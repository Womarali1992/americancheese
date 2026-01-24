import React, { useState } from "react";
import { useLocation } from "wouter";
import { Task } from "@shared/schema";
import { ProgressBar } from "@/components/charts/ProgressBar";
import { useTier2CategoriesByTier1Name } from "@/hooks/useTemplateCategories";
import { ChevronDown, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useColors, hexToRgba, lightenColor } from "@/lib/colors";
import { useQuery } from "@tanstack/react-query";

interface CategoryProgressColumnsProps {
  tasks: Task[];
  hiddenCategories: string[];
  projectId?: number;
  isLoading?: boolean;
}

export const CategoryProgressColumns: React.FC<CategoryProgressColumnsProps> = ({
  tasks,
  hiddenCategories,
  projectId,
  isLoading = false
}) => {
  // Use simplified color system
  const { getTier1Color, getTier2Color } = useColors(projectId);
  const [, navigate] = useLocation();
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch categories from admin panel
  const { data: tier2ByTier1Name, tier1Categories: dbTier1Categories, tier2Categories: dbTier2Categories, isLoading: categoriesLoading } = useTier2CategoriesByTier1Name(projectId);

  // Mutation for reordering tasks
  const reorderTasksMutation = useMutation({
    mutationFn: (updates: { id: number; sortOrder: number }[]) =>
      apiRequest('/api/tasks/reorder', 'POST', { updates }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "Success",
        description: "Tasks reordered successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reorder tasks",
        variant: "destructive",
      });
    },
  });

  // Handle drag and drop
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) {
      console.log('Drag ended without destination');
      return;
    }

    const { source, destination } = result;
    
    // Extract tier1 and tier2 from droppableId (format: "tier1-tier2")
    const [sourceTier1, sourceTier2] = source.droppableId.split('-');
    const [destTier1, destTier2] = destination.droppableId.split('-');

    console.log('Drag operation:', { sourceTier1, sourceTier2, destTier1, destTier2 });

    // Only allow reordering within the same tier2 category
    if (sourceTier1 !== destTier1 || sourceTier2 !== destTier2) {
      console.log('Invalid move: different categories');
      toast({
        title: "Invalid Move",
        description: "Tasks can only be reordered within the same category",
        variant: "destructive",
      });
      return;
    }

    // If the item is dropped in the same position, no need to update
    if (source.index === destination.index) {
      console.log('No change in position');
      return;
    }

    const tier2Tasks = tasksByTier2[sourceTier1]?.[sourceTier2] || [];
    if (tier2Tasks.length === 0) {
      console.log('No tasks in category');
      return;
    }

    const reorderedTasks = Array.from(tier2Tasks);
    const [movedTask] = reorderedTasks.splice(source.index, 1);
    reorderedTasks.splice(destination.index, 0, movedTask);

    console.log('Reordering tasks:', {
      movedTask: movedTask.title,
      fromIndex: source.index,
      toIndex: destination.index
    });

    // Create updates for all tasks in this category
    const updates = reorderedTasks.map((task, index) => ({
      id: task.id,
      sortOrder: index
    }));

    reorderTasksMutation.mutate(updates);
  };

  // Helper function to map tier1 category names to color keys expected by ProgressBar

  // Create standard categories mapping from database tier1 categories
  const dynamicStandardCategories = dbTier1Categories?.reduce((acc: Record<string, string>, cat: { name: string }) => {
    if (cat.name && typeof cat.name === 'string') {
      acc[cat.name.toLowerCase()] = cat.name;
    }
    return acc;
  }, {} as Record<string, string>) || {};

  // Group tasks by tier1 and tier2 categories - with fallback support
  const tasksByTier1: Record<string, Task[]> = {};
  const tasksByTier2: Record<string, Record<string, Task[]>> = {};

  
  tasks.forEach((task: Task) => {
    // Try tier1Category first, then fallback to default categories
    let tier1 = task.tier1Category;
    let tier2 = task.tier2Category;
    
    // If no legacy categories, try to infer from new category system
    if (!tier1 && !tier2) {
      // For now, assign to default categories to ensure cards still show
      tier1 = 'General';
      tier2 = 'Tasks';
    } else {
      // Use existing logic
      tier1 = tier1 || 'Uncategorized';
      tier2 = tier2 || 'General';
    }
    
    if (!tasksByTier1[tier1]) {
      tasksByTier1[tier1] = [];
    }
    tasksByTier1[tier1].push(task);
    
    if (!tasksByTier2[tier1]) {
      tasksByTier2[tier1] = {};
    }
    if (!tasksByTier2[tier1][tier2]) {
      tasksByTier2[tier1][tier2] = [];
    }
    tasksByTier2[tier1][tier2].push(task);
  });

  // Sort tasks by sortOrder for consistent ordering
  Object.keys(tasksByTier2).forEach(tier1 => {
    Object.keys(tasksByTier2[tier1]).forEach(tier2 => {
      tasksByTier2[tier1][tier2].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    });
  });

  // Calculate progress for tier1 and tier2 categories
  const progressByTier1: Record<string, { progress: number; tasks: number; completed: number }> = {};
  const progressByTier2: Record<string, Record<string, { progress: number; tasks: number; completed: number }>> = {};

  Object.keys(tasksByTier1).forEach(tier1 => {
    const tier1Tasks = tasksByTier1[tier1];
    const totalTasks = tier1Tasks.length;
    const completedTasks = tier1Tasks.filter((task: Task) => 
      task.completed === true || task.status === 'completed'
    ).length;
    
    progressByTier1[tier1] = {
      progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      tasks: totalTasks,
      completed: completedTasks
    };
    
    if (tasksByTier2[tier1]) {
      progressByTier2[tier1] = {};
      
      Object.keys(tasksByTier2[tier1]).forEach(tier2 => {
        const tier2Tasks = tasksByTier2[tier1][tier2];
        const tier2TotalTasks = tier2Tasks.length;
        const tier2CompletedTasks = tier2Tasks.filter((task: Task) =>
          task.completed === true || task.status === 'completed'
        ).length;
        
        progressByTier2[tier1][tier2] = {
          progress: tier2TotalTasks > 0 ? Math.round((tier2CompletedTasks / tier2TotalTasks) * 100) : 0,
          tasks: tier2TotalTasks,
          completed: tier2CompletedTasks
        };
      });
    }
  });

  // Simplified color system - single source of truth
  const getTier1ColorLocal = (tier1: string) => getTier1Color(tier1);
  const getTier2ColorLocal = (tier2Name: string, tier1: string) => getTier2Color(tier2Name, tier1);


  // Get categories from database as the source of truth, sorted by sortOrder
  // IMPORTANT: Show ALL categories from the preset, even if they have no tasks yet
  const categoriesToDisplay = (dbTier1Categories || [])
    .filter((dbCat: any) => {
      // Don't show hidden categories
      const catLower = dbCat.name.toLowerCase();
      return !hiddenCategories.some(h => (h || '').toString().toLowerCase() === catLower);
    })
    .sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .map((dbCat: any) => dbCat.name);

  if (isLoading || categoriesLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-lg border p-4 animate-pulse">
            <div className="h-4 bg-slate-200 rounded mb-2"></div>
            <div className="h-2 bg-slate-200 rounded mb-4"></div>
            <div className="space-y-2">
              <div className="h-3 bg-slate-200 rounded"></div>
              <div className="h-3 bg-slate-200 rounded"></div>
              <div className="h-3 bg-slate-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (categoriesToDisplay.length === 0) {
    return (
      <div className="text-center text-sm text-slate-500 py-8">
        No categories with tasks to display
      </div>
    );
  }

  return (
    <DragDropContext 
      onDragEnd={handleDragEnd}
      onBeforeDragStart={(start) => {
        console.log('Drag starting:', start.draggableId);
      }}
      onDragStart={(start) => {
        console.log('Drag in progress:', start.draggableId);
      }}
      onDragUpdate={(update) => {
        if (update.destination) {
          console.log('Drag update:', update.destination.droppableId);
        }
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" style={{ touchAction: 'pan-y' }}>
      {categoriesToDisplay.map(tier1 => {
        const displayName = dynamicStandardCategories[tier1 as keyof typeof dynamicStandardCategories] ||
                          tier1.charAt(0).toUpperCase() + tier1.slice(1);
        const { progress, tasks, completed } = progressByTier1[tier1] || { progress: 0, tasks: 0, completed: 0 };
        const tier1Color = getTier1ColorLocal(tier1);

        // Get tier2 categories from database first (show ALL preset categories)
        // Then add any additional tier2 categories that have tasks
        const tier2Categories: string[] = [];
        
        // First, add ALL tier2 categories from the database for this tier1
        // This ensures preset categories are always shown, even with 0 tasks
        // Note: tier2ByTier1Name uses lowercase keys and contains arrays of lowercase tier2 names
        const tier1LowerCase = tier1.toLowerCase();
        const dbTier2ForThisTier1 = tier2ByTier1Name?.[tier1LowerCase] || [];
        
        // Get the proper-cased tier2 names from dbTier2Categories
        dbTier2ForThisTier1.forEach((tier2NameLower: string) => {
          // Find the properly-cased tier2 category from dbTier2Categories
          const dbTier2Cat = dbTier2Categories?.find((cat: any) => 
            cat.name?.toLowerCase() === tier2NameLower
          );
          const tier2Name = dbTier2Cat?.name || tier2NameLower;
          
          if (tier2Name && !tier2Categories.includes(tier2Name)) {
            tier2Categories.push(tier2Name);
            // Initialize progress data for database categories with 0 tasks
            if (!progressByTier2[tier1]) {
              progressByTier2[tier1] = {};
            }
            if (!progressByTier2[tier1][tier2Name]) {
              progressByTier2[tier1][tier2Name] = { progress: 0, tasks: 0, completed: 0 };
            }
          }
        });

        // Then add any tier2 categories from tasks that might not be in the database
        if (progressByTier2[tier1]) {
          Object.keys(progressByTier2[tier1]).forEach(cat => {
            if (!tier2Categories.includes(cat) && progressByTier2[tier1][cat].tasks > 0) {
              tier2Categories.push(cat);
            }
          });
        }
        
        // Also check tasksByTier2 for any additional categories
        if (Object.keys(tasksByTier2[tier1] || {}).length > 0) {
          Object.keys(tasksByTier2[tier1]).forEach(tier2Key => {
            if (!tier2Categories.includes(tier2Key) && tasksByTier2[tier1][tier2Key].length > 0) {
              tier2Categories.push(tier2Key);
            }
          });
        }
        
        // Fallback: If still no tier2 categories but we have tasks, create a default tier2
        if (tier2Categories.length === 0 && tasks > 0) {
          tier2Categories.push('General');
          
          // Create progress data for the fallback tier2 category
          if (!progressByTier2[tier1]) {
            progressByTier2[tier1] = {};
          }
          progressByTier2[tier1]['General'] = {
            progress,
            tasks,
            completed
          };
          
          // Also ensure the tasks are available in tasksByTier2
          if (!tasksByTier2[tier1]) {
            tasksByTier2[tier1] = {};
          }
          if (!tasksByTier2[tier1]['General']) {
            // If there are tasks in this tier1 but no tier2 breakdown, assign them all to 'General'
            tasksByTier2[tier1]['General'] = tasksByTier1[tier1];
          }
        }

        return (
          <div key={tier1} className="rounded-lg border shadow-sm overflow-hidden" style={{ backgroundColor: lightenColor(tier1Color, 0.92) }}>
            {/* Tier 1 Header */}
            <div
              className="p-4 border-b"
              style={{
                backgroundColor: lightenColor(tier1Color, 0.75),
                borderColor: hexToRgba(tier1Color, 0.25)
              }}
            >
              <div className="flex items-center mb-2">
                <div
                  className="w-3 h-3 rounded-sm mr-2"
                  style={{ backgroundColor: tier1Color }}
                ></div>
                <h3
                  className="text-base font-semibold cursor-pointer transition-colors text-black hover:text-gray-700"
                  onClick={() => {
                    const projectParam = projectId ? `projectId=${projectId}` : '';
                    const tier1Param = `tier1=${encodeURIComponent(tier1)}`;
                    const params = [projectParam, tier1Param].filter(Boolean).join('&');
                    navigate(`/tasks?${params}`);
                  }}
                  title={`View all tasks in ${displayName} category`}
                >
                  {displayName}
                </h3>
              </div>

              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-500">{completed} of {tasks} tasks</span>
                <span className="text-sm font-medium text-black">{progress}%</span>
              </div>
              
              <ProgressBar 
                value={progress} 
                color={tier1Color}
                variant="meter"
                showLabel={false}
                className="h-2"
                navigable={true}
                onClick={() => {
                  const projectParam = projectId ? `projectId=${projectId}` : '';
                  const tier1Param = `tier1=${encodeURIComponent(tier1)}`;
                  const params = [projectParam, tier1Param].filter(Boolean).join('&');
                  navigate(`/tasks?${params}`);
                }}
              />
              
              <div
                className="text-xs px-2 py-1 rounded-md font-medium mt-2 inline-block text-gray-600"
                style={{
                  backgroundColor: hexToRgba(tier1Color, 0.15)
                }}
              >
                {progress === 100 ? "Complete" :
                 progress > 75 ? "Almost Complete" :
                 progress > 25 ? "In Progress" :
                 progress > 0 ? "Just Started" : "Not Started"}
              </div>
            </div>

            {/* Tier 2 Categories */}
            <div className="p-4" style={{ backgroundColor: lightenColor(tier1Color, 0.85) }}>
              {tier2Categories.length > 0 ? (
                <div className="space-y-3">
                  {tier2Categories.map(tier2 => {
                    const tier2Progress = progressByTier2[tier1]?.[tier2] || 
                                        { progress: 0, tasks: 0, completed: 0 };
                    
                    const dbCategory = dbTier2Categories?.find((cat: { name: string; color?: string; parentId?: number }) => 
                      cat.name && typeof cat.name === 'string' && cat.name.toLowerCase() === tier2.toLowerCase() && 
                      cat.parentId === dbTier1Categories?.find((t1: { name: string; id?: number }) => 
                        t1.name && typeof t1.name === 'string' && t1.name.toLowerCase() === tier1.toLowerCase()
                      )?.id
                    );
                    
                    const tier2DisplayName = dbCategory?.name || tier2.charAt(0).toUpperCase() + tier2.slice(1);
                    const tier2Color = getTier2ColorLocal(tier2, tier1);
                    
                    const categoryKey = `${tier1}-${tier2}`;
                    const isExpanded = expandedCategories[categoryKey] || false;
                    
                    const toggleExpand = () => {
                      setExpandedCategories(prev => ({
                        ...prev,
                        [categoryKey]: !prev[categoryKey]
                      }));
                    };

                    return (
                      <div key={categoryKey} className="border-l-2 pl-3 rounded-md" style={{
                        borderColor: tier2Color,
                        backgroundColor: lightenColor(tier2Color, 0.85)
                      }}>
                        <div
                          className="cursor-pointer rounded p-1 -m-1"
                          onClick={toggleExpand}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center">
                              <div 
                                className="w-2 h-2 rounded-sm mr-2" 
                                style={{ backgroundColor: tier2Color }}
                              ></div>
                              <span 
                                className="text-xs font-medium text-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
                                onClick={(e: React.MouseEvent) => {
                                  e.stopPropagation();
                                  const projectParam = projectId ? `projectId=${projectId}` : '';
                                  const tier1Param = `tier1=${encodeURIComponent(tier1)}`;
                                  const tier2Param = `tier2=${encodeURIComponent(tier2)}`;
                                  const params = [projectParam, tier1Param, tier2Param].filter(Boolean).join('&');
                                  navigate(`/tasks?${params}`);
                                }}
                                title={`View tasks in ${tier2DisplayName} category`}
                              >
                                {tier2DisplayName}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-xs font-medium mr-1">{tier2Progress.progress}%</span>
                              <ChevronDown className={`h-3 w-3 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </div>
                          </div>
                          
                          <ProgressBar 
                            value={tier2Progress.progress} 
                            color={tier2Color}
                            variant="meter"
                            showLabel={false}
                            className="h-1.5 mb-1"
                            navigable={true}
                            onClick={() => {
                              const projectParam = projectId ? `projectId=${projectId}` : '';
                              const tier1Param = `tier1=${encodeURIComponent(tier1)}`;
                              const tier2Param = `tier2=${encodeURIComponent(tier2)}`;
                              const params = [projectParam, tier1Param, tier2Param].filter(Boolean).join('&');
                              navigate(`/tasks?${params}`);
                            }}
                          />
                          
                          <div className="text-xs text-slate-500">
                            {tier2Progress.completed} of {tier2Progress.tasks} tasks
                          </div>
                        </div>

                        {/* Expanded task list with drag and drop */}
                        {isExpanded && (
                          <Droppable droppableId={`${tier1}-${tier2}`}>
                            {(provided, snapshot) => (
                              <div 
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`mt-2 pl-3 border-l border-slate-200 text-xs space-y-1 transition-all duration-200 min-h-[2rem] ${
                                  snapshot.isDraggingOver 
                                    ? 'bg-blue-50 border-blue-400 shadow-inner' 
                                    : snapshot.draggingOverWith 
                                      ? 'bg-slate-50 border-slate-300' 
                                      : ''
                                }`}
                                style={{ 
                                  touchAction: 'pan-y',
                                  WebkitOverflowScrolling: 'touch'
                                }}
                              >
                                {tasksByTier2[tier1]?.[tier2]?.length > 0 ? (
                                  tasksByTier2[tier1][tier2].map((task: Task, index: number) => (
                                    <Draggable key={task.id.toString()} draggableId={task.id.toString()} index={index}>
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          className={`group flex items-center py-2 px-2 -mx-2 rounded transition-all duration-200 border ${
                                            snapshot.isDragging 
                                              ? 'bg-white shadow-xl border-blue-400 scale-105 rotate-1 z-50 opacity-95' 
                                              : 'border-transparent hover:bg-slate-50 hover:shadow-sm hover:border-slate-200'
                                          }`}
                                          style={{
                                            ...provided.draggableProps.style,
                                            touchAction: 'manipulation',
                                            userSelect: 'none',
                                            WebkitUserSelect: 'none',
                                            msUserSelect: 'none',
                                            WebkitTouchCallout: 'none',
                                            ...(snapshot.isDragging && {
                                              transform: `${provided.draggableProps.style?.transform || ''} rotate(2deg)`,
                                            })
                                          }}
                                        >
                                          <div 
                                            {...provided.dragHandleProps}
                                            className="mr-2 opacity-100 transition-opacity cursor-grab active:cursor-grabbing flex-shrink-0"
                                            title="Drag to reorder tasks"
                                            style={{ 
                                              touchAction: 'none',
                                              userSelect: 'none',
                                              WebkitUserSelect: 'none',
                                              WebkitTouchCallout: 'none',
                                              msUserSelect: 'none',
                                            } as React.CSSProperties}
                                            onMouseDown={(e) => {
                                              console.log('Drag handle mouse down');
                                              e.stopPropagation();
                                            }}
                                            onTouchStart={(e) => {
                                              console.log('Drag handle touch start');
                                              e.stopPropagation();
                                            }}
                                          >
                                            <GripVertical className="h-4 w-4 text-slate-500 hover:text-slate-700" />
                                          </div>
                                          <div 
                                            className="flex items-center flex-1 cursor-pointer"
                                            onClick={() => !snapshot.isDragging && navigate(`/tasks/${task.id}`)}
                                          >
                                            <div className={`w-1 h-1 rounded-full mr-2 ${task.completed ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                                            <span className={`${task.completed ? 'line-through text-slate-400' : 'text-slate-700'} hover:text-blue-600 transition-colors`}>
                                              {task.title}
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                    </Draggable>
                                  ))
                                ) : (
                                  <div className="text-slate-500 italic py-1">No tasks in this category</div>
                                )}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-xs text-slate-500 text-center py-4 italic">
                  No subcategories available
                </div>
              )}
            </div>
          </div>
        );
      })}
      </div>
    </DragDropContext>
  );
};
