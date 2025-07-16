import React, { useState } from 'react';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Clipboard,
  CheckSquare,
  Combine,
  Package,
  Users,
  User,
  Calendar,
  FileText,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Plus,
  Upload,
  File
} from "lucide-react";
import { Task } from '@shared/schema';
import { SubtaskManager } from './SubtaskManager';
import { TaskChecklistManager } from './TaskChecklistManager';
import { SpecialSectionsManager } from './SpecialSectionsManager';
import { TaskLabor } from './TaskLabor';
import { TaskMaterials } from './TaskMaterials';
import { TaskAttachmentsPanel } from './TaskAttachmentsPanel';
import { formatDate } from '@/lib/utils';
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
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
  const project = projects.find((p: any) => p.id === task.projectId);
  
  // Calculate progress for different sections
  const calculateProgress = (completed: number, total: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

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
      content: <SpecialSectionsManager taskId={task.id} />
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
                <Badge variant="outline">{taskMaterials.length}</Badge>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={onAddMaterials}
                className="text-orange-600 border-orange-200 hover:bg-orange-50"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <TaskMaterials taskId={task.id} />
            </div>
          </div>

          {/* Contacts Section */}
          {taskContacts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-green-600" />
                <h4 className="font-medium">Assigned Contacts</h4>
                <Badge variant="outline">{taskContacts.length}</Badge>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {taskContacts.map((contact: any) => (
                    <div key={contact.id} className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                      <User className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="font-medium text-sm">{contact.name}</p>
                        <p className="text-xs text-gray-600">{contact.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

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
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <TaskLabor taskId={task.id} mode="full" />
          </div>
        </div>
      )
    }
  ];

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  return (
    <div className="space-y-4">
      {/* Desktop: Grid layout for collapsed sections, full width for expanded */}
      <div className="hidden lg:block">
        {/* Show grid only when no section is expanded */}
        {!expandedSection && (
          <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {sections.map((section) => (
              <Card key={section.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader 
                  className="pb-3 hover:bg-gray-50 transition-colors"
                  onClick={() => toggleSection(section.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {section.icon}
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={section.badgeVariant as any}>
                        {section.badge}
                      </Badge>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
        
        {/* Show full width expanded section */}
        {expandedSection && (
          <Card className="overflow-hidden">
            <CardHeader 
              className="pb-3 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleSection(expandedSection)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {sections.find(s => s.id === expandedSection)?.icon}
                  <CardTitle className="text-lg">{sections.find(s => s.id === expandedSection)?.title}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={sections.find(s => s.id === expandedSection)?.badgeVariant as any}>
                    {sections.find(s => s.id === expandedSection)?.badge}
                  </Badge>
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {sections.find(s => s.id === expandedSection)?.content}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Mobile: Accordion-based layout */}
      <div className="block lg:hidden">
        <Accordion type="multiple" defaultValue={["overview", "subtasks"]} className="w-full space-y-4">
          {sections.map((section) => (
            <AccordionItem key={section.id} value={section.id} className="border rounded-lg">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-3">
                  {section.icon}
                  <span className="text-lg font-semibold">{section.title}</span>
                  <Badge variant={section.badgeVariant as any}>
                    {section.badge}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                {section.content}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}