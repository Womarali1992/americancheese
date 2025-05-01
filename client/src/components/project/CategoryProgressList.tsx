import React, { useState } from 'react';
import { ProgressBar } from '@/components/charts/ProgressBar';
import { getTier1CategoryColor, getTier2CategoryColor } from '@/lib/color-utils';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { ChevronDown } from 'lucide-react';

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
  
  // Group tasks by tier2Category within each tier1Category
  const tasksByTier2 = tasks.reduce((acc, task) => {
    if (!task.tier1Category || !task.tier2Category) return acc;
    
    const tier1 = task.tier1Category.toLowerCase();
    
    // Skip tasks in hidden categories
    if (hiddenCategories.includes(tier1)) return acc;
    
    const tier2 = task.tier2Category.toLowerCase();
    
    if (!acc[tier1]) {
      acc[tier1] = {};
    }
    
    if (!acc[tier1][tier2]) {
      acc[tier1][tier2] = [];
    }
    
    acc[tier1][tier2].push(task);
    return acc;
  }, {} as Record<string, Record<string, any[]>>);
  
  // Calculate completion percentage for each tier1
  const progressByTier1: Record<string, { progress: number, tasks: number, completed: number }> = {};
  
  // Calculate completion percentage for each tier2 within tier1
  const progressByTier2: Record<string, Record<string, { progress: number, tasks: number, completed: number }>> = {};
  
  const standardCategories = {
    'structural': 'Structural Systems',
    'systems': 'Systems', 
    'sheathing': 'Sheathing',
    'finishings': 'Finishings'
  };
  
  // Mapping of predefined tier2 categories for each tier1
  const predefinedTier2Categories: Record<string, { [key: string]: string }> = {
    'structural': {
      'foundation': 'Foundation',
      'framing': 'Framing',
      'roofing': 'Roofing',
      'other': 'Other Structural'
    },
    'systems': {
      'electrical': 'Electrical',
      'plumbing': 'Plumbing',
      'hvac': 'HVAC',
      'other': 'Other Systems'
    },
    'sheathing': {
      'barriers': 'Barriers',
      'drywall': 'Drywall',
      'exteriors': 'Exteriors',
      'other': 'Other Sheathing'
    },
    'finishings': {
      'windows': 'Windows',
      'doors': 'Doors',
      'cabinets': 'Cabinets',
      'fixtures': 'Fixtures',
      'flooring': 'Flooring',
      'other': 'Other Finishings'
    }
  };
  
  // Process each tier1 category
  Object.keys(tasksByTier1).forEach(tier1 => {
    const tier1Tasks = tasksByTier1[tier1];
    const totalTasks = tier1Tasks.length;
    
    // Check both the completed flag and status field
    const completedTasks = tier1Tasks.filter(task => 
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
        const tier2CompletedTasks = tier2Tasks.filter(task => 
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
  
  // Only display standard categories that aren't hidden
  const categoriesToDisplay = Object.keys(standardCategories)
    .filter(category => !hiddenCategories.includes(category) && progressByTier1[category]);

  if (categoriesToDisplay.length === 0) {
    return (
      <div className="text-center text-sm text-slate-500 py-2">
        All categories are hidden
      </div>
    );
  }
  
  return (
    <Accordion type="multiple" className="space-y-5">
      {categoriesToDisplay.map(tier1 => {
        const displayName = standardCategories[tier1 as keyof typeof standardCategories];
        const { progress, tasks, completed } = progressByTier1[tier1] || { progress: 0, tasks: 0, completed: 0 };
        
        // Get tier2 categories for this tier1 (use predefined if available, or fall back to dynamic)
        const tier2Categories = progressByTier2[tier1] 
          ? Object.keys(progressByTier2[tier1])
          : [];
          
        const hasTier2Categories = tier2Categories.length > 0;
        
        return (
          <AccordionItem 
            key={tier1} 
            value={tier1} 
            className="border-0 shadow-sm rounded-lg bg-white overflow-hidden"
          >
            <div className="px-4 pt-3 pb-1">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className={`w-1.5 h-5 rounded-sm mr-2 ${getTier1CategoryColor(tier1, 'bg')}`}></div>
                  <AccordionTrigger className="p-0 hover:no-underline">
                    <p className="text-sm font-medium">{displayName}</p>
                  </AccordionTrigger>
                </div>
                <p className="text-sm font-semibold">{progress}%</p>
              </div>
              <ProgressBar 
                value={progress} 
                color={getTier1CategoryColor(tier1, 'bg').replace('bg-', '')}
                variant="meter"
                showLabel={false}
                className="mt-2"
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
                <div className="space-y-3 mt-1 border-t pt-3">
                  {tier2Categories.map(tier2 => {
                    // Get tier2 progress data if available, or default values
                    const tier2Progress = progressByTier2[tier1]?.[tier2] || 
                                        { progress: 0, tasks: 0, completed: 0 };
                    
                    // Get the display name for this tier2 category
                    const tier2DisplayName = 
                      predefinedTier2Categories[tier1]?.[tier2] || 
                      tier2.charAt(0).toUpperCase() + tier2.slice(1);
                    
                    return (
                      <div key={`${tier1}-${tier2}`} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className={`w-1 h-4 rounded-sm mr-2 ${getTier2CategoryColor(tier2, 'bg')}`}></div>
                            <p className="text-xs font-medium text-slate-700">{tier2DisplayName}</p>
                          </div>
                          <p className="text-xs font-medium">{tier2Progress.progress}%</p>
                        </div>
                        <ProgressBar 
                          value={tier2Progress.progress} 
                          color={getTier2CategoryColor(tier2, 'bg').replace('bg-', '')}
                          variant="meter"
                          showLabel={false}
                          className="h-1.5"
                        />
                        <div className="text-xs text-slate-500">
                          {tier2Progress.completed} of {tier2Progress.tasks} tasks
                        </div>
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