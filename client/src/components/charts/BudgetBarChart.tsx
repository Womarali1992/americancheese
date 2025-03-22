import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

interface BudgetData {
  name: string;
  amount: number;
  color: string;
}

interface Props {
  data: {
    materials: number;
    labor: number;
  };
}

export function BudgetBarChart({ data }: Props) {
  const chartData = [
    { name: 'Materials', amount: data.materials, color: '#f97316' },
    { name: 'Labor', amount: data.labor, color: '#3b82f6' }
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        layout="vertical"
        data={chartData}
        margin={{ top: 5, right: 50, bottom: 5, left: 20 }}
      >
        <YAxis 
          type="category" 
          dataKey="name" 
          stroke="#666"
          fontSize={12}
        />
        <XAxis 
          type="number" 
          hide={false}
          stroke="#666"
          tickFormatter={formatCurrency}
        />
        <Bar 
          dataKey="amount" 
          radius={[0, 4, 4, 0]}
        >
          {chartData.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
          <LabelList 
            dataKey="amount" 
            position="right" 
            formatter={formatCurrency}
            style={{ fontSize: '11px', fill: '#084f09' }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}