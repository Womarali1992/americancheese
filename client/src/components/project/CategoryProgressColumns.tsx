import React, { useState } from "react";
import { useLocation } from "wouter";
import { Task } from "@shared/schema";
import { ProgressBar } from "@/components/charts/ProgressBar";
import { useTier2CategoriesByTier1Name } from "@/hooks/useTemplateCategories";
import { ChevronDown } from "lucide-react";

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
  const [, navigate] = useLocation();
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  
  // Fetch categories from admin panel
  const { data: tier2ByTier1Name, tier1Categories: dbTier1Categories, tier2Categories: dbTier2Categories, isLoading: categoriesLoading } = useTier2CategoriesByTier1Name(projectId);

  // Helper function to map tier1 category names to color keys expected by ProgressBar
  const mapTier1CategoryToColorKey = (tier1Category: string): string => {
    const normalizedCategory = tier1Category.toLowerCase().trim();
    
    const categoryColorMap: Record<string, string> = {
      'structural': 'structural',
      'structure': 'structural',
      'systems': 'systems',
      'system': 'systems',
      'sheathing': 'sheathing',
      'finishings': 'finishings',
      'finishing': 'finishings',
      'finish': 'finishings',
      'development': 'structural',
      'design': 'systems',
      'construction': 'sheathing',
      'completion': 'finishings',
      'planning': 'structural',
      'implementation': 'systems',
      'testing': 'sheathing',
      'deployment': 'finishings'
    };
    
    return categoryColorMap[normalizedCategory] || 'blue';
  };

  // Create standard categories mapping from database tier1 categories
  const dynamicStandardCategories = dbTier1Categories?.reduce((acc: Record<string, string>, cat: { name: string }) => {
    acc[cat.name.toLowerCase()] = cat.name;
    return acc;
  }, {} as Record<string, string>) || {};

  // Group tasks by tier1 and tier2 categories
  const tasksByTier1: Record<string, Task[]> = {};
  const tasksByTier2: Record<string, Record<string, Task[]>> = {};

  tasks.forEach((task: Task) => {
    const tier1 = task.tier1Category || 'Uncategorized';
    const tier2 = task.tier2Category || 'General';
    
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

  // Get tier1 color
  const getTier1Color = (tier1: string) => {
    const dbCategory = dbTier1Categories?.find((cat: { name: string; color?: string }) => 
      cat.name.toLowerCase() === tier1.toLowerCase()
    );
    
    if (dbCategory?.color) {
      return dbCategory.color;
    }
    
    const colorKey = mapTier1CategoryToColorKey(tier1);
    const computedColor = getComputedStyle(document.documentElement)
      .getPropertyValue(`--tier1-${colorKey}`)
      .trim();
    
    return computedColor || '#64748b';
  };

  // Get tier2 color
  const getTier2Color = (tier2Name: string, tier1: string) => {
    const dbCategory = dbTier2Categories?.find((cat: { name: string; color?: string; parentId?: number }) => 
      cat.name.toLowerCase() === tier2Name.toLowerCase() && 
      cat.parentId === dbTier1Categories?.find((t1: { name: string; id?: number }) => t1.name.toLowerCase() === tier1.toLowerCase())?.id
    );
    
    if (dbCategory?.color) {
      return dbCategory.color;
    }
    
    const normalizedName = tier2Name.toLowerCase();
    const computedColor = getComputedStyle(document.documentElement)
      .getPropertyValue(`--tier2-${normalizedName}`)
      .trim();
    
    return computedColor || '#64748b';
  };

  // Filter categories to display (non-hidden and with tasks)
  const categoriesToDisplay = Object.keys(tasksByTier1)
    .filter(category => !hiddenCategories.includes(category))
    .filter(category => tasksByTier1[category].length > 0);

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {categoriesToDisplay.map(tier1 => {
        const displayName = dynamicStandardCategories[tier1 as keyof typeof dynamicStandardCategories] || 
                          tier1.charAt(0).toUpperCase() + tier1.slice(1);
        const { progress, tasks, completed } = progressByTier1[tier1] || { progress: 0, tasks: 0, completed: 0 };
        const tier1Color = getTier1Color(tier1);

        // Get tier2 categories that have tasks
        const tier2Categories: string[] = [];
        if (progressByTier2[tier1]) {
          Object.keys(progressByTier2[tier1]).forEach(cat => {
            if (progressByTier2[tier1][cat].tasks > 0) {
              tier2Categories.push(cat);
            }
          });
        }

        return (
          <div key={tier1} className="bg-white rounded-lg border shadow-sm overflow-hidden">
            {/* Tier 1 Header */}
            <div className="p-4 border-b bg-slate-50">
              <div className="flex items-center mb-2">
                <div 
                  className="w-3 h-3 rounded-sm mr-2" 
                  style={{ backgroundColor: tier1Color }}
                ></div>
                <h3 className="text-sm font-semibold text-slate-800">{displayName}</h3>
              </div>
              
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-600">{completed} of {tasks} tasks</span>
                <span className="text-sm font-medium">{progress}%</span>
              </div>
              
              <ProgressBar 
                value={progress} 
                color={mapTier1CategoryToColorKey(tier1)}
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
              
              <div className={`text-xs px-2 py-1 rounded-md font-medium mt-2 inline-block ${
                progress === 100 ? "bg-green-100 text-green-700" :
                progress > 75 ? "bg-blue-100 text-blue-700" :
                progress > 25 ? "bg-orange-100 text-orange-700" :
                "bg-slate-100 text-slate-700"
              }`}>
                {progress === 100 ? "Complete" : 
                 progress > 75 ? "Almost Complete" :
                 progress > 25 ? "In Progress" :
                 progress > 0 ? "Just Started" : "Not Started"}
              </div>
            </div>

            {/* Tier 2 Categories */}
            <div className="p-4">
              {tier2Categories.length > 0 ? (
                <div className="space-y-3">
                  {tier2Categories.map(tier2 => {
                    const tier2Progress = progressByTier2[tier1]?.[tier2] || 
                                        { progress: 0, tasks: 0, completed: 0 };
                    
                    const dbCategory = dbTier2Categories?.find((cat: { name: string; color?: string; parentId?: number }) => 
                      cat.name.toLowerCase() === tier2.toLowerCase() && 
                      cat.parentId === dbTier1Categories?.find((t1: { name: string; id?: number }) => t1.name.toLowerCase() === tier1.toLowerCase())?.id
                    );
                    
                    const tier2DisplayName = dbCategory?.name || tier2.charAt(0).toUpperCase() + tier2.slice(1);
                    const tier2Color = getTier2Color(tier2, tier1);
                    
                    const categoryKey = `${tier1}-${tier2}`;
                    const isExpanded = expandedCategories[categoryKey] || false;
                    
                    const toggleExpand = () => {
                      setExpandedCategories(prev => ({
                        ...prev,
                        [categoryKey]: !prev[categoryKey]
                      }));
                    };

                    return (
                      <div key={categoryKey} className="border-l-2 pl-3" style={{ borderColor: tier2Color }}>
                        <div 
                          className="cursor-pointer hover:bg-slate-50 rounded p-1 -m-1"
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

                        {/* Expanded task list */}
                        {isExpanded && (
                          <div className="mt-2 pl-3 border-l border-slate-200 text-xs space-y-1">
                            {tasksByTier2[tier1]?.[tier2]?.map((task: Task) => (
                              <div 
                                key={task.id} 
                                className="flex items-center py-1 cursor-pointer hover:bg-slate-100 rounded px-2 -mx-2 transition-colors"
                                onClick={() => navigate(`/tasks/${task.id}`)}
                              >
                                <div className={`w-1 h-1 rounded-full mr-2 ${task.completed ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                                <span className={`${task.completed ? 'line-through text-slate-400' : 'text-slate-700'} hover:text-blue-600 transition-colors`}>
                                  {task.title}
                                </span>
                              </div>
                            )) || (
                              <div className="text-slate-500 italic py-1">No tasks in this category</div>
                            )}
                          </div>
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
  );
};