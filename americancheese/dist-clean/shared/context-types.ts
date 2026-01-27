/**
 * Context Control Center - TypeScript Interfaces
 *
 * Defines the structure for AI/LLM context data that can be attached
 * to projects, tasks, materials, and other entities.
 */

/**
 * A persona in the casting section (agents, users, stakeholders)
 */
export interface CastingPersona {
  id: string;
  name: string;
  role: 'primary_agent' | 'target_user' | 'stakeholder' | 'reviewer';
  description?: string;
}

/**
 * Types of context sections available
 */
export type ContextSectionType =
  | 'mission'
  | 'tech'
  | 'casting'
  | 'deliverables'
  | 'strategy_tags'
  | 'scope'
  | 'constraints'
  | 'custom';

/**
 * Content types for different section types
 */
export type ContextSectionContent =
  | string                // For mission, scope, constraints, custom
  | string[]              // For tech, deliverables, strategy_tags
  | CastingPersona[];     // For casting

/**
 * A single section in the context editor
 */
export interface ContextSection {
  id: string;
  type: ContextSectionType;
  label: string;
  content: ContextSectionContent;
  order: number;
  visible: boolean;
}

/**
 * Entity types that can have structured context
 */
export type ContextEntityType = 'project' | 'task' | 'material' | 'labor';

/**
 * Metadata for context data
 */
export interface ContextMetadata {
  createdAt: string;
  updatedAt: string;
  templateId?: number;
  templateName?: string;
}

/**
 * Complete context data structure
 */
export interface ContextData {
  version: string;
  entityId: string;
  entityType: ContextEntityType;
  sections: ContextSection[];
  metadata: ContextMetadata;
}

/**
 * Context template for reusable configurations
 */
export interface ContextTemplate {
  id: number;
  name: string;
  description?: string;
  contextData: string; // JSON stringified ContextData
  isGlobal: boolean;
  projectId?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Default section configurations
 */
export const DEFAULT_SECTIONS: Omit<ContextSection, 'id'>[] = [
  {
    type: 'mission',
    label: 'Mission',
    content: '',
    order: 1,
    visible: true,
  },
  {
    type: 'scope',
    label: 'Scope',
    content: '',
    order: 2,
    visible: true,
  },
  {
    type: 'tech',
    label: 'Tech Stack',
    content: [],
    order: 3,
    visible: true,
  },
  {
    type: 'casting',
    label: 'Casting',
    content: [],
    order: 4,
    visible: true,
  },
  {
    type: 'deliverables',
    label: 'Deliverables',
    content: [],
    order: 5,
    visible: true,
  },
  {
    type: 'strategy_tags',
    label: 'Strategy Tags',
    content: [],
    order: 6,
    visible: true,
  },
];

/**
 * Helper to create a new empty context
 */
export function createEmptyContext(entityId: string, entityType: ContextEntityType): ContextData {
  const now = new Date().toISOString();
  return {
    version: '1.0',
    entityId,
    entityType,
    sections: DEFAULT_SECTIONS.map((section, index) => ({
      ...section,
      id: `section-${index + 1}`,
    })),
    metadata: {
      createdAt: now,
      updatedAt: now,
    },
  };
}

/**
 * Helper to get section by type
 */
export function getSectionByType(context: ContextData, type: ContextSectionType): ContextSection | undefined {
  return context.sections.find(s => s.type === type);
}

/**
 * Helper to update a section's content
 */
export function updateSectionContent(
  context: ContextData,
  sectionId: string,
  content: ContextSectionContent
): ContextData {
  return {
    ...context,
    sections: context.sections.map(section =>
      section.id === sectionId ? { ...section, content } : section
    ),
    metadata: {
      ...context.metadata,
      updatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Suggested tech stack options for construction projects
 */
export const SUGGESTED_TECH_STACK = [
  // Project Management
  'Procore',
  'Buildertrend',
  'CoConstruct',
  'PlanGrid',
  // Design & CAD
  'AutoCAD',
  'Revit',
  'SketchUp',
  'Bluebeam',
  // Estimation
  'RSMeans',
  'ProEst',
  'STACK',
  // Scheduling
  'Microsoft Project',
  'Primavera P6',
  'Smartsheet',
  // Communication
  'Slack',
  'Microsoft Teams',
  'Zoom',
  // Documentation
  'Markdown',
  'PDF',
  'Excel',
  // Custom/Other
  'Python',
  'JavaScript',
  'SQL',
];

/**
 * Suggested strategy tags for construction projects
 */
export const SUGGESTED_STRATEGY_TAGS = [
  'residential',
  'commercial',
  'renovation',
  'new-build',
  'sustainable',
  'fast-track',
  'budget-conscious',
  'high-end',
  'multi-phase',
  'design-build',
  'permit-required',
  'historic-preservation',
];
