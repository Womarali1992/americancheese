import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { ProgressBar } from '@/components/charts/ProgressBar';
import { getTier1CategoryColor, getTier2CategoryColor } from '@/lib/color-utils';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { ChevronDown } from 'lucide-react';
import { useTier2CategoriesByTier1Name } from '@/hooks/useTemplateCategories';

interface Task {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  status: string;
  tier1Category?: string;
  tier2Category?: string;
  category?: string;
  projectId?: number;
  dueDate?: string;
  [key: string]: any; // For any other properties we might need
}

interface CategoryProgressListProps {
  tasks: Task[];
  hiddenCategories: string[];
  expandable?: boolean;
  projectId?: number;
  isLoading?: boolean;
}

export const CategoryProgressList: React.FC<CategoryProgressListProps> = ({ 
  tasks, 
  hiddenCategories,
  expandable = false,
  projectId,
  isLoading = false
}) => {
  // Navigation hook
  const [, navigate] = useLocation();
  
  // State to track which tier2 categories are expanded
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  
  // Fetch categories from admin panel
  const { data: tier2ByTier1Name, tier1Categories: dbTier1Categories, tier2Categories: dbTier2Categories, isLoading: categoriesLoading } = useTier2CategoriesByTier1Name(projectId);
  // Helper function to map tier1 category names to color keys expected by ProgressBar
  const mapTier1CategoryToColorKey = (tier1Category: string): string => {
    const normalizedCategory = tier1Category.toLowerCase().trim();
    
    // Map database tier1 category names to ProgressBar color keys
    const categoryColorMap: Record<string, string> = {
      'structural': 'structural',
      'structure': 'structural',
      'systems': 'systems',
      'system': 'systems',
      'sheathing': 'sheathing',
      'finishings': 'finishings',
      'finishing': 'finishings',
      'finish': 'finishings',
      
      // Common project-specific categories that map to standard colors
      'development': 'structural',
      'design': 'systems',
      'construction': 'sheathing',
      'completion': 'finishings',
      'planning': 'structural',
      'implementation': 'systems',
      'testing': 'sheathing',
      'delivery': 'finishings',
      
      // Specific project categories from the current project
      'search agent work flow': 'structural',
      'website admin': 'systems',
      'apartment locating agent a.l.i.': 'systems',
      'apartment locating agent': 'systems',
      'a.l.i.': 'systems',
      'ali': 'systems',
      'agent development': 'systems',
      'web development': 'systems',
      'admin panel': 'systems',
      'workflow': 'structural',
      'automation': 'systems'
    };
    
    return categoryColorMap[normalizedCategory] || 'structural'; // Default to structural if no match
  };

  // Helper function to normalize tier2 category names 
  const normalizeTier2 = (tier2: string | undefined | null): string => {
    if (!tier2) return 'other';
    
    const normalized = tier2?.toLowerCase().trim() || '';
    
    console.log("Original tier2 value:", tier2, "normalized to:", normalized);
    
    // Normalize common naming variations
    if (normalized === 'electrical' || normalized === 'electric') return 'electrical';
    if (normalized === 'hvac' || normalized === 'heating' || normalized === 'cooling' || normalized === 'ventilation') return 'hvac';
    if (normalized === 'barrier' || normalized === 'moisture-barrier' || normalized === 'moisture barrier') return 'barriers';
    if (normalized === 'frame' || normalized === 'framings' || normalized === 'framing') return 'framing';
    if (normalized === 'floor' || normalized === 'floors' || normalized === 'flooring') return 'flooring';
    if (normalized === 'roof' || normalized === 'roofing') return 'roofing';
    if (normalized === 'window' || normalized === 'windows') return 'windows';
    if (normalized === 'door' || normalized === 'doors') return 'doors';
    if (normalized === 'cabinet' || normalized === 'cabinets') return 'cabinets';
    if (normalized === 'fixture' || normalized === 'fixtures') return 'fixtures';
    if (normalized === 'drywall' || normalized === 'sheetrock' || normalized === 'wallboard') return 'drywall';
    
    // Handle framing task variations
    if (normalized.includes('fram')) {
      return 'framing';
    }
    
    return normalized;
  };

  // For debugging - log all tasks with their tier1 and tier2 categories
  const tier1Categories: string[] = [];
  
  // Add unique tier1 categories to our array
  tasks.forEach(task => {
    if (task.tier1Category) {
      const lowerCaseTier1 = task.tier1Category.toLowerCase();
      if (!tier1Categories.includes(lowerCaseTier1)) {
        tier1Categories.push(lowerCaseTier1);
      }
    }
  });
  
  // Group tasks by tier1Category
  const tasksByTier1 = tasks.reduce((acc, task) => {
    if (!task.tier1Category) return acc;
    
    // Create a standardized category name
    const tier1 = task.tier1Category.toLowerCase();
    
    // Skip tasks in hidden categories
    if (hiddenCategories.includes(tier1)) return acc;
    
    if (!acc[tier1]) {
      acc[tier1] = [];
    }
    acc[tier1].push(task);
    
    // Tasks are properly categorized by their tier1 categories
    
    return acc;
  }, {} as Record<string, Task[]>);
  
  // Group tasks by tier2Category within each tier1Category with improved normalization
  const tasksByTier2 = tasks.reduce((acc, task) => {
    if (!task.tier1Category) return acc;
    
    const tier1 = task.tier1Category.toLowerCase();
    
    // Skip tasks in hidden categories
    if (hiddenCategories.includes(tier1)) return acc;
    
    // Extract and normalize tier2 category
    const tier2 = normalizeTier2(task.tier2Category);
    
    if (!acc[tier1]) {
      acc[tier1] = {};
    }
    
    if (!acc[tier1][tier2]) {
      acc[tier1][tier2] = [];
    }
    
    acc[tier1][tier2].push(task);
    return acc;
  }, {} as Record<string, Record<string, Task[]>>);
  
  // Calculate completion percentage for each tier1
  const progressByTier1: Record<string, { progress: number, tasks: number, completed: number }> = {};
  
  // Calculate completion percentage for each tier2 within tier1
  const progressByTier2: Record<string, Record<string, { progress: number, tasks: number, completed: number }>> = {};
  

  
  // Use dynamic categories from admin panel, fallback to empty object if loading
  const predefinedTier2Categories = tier2ByTier1Name || {};
  
  // Database categories are now properly loaded and used
  
  // Create standard categories mapping from database tier1 categories
  const dynamicStandardCategories = dbTier1Categories?.reduce((acc: any, cat: any) => {
    acc[cat.name.toLowerCase()] = cat.name;
    return acc;
  }, {}) || {};
  
  // Process each tier1 category
  Object.keys(tasksByTier1).forEach(tier1 => {
    const tier1Tasks = tasksByTier1[tier1];
    const totalTasks = tier1Tasks.length;
    
    // Check both the completed flag and status field
    const completedTasks = tier1Tasks.filter((task: Task) => 
      task.completed === true || task.status === 'completed'
    ).length;
    
    // Store tier1 progress calculations
    progressByTier1[tier1] = {
      progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      tasks: totalTasks,
      completed: completedTasks
    };
    
    // Process tier2 categories within this tier1
    if (tasksByTier2[tier1]) {
      progressByTier2[tier1] = {};
      
      Object.keys(tasksByTier2[tier1]).forEach(tier2 => {
        const tier2Tasks = tasksByTier2[tier1][tier2];
        const tier2TotalTasks = tier2Tasks.length;
        
        // Check both the completed flag and status field for tier2 tasks
        const tier2CompletedTasks = tier2Tasks.filter((task: Task) => 
          task.completed === true || task.status === 'completed'
        ).length;
        
        // Store tier2 progress calculations
        progressByTier2[tier1][tier2] = {
          progress: tier2TotalTasks > 0 ? Math.round((tier2CompletedTasks / tier2TotalTasks) * 100) : 0,
          tasks: tier2TotalTasks,
          completed: tier2CompletedTasks
        };
      });
    }
  });
  
  // No fallback sections - only show categories with actual tasks
  
  // Only display tier1 categories that actually have tasks, excluding hidden ones
  const categoriesToDisplay = Object.keys(tasksByTier1)
    .filter(category => !hiddenCategories.includes(category))
    .filter(category => tasksByTier1[category].length > 0); // Only show categories with actual tasks

  // Show loading state if tasks are still loading OR if no tasks are provided
  if (isLoading || tasks.length === 0) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border-0 shadow-sm rounded-lg bg-white overflow-hidden p-4">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <div className="w-1.5 h-5 bg-slate-200 rounded-sm mr-2 animate-pulse"></div>
                <div className="h-4 bg-slate-200 rounded w-24 animate-pulse"></div>
              </div>
              <div className="h-4 bg-slate-200 rounded w-8 animate-pulse"></div>
            </div>
            <div className="h-2 bg-slate-200 rounded w-full animate-pulse mb-2"></div>
            <div className="flex justify-between items-center">
              <div className="h-3 bg-slate-200 rounded w-16 animate-pulse"></div>
              <div className="h-3 bg-slate-200 rounded w-20 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (categoriesToDisplay.length === 0) {
    return (
      <div className="text-center text-sm text-slate-500 py-2">
        No categories with tasks to display
      </div>
    );
  }
  
  // Allow multiple sections to be open at the same time with default expanded state
  return (
    <Accordion type="multiple" defaultValue={categoriesToDisplay} className="space-y-5">
      {categoriesToDisplay.map(tier1 => {
        // Get display name from database categories first, fallback to capitalized tier1 name
        const displayName = dynamicStandardCategories[tier1 as keyof typeof dynamicStandardCategories] || 
                          tier1.charAt(0).toUpperCase() + tier1.slice(1);
        const { progress, tasks, completed } = progressByTier1[tier1] || { progress: 0, tasks: 0, completed: 0 };
        
        // Double-check that this category actually has tasks - if not, skip it
        if (tasks === 0) {
          console.warn(`Category ${tier1} has 0 tasks, skipping display`);
          return null;
        }
        
        // Get tier2 categories that actually have tasks for this tier1 category
        const tier2Categories: string[] = [];
        
        // Only include tier2 categories that actually have tasks
        if (progressByTier2[tier1]) {
          const dynamicCategories = Object.keys(progressByTier2[tier1]);
          
          dynamicCategories.forEach(cat => {
            // Only add if this tier2 category has tasks
            if (progressByTier2[tier1][cat].tasks > 0) {
              tier2Categories.push(cat);
            }
          });
        }
        
        // Only show tier2 categories if there are actual categories with tasks
        const hasTier2Categories = tier2Categories.length > 0;
        
        // Get the tier1 category color from the database or use fallback
        const dbTier1Category = dbTier1Categories?.find(cat => 
          cat.name.toLowerCase() === tier1.toLowerCase()
        );
        const tier1Color = dbTier1Category?.color || '#6B7280';
        
        return (
          <AccordionItem 
            key={tier1} 
            value={tier1} 
            className="border-0 shadow-sm rounded-lg bg-white overflow-hidden"
          >
            <div className="px-4 pt-3 pb-1">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-1.5 h-5 rounded-sm mr-2" style={{ backgroundColor: tier1Color }}></div>
                  <AccordionTrigger className="p-0 hover:no-underline">
                    <p className="text-sm font-medium">{displayName}</p>
                  </AccordionTrigger>
                </div>
                <p className="text-sm font-semibold">{progress}%</p>
              </div>
              <ProgressBar 
                value={progress} 
                color={tier1Color}
                variant="meter"
                showLabel={false}
                className="mt-2"
                navigable={true}
                onClick={() => {
                  const projectParam = projectId ? `projectId=${projectId}` : '';
                  const tier1Param = `tier1=${encodeURIComponent(tier1)}`;
                  const params = [projectParam, tier1Param].filter(Boolean).join('&');
                  navigate(`/tasks?${params}`);
                }}
              />
              <div className="flex justify-between items-center mt-1 mb-2">
                <div className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md">
                  {completed} of {tasks} tasks
                </div>
                <div className={`text-xs px-2 py-0.5 rounded-md font-medium ${
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
            </div>
            
            <AccordionContent className="px-4 pb-3">
              {hasTier2Categories ? (
                <div className="grid grid-cols-2 gap-4 mt-1 border-t pt-3">
                  {tier2Categories.map(tier2 => {
                    // Get tier2 progress data if available, or default values
                    const tier2Progress = progressByTier2[tier1]?.[tier2] || 
                                        { progress: 0, tasks: 0, completed: 0 };
                    
                    // Get the display name and color for this tier2 category from database
                    const dbCategory = dbTier2Categories?.find(cat => 
                      cat.name.toLowerCase() === tier2.toLowerCase() && 
                      cat.parentId === dbTier1Categories?.find(t1 => t1.name.toLowerCase() === tier1.toLowerCase())?.id
                    );
                    
                    const tier2DisplayName = dbCategory?.name || tier2.charAt(0).toUpperCase() + tier2.slice(1);
                    
                    // Get tier2 category color - use CSS variable for consistency
                    const getTier2Color = (tier2Name: string) => {
                      const normalizedName = tier2Name.toLowerCase();
                      
                      // First try to get color from database
                      if (dbCategory?.color) {
                        return dbCategory.color;
                      }
                      
                      // Use CSS variable for consistent color theming
                      const cssVar = `var(--tier2-${normalizedName}, #64748b)`;
                      
                      // Get the computed value from CSS variables
                      const computedColor = getComputedStyle(document.documentElement)
                        .getPropertyValue(`--tier2-${normalizedName}`)
                        .trim();
                      
                      return computedColor || '#64748b';
                    };
                    
                    const categoryKey = `${tier1}-${tier2}`;
                    const isExpanded = expandedCategories[categoryKey] !== undefined ? expandedCategories[categoryKey] : false;
                    
                    // Function to toggle expanded state for this category
                    const toggleExpand = () => {
                      if (expandable) {
                        setExpandedCategories(prev => ({
                          ...prev,
                          [categoryKey]: prev[categoryKey] !== undefined ? !prev[categoryKey] : true
                        }));
                      }
                    };

                    return (
                      <div key={categoryKey} className="space-y-1">
                        {/* Progress bar section - clickable if expandable is true */}
                        <div 
                          className={`${expandable ? 'cursor-pointer hover:bg-slate-50 rounded' : ''}`} 
                          onClick={toggleExpand}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              {/* Using tier2 category color instead of tier1 */}
                              <div className="w-1.5 h-4 rounded-sm mr-2 shadow border border-gray-100" 
                                  style={{ 
                                    backgroundColor: getTier2Color(tier2),
                                    opacity: 1 
                                  }}>
                              </div>
                              <p 
                                className="text-xs font-medium text-slate-700 cursor-pointer hover:text-blue-600 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent the accordion toggle
                                  const projectParam = projectId ? `projectId=${projectId}` : '';
                                  const tier1Param = `tier1=${encodeURIComponent(tier1)}`;
                                  const tier2Param = `tier2=${encodeURIComponent(tier2)}`;
                                  
                                  const params = [projectParam, tier1Param, tier2Param].filter(Boolean).join('&');
                                  navigate(`/tasks?${params}`);
                                }}
                                title={`View tasks in ${tier2DisplayName} category`}
                              >
                                {tier2DisplayName}
                              </p>
                            </div>
                            <div className="flex items-center">
                              <p className="text-xs font-medium mr-1">{tier2Progress.progress}%</p>
                              {expandable && (
                                <ChevronDown className={`h-3 w-3 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              )}
                            </div>
                          </div>
                          <ProgressBar 
                            value={tier2Progress.progress} 
                            color={getTier2Color(tier2)}
                            variant="meter"
                            showLabel={false}
                            className="h-1.5"
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
                        
                        {/* Expanded content section - only shown when expanded */}
                        {expandable && isExpanded && (
                          <div className="mt-2 pl-3 border-l-2 border-slate-200 text-xs">
                            {tier2Progress.tasks > 0 ? (
                              <div className="space-y-1">
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
                                ))}
                              </div>
                            ) : (
                              <div className="text-slate-500 italic">No tasks in this category</div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-slate-500 text-center py-2">
                  No subcategories available
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};