/**
 * Workout Training Load Templates for Fitness Projects
 * Based on periodization principles and training load management
 */

// Helper interface for workout templates
export interface WorkoutTemplate {
  id: string;
  title: string;
  description: string;
  tier1Category: string;
  tier2Category: string;
  category: string;
  estimatedDuration: number; // In days
  trainingLoad?: number; // Relative training load scale 1-10
  intensity?: string; // "low" | "moderate" | "high" | "peak"
  volume?: string; // "low" | "moderate" | "high"
  type?: string; // "strength" | "cardio" | "hybrid" | "recovery"
}

// Organize templates by tier1 and tier2 categories
export interface WorkoutTemplateCollection {
  [tier1: string]: {
    [tier2: string]: WorkoutTemplate[];
  };
}

// Foundation Phase Templates - Building base fitness
const foundationPhaseTemplates: WorkoutTemplate[] = [
  {
    id: "FP1",
    title: "Initial Assessment & Movement Screening (FP1)",
    description: "Comprehensive fitness assessment including movement patterns, cardiovascular base testing, strength benchmarks, and flexibility evaluation. Establish baseline metrics for progress tracking.",
    tier1Category: "foundation",
    tier2Category: "assessment",
    category: "assessment",
    estimatedDuration: 2,
    trainingLoad: 2,
    intensity: "low",
    volume: "low",
    type: "assessment"
  },
  {
    id: "FP2",
    title: "Movement Pattern Development (FP2)",
    description: "Focus on fundamental movement patterns: squat, hinge, push, pull, carry, and locomotion. Emphasize proper form and mobility work.",
    tier1Category: "foundation",
    tier2Category: "movement",
    category: "movement",
    estimatedDuration: 14,
    trainingLoad: 3,
    intensity: "low",
    volume: "moderate",
    type: "strength"
  },
  {
    id: "FP3",
    title: "Aerobic Base Building (FP3)",
    description: "Low-intensity aerobic work to develop cardiovascular base. Zone 1-2 training focusing on fat oxidation and mitochondrial adaptation.",
    tier1Category: "foundation",
    tier2Category: "cardio",
    category: "cardio",
    estimatedDuration: 21,
    trainingLoad: 4,
    intensity: "low",
    volume: "high",
    type: "cardio"
  },
  {
    id: "FP4",
    title: "Core Stability & Postural Strength (FP4)",
    description: "Progressive core stability training including anti-extension, anti-flexion, anti-rotation, and hip stability exercises.",
    tier1Category: "foundation",
    tier2Category: "stability",
    category: "stability",
    estimatedDuration: 10,
    trainingLoad: 3,
    intensity: "low",
    volume: "moderate",
    type: "strength"
  }
];

// Strength Development Templates
const strengthPhaseTemplates: WorkoutTemplate[] = [
  {
    id: "ST1",
    title: "Anatomical Adaptation Phase (ST1)",
    description: "High-volume, moderate-intensity strength training to prepare tissues for more intensive loading. Focus on work capacity and movement quality.",
    tier1Category: "strength",
    tier2Category: "adaptation",
    category: "strength",
    estimatedDuration: 21,
    trainingLoad: 5,
    intensity: "moderate",
    volume: "high",
    type: "strength"
  },
  {
    id: "ST2",
    title: "Hypertrophy Phase (ST2)",
    description: "Muscle building phase with moderate to high volume, moderate intensity. Focus on time under tension and progressive overload.",
    tier1Category: "strength",
    tier2Category: "hypertrophy",
    category: "hypertrophy",
    estimatedDuration: 28,
    trainingLoad: 6,
    intensity: "moderate",
    volume: "high",
    type: "strength"
  },
  {
    id: "ST3",
    title: "Maximum Strength Phase (ST3)",
    description: "High-intensity, low-volume training focused on neural adaptations and maximum force production. 85-95% 1RM loading.",
    tier1Category: "strength",
    tier2Category: "maximal",
    category: "maximal",
    estimatedDuration: 21,
    trainingLoad: 7,
    intensity: "high",
    volume: "low",
    type: "strength"
  },
  {
    id: "ST4",
    title: "Power Development Phase (ST4)",
    description: "Explosive movement training combining strength and speed. Olympic lifts, plyometrics, and ballistic exercises.",
    tier1Category: "strength",
    tier2Category: "power",
    category: "power",
    estimatedDuration: 14,
    trainingLoad: 6,
    intensity: "high",
    volume: "moderate",
    type: "hybrid"
  }
];

// Conditioning/Cardio Templates
const conditioningPhaseTemplates: WorkoutTemplate[] = [
  {
    id: "CD1",
    title: "Aerobic Power Development (CD1)",
    description: "VO2max interval training and threshold work. High-intensity intervals to improve aerobic power and lactate buffering.",
    tier1Category: "conditioning",
    tier2Category: "aerobic",
    category: "aerobic",
    estimatedDuration: 14,
    trainingLoad: 7,
    intensity: "high",
    volume: "moderate",
    type: "cardio"
  },
  {
    id: "CD2",
    title: "Anaerobic Capacity Training (CD2)",
    description: "High-intensity interval training for anaerobic energy system development. Short, intense intervals with incomplete recovery.",
    tier1Category: "conditioning",
    tier2Category: "anaerobic",
    category: "anaerobic",
    estimatedDuration: 10,
    trainingLoad: 8,
    intensity: "high",
    volume: "low",
    type: "cardio"
  },
  {
    id: "CD3",
    title: "Metabolic Conditioning (CD3)",
    description: "Multi-modal training combining strength and cardio elements. Circuit training, CrossFit-style workouts, and functional fitness.",
    tier1Category: "conditioning",
    tier2Category: "metabolic",
    category: "metabolic",
    estimatedDuration: 21,
    trainingLoad: 6,
    intensity: "moderate",
    volume: "high",
    type: "hybrid"
  },
  {
    id: "CD4",
    title: "Sport-Specific Conditioning (CD4)",
    description: "Training that mimics the demands of specific sports or activities. Movement patterns and energy systems specific to target activity.",
    tier1Category: "conditioning",
    tier2Category: "specific",
    category: "specific",
    estimatedDuration: 14,
    trainingLoad: 6,
    intensity: "moderate",
    volume: "moderate",
    type: "hybrid"
  }
];

// Recovery and Maintenance Templates
const recoveryPhaseTemplates: WorkoutTemplate[] = [
  {
    id: "RC1",
    title: "Active Recovery Week (RC1)",
    description: "Low-intensity movement, mobility work, and light activities to promote recovery while maintaining movement quality.",
    tier1Category: "recovery",
    tier2Category: "active",
    category: "active",
    estimatedDuration: 7,
    trainingLoad: 2,
    intensity: "low",
    volume: "low",
    type: "recovery"
  },
  {
    id: "RC2",
    title: "Deload Phase (RC2)",
    description: "Reduced training volume while maintaining intensity. Allows for supercompensation and stress adaptation.",
    tier1Category: "recovery",
    tier2Category: "deload",
    category: "deload",
    estimatedDuration: 7,
    trainingLoad: 3,
    intensity: "moderate",
    volume: "low",
    type: "strength"
  },
  {
    id: "RC3",
    title: "Mobility & Flexibility Focus (RC3)",
    description: "Dedicated flexibility, mobility, and soft tissue work. Address movement restrictions and maintain joint range of motion.",
    tier1Category: "recovery",
    tier2Category: "mobility",
    category: "mobility",
    estimatedDuration: 14,
    trainingLoad: 2,
    intensity: "low",
    volume: "moderate",
    type: "recovery"
  },
  {
    id: "RC4",
    title: "Complete Rest Period (RC4)",
    description: "Planned complete rest from structured training. Mental and physical recovery period between training blocks.",
    tier1Category: "recovery",
    tier2Category: "rest",
    category: "rest",
    estimatedDuration: 7,
    trainingLoad: 1,
    intensity: "low",
    volume: "low",
    type: "recovery"
  }
];

// Peak/Competition Phase Templates
const peakPhaseTemplates: WorkoutTemplate[] = [
  {
    id: "PK1",
    title: "Pre-Competition Taper (PK1)",
    description: "Gradual reduction in training volume while maintaining intensity. Optimize performance for competition or testing.",
    tier1Category: "peak",
    tier2Category: "taper",
    category: "taper",
    estimatedDuration: 14,
    trainingLoad: 4,
    intensity: "high",
    volume: "low",
    type: "hybrid"
  },
  {
    id: "PK2",
    title: "Peak Performance Week (PK2)",
    description: "Minimal training volume with technique refinement and activation work. Final preparation for peak performance.",
    tier1Category: "peak",
    tier2Category: "peak",
    category: "peak",
    estimatedDuration: 7,
    trainingLoad: 3,
    intensity: "moderate",
    volume: "low",
    type: "hybrid"
  },
  {
    id: "PK3",
    title: "Competition/Testing Phase (PK3)",
    description: "Performance execution phase. Competition participation or fitness testing with minimal additional training stress.",
    tier1Category: "peak",
    tier2Category: "competition",
    category: "competition",
    estimatedDuration: 3,
    trainingLoad: 5,
    intensity: "peak",
    volume: "low",
    type: "hybrid"
  }
];

// Specialized Training Templates
const specializedTemplates: WorkoutTemplate[] = [
  {
    id: "SP1",
    title: "Injury Prevention Protocol (SP1)",
    description: "Targeted exercises to address common injury patterns and movement dysfunctions. Corrective exercise programming.",
    tier1Category: "specialized",
    tier2Category: "prevention",
    category: "prevention",
    estimatedDuration: 21,
    trainingLoad: 3,
    intensity: "low",
    volume: "moderate",
    type: "recovery"
  },
  {
    id: "SP2",
    title: "Return to Training Protocol (SP2)",
    description: "Progressive loading protocol for returning to training after injury or extended time off. Gradual capacity building.",
    tier1Category: "specialized",
    tier2Category: "return",
    category: "return",
    estimatedDuration: 28,
    trainingLoad: 4,
    intensity: "low",
    volume: "moderate",
    type: "hybrid"
  },
  {
    id: "SP3",
    title: "Functional Movement Training (SP3)",
    description: "Real-world movement patterns and functional strength development. Activities of daily living and occupational demands.",
    tier1Category: "specialized",
    tier2Category: "functional",
    category: "functional",
    estimatedDuration: 21,
    trainingLoad: 5,
    intensity: "moderate",
    volume: "moderate",
    type: "hybrid"
  }
];

// Organize all workout templates into a structured collection
export const workoutTemplates: WorkoutTemplateCollection = {
  foundation: {
    assessment: foundationPhaseTemplates.filter(t => t.tier2Category === "assessment"),
    movement: foundationPhaseTemplates.filter(t => t.tier2Category === "movement"),
    cardio: foundationPhaseTemplates.filter(t => t.tier2Category === "cardio"),
    stability: foundationPhaseTemplates.filter(t => t.tier2Category === "stability")
  },
  strength: {
    adaptation: strengthPhaseTemplates.filter(t => t.tier2Category === "adaptation"),
    hypertrophy: strengthPhaseTemplates.filter(t => t.tier2Category === "hypertrophy"),
    maximal: strengthPhaseTemplates.filter(t => t.tier2Category === "maximal"),
    power: strengthPhaseTemplates.filter(t => t.tier2Category === "power")
  },
  conditioning: {
    aerobic: conditioningPhaseTemplates.filter(t => t.tier2Category === "aerobic"),
    anaerobic: conditioningPhaseTemplates.filter(t => t.tier2Category === "anaerobic"),
    metabolic: conditioningPhaseTemplates.filter(t => t.tier2Category === "metabolic"),
    specific: conditioningPhaseTemplates.filter(t => t.tier2Category === "specific")
  },
  recovery: {
    active: recoveryPhaseTemplates.filter(t => t.tier2Category === "active"),
    deload: recoveryPhaseTemplates.filter(t => t.tier2Category === "deload"),
    mobility: recoveryPhaseTemplates.filter(t => t.tier2Category === "mobility"),
    rest: recoveryPhaseTemplates.filter(t => t.tier2Category === "rest")
  },
  peak: {
    taper: peakPhaseTemplates.filter(t => t.tier2Category === "taper"),
    peak: peakPhaseTemplates.filter(t => t.tier2Category === "peak"),
    competition: peakPhaseTemplates.filter(t => t.tier2Category === "competition")
  },
  specialized: {
    prevention: specializedTemplates.filter(t => t.tier2Category === "prevention"),
    return: specializedTemplates.filter(t => t.tier2Category === "return"),
    functional: specializedTemplates.filter(t => t.tier2Category === "functional")
  }
};

// Helper function to get all workout templates as a flat array
export function getAllWorkoutTemplates(): WorkoutTemplate[] {
  const allTemplates: WorkoutTemplate[] = [];

  Object.values(workoutTemplates).forEach((tier1Category) => {
    Object.values(tier1Category).forEach((templatesArray) => {
      allTemplates.push(...templatesArray);
    });
  });

  return allTemplates;
}

// Helper function to get workout template by ID
export function getWorkoutTemplateById(id: string): WorkoutTemplate | undefined {
  return getAllWorkoutTemplates().find((template) => template.id === id);
}

// Helper function to get templates by tier1 category
export function getWorkoutTemplatesByTier1(tier1: string): WorkoutTemplate[] {
  const templates: WorkoutTemplate[] = [];

  if (workoutTemplates[tier1]) {
    Object.values(workoutTemplates[tier1]).forEach((templatesArray) => {
      templates.push(...templatesArray);
    });
  }

  return templates;
}

// Helper function to get templates by tier1 and tier2 categories
export function getWorkoutTemplatesByTier2(
  tier1: string,
  tier2: string,
): WorkoutTemplate[] {
  if (workoutTemplates[tier1] && workoutTemplates[tier1][tier2]) {
    return workoutTemplates[tier1][tier2];
  }
  return [];
}

// Training Load Calculation Utilities
export interface TrainingLoadCalculation {
  weeklyLoad: number;
  acuteLoad: number; // 7-day rolling average
  chronicLoad: number; // 28-day rolling average
  acuteToChronicRatio: number;
  riskLevel: 'low' | 'moderate' | 'high';
  recommendation: string;
}

// Calculate training load metrics for injury prevention and performance optimization
export function calculateTrainingLoad(
  recentWorkouts: { date: Date; trainingLoad: number }[],
  currentDate: Date = new Date()
): TrainingLoadCalculation {
  const msPerDay = 24 * 60 * 60 * 1000;

  // Filter workouts within last 28 days
  const last28Days = recentWorkouts.filter(workout =>
    (currentDate.getTime() - workout.date.getTime()) <= (28 * msPerDay)
  );

  // Calculate acute load (last 7 days)
  const last7Days = last28Days.filter(workout =>
    (currentDate.getTime() - workout.date.getTime()) <= (7 * msPerDay)
  );

  const acuteLoad = last7Days.reduce((sum, workout) => sum + workout.trainingLoad, 0) / 7;
  const chronicLoad = last28Days.reduce((sum, workout) => sum + workout.trainingLoad, 0) / 28;

  const acuteToChronicRatio = chronicLoad > 0 ? acuteLoad / chronicLoad : 0;

  // Risk assessment based on acute:chronic ratio
  let riskLevel: 'low' | 'moderate' | 'high';
  let recommendation: string;

  if (acuteToChronicRatio < 0.8) {
    riskLevel = 'low';
    recommendation = 'Training load is low. Consider gradually increasing intensity or volume.';
  } else if (acuteToChronicRatio <= 1.3) {
    riskLevel = 'low';
    recommendation = 'Optimal training load range. Continue current progression.';
  } else if (acuteToChronicRatio <= 1.5) {
    riskLevel = 'moderate';
    recommendation = 'Moderate injury risk. Monitor fatigue and consider reducing load.';
  } else {
    riskLevel = 'high';
    recommendation = 'High injury risk. Reduce training load or implement recovery week.';
  }

  return {
    weeklyLoad: last7Days.reduce((sum, workout) => sum + workout.trainingLoad, 0),
    acuteLoad,
    chronicLoad,
    acuteToChronicRatio,
    riskLevel,
    recommendation
  };
}

// Generate periodized training plan
export interface TrainingPeriod {
  phase: string;
  templateIds: string[];
  duration: number;
  focus: string;
  targetLoad: number;
}

export function generatePeriodizedPlan(
  totalWeeks: number,
  goals: string[] = ['strength', 'conditioning']
): TrainingPeriod[] {
  const plan: TrainingPeriod[] = [];

  if (totalWeeks >= 12) {
    // Full periodization with all phases
    plan.push({
      phase: 'Foundation',
      templateIds: ['FP1', 'FP2', 'FP3', 'FP4'],
      duration: 4,
      focus: 'Movement quality and aerobic base',
      targetLoad: 3
    });

    plan.push({
      phase: 'Strength Development',
      templateIds: ['ST1', 'ST2'],
      duration: 6,
      focus: 'Strength and muscle development',
      targetLoad: 6
    });

    plan.push({
      phase: 'Peak Preparation',
      templateIds: ['ST3', 'CD1'],
      duration: 2,
      focus: 'Maximum strength and power',
      targetLoad: 7
    });

    if (totalWeeks > 12) {
      plan.push({
        phase: 'Recovery',
        templateIds: ['RC1', 'RC2'],
        duration: Math.min(totalWeeks - 12, 2),
        focus: 'Recovery and adaptation',
        targetLoad: 2
      });
    }
  } else if (totalWeeks >= 8) {
    // Condensed plan
    plan.push({
      phase: 'Foundation',
      templateIds: ['FP2', 'FP3'],
      duration: 3,
      focus: 'Movement and base building',
      targetLoad: 4
    });

    plan.push({
      phase: 'Development',
      templateIds: ['ST1', 'CD3'],
      duration: 4,
      focus: 'Strength and conditioning',
      targetLoad: 6
    });

    plan.push({
      phase: 'Peak',
      templateIds: ['PK1'],
      duration: 1,
      focus: 'Performance optimization',
      targetLoad: 4
    });
  } else {
    // Short program
    plan.push({
      phase: 'Quick Start',
      templateIds: ['FP2', 'ST1'],
      duration: totalWeeks,
      focus: 'Rapid adaptation',
      targetLoad: 5
    });
  }

  return plan;
}