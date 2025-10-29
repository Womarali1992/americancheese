import React from "react";
import { ProjectBudgetChart } from "./ProjectBudgetChart";

// Extended data type that includes system breakdowns
interface ProjectExpense {
  id: number;
  name: string;
  materials: number;
  labor: number;
  systems?: {
    structural: {
      materials: number;
      labor: number;
    };
    systems: {
      materials: number;
      labor: number;
    };
    sheathing: {
      materials: number;
      labor: number;
    };
    finishings: {
      materials: number;
      labor: number;
    };
  };
}

interface BudgetExpandableChartProps {
  data: {
    projects: ProjectExpense[];
  };
  className?: string;
}

export function BudgetExpandableChart({ data, className }: BudgetExpandableChartProps) {
  return (
    <div className={`w-full space-y-4 ${className}`}>
      {data.projects.map((project) => (
        <ProjectBudgetChart
          key={project.id}
          projectId={project.id}
          projectName={project.name}
          budget={{
            materials: project.materials,
            labor: project.labor,
            systems: project.systems
          }}
        />
      ))}
    </div>
  );
}