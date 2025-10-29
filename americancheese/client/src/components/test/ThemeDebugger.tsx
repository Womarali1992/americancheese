/**
 * Theme Debug Component
 * 
 * This component shows the current state of theme loading for debugging purposes.
 */

import React from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ThemeDebuggerProps {
  projectId: number;
}

export function ThemeDebugger({ projectId }: ThemeDebuggerProps) {
  const themeHook = useTheme(projectId);
  
  // Get raw project data
  const { data: project, isLoading } = useQuery({
    queryKey: [`/api/projects/${projectId}`],
  });

  return (
    <Card className="m-4 border-2 border-red-200">
      <CardHeader>
        <CardTitle className="text-red-700">Theme Debug - Project {projectId}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold">Raw Project Data:</h4>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
            {isLoading ? 'Loading...' : JSON.stringify(project, null, 2)}
          </pre>
        </div>
        
        <div>
          <h4 className="font-semibold">Theme Hook Data:</h4>
          <ul className="text-sm space-y-1">
            <li><strong>Current Theme:</strong> {themeHook.currentTheme.name}</li>
            <li><strong>Is Project Specific:</strong> {themeHook.isProjectSpecific ? 'Yes' : 'No'}</li>
            <li><strong>Available Themes:</strong> {Object.keys(themeHook.availableThemes).join(', ')}</li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-semibold">Modern Color System:</h4>
          <div className="grid grid-cols-4 gap-2">
            {themeHook.currentTheme.colors?.slice(0, 8).map((color, index) => {
              const semanticNames = ['primary', 'secondary', 'accent', 'success', 'warning', 'error', 'info', 'material'];
              const semanticName = semanticNames[index] || `color-${index}`;
              return (
                <div key={index} className="text-center">
                  <div 
                    className="w-12 h-12 rounded mx-auto border mb-1"
                    style={{ backgroundColor: color }}
                  />
                  <div className="text-xs">
                    <div className="font-medium">{semanticName}</div>
                    <div className="text-gray-500">{color}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div>
          <h4 className="font-semibold">Applied CSS Variables:</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>--color-primary: <span style={{color: 'var(--color-primary)'}}>●</span> {themeHook.currentTheme.colors?.[0] || 'N/A'}</div>
            <div>--color-secondary: <span style={{color: 'var(--color-secondary)'}}>●</span> {themeHook.currentTheme.colors?.[1] || 'N/A'}</div>
            <div>--color-accent: <span style={{color: 'var(--color-accent)'}}>●</span> {themeHook.currentTheme.colors?.[2] || 'N/A'}</div>
            <div>--color-material: <span style={{color: 'var(--color-material)'}}>●</span> {themeHook.currentTheme.colors?.[7] || themeHook.currentTheme.colors?.[2] || 'N/A'}</div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold">Project Database Fields:</h4>
          {project && (
            <ul className="text-sm space-y-1">
              <li><strong>colorTheme:</strong> {project.colorTheme || 'null'}</li>
              <li><strong>useGlobalTheme:</strong> {String(project.useGlobalTheme)}</li>
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ThemeDebugger;