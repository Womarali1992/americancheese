import { useState } from "react";
import { TaskSelector } from "@/components/ui/task-selector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function TaskSelectorExample() {
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [selectedProjectTaskId, setSelectedProjectTaskId] = useState<string>("");

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Task Selector Examples</h1>
        <p className="text-muted-foreground">
          Here are examples of how to use the task selector component with different configurations.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Basic Task Selector */}
        <Card>
          <CardHeader>
            <CardTitle>All Tasks (No Filter)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="all-tasks">Select Any Task</Label>
              <TaskSelector
                value={selectedTaskId}
                onValueChange={setSelectedTaskId}
                placeholder="Choose any task from all projects"
                className="w-full"
              />
            </div>
            {selectedTaskId && (
              <div className="p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  Selected Task ID: <strong>{selectedTaskId}</strong>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Project-Specific Task Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Tasks for Project 8 (HTXapt.com)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-tasks">Select Task from Project 8</Label>
              <TaskSelector
                value={selectedProjectTaskId}
                onValueChange={setSelectedProjectTaskId}
                placeholder="Choose task from HTXapt.com project"
                projectId={8}
                className="w-full"
              />
            </div>
            {selectedProjectTaskId && (
              <div className="p-3 bg-green-50 rounded-md">
                <p className="text-sm text-green-800">
                  Selected Task ID: <strong>{selectedProjectTaskId}</strong>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Examples</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-semibold">Basic Usage:</h4>
              <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-x-auto">
{`<TaskSelector
  value={selectedTaskId}
  onValueChange={setSelectedTaskId}
  placeholder="Select a task"
/>`}
              </pre>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">Project-Specific Usage:</h4>
              <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-x-auto">
{`<TaskSelector
  value={selectedTaskId}
  onValueChange={setSelectedTaskId}
  projectId={8}
  placeholder="Select task from project"
/>`}
              </pre>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">Features:</h4>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Shows all tasks with no filters by default</li>
                <li>Can be filtered by project using the projectId prop</li>
                <li>Displays task title, categories, assigned person, and dates</li>
                <li>Shows task status with color-coded badges</li>
                <li>Automatically sorts tasks alphabetically</li>
                <li>Responsive design that works on all screen sizes</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        <Button 
          onClick={() => setSelectedTaskId("")}
          variant="outline"
        >
          Clear All Tasks Selection
        </Button>
        <Button 
          onClick={() => setSelectedProjectTaskId("")}
          variant="outline"
        >
          Clear Project Tasks Selection
        </Button>
      </div>
    </div>
  );
}