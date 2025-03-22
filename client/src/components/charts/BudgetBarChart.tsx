import { formatCurrency } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, LabelList, ResponsiveContainer } from 'recharts';

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
    return [
      { name: 'Materials', amount: data.materials, color: '#f97316' }, // orange-500
      { name: 'Labor', amount: data.labor, color: '#3b82f6' }, // blue-500
      { name: 'Equipment', amount: data.equipment || 0, color: '#8b5cf6' }, // purple-500
      { name: 'Permits', amount: data.permits || 0, color: '#f59e0b' }, // amber-500
      { name: 'Misc', amount: data.misc || 0, color: '#64748b' }, // slate-500
    ].filter(item => item.amount > 0);
  };

  const chartData = getExpenseData();
  
  const CustomBarLabel = (props: any) => {
    const { x, y, width, value } = props;
    return (
      <text 
        x={x + width + 5} 
        y={y + 15} 
        fill="#084f09" 
        textAnchor="start" 
        fontSize="11"
      >
        {formatCurrency(value)}
      </text>
    );
  };

  return (
    <div className="w-full h-full px-4 pt-2">
      <ResponsiveContainer width="100%" height={chartData.length * 50}>
        <BarChart
          layout="vertical"
          data={chartData}
          margin={{ top: 10, right: 80, left: 5, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
          <XAxis type="number" hide={true} />
          <YAxis 
            type="category" 
            dataKey="name" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 14, fill: '#334155', fontWeight: 500 }}
            width={80}
          />
          <Bar 
            dataKey="amount" 
            barSize={30} 
            radius={[0, 4, 4, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
            <LabelList 
              dataKey="amount" 
              content={CustomBarLabel} 
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}