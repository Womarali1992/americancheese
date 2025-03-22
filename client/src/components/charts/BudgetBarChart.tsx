import { formatCurrency } from "@/lib/utils";

interface ExpenseBreakdownProps {
  data: {
    materials: number;
    labor: number;
    equipment?: number;
    permits?: number;
    misc?: number;
  };
}

export function BudgetBarChart({ data }: ExpenseBreakdownProps) {
  const getExpenseData = () => {
    const totalAmount = Object.values(data).reduce((sum, val) => sum + (val || 0), 0);
    
    return [
      { name: 'Materials', amount: data.materials, percentage: Math.round((data.materials / totalAmount) * 100) },
      { name: 'Labor', amount: data.labor, percentage: Math.round((data.labor / totalAmount) * 100) },
      { name: 'Equipment', amount: data.equipment || 0, percentage: data.equipment ? Math.round((data.equipment / totalAmount) * 100) : 0 },
      { name: 'Permits', amount: data.permits || 0, percentage: data.permits ? Math.round((data.permits / totalAmount) * 100) : 0 },
      { name: 'Misc', amount: data.misc || 0, percentage: data.misc ? Math.round((data.misc / totalAmount) * 100) : 0 }
    ].filter(item => item.amount > 0);
  };

  return (
    <div className="w-full space-y-4 px-4">
      {getExpenseData().map((item, index) => (
        <div className="space-y-1" key={index}>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">{item.name}</span>
            <span className="text-sm text-[#084f09]">{formatCurrency(item.amount)}</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full ${
                index === 0 
                  ? 'bg-orange-500' 
                  : index === 1 
                    ? 'bg-blue-500' 
                    : index === 2 
                      ? 'bg-purple-500' 
                      : index === 3 
                        ? 'bg-amber-500' 
                        : 'bg-slate-500'
              }`}
              style={{ width: `${item.percentage}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
}