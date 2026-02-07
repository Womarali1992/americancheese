import React, { useState, useCallback, useMemo } from 'react';
import { FileCode2, Copy, Check, Eye, EyeOff, Plus, Settings2, Lightbulb, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MultiSelectChips } from '@/components/ui/multi-select-chips';
import { TagInput } from '@/components/ui/tag-input';
import { BulletedListInput } from '@/components/ui/bulleted-list-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ContextData,
  ContextSection,
  ContextEntityType,
  ContextSectionType,
  CastingPersona,
  createEmptyContext,
  updateSectionContent,
  SUGGESTED_TECH_STACK,
  SUGGESTED_STRATEGY_TAGS,
  BMAD_SECTION_GUIDANCE,
  BMAD_PRINCIPLES,
  calculateBmadScore,
} from '../../../../shared/context-types';
import { generateContextXml } from '../../../../shared/context-xml-generator';

export interface ContextEditorProps {
  /** Entity ID for context */
  entityId: string;
  /** Type of entity */
  entityType: ContextEntityType;
  /** Initial context data (JSON stringified or object) */
  initialContext?: string | ContextData | null;
  /** Callback when context changes */
  onChange?: (context: ContextData) => void;
  /** Callback with XML export */
  onExport?: (xml: string) => void;
  /** Whether editor is read-only */
  readOnly?: boolean;
  /** Compact mode - fewer sections visible by default */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Show XML preview */
  showPreview?: boolean;
}

// Section icons and labels with BMAD guidance
const SECTION_CONFIG: Record<string, { icon: string; label: string; description: string }> = {
  mission: {
    icon: '🎯',
    label: 'Mission',
    description: 'Core purpose and objectives',
  },
  scope: {
    icon: '📐',
    label: 'Scope',
    description: 'Boundaries and focus areas',
  },
  tech: {
    icon: '🛠️',
    label: 'Tech Stack',
    description: 'Tools, technologies, and platforms',
  },
  casting: {
    icon: '👥',
    label: 'Casting',
    description: 'Key personas and stakeholders',
  },
  deliverables: {
    icon: '📦',
    label: 'Deliverables',
    description: 'Expected outputs and outcomes',
  },
  strategy_tags: {
    icon: '#️⃣',
    label: 'Strategy Tags',
    description: 'Keywords for AI context',
  },
  constraints: {
    icon: '⚠️',
    label: 'Constraints',
    description: 'Limitations and requirements',
  },
  custom: {
    icon: '📝',
    label: 'Custom',
    description: 'User-defined section',
  },
};

/**
 * BMAD Quality Indicator Component
 * Shows the overall BMAD score and principle breakdown
 */
interface BmadIndicatorProps {
  context: ContextData;
  compact?: boolean;
}

function BmadIndicator({ context, compact = false }: BmadIndicatorProps) {
  const [expanded, setExpanded] = useState(false);
  const { total, principles, suggestions } = useMemo(
    () => calculateBmadScore(context),
    [context]
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-red-400';
  };

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 cursor-help">
              <TrendingUp className={cn('h-3.5 w-3.5', getScoreColor(total))} />
              <span className={cn('text-xs font-medium', getScoreColor(total))}>
                {total}%
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[250px]">
            <div className="space-y-2">
              <p className="font-medium text-xs">BMAD Quality Score</p>
              <div className="grid grid-cols-2 gap-1 text-xs">
                {Object.entries(BMAD_PRINCIPLES).map(([key, { label, color }]) => (
                  <div key={key} className="flex items-center gap-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span>{label}:</span>
                    <span className="font-medium">
                      {principles[key as keyof typeof principles]}%
                    </span>
                  </div>
                ))}
              </div>
              {suggestions.length > 0 && (
                <div className="border-t pt-1 mt-1">
                  <p className="text-xs text-muted-foreground">{suggestions[0]}</p>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1.5"
        >
          <TrendingUp className={cn('h-3.5 w-3.5', getScoreColor(total))} />
          <span>BMAD</span>
          <span className={cn('font-bold', getScoreColor(total))}>{total}%</span>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <div className="bg-muted/50 rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Quality Score</span>
            <span className={cn('text-sm font-bold', getScoreColor(total))}>
              {total}/100
            </span>
          </div>

          {/* Principle bars */}
          <div className="space-y-2">
            {Object.entries(BMAD_PRINCIPLES).map(([key, { label, color, description }]) => {
              const score = principles[key as keyof typeof principles];
              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="font-medium">{label}</span>
                    </div>
                    <span className="text-muted-foreground">{score}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${score}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="border-t pt-2 space-y-1">
              <p className="text-xs font-medium flex items-center gap-1">
                <Lightbulb className="h-3 w-3 text-amber-500" />
                Suggestions
              </p>
              {suggestions.map((suggestion, i) => (
                <p key={i} className="text-xs text-muted-foreground pl-4">
                  {suggestion}
                </p>
              ))}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * BMAD Hint Badge for individual sections
 */
interface BmadHintProps {
  sectionType: ContextSectionType;
}

function BmadHint({ sectionType }: BmadHintProps) {
  const guidance = BMAD_SECTION_GUIDANCE[sectionType];
  if (!guidance) return null;

  const principle = BMAD_PRINCIPLES[guidance.principle];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 h-4 cursor-help"
            style={{
              borderColor: principle.color,
              color: principle.color,
            }}
          >
            {principle.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[200px]">
          <p className="text-xs">{guidance.hint}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Persona role options
const PERSONA_ROLES = [
  { value: 'primary_agent', label: 'Primary Agent' },
  { value: 'target_user', label: 'Target User' },
  { value: 'stakeholder', label: 'Stakeholder' },
  { value: 'reviewer', label: 'Reviewer' },
] as const;

export function ContextEditor({
  entityId,
  entityType,
  initialContext,
  onChange,
  onExport,
  readOnly = false,
  compact = false,
  className,
  showPreview = true,
}: ContextEditorProps) {
  // Parse initial context
  const parseInitialContext = (): ContextData => {
    if (!initialContext) {
      return createEmptyContext(entityId, entityType);
    }
    if (typeof initialContext === 'string') {
      try {
        return JSON.parse(initialContext);
      } catch {
        return createEmptyContext(entityId, entityType);
      }
    }
    return initialContext;
  };

  const [context, setContext] = useState<ContextData>(parseInitialContext);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate XML
  const xml = useMemo(() => generateContextXml(context, entityId), [context, entityId]);

  // Update context and notify parent
  const updateContext = useCallback(
    (newContext: ContextData) => {
      setContext(newContext);
      onChange?.(newContext);
    },
    [onChange]
  );

  // Update a specific section's content
  const updateSection = useCallback(
    (sectionId: string, content: ContextSection['content']) => {
      const newContext = updateSectionContent(context, sectionId, content);
      updateContext(newContext);
    },
    [context, updateContext]
  );

  // Toggle section visibility
  const toggleSectionVisibility = useCallback(
    (sectionId: string) => {
      const newContext = {
        ...context,
        sections: context.sections.map(s =>
          s.id === sectionId ? { ...s, visible: !s.visible } : s
        ),
      };
      updateContext(newContext);
    },
    [context, updateContext]
  );

  // Copy XML to clipboard
  const copyXml = async () => {
    try {
      await navigator.clipboard.writeText(xml);
      setCopied(true);
      onExport?.(xml);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Render section content based on type
  const renderSectionContent = (section: ContextSection) => {
    if (readOnly) {
      return renderReadOnlySection(section);
    }

    switch (section.type) {
      case 'mission':
      case 'scope':
      case 'constraints':
        return (
          <Textarea
            value={(section.content as string) || ''}
            onChange={(e) => updateSection(section.id, e.target.value)}
            placeholder={`Enter ${section.label.toLowerCase()}...`}
            className="min-h-[80px] text-sm"
          />
        );

      case 'tech':
        return (
          <MultiSelectChips
            value={(section.content as string[]) || []}
            onChange={(value) => updateSection(section.id, value)}
            options={SUGGESTED_TECH_STACK}
            placeholder="Select technologies..."
            allowCustom
          />
        );

      case 'casting':
        return (
          <CastingEditor
            personas={(section.content as CastingPersona[]) || []}
            onChange={(personas) => updateSection(section.id, personas)}
          />
        );

      case 'deliverables':
        return (
          <BulletedListInput
            value={(section.content as string[]) || []}
            onChange={(value) => updateSection(section.id, value)}
            placeholder="Add deliverable..."
            allowReorder
          />
        );

      case 'strategy_tags':
        return (
          <TagInput
            value={(section.content as string[]) || []}
            onChange={(value) => updateSection(section.id, value)}
            suggestions={SUGGESTED_STRATEGY_TAGS}
            placeholder="Add tag..."
          />
        );

      case 'custom':
        return (
          <Textarea
            value={(section.content as string) || ''}
            onChange={(e) => updateSection(section.id, e.target.value)}
            placeholder="Enter content..."
            className="min-h-[60px] text-sm"
          />
        );

      default:
        return null;
    }
  };

  // Render read-only section content
  const renderReadOnlySection = (section: ContextSection) => {
    const content = section.content;

    if (typeof content === 'string') {
      return content ? (
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{content}</p>
      ) : (
        <p className="text-sm text-muted-foreground italic">Not set</p>
      );
    }

    if (Array.isArray(content)) {
      if (content.length === 0) {
        return <p className="text-sm text-muted-foreground italic">Not set</p>;
      }

      if (section.type === 'casting') {
        return (
          <div className="space-y-1">
            {(content as CastingPersona[]).map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {p.role.replace(/_/g, ' ')}
                </Badge>
                <span className="text-sm">{p.name}</span>
              </div>
            ))}
          </div>
        );
      }

      if (section.type === 'strategy_tags') {
        return (
          <div className="flex flex-wrap gap-1">
            {(content as string[]).map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        );
      }

      if (section.type === 'deliverables') {
        return (
          <ul className="list-disc list-inside space-y-1">
            {(content as string[]).map((item, i) => (
              <li key={i} className="text-sm text-muted-foreground">
                {item}
              </li>
            ))}
          </ul>
        );
      }

      return (
        <div className="flex flex-wrap gap-1">
          {(content as string[]).map((item, i) => (
            <Badge key={i} variant="outline" className="text-xs">
              {item}
            </Badge>
          ))}
        </div>
      );
    }

    return null;
  };

  // Get visible sections for accordion
  const visibleSections = context.sections.filter(s => s.visible);
  const defaultOpenSections = compact
    ? [visibleSections[0]?.id].filter(Boolean)
    : visibleSections.map(s => s.id);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with BMAD indicator and export button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileCode2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">AI Context</span>
          <Badge variant="outline" className="text-xs">
            {entityType}
          </Badge>
          <BmadIndicator context={context} compact />
        </div>
        <div className="flex items-center gap-2">
          {showPreview && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPreviewOpen(!previewOpen)}
              className="h-7 text-xs"
            >
              {previewOpen ? (
                <EyeOff className="h-3.5 w-3.5 mr-1" />
              ) : (
                <Eye className="h-3.5 w-3.5 mr-1" />
              )}
              Preview
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={copyXml}
            className="h-7 text-xs"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 mr-1 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5 mr-1" />
            )}
            {copied ? 'Copied!' : 'Copy XML'}
          </Button>
        </div>
      </div>

      {/* BMAD Quality Panel */}
      {!readOnly && <BmadIndicator context={context} />}

      {/* XML Preview */}
      {showPreview && previewOpen && (
        <div className="bg-slate-900 rounded-md p-3 overflow-auto max-h-64">
          <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
            {xml}
          </pre>
        </div>
      )}

      {/* Section Accordion */}
      <Accordion
        type="multiple"
        defaultValue={defaultOpenSections}
        className="space-y-2"
      >
        {context.sections.map(section => {
          const config = SECTION_CONFIG[section.type] || SECTION_CONFIG.custom;

          return (
            <AccordionItem
              key={section.id}
              value={section.id}
              className={cn(
                'border rounded-lg px-3',
                !section.visible && 'opacity-50'
              )}
            >
              <AccordionTrigger className="hover:no-underline py-2">
                <div className="flex items-center gap-2 text-sm">
                  <span>{config.icon}</span>
                  <span className="font-medium">{section.label}</span>
                  <BmadHint sectionType={section.type} />
                  {!section.visible && (
                    <Badge variant="outline" className="text-xs ml-2">
                      Hidden
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs text-muted-foreground">
                      {config.description}
                    </p>
                    {BMAD_SECTION_GUIDANCE[section.type] && (
                      <p className="text-xs text-muted-foreground italic flex-shrink-0">
                        {BMAD_SECTION_GUIDANCE[section.type].hint}
                      </p>
                    )}
                  </div>
                  {renderSectionContent(section)}
                  {!readOnly && (
                    <div className="flex justify-end pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSectionVisibility(section.id)}
                        className="h-6 text-xs"
                      >
                        {section.visible ? (
                          <>
                            <EyeOff className="h-3 w-3 mr-1" />
                            Hide from export
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3 mr-1" />
                            Show in export
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}

// Sub-component for casting/personas editor
interface CastingEditorProps {
  personas: CastingPersona[];
  onChange: (personas: CastingPersona[]) => void;
}

function CastingEditor({ personas, onChange }: CastingEditorProps) {
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<CastingPersona['role']>('target_user');

  const addPersona = () => {
    if (!newName.trim()) return;

    const newPersona: CastingPersona = {
      id: `persona-${Date.now()}`,
      name: newName.trim(),
      role: newRole,
    };

    onChange([...personas, newPersona]);
    setNewName('');
  };

  const removePersona = (id: string) => {
    onChange(personas.filter(p => p.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addPersona();
    }
  };

  return (
    <div className="space-y-3">
      {/* Existing personas */}
      {personas.map(persona => (
        <div
          key={persona.id}
          className="flex items-center gap-2 p-2 bg-muted/50 rounded-md"
        >
          <Badge variant="outline" className="text-xs capitalize">
            {persona.role.replace(/_/g, ' ')}
          </Badge>
          <span className="flex-1 text-sm">{persona.name}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removePersona(persona.id)}
            className="h-6 w-6 p-0"
          >
            <span className="sr-only">Remove</span>
            ×
          </Button>
        </div>
      ))}

      {/* Add new persona */}
      <div className="flex items-center gap-2">
        <Select
          value={newRole}
          onValueChange={(v) => setNewRole(v as CastingPersona['role'])}
        >
          <SelectTrigger className="w-36 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERSONA_ROLES.map(role => (
              <SelectItem key={role.value} value={role.value} className="text-xs">
                {role.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Persona name..."
          className="h-8 text-xs flex-1"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={addPersona}
          disabled={!newName.trim()}
          className="h-8"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export default ContextEditor;
