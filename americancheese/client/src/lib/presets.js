/**
 * Project Category Presets
 *
 * JavaScript version for client-side imports
 */

// Home Builder Preset
export const HOME_BUILDER_PRESET = {
  id: 'home-builder',
  name: 'Home Builder',
  description: 'Comprehensive home building preset with permitting, structural, systems, and finishings phases',
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

// Standard Construction Preset
export const STANDARD_CONSTRUCTION_PRESET = {
  id: 'standard-construction',
  name: 'Standard Construction',
  description: 'Traditional construction preset with structural, systems, sheathing, and finishings phases',
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

// Software Development Preset
export const SOFTWARE_DEVELOPMENT_PRESET = {
  id: 'software-development',
  name: 'Software Development',
  description: 'Comprehensive software development preset with engineering, product management, design, and marketing phases',
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

// Workout Preset
export const WORKOUT_PRESET = {
  id: 'workout',
  name: 'Workout Training',
  description: 'Push/Pull/Legs/Cardio workout program organized by muscle groups',
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

// Digital Marketing Preset
export const DIGITAL_MARKETING_PRESET = {
  id: 'digital-marketing',
  name: 'Digital Marketing',
  description: '4 Core Categories of Digital Marketing: Foundation, Creation, Distribution, and Optimization',
  categories: {
    tier1: [
      {
        name: 'Foundation',
        description: 'Strategy & Audience - defining who you serve and why they should care',
        sortOrder: 1
      },
      {
        name: 'Creation',
        description: 'Content & Value - building valuable story and utility that communicates your offer',
        sortOrder: 2
      },
      {
        name: 'Distribution',
        description: 'Channels & Reach - pathways to get content in front of your defined audience',
        sortOrder: 3
      },
      {
        name: 'Optimization',
        description: 'Measurement & Growth - analyzing data to refine strategy and achieve sustainable growth',
        sortOrder: 4
      }
    ],
    tier2: {
      'Foundation': [
        { name: 'Audience Research', description: 'Target audience identification, personas, and market analysis' },
        { name: 'Brand Strategy', description: 'Brand positioning, value proposition, and competitive analysis' },
        { name: 'Goals & Objectives', description: 'SMART goals, KPIs, and success metrics definition' },
        { name: 'Market Analysis', description: 'Industry research, trends, and opportunity assessment' }
      ],
      'Creation': [
        { name: 'Content Strategy', description: 'Content planning, editorial calendar, and messaging framework' },
        { name: 'Blog & Articles', description: 'Written content, thought leadership, and educational materials' },
        { name: 'Video & Multimedia', description: 'Video content, podcasts, graphics, and visual assets' },
        { name: 'Landing Pages', description: 'Conversion-focused pages, forms, and user experience design' }
      ],
      'Distribution': [
        { name: 'Search (SEO & SEM)', description: 'Search engine optimization and search marketing campaigns' },
        { name: 'Social Media', description: 'Social platform management, organic content, and community building' },
        { name: 'Email & Automation', description: 'Email marketing, drip campaigns, and marketing automation' },
        { name: 'Paid Advertising', description: 'PPC campaigns, social ads, display advertising, and media buying' }
      ],
      'Optimization': [
        { name: 'Analytics & Tracking', description: 'Data collection, tracking setup, and measurement frameworks' },
        { name: 'A/B Testing', description: 'Conversion optimization, split testing, and performance experiments' },
        { name: 'Reporting & Insights', description: 'Performance reports, data analysis, and actionable insights' },
        { name: 'Growth Strategy', description: 'Scaling tactics, optimization cycles, and continuous improvement' }
      ]
    }
  }
};

// Available presets registry
export const AVAILABLE_PRESETS = {
  'home-builder': HOME_BUILDER_PRESET,
  'standard-construction': STANDARD_CONSTRUCTION_PRESET,
  'software-development': SOFTWARE_DEVELOPMENT_PRESET,
  'workout': WORKOUT_PRESET,
  'digital-marketing': DIGITAL_MARKETING_PRESET
};

// Default preset ID
export const DEFAULT_PRESET_ID = 'home-builder';

// Get preset by ID
export function getPresetById(presetId) {
  return AVAILABLE_PRESETS[presetId];
}

// Get all available presets
export function getAllPresets() {
  return Object.values(AVAILABLE_PRESETS);
}

// Get preset names for UI display
export function getPresetOptions() {
  return getAllPresets().map(preset => ({
    value: preset.id,
    label: preset.name,
    description: preset.description
  }));
}
