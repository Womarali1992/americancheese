/**
 * Test Component for Project-Specific Themes
 * 
 * This component tests if project-specific themes are working correctly
 * in the "All Projects" view by showing colors for different projects.
 */

import React from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProjectThemeTestProps {
  projectIds: number[];
  testCategories: string[];
}

export function ProjectThemeTest({ 
  projectIds = [5, 6, 8, 9, 10, 11], 
  testCategories = ['structural', 'electrical', 'framing', 'plumbing'] 
}: ProjectThemeTestProps) {
  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle>Project Theme Test</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projectIds.map(projectId => {
            const ProjectThemeColors = ({ projectId }: { projectId: number }) => {
              const { currentTheme, getColor, isProjectSpecific } = useTheme(projectId);
              
              return (
                <div key={projectId} className="border rounded p-3">
                  <h4 className="font-medium mb-2">
                    Project {projectId} - {currentTheme.name}
                    {isProjectSpecific && <span className="ml-2 text-blue-600">(Project-specific)</span>}
                  </h4>
                  <div className="grid grid-cols-4 gap-2">
                    {testCategories.map(category => {
                      const color = getColor.category(category);
                      return (
                        <div key={category} className="text-center">
                          <div 
                            className="w-12 h-12 rounded mx-auto border-2 border-gray-300 mb-1"
                            style={{ backgroundColor: color }}
                            title={`${category}: ${color}`}
                          />
                          <span className="text-xs capitalize">{category}</span>
                          <div className="text-xs text-gray-500">{color}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            };
            
            return <ProjectThemeColors key={projectId} projectId={projectId} />;
          })}
        </div>
        
        <div className="mt-6 p-3 bg-gray-50 rounded text-sm">
          <strong>Expected behavior:</strong>
          <ul className="mt-1 list-disc list-inside space-y-1">
            <li>Projects with custom themes should show different colors</li>
            <li>Projects without custom themes should use the global theme</li>
            <li>Each project should display its theme name</li>
            <li>Project-specific themes should be marked as such</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

export default ProjectThemeTest;