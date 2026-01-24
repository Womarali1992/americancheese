import React, { useState } from 'react';
import { FileCode2, Save, Download, Upload, Trash2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { ContextData } from '../../../../shared/context-types';
import type { AiContextTemplate } from '../../../../shared/schema';

export interface ContextTemplateSelectorProps {
  /** Available templates */
  templates: AiContextTemplate[];
  /** Current context data */
  currentContext?: ContextData | null;
  /** Callback when a template is selected */
  onApplyTemplate?: (template: AiContextTemplate) => void;
  /** Callback to save current context as template */
  onSaveAsTemplate?: (name: string, description: string, isGlobal: boolean) => void;
  /** Callback to delete a template */
  onDeleteTemplate?: (templateId: number) => void;
  /** Loading state */
  loading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function ContextTemplateSelector({
  templates,
  currentContext,
  onApplyTemplate,
  onSaveAsTemplate,
  onDeleteTemplate,
  loading = false,
  className,
}: ContextTemplateSelectorProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const [newTemplateIsGlobal, setNewTemplateIsGlobal] = useState(false);

  // Handle template selection
  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
  };

  // Apply selected template
  const handleApplyTemplate = () => {
    if (!selectedTemplateId) return;

    const template = templates.find(t => t.id.toString() === selectedTemplateId);
    if (template && onApplyTemplate) {
      onApplyTemplate(template);
      setSelectedTemplateId('');
    }
  };

  // Save current context as template
  const handleSaveAsTemplate = () => {
    if (!newTemplateName.trim() || !onSaveAsTemplate) return;

    onSaveAsTemplate(
      newTemplateName.trim(),
      newTemplateDescription.trim(),
      newTemplateIsGlobal
    );

    // Reset form
    setNewTemplateName('');
    setNewTemplateDescription('');
    setNewTemplateIsGlobal(false);
    setSaveDialogOpen(false);
  };

  // Group templates by global vs project-specific
  const globalTemplates = templates.filter(t => t.isGlobal);
  const projectTemplates = templates.filter(t => !t.isGlobal);

  return (
    <div className={cn('space-y-3', className)}>
      {/* Template selector */}
      <div className="flex items-center gap-2">
        <Select value={selectedTemplateId} onValueChange={handleSelectTemplate}>
          <SelectTrigger className="flex-1 h-8 text-xs">
            <SelectValue placeholder="Select a template..." />
          </SelectTrigger>
          <SelectContent>
            {globalTemplates.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  Global Templates
                </div>
                {globalTemplates.map(template => (
                  <SelectItem
                    key={template.id}
                    value={template.id.toString()}
                    className="text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <FileCode2 className="h-3.5 w-3.5" />
                      {template.name}
                    </div>
                  </SelectItem>
                ))}
              </>
            )}
            {projectTemplates.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  Project Templates
                </div>
                {projectTemplates.map(template => (
                  <SelectItem
                    key={template.id}
                    value={template.id.toString()}
                    className="text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <FileCode2 className="h-3.5 w-3.5" />
                      {template.name}
                    </div>
                  </SelectItem>
                ))}
              </>
            )}
            {templates.length === 0 && (
              <div className="px-2 py-4 text-xs text-center text-muted-foreground">
                No templates available
              </div>
            )}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={handleApplyTemplate}
          disabled={!selectedTemplateId || loading}
          className="h-8 text-xs"
        >
          <Download className="h-3.5 w-3.5 mr-1" />
          Apply
        </Button>
      </div>

      {/* Selected template preview */}
      {selectedTemplateId && (
        <div className="p-2 bg-muted/50 rounded-md">
          {(() => {
            const template = templates.find(
              t => t.id.toString() === selectedTemplateId
            );
            if (!template) return null;

            return (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{template.name}</span>
                  <div className="flex items-center gap-1">
                    {template.isGlobal && (
                      <Badge variant="secondary" className="text-xs">
                        Global
                      </Badge>
                    )}
                    {onDeleteTemplate && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Template</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{template.name}"?
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDeleteTemplate(template.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
                {template.description && (
                  <p className="text-xs text-muted-foreground">
                    {template.description}
                  </p>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Save as template button */}
      {currentContext && onSaveAsTemplate && (
        <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full h-8 text-xs border-dashed"
            >
              <Save className="h-3.5 w-3.5 mr-1" />
              Save Current as Template
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Save as Template</DialogTitle>
              <DialogDescription>
                Create a reusable template from your current context configuration.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="template-name" className="text-sm">
                  Template Name
                </Label>
                <Input
                  id="template-name"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="e.g., Residential Construction Project"
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-description" className="text-sm">
                  Description (optional)
                </Label>
                <Textarea
                  id="template-description"
                  value={newTemplateDescription}
                  onChange={(e) => setNewTemplateDescription(e.target.value)}
                  placeholder="Brief description of when to use this template..."
                  className="min-h-[60px] resize-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="template-global"
                  checked={newTemplateIsGlobal}
                  onChange={(e) => setNewTemplateIsGlobal(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="template-global" className="text-sm font-normal">
                  Make available to all projects (global template)
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSaveDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveAsTemplate}
                disabled={!newTemplateName.trim() || loading}
              >
                <Plus className="h-4 w-4 mr-1" />
                Create Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default ContextTemplateSelector;
