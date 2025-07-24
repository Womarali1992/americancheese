import React, { useState } from 'react';
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Clipboard,
  CheckSquare,
  Combine,
  Package,
  Users,
  User,
  Calendar,
  FileText,
  Plus,
  Upload,
  File,
  Maximize2,
  Minimize2,
  X
} from "lucide-react";
import { Task } from '@shared/schema';
import { SubtaskManager } from './SubtaskManager';
import { TaskChecklistManager } from './TaskChecklistManager';
import { SpecialSectionsManager } from './SpecialSectionsManager';
import { TaskLabor } from './TaskLabor';
import { TaskMaterials } from './TaskMaterials';
import { TaskAttachmentsPanel } from './TaskAttachmentsPanel';
import { format } from 'date-fns';

interface ConsolidatedTaskSectionsProps {
  task: Task;
  onAddMaterials?: () => void;
  onAddLabor?: () => void;
  onAddAttachments?: () => void;
  taskMaterials?: any[];
  taskContacts?: any[];
  projects?: any[];
}

export function ConsolidatedTaskSections({ 
  task, 
  onAddMaterials, 
  onAddLabor, 
  onAddAttachments,
  taskMaterials = [],
  taskContacts = [],
  projects = []
}: ConsolidatedTaskSectionsProps) {
  const [fullscreenSection, setFullscreenSection] = useState<string | null>(null);
  
  const project = projects.find((p: any) => p.id === task.projectId);

  const sections = [
    {
      id: 'overview',
      title: 'Task Overview',
      icon: <FileText className="h-5 w-5" />,
      badge: task.status === 'completed' ? 'Completed' : 'Active',
      badgeVariant: task.status === 'completed' ? 'default' : 'secondary',
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center p-3 bg-blue-50 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-500 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Start Date</p>
                <p className="font-medium">{task.startDate ? format(new Date(task.startDate), 'MMM d, yyyy') : 'Not set'}</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-purple-50 rounded-lg">
              <Calendar className="h-5 w-5 text-purple-500 mr-3" />
              <div>
                <p className="text-sm text-gray-500">End Date</p>
                <p className="font-medium">{task.endDate ? format(new Date(task.endDate), 'MMM d, yyyy') : 'Not set'}</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-green-50 rounded-lg">
              <User className="h-5 w-5 text-green-500 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Assigned To</p>
                <p className="font-medium">{task.assignedTo || "Unassigned"}</p>
              </div>
            </div>
          </div>
          
          {task.description && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{task.description}</p>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'subtasks',
      title: 'Task Checklist',
      icon: <Clipboard className="h-5 w-5" />,
      badge: '0/0',
      badgeVariant: 'outline',
      content: <SubtaskManager taskId={task.id} />
    },
    {
      id: 'blockers',
      title: 'Blocker Board',
      icon: <CheckSquare className="h-5 w-5" />,
      badge: '0/0',
      badgeVariant: 'outline',
      content: <TaskChecklistManager taskId={task.id} />
    },
    {
      id: 'special',
      title: 'Special Sections',
      icon: <Combine className="h-5 w-5" />,
      badge: 'Advanced',
      badgeVariant: 'secondary',
      content: <SpecialSectionsManager task={task} />
    },
    {
      id: 'resources',
      title: 'Resources & Assets',
      icon: <Package className="h-5 w-5" />,
      badge: `${taskMaterials.length + taskContacts.length}`,
      badgeVariant: 'outline',
      content: (
        <div className="space-y-6">
          {/* Materials Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-orange-600" />
                <h4 className="font-medium">Materials</h4>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={onAddMaterials}
                className="text-orange-600 border-orange-200 hover:bg-orange-50"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Materials
              </Button>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <TaskMaterials taskId={task.id} />
            </div>
          </div>

          {/* Attachments Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <File className="h-4 w-4 text-blue-600" />
                <h4 className="font-medium">Attachments</h4>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={onAddAttachments}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <Upload className="h-3 w-3 mr-1" />
                Upload
              </Button>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <TaskAttachmentsPanel task={task} />
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'labor',
      title: 'Labor & Time Tracking',
      icon: <Users className="h-5 w-5" />,
      badge: 'Track',
      badgeVariant: 'outline',
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Labor Entries</h4>
            <Button 
              size="sm" 
              variant="outline"
              onClick={onAddLabor}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Labor
            </Button>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <TaskLabor taskId={task.id} />
          </div>
        </div>
      )
    }
  ];

  const toggleFullscreen = (sectionId: string) => {
    setFullscreenSection(fullscreenSection === sectionId ? null : sectionId);
  };

  // If a section is in fullscreen mode
  if (fullscreenSection) {
    const section = sections.find(s => s.id === fullscreenSection);
    if (section) {
      return (
        <div className="fixed inset-0 bg-white z-50 overflow-hidden">
          <Card className="h-full rounded-none border-0">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3 border-b">
              <div className="flex items-center gap-3">
                {section.icon}
                <CardTitle className="text-xl">{section.title}</CardTitle>
                <Badge variant={section.badgeVariant as any}>
                  {section.badge}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFullscreenSection(null)}
                className="p-2 h-8 w-8 hover:bg-gray-200"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="flex-1 p-6 overflow-y-auto h-[calc(100vh-80px)]">
              {section.content}
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  // Normal view - all sections on one page
  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <Card key={section.id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {section.icon}
                <CardTitle className="text-lg">{section.title}</CardTitle>
                <Badge variant={section.badgeVariant as any}>
                  {section.badge}
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleFullscreen(section.id)}
                className="p-2 h-8 w-8 hover:bg-gray-100"
                title="Open in fullscreen"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {section.content}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}