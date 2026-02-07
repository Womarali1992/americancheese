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

/**
 * BMAD Method - Prompt Engineering Principles
 *
 * Brief: Keep it concise and focused
 * Motivated: Explain the purpose and why it matters
 * Aligned: Ensure roles and approach are clear
 * Detailed: Provide specific deliverables and constraints
 */
export interface BmadGuidance {
  principle: 'brief' | 'motivated' | 'aligned' | 'detailed';
  hint: string;
  maxLength?: number;
  minItems?: number;
}

/**
 * BMAD guidance mapped to each section type
 */
export const BMAD_SECTION_GUIDANCE: Record<ContextSectionType, BmadGuidance> = {
  mission: {
    principle: 'motivated',
    hint: 'Explain WHY this matters. Focus on purpose and impact, not just what.',
    maxLength: 500,
  },
  scope: {
    principle: 'brief',
    hint: 'Be concise. Define clear boundaries - what\'s IN and what\'s OUT.',
    maxLength: 300,
  },
  tech: {
    principle: 'detailed',
    hint: 'List specific tools and technologies. Avoid vague terms.',
    minItems: 1,
  },
  casting: {
    principle: 'aligned',
    hint: 'Define WHO is involved and their roles. Clear ownership improves AI responses.',
    minItems: 1,
  },
  deliverables: {
    principle: 'detailed',
    hint: 'Be specific about expected outputs. Measurable outcomes work best.',
    minItems: 1,
  },
  strategy_tags: {
    principle: 'aligned',
    hint: 'Tags help AI understand approach and context. Choose meaningful keywords.',
    minItems: 2,
  },
  constraints: {
    principle: 'detailed',
    hint: 'Specify limitations, requirements, and non-negotiables clearly.',
    maxLength: 400,
  },
  custom: {
    principle: 'brief',
    hint: 'Keep custom sections focused on a single topic.',
    maxLength: 500,
  },
};

/**
 * BMAD principle labels and colors
 */
export const BMAD_PRINCIPLES = {
  brief: {
    label: 'Brief',
    color: '#3b82f6', // blue
    description: 'Keep it concise and focused',
  },
  motivated: {
    label: 'Motivated',
    color: '#10b981', // green
    description: 'Explain the purpose and why',
  },
  aligned: {
    label: 'Aligned',
    color: '#f59e0b', // amber
    description: 'Clear roles and approach',
  },
  detailed: {
    label: 'Detailed',
    color: '#8b5cf6', // purple
    description: 'Specific and measurable',
  },
} as const;

/**
 * Calculate BMAD score for a context
 * Returns a score from 0-100 and individual principle scores
 */
export function calculateBmadScore(context: ContextData): {
  total: number;
  principles: Record<'brief' | 'motivated' | 'aligned' | 'detailed', number>;
  suggestions: string[];
} {
  const scores = {
    brief: 0,
    motivated: 0,
    aligned: 0,
    detailed: 0,
  };
  const suggestions: string[] = [];

  for (const section of context.sections) {
    if (!section.visible) continue;

    const guidance = BMAD_SECTION_GUIDANCE[section.type];
    if (!guidance) continue;

    const content = section.content;
    let sectionScore = 0;

    // Check content based on type
    if (typeof content === 'string') {
      const length = content.trim().length;
      if (length > 0) {
        // Has content
        sectionScore = 50;
        // Check if within recommended length
        if (guidance.maxLength && length <= guidance.maxLength) {
          sectionScore = 100;
        } else if (guidance.maxLength && length > guidance.maxLength) {
          sectionScore = 70;
          suggestions.push(`${section.label}: Consider being more concise (${length}/${guidance.maxLength} chars)`);
        } else {
          sectionScore = 100;
        }
      } else {
        suggestions.push(`${section.label}: Add content to improve ${guidance.principle} score`);
      }
    } else if (Array.isArray(content)) {
      const count = content.length;
      if (count > 0) {
        sectionScore = 50;
        if (guidance.minItems && count >= guidance.minItems) {
          sectionScore = 100;
        } else if (guidance.minItems) {
          suggestions.push(`${section.label}: Add more items (${count}/${guidance.minItems} recommended)`);
        } else {
          sectionScore = 100;
        }
      } else {
        suggestions.push(`${section.label}: Add items to improve ${guidance.principle} score`);
      }
    }

    // Add to principle score (weighted average)
    scores[guidance.principle] = Math.max(scores[guidance.principle], sectionScore);
  }

  // Calculate total as average of all principles
  const total = Math.round(
    (scores.brief + scores.motivated + scores.aligned + scores.detailed) / 4
  );

  return {
    total,
    principles: scores,
    suggestions: suggestions.slice(0, 3), // Top 3 suggestions
  };
}
