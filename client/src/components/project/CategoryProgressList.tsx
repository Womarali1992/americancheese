import React from 'react';
import { ProgressBar } from '@/components/ui/progress-bar';

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
    <div className="space-y-4">
      {categoriesToDisplay.map(tier => {
        const displayName = standardCategories[tier as keyof typeof standardCategories];
        const { progress, tasks, completed } = progressByTier[tier] || { progress: 0, tasks: 0, completed: 0 };
        
        return (
          <div key={tier} className="space-y-1">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium">{displayName}</p>
              <p className="text-sm text-slate-500">{progress}%</p>
            </div>
            <ProgressBar value={progress} color="teal" />
            <p className="text-xs text-slate-500 text-right">
              {completed} of {tasks} tasks completed
            </p>
          </div>
        );
      })}
    </div>
  );
};