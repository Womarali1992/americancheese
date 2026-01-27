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
        { name: 'Launch & Analytics', description: 'Product launch, marketing campaigns, and performance analytics' },
        { name: 'Content Marketing', description: 'Content creation, distribution, and optimization' },
        { name: 'Content Strategy', description: 'Audience segments, positioning, brand voice, and content ratios' },
        { name: 'Content Library', description: 'Angles, hooks, pillars, and thematic content buckets' },
        { name: 'Content Production', description: 'Content types, script templates, and creation workflows' },
        { name: 'Content Distribution', description: 'Posting schedules, cross-posting, and metrics tracking' }
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
 * Digital Marketing Plan Preset
 * Comprehensive digital marketing planning with creative strategy, GTM, and content
 */
export const DIGITAL_MARKETING_PLAN_PRESET: CategoryPreset = {
  id: 'digital-marketing-plan',
  name: 'Digital Marketing Plan',
  description: 'Complete digital marketing plan with creative strategy, audience research, offer design, and content creation',
  recommendedTheme: 'velvet-lounge',
  categories: {
    tier1: [
      {
        name: 'Creative Strategy',
        description: 'Audience research, offer design, messaging angles, and creative briefs',
        sortOrder: 1
      },
      {
        name: 'Marketing / Go-to-Market (GTM)',
        description: 'Positioning, demand generation, pricing, and launch analytics',
        sortOrder: 2
      },
      {
        name: 'Content Types',
        description: 'Content creation including guides, educational materials, and promotional content',
        sortOrder: 3
      }
    ],
    tier2: {
      'Creative Strategy': [
        { name: 'Audience & Job To Be Done', description: 'Define target audience segments, triggers, pain points, and desired outcomes' },
        { name: 'Offer Design', description: 'Design offers for cold, warm, and hot prospects with risk reversals' },
        { name: 'Angle Library', description: 'Develop messaging angles and claims to test across campaigns' },
        { name: 'Creative Brief', description: 'One-page creative brief templates for each ad concept' }
      ],
      'Marketing / Go-to-Market (GTM)': [
        { name: 'Positioning & Messaging', description: 'Brand positioning, messaging, and content strategy' },
        { name: 'Demand Gen & Acquisition', description: 'Lead generation, acquisition, and growth marketing' },
        { name: 'Pricing & Packaging', description: 'Pricing strategy, packaging, and monetization' },
        { name: 'Launch & Analytics', description: 'Product launch, marketing campaigns, and performance analytics' }
      ],
      'Content Types': [
        { name: 'Renter Guides', description: 'How-to guides and educational content for renters' },
        { name: 'Video Scripts', description: 'Scripts for video content, reels, and short-form video' },
        { name: 'Social Media Content', description: 'Social media posts, carousels, and stories' }
      ]
    }
  }
};

/**
 * AI Agent Preset
 * AI agent/bot development workflow with Strategy, Library, Production, and Distribution phases
 */
export const AI_AGENT_PRESET: CategoryPreset = {
  id: 'ai-agent',
  name: 'AI Agent',
  description: 'AI agent/bot development workflow organized by Strategy, Library, Production, and Distribution',
  recommendedTheme: 'futuristic',
  categories: {
    tier1: [
      {
        name: 'Strategy',
        description: 'Planning, research, and strategic direction for the AI agent',
        sortOrder: 1
      },
      {
        name: 'Library',
        description: 'Components, integrations, tools, and reusable assets',
        sortOrder: 2
      },
      {
        name: 'Production',
        description: 'Development, testing, deployment, and operations',
        sortOrder: 3
      },
      {
        name: 'Distribution',
        description: 'Marketing, documentation, support, and analytics',
        sortOrder: 4
      }
    ],
    tier2: {
      'Strategy': [
        { name: 'Planning', description: 'Project planning, roadmap, and milestones' },
        { name: 'Research', description: 'Market research, competitor analysis, and user needs' },
        { name: 'Architecture', description: 'System architecture, technical design, and decisions' },
        { name: 'Goals', description: 'Objectives, KPIs, and success metrics' }
      ],
      'Library': [
        { name: 'Components', description: 'Reusable components, modules, and building blocks' },
        { name: 'Integrations', description: 'Third-party integrations, APIs, and services' },
        { name: 'Tools', description: 'Development tools, utilities, and helpers' },
        { name: 'Data', description: 'Data sources, training data, and knowledge bases' }
      ],
      'Production': [
        { name: 'Development', description: 'Core development, features, and implementation' },
        { name: 'Testing', description: 'Testing, QA, and validation' },
        { name: 'Deployment', description: 'Deployment, CI/CD, and release management' },
        { name: 'Monitoring', description: 'Monitoring, logging, and observability' }
      ],
      'Distribution': [
        { name: 'Marketing', description: 'Marketing, promotion, and outreach' },
        { name: 'Documentation', description: 'User guides, API docs, and tutorials' },
        { name: 'Support', description: 'Customer support, feedback, and issue resolution' },
        { name: 'Analytics', description: 'Usage analytics, metrics, and reporting' }
      ]
    }
  }
};

/**
 * Marketing/Sales Preset
 * End-to-end marketing and sales funnel for real estate and service businesses
 */
export const MARKETING_SALES_PRESET: CategoryPreset = {
  id: 'marketing-sales',
  name: 'Marketing & Sales',
  description: 'End-to-end marketing and sales funnel: Lead Generation, Nurturing, Conversion, and Retention',
  recommendedTheme: 'futuristic',
  categories: {
    tier1: [
      {
        name: 'Lead Generation',
        description: 'Attract prospects through content, ads, organic outreach, and brand awareness',
        sortOrder: 1
      },
      {
        name: 'Lead Nurturing',
        description: 'Build relationships through communication, value delivery, and trust',
        sortOrder: 2
      },
      {
        name: 'Conversion',
        description: 'Close deals through presentation, objection handling, and pipeline management',
        sortOrder: 3
      },
      {
        name: 'Retention',
        description: 'Keep and grow customers through success, feedback, and referrals',
        sortOrder: 4
      }
    ],
    tier2: {
      'Lead Generation': [
        { name: 'Content Marketing', description: 'Blog, video, social media, and lead magnets' },
        { name: 'Paid Advertising', description: 'Google Ads, Meta Ads, TikTok, and retargeting' },
        { name: 'Organic Outreach', description: 'SEO, community engagement, partnerships, and referrals' },
        { name: 'Brand Awareness', description: 'PR, events, influencers, and local sponsorships' }
      ],
      'Lead Nurturing': [
        { name: 'Initial Contact', description: 'Response systems, qualification, needs assessment, and CRM' },
        { name: 'Communication', description: 'WhatsApp, email, SMS, and phone workflows' },
        { name: 'Value Delivery', description: 'AI matching, market insights, area guides, and comparisons' },
        { name: 'Relationship Building', description: 'Check-ins, personalization, proactive updates, and authenticity' }
      ],
      'Conversion': [
        { name: 'Presentation', description: 'Property showcasing, virtual tours, coordination, and recommendations' },
        { name: 'Objection Handling', description: 'Price, location, timing, and competition responses' },
        { name: 'Closing Process', description: 'Application support, documents, approvals, and move-in' },
        { name: 'Deal Management', description: 'Pipeline tracking, follow-up, urgency, and decision support' }
      ],
      'Retention': [
        { name: 'Customer Success', description: 'Move-in support, issue resolution, satisfaction, and welcome' },
        { name: 'Feedback Loop', description: 'Reviews, testimonials, NPS, and feedback implementation' },
        { name: 'Referral Engine', description: 'Referral requests, incentives, tracking, and recognition' },
        { name: 'Long-term Value', description: 'Renewals, re-engagement, alumni community, and lifetime growth' }
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
  'digital-marketing': DIGITAL_MARKETING_PRESET,
  'digital-marketing-plan': DIGITAL_MARKETING_PLAN_PRESET,
  'marketing-sales': MARKETING_SALES_PRESET,
  'ai-agent': AI_AGENT_PRESET
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
  return [
    {
      value: 'none',
      label: 'None',
      description: 'Start with an empty project - add categories manually later'
    },
    ...getAllPresets().map(preset => ({
      value: preset.id,
      label: preset.name,
      description: preset.description
    }))
  ];
}

/**
 * Task template for preset configuration
 */
export interface PresetTaskTemplate {
  id: string;
  title: string;
  description: string;
  estimatedDuration: number;
}

/**
 * Preset configuration stored in globalSettings
 */
export interface PresetConfiguration {
  name?: string;
  description?: string;
  recommendedTheme?: string;
  categories?: {
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
  tasks?: {
    [tier1Name: string]: {
      [tier2Name: string]: PresetTaskTemplate[];
    };
  };
}

/**
 * Merge base preset with custom configuration
 * Custom configurations from globalSettings override base preset values
 */
export function mergePresetWithConfig(
  basePreset: CategoryPreset,
  config: PresetConfiguration | null
): CategoryPreset {
  if (!config) {
    return basePreset;
  }

  return {
    ...basePreset,
    name: config.name ?? basePreset.name,
    description: config.description ?? basePreset.description,
    recommendedTheme: config.recommendedTheme ?? basePreset.recommendedTheme,
    categories: config.categories ?? basePreset.categories
  };
}

/**
 * Get all presets merged with their custom configurations
 */
export function getPresetsWithConfigs(
  configs: Record<string, PresetConfiguration>
): CategoryPreset[] {
  return Object.values(AVAILABLE_PRESETS).map(preset =>
    mergePresetWithConfig(preset, configs[preset.id] || null)
  );
}

/**
 * Get a single preset merged with its custom configuration
 */
export function getPresetWithConfig(
  presetId: string,
  config: PresetConfiguration | null
): CategoryPreset | undefined {
  const basePreset = AVAILABLE_PRESETS[presetId];
  if (!basePreset) return undefined;

  return mergePresetWithConfig(basePreset, config);
}
