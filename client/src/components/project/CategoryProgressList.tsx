import React from 'react';
import { ProgressBar } from '@/components/charts/ProgressBar';

interface CategoryProgressListProps {
  tasks: any[];
  hiddenCategories: string[];
}

export const CategoryProgressList: React.FC<CategoryProgressListProps> = ({ 
  tasks, 
  hiddenCategories 
}) => {
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
    return acc;
  }, {} as Record<string, any[]>);
  
  // Calculate completion percentage for each tier
  const progressByTier: Record<string, { progress: number, tasks: number, completed: number }> = {};
  
  const standardCategories = {
    'structural': 'Structural Systems',
    'systems': 'Systems', 
    'sheathing': 'Sheathing',
    'finishings': 'Finishings'
  };
  
  // Process each tier1 category
  Object.keys(tasksByTier1).forEach(tier => {
    const tierTasks = tasksByTier1[tier];
    const totalTasks = tierTasks.length;
    
    // Check both the completed flag and status field
    const completedTasks = tierTasks.filter(task => 
      task.completed === true || task.status === 'completed'
    ).length;
    
    // Store progress calculations
    progressByTier[tier] = {
      progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      tasks: totalTasks,
      completed: completedTasks
    };
  });
  
  // Only display standard categories that aren't hidden
  const categoriesToDisplay = Object.keys(standardCategories)
    .filter(category => !hiddenCategories.includes(category) && progressByTier[category]);

  if (categoriesToDisplay.length === 0) {
    return (
      <div className="text-center text-sm text-slate-500 py-2">
        All categories are hidden
      </div>
    );
  }
  
  return (
    <div className="space-y-5">
      {categoriesToDisplay.map(tier => {
        const displayName = standardCategories[tier as keyof typeof standardCategories];
        const { progress, tasks, completed } = progressByTier[tier] || { progress: 0, tasks: 0, completed: 0 };
        
        return (
          <div key={tier} className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className={`w-1.5 h-5 rounded-sm mr-2 ${
                  tier === 'structural' ? "bg-orange-500" : 
                  tier === 'systems' ? "bg-blue-500" : 
                  tier === 'sheathing' ? "bg-teal-500" : 
                  tier === 'finishings' ? "bg-slate-500" : "bg-teal-500"
                }`}></div>
                <p className="text-sm font-medium">{displayName}</p>
              </div>
              <p className="text-sm font-semibold">{progress}%</p>
            </div>
            <ProgressBar 
              value={progress} 
              color={
                tier === 'structural' ? "brown" : 
                tier === 'systems' ? "blue" : 
                tier === 'sheathing' ? "teal" : 
                tier === 'finishings' ? "slate" : "teal"
              }
              variant="meter"
              showLabel={false}
            />
            <div className="flex justify-between items-center">
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
        );
      })}
    </div>
  );
};