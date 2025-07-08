import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Flag, Combine, Eye, EyeOff } from 'lucide-react';
import { CommentableDescription } from '../CommentableDescription';
import { SubtaskComments } from './SubtaskComments';
import { Subtask } from '@shared/schema';

interface SpecialSectionsManagerProps {
  taskId: number;
}

interface SpecialSection {
  id: string;
  type: 'combined' | 'commented' | 'flagged';
  entityType: 'task' | 'subtask';
  entityId: number;
  fieldName: string;
  content: string;
  title: string;
  sectionIndices: number[];
  createdAt: string;
  updatedAt: string;
}

interface SectionState {
  id: number;
  entityType: string;
  entityId: number;
  fieldName: string;
  combinedSections: string[];
  cautionSections: string[];
  flaggedSections: string[];
  createdAt: string;
  updatedAt: string;
}

export function SpecialSectionsManager({ taskId }: SpecialSectionsManagerProps) {
  const [specialSections, setSpecialSections] = useState<SpecialSection[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Fetch task data to get the description
  const { data: task } = useQuery({
    queryKey: [`/api/tasks/${taskId}`],
    enabled: taskId > 0,
  });

  // Fetch subtasks for this task
  const { data: subtasks = [] } = useQuery<Subtask[]>({
    queryKey: [`/api/tasks/${taskId}/subtasks`],
    enabled: taskId > 0,
  });

  // Fetch section states for task description
  const { data: taskSectionState } = useQuery<SectionState>({
    queryKey: [`/api/section-states/task/${taskId}/description`],
    enabled: taskId > 0,
  });

  // Fetch section states for all subtasks
  const { data: subtaskSectionStates = [] } = useQuery<SectionState[]>({
    queryKey: [`/api/section-states/subtasks/${taskId}`],
    enabled: taskId > 0 && subtasks.length > 0,
    queryFn: async () => {
      const states = await Promise.all(
        subtasks.map(async (subtask) => {
          try {
            const response = await fetch(`/api/section-states/subtask/${subtask.id}/description`);
            if (response.ok) {
              return await response.json();
            }
            return null;
          } catch {
            return null;
          }
        })
      );
      return states.filter(Boolean);
    },
  });

  // Process section states to create special sections
  useEffect(() => {
    const sections: SpecialSection[] = [];

    // Process task description sections
    if (taskSectionState && task?.description) {
      const taskDescription = task.description;
      const taskSections = taskDescription.split('\n\n').filter(s => s.trim());

      // Add combined sections
      taskSectionState.combinedSections.forEach((indexStr) => {
        const index = parseInt(indexStr);
        if (index < taskSections.length) {
          sections.push({
            id: `task-${taskId}-combined-${index}`,
            type: 'combined',
            entityType: 'task',
            entityId: taskId,
            fieldName: 'description',
            content: taskSections[index],
            title: `Task: ${task.title} - Combined Section ${index + 1}`,
            sectionIndices: [index],
            createdAt: taskSectionState.createdAt,
            updatedAt: taskSectionState.updatedAt,
          });
        }
      });

      // Add commented sections
      taskSectionState.cautionSections.forEach((indexStr) => {
        const index = parseInt(indexStr);
        if (index < taskSections.length) {
          sections.push({
            id: `task-${taskId}-commented-${index}`,
            type: 'commented',
            entityType: 'task',
            entityId: taskId,
            fieldName: 'description',
            content: taskSections[index],
            title: `Task: ${task.title} - Commented Section ${index + 1}`,
            sectionIndices: [index],
            createdAt: taskSectionState.createdAt,
            updatedAt: taskSectionState.updatedAt,
          });
        }
      });

      // Add flagged sections
      taskSectionState.flaggedSections.forEach((indexStr) => {
        const index = parseInt(indexStr);
        if (index < taskSections.length) {
          sections.push({
            id: `task-${taskId}-flagged-${index}`,
            type: 'flagged',
            entityType: 'task',
            entityId: taskId,
            fieldName: 'description',
            content: taskSections[index],
            title: `Task: ${task.title} - Flagged Section ${index + 1}`,
            sectionIndices: [index],
            createdAt: taskSectionState.createdAt,
            updatedAt: taskSectionState.updatedAt,
          });
        }
      });
    }

    // Process subtask description sections
    subtaskSectionStates.forEach((sectionState) => {
      const subtask = subtasks.find(s => s.id === sectionState.entityId);
      if (!subtask?.description) return;

      const subtaskSections = subtask.description.split('\n\n').filter(s => s.trim());

      // Add combined sections
      sectionState.combinedSections.forEach((indexStr) => {
        const index = parseInt(indexStr);
        if (index < subtaskSections.length) {
          sections.push({
            id: `subtask-${subtask.id}-combined-${index}`,
            type: 'combined',
            entityType: 'subtask',
            entityId: subtask.id,
            fieldName: 'description',
            content: subtaskSections[index],
            title: `Subtask: ${subtask.title} - Combined Section ${index + 1}`,
            sectionIndices: [index],
            createdAt: sectionState.createdAt,
            updatedAt: sectionState.updatedAt,
          });
        }
      });

      // Add commented sections
      sectionState.cautionSections.forEach((indexStr) => {
        const index = parseInt(indexStr);
        if (index < subtaskSections.length) {
          sections.push({
            id: `subtask-${subtask.id}-commented-${index}`,
            type: 'commented',
            entityType: 'subtask',
            entityId: subtask.id,
            fieldName: 'description',
            content: subtaskSections[index],
            title: `Subtask: ${subtask.title} - Commented Section ${index + 1}`,
            sectionIndices: [index],
            createdAt: sectionState.createdAt,
            updatedAt: sectionState.updatedAt,
          });
        }
      });

      // Add flagged sections
      sectionState.flaggedSections.forEach((indexStr) => {
        const index = parseInt(indexStr);
        if (index < subtaskSections.length) {
          sections.push({
            id: `subtask-${subtask.id}-flagged-${index}`,
            type: 'flagged',
            entityType: 'subtask',
            entityId: subtask.id,
            fieldName: 'description',
            content: subtaskSections[index],
            title: `Subtask: ${subtask.title} - Flagged Section ${index + 1}`,
            sectionIndices: [index],
            createdAt: sectionState.createdAt,
            updatedAt: sectionState.updatedAt,
          });
        }
      });
    });

    // Sort sections by updated time (most recent first)
    sections.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    setSpecialSections(sections);
  }, [taskSectionState, subtaskSectionStates, task, subtasks, taskId]);

  const toggleSectionExpanded = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const getTypeIcon = (type: 'combined' | 'commented' | 'flagged') => {
    switch (type) {
      case 'combined':
        return <Combine className="h-4 w-4" />;
      case 'commented':
        return <MessageSquare className="h-4 w-4" />;
      case 'flagged':
        return <Flag className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: 'combined' | 'commented' | 'flagged') => {
    switch (type) {
      case 'combined':
        return <Badge className="bg-purple-100 text-purple-700">Combined</Badge>;
      case 'commented':
        return <Badge className="bg-blue-100 text-blue-700">Commented</Badge>;
      case 'flagged':
        return <Badge className="bg-red-100 text-red-700">Flagged</Badge>;
    }
  };

  if (specialSections.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Combine className="h-5 w-5" />
            Special Sections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            <div className="flex flex-col items-center gap-2">
              <div className="flex gap-2">
                <Combine className="h-6 w-6" />
                <MessageSquare className="h-6 w-6" />
                <Flag className="h-6 w-6" />
              </div>
              <p>No special sections yet</p>
              <p className="text-sm">
                Combined, commented, and flagged sections will appear here
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Combine className="h-5 w-5" />
          Special Sections ({specialSections.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {specialSections.map((section) => {
          const isExpanded = expandedSections.has(section.id);
          const subtask = section.entityType === 'subtask' 
            ? subtasks.find(s => s.id === section.entityId)
            : null;

          return (
            <div
              key={section.id}
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getTypeIcon(section.type)}
                  <span className="font-medium text-sm">{section.title}</span>
                  {getTypeBadge(section.type)}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toggleSectionExpanded(section.id)}
                  className="h-8 w-8 p-0"
                >
                  {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>

              <div className="text-xs text-gray-500 mb-2">
                Updated: {new Date(section.updatedAt).toLocaleString()}
              </div>

              {isExpanded && (
                <div className="border-t pt-4 mt-2">
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <CommentableDescription
                      description={section.content}
                      title={section.title}
                      className="text-sm"
                      onDescriptionChange={async (newContent) => {
                        // This will update the original description
                        console.log('Special section content changed:', newContent);
                      }}
                      entityType={section.entityType}
                      entityId={section.entityId}
                      fieldName={section.fieldName}
                      readOnly={true} // Make it read-only in this view
                    />
                  </div>

                  {/* Show comments if it's a subtask */}
                  {section.entityType === 'subtask' && subtask && (
                    <div className="mt-4 pt-4 border-t">
                      <SubtaskComments
                        subtaskId={subtask.id}
                        subtaskTitle={subtask.title}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}