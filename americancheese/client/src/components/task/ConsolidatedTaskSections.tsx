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
import { ExportableSection } from '@/components/ui/page-drag-export';
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
      content: <TaskChecklistManager taskId={task.id} projectId={task.projectId} />
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
          {/* Materials and Labor Side by Side on Desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Materials Section */}
            <ExportableSection id="materials">
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
            </ExportableSection>

            {/* Labor & Time Tracking Section */}
            <ExportableSection id="labor">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-700" />
                    <h4 className="font-medium">Labor & Time Tracking</h4>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onAddLabor}
                    className="text-slate-700 border-slate-300 hover:bg-slate-100"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Labor
                  </Button>
                </div>
                <div className="bg-slate-100 p-4 rounded-lg border border-slate-300">
                  <TaskLabor taskId={task.id} />
                </div>
              </div>
            </ExportableSection>
          </div>

          {/* Attachments Section - Full Width Below */}
          <ExportableSection id="attachments">
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
                <TaskAttachmentsPanel task={{ ...task, completed: Boolean(task.completed), category: task.category || '', tier1Category: task.tier1Category || '', tier2Category: task.tier2Category || '' }} />
              </div>
            </div>
          </ExportableSection>
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
        <div className="fixed inset-0 bg-white z-50 flex flex-col overflow-hidden">
          <div className="flex-shrink-0 flex items-center justify-between p-4 border-b bg-white">
            <div className="flex items-center gap-3">
              {section.icon}
              <h1 className="text-xl font-semibold">{section.title}</h1>
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
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {section.content}
          </div>
        </div>
      );
    }
  }

  // Normal view - subtasks as main header, other sections below
  const subtasksSection = sections.find(s => s.id === 'subtasks');
  const otherSections = sections.filter(s => s.id !== 'subtasks');

  return (
    <div className="space-y-6">
      {/* Subtasks as main header section */}
      {subtasksSection && (
        <ExportableSection id="subtasks">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {subtasksSection.icon}
                <h1 className="text-2xl font-bold">{subtasksSection.title}</h1>
                <Badge variant={subtasksSection.badgeVariant as any}>
                  {subtasksSection.badge}
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleFullscreen(subtasksSection.id)}
                className="p-2 h-8 w-8 hover:bg-gray-100"
                title="Open in fullscreen"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border">
              {subtasksSection.content}
            </div>
          </div>
        </ExportableSection>
      )}

      {/* Other sections in cards */}
      {otherSections.map((section) => (
        <ExportableSection key={section.id} id={section.id}>
          <Card className="overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white">
            <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-md ${section.id === 'special' ? 'bg-purple-100 text-purple-600' :
                    section.id === 'resources' ? 'bg-blue-100 text-blue-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                    {section.icon}
                  </div>
                  <CardTitle className="text-lg font-semibold text-slate-900">{section.title}</CardTitle>
                  {section.badge !== '0/0' && (
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-slate-200">
                      {section.badge}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleFullscreen(section.id)}
                  className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  title="Open in fullscreen"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {section.content}
            </CardContent>
          </Card>
        </ExportableSection>
      ))}
    </div>
  );
}