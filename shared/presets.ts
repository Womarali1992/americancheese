/**
 * Project Category Presets
 *
 * This module defines different category presets that can be used when creating new projects.
 * Each preset defines a set of tier1 and tier2 categories that will be automatically loaded.
 */

export interface CategoryPreset {
  id: string;
  name: string;
  description: string;
  recommendedTheme?: string; // Recommended theme key for this preset
  categories: {
    tier1: Array<{
      name: string;
      description: string;
      sortOrder: number;
    }>;
    tier2: Record<string, Array<{
      name: string;
      description: string;
    }>>;
  };
}

/**
 * Home Builder Preset
 * Focused on residential construction with permitting as the first phase
 */
export const HOME_BUILDER_PRESET: CategoryPreset = {
  id: 'home-builder',
  name: 'Home Builder',
  description: 'Comprehensive home building preset with permitting, structural, systems, and finishings phases',
  recommendedTheme: 'earth-tone',
  categories: {
    tier1: [
      {
        name: 'Permitting',
        description: 'Permits, approvals, and regulatory compliance',
        sortOrder: 1
      },
      {
        name: 'Structural',
        description: 'Foundation, framing, and structural elements',
        sortOrder: 2
      },
      {
        name: 'Systems',
        description: 'Electrical, plumbing, and HVAC systems',
        sortOrder: 3
      },
      {
        name: 'Finishings',
        description: 'Flooring, paint, fixtures, and final touches',
        sortOrder: 4
      }
    ],
    tier2: {
      'Permitting': [
        { name: 'Building Permits', description: 'Main building permit and approvals' },
        { name: 'Utility Permits', description: 'Water, sewer, and utility connections' },
        { name: 'Inspections', description: 'Required building inspections' },
        { name: 'Documentation', description: 'Plans, drawings, and paperwork' }
      ],
      'Structural': [
        { name: 'Foundation', description: 'Foundation and excavation work' },
        { name: 'Framing', description: 'Structural framing and support' },
        { name: 'Roofing', description: 'Roof structure and materials' }
      ],
      'Systems': [
        { name: 'Electrical', description: 'Electrical wiring and fixtures' },
        { name: 'Plumbing', description: 'Plumbing systems and fixtures' },
        { name: 'HVAC', description: 'Heating, ventilation, and air conditioning' }
      ],
      'Finishings': [
        { name: 'Flooring', description: 'Floor materials and installation' },
        { name: 'Paint', description: 'Interior and exterior painting' },
        { name: 'Fixtures', description: 'Light fixtures and hardware' },
        { name: 'Landscaping', description: 'Exterior landscaping and hardscaping' }
      ]
    }
  }
};


/**
 * Standard Construction Preset (Original)
 * Traditional construction categories without permitting
 */
export const STANDARD_CONSTRUCTION_PRESET: CategoryPreset = {
  id: 'standard-construction',
  name: 'Standard Construction',
  description: 'Traditional construction preset with structural, systems, sheathing, and finishings phases',
  recommendedTheme: 'classic-construction',
  categories: {
    tier1: [
      {
        name: 'Structural',
        description: 'Foundation, framing, and structural elements',
        sortOrder: 1
      },
      {
        name: 'Systems',
        description: 'Electrical, plumbing, and HVAC systems',
        sortOrder: 2
      },
      {
        name: 'Sheathing',
        description: 'Insulation, drywall, and exterior sheathing',
        sortOrder: 3
      },
      {
        name: 'Finishings',
        description: 'Flooring, paint, fixtures, and final touches',
        sortOrder: 4
      }
    ],
    tier2: {
      'Structural': [
        { name: 'Foundation', description: 'Foundation and excavation work' },
        { name: 'Framing', description: 'Structural framing and support' },
        { name: 'Roofing', description: 'Roof structure and materials' }
      ],
      'Systems': [
        { name: 'Electrical', description: 'Electrical wiring and fixtures' },
        { name: 'Plumbing', description: 'Plumbing systems and fixtures' },
        { name: 'HVAC', description: 'Heating, ventilation, and air conditioning' }
      ],
      'Sheathing': [
        { name: 'Insulation', description: 'Insulation materials and installation' },
        { name: 'Drywall', description: 'Drywall installation and finishing' },
        { name: 'Windows', description: 'Window installation and sealing' }
      ],
      'Finishings': [
        { name: 'Flooring', description: 'Floor materials and installation' },
        { name: 'Paint', description: 'Interior and exterior painting' },
        { name: 'Fixtures', description: 'Light fixtures and hardware' },
        { name: 'Landscaping', description: 'Exterior landscaping and hardscaping' }
      ]
    }
  }
};

/**
 * Software Development Preset
 * Software engineering and product development lifecycle
 */
export const SOFTWARE_DEVELOPMENT_PRESET: CategoryPreset = {
  id: 'software-development',
  name: 'Software Development',
  description: 'Comprehensive software development preset with engineering, product management, design, and marketing phases',
  recommendedTheme: 'futuristic',
  categories: {
    tier1: [
      {
        name: 'Software Engineering',
        description: 'Development, architecture, and technical implementation',
        sortOrder: 1
      },
      {
        name: 'Product Management',
        description: 'Strategy, planning, and product lifecycle management',
        sortOrder: 2
      },
      {
        name: 'Design / UX',
        description: 'User experience, interface design, and usability',
        sortOrder: 3
      },
      {
        name: 'Marketing / Go-to-Market (GTM)',
        description: 'Marketing strategy, positioning, and market launch',
        sortOrder: 4
      }
    ],
    tier2: {
      'Software Engineering': [
        { name: 'DevOps & Infrastructure', description: 'CI/CD, deployment, monitoring, and infrastructure' },
        { name: 'Architecture & Platform', description: 'System design, architecture decisions, and platform setup' },
        { name: 'Application Development', description: 'Frontend, backend, and mobile development' },
        { name: 'Quality & Security', description: 'Testing, code quality, security, and compliance' }
      ],
      'Product Management': [
        { name: 'Strategy & Vision', description: 'Product strategy, vision, and goal setting' },
        { name: 'Discovery & Research', description: 'Market research, user research, and validation' },
        { name: 'Roadmap & Prioritization', description: 'Feature prioritization and roadmap planning' },
        { name: 'Delivery & Lifecycle', description: 'Release planning, metrics, and lifecycle management' }
      ],
      'Design / UX': [
        { name: 'Research and Usability', description: 'User research, usability testing, and design validation' },
        { name: 'UI/UX Design', description: 'Interface design, prototyping, and design systems' },
        { name: 'Visual Design', description: 'Branding, graphics, and visual identity' },
        { name: 'Interaction Design', description: 'User flows, wireframes, and interaction patterns' }
      ],
      'Marketing / Go-to-Market (GTM)': [
        { name: 'Positioning & Messaging', description: 'Brand positioning, messaging, and content strategy' },
        { name: 'Demand Gen & Acquisition', description: 'Lead generation, acquisition, and growth marketing' },
        { name: 'Pricing & Packaging', description: 'Pricing strategy, packaging, and monetization' },
        { name: 'Launch & Analytics', description: 'Product launch, marketing campaigns, and performance analytics' }
      ]
    }
  }
};

/**
 * Workout Preset
 * Push/Pull/Legs/Cardio training program with muscle group organization
 */
export const WORKOUT_PRESET: CategoryPreset = {
  id: 'workout',
  name: 'Workout Training',
  description: 'Push/Pull/Legs/Cardio workout program organized by muscle groups',
  recommendedTheme: 'neon-noir',
  categories: {
    tier1: [
      {
        name: 'Push',
        description: 'Push movements - chest, shoulders, triceps',
        sortOrder: 1
      },
      {
        name: 'Pull',
        description: 'Pull movements - back, biceps, rear delts',
        sortOrder: 2
      },
      {
        name: 'Legs',
        description: 'Lower body - quads, glutes, hamstrings, calves',
        sortOrder: 3
      },
      {
        name: 'Cardio',
        description: 'Cardiovascular training and conditioning',
        sortOrder: 4
      }
    ],
    tier2: {
      'Push': [
        { name: 'Chest', description: 'Chest exercises - bench press, flyes, dips' },
        { name: 'Shoulders', description: 'Shoulder exercises - presses, raises, shrugs' },
        { name: 'Triceps', description: 'Tricep exercises - extensions, dips, close-grip' }
      ],
      'Pull': [
        { name: 'Back', description: 'Back exercises - rows, pull-ups, deadlifts' },
        { name: 'Biceps', description: 'Bicep exercises - curls, chin-ups, hammers' },
        { name: 'Rear Delts', description: 'Rear deltoid exercises - reverse flyes, face pulls' }
      ],
      'Legs': [
        { name: 'Quads', description: 'Quadriceps exercises - squats, lunges, leg press' },
        { name: 'Glutes', description: 'Glute exercises - hip thrusts, bridges, squats' },
        { name: 'Hamstrings', description: 'Hamstring exercises - deadlifts, curls, bridges' },
        { name: 'Calves', description: 'Calf exercises - raises, jumps, walks' }
      ],
      'Cardio': [
        { name: 'HIIT', description: 'High-intensity interval training' },
        { name: 'Steady State', description: 'Steady-state cardio - running, cycling, swimming' },
        { name: 'Circuit Training', description: 'Circuit-based cardiovascular training' }
      ]
    }
  }
};

/**
 * Digital Marketing Preset
 * Marketing-focused preset using the same Marketing/GTM structure as Software Development
 */
export const DIGITAL_MARKETING_PRESET: CategoryPreset = {
  id: 'digital-marketing',
  name: 'Digital Marketing',
  description: 'Marketing strategy, positioning, demand generation, and market launch',
  recommendedTheme: 'futuristic',
  categories: {
    tier1: [
      {
        name: 'Marketing / Go-to-Market (GTM)',
        description: 'Marketing strategy, positioning, and market launch',
        sortOrder: 1
      }
    ],
    tier2: {
      'Marketing / Go-to-Market (GTM)': [
        { name: 'Positioning & Messaging', description: 'Brand positioning, messaging, and content strategy' },
        { name: 'Demand Gen & Acquisition', description: 'Lead generation, acquisition, and growth marketing' },
        { name: 'Pricing & Packaging', description: 'Pricing strategy, packaging, and monetization' },
        { name: 'Launch & Analytics', description: 'Product launch, marketing campaigns, and performance analytics' }
      ]
    }
  }
};

/**
 * Available presets registry
 */
export const AVAILABLE_PRESETS: Record<string, CategoryPreset> = {
  'home-builder': HOME_BUILDER_PRESET,
  'standard-construction': STANDARD_CONSTRUCTION_PRESET,
  'software-development': SOFTWARE_DEVELOPMENT_PRESET,
  'workout': WORKOUT_PRESET,
  'digital-marketing': DIGITAL_MARKETING_PRESET
};

/**
 * Default preset ID
 */
export const DEFAULT_PRESET_ID = 'home-builder';

/**
 * Get preset by ID
 */
export function getPresetById(presetId: string): CategoryPreset | undefined {
  return AVAILABLE_PRESETS[presetId];
}

/**
 * Get all available presets
 */
export function getAllPresets(): CategoryPreset[] {
  return Object.values(AVAILABLE_PRESETS);
}

/**
 * Get preset names for UI display
 */
export function getPresetOptions(): Array<{ value: string; label: string; description: string }> {
  return getAllPresets().map(preset => ({
    value: preset.id,
    label: preset.name,
    description: preset.description
  }));
}
