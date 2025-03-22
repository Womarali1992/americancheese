import { formatCurrency } from "@/lib/utils";

interface ProjectExpense {
  id: number;
  name: string;
  materials: number;
  labor: number;
}

interface ExpenseBreakdownProps {
  data: {
    projects: ProjectExpense[];
  };
}

export function BudgetBarChart({ data }: ExpenseBreakdownProps) {
  // Set consistent colors for materials and labor
  const materialColor = 'bg-orange-500';
  const laborColor = 'bg-blue-500';
  
  // Calculate max value for scale normalization
  const maxValue = Math.max(
    ...data.projects.map((p) => Math.max(p.materials, p.labor))
  );
  
  return (
    <div className="w-full space-y-6 px-2">
      {data.projects.map((project) => {
        // Calculate percentage widths based on the max value
        const materialWidth = Math.round((project.materials / maxValue) * 100);
        const laborWidth = Math.round((project.labor / maxValue) * 100);
      
        return (
          <div key={project.id} className="space-y-3">
            <h3 className="text-sm font-semibold mb-2">{project.name}</h3>
            
            {/* Materials bar */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm">Materials</span>
                <span className="text-sm text-[#084f09]">{formatCurrency(project.materials)}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${materialColor}`}
                  style={{ 
                    width: `${materialWidth}%`
                  }}
                ></div>
              </div>
            </div>
            
            {/* Labor bar */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm">Labor</span>
                <span className="text-sm text-[#084f09]">{formatCurrency(project.labor)}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${laborColor}`}
                  style={{ 
                    width: `${laborWidth}%`
                  }}
                ></div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}