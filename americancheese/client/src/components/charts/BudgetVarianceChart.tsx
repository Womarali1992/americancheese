import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from "recharts";

interface BudgetCategory {
  name: string;
  estimated: number;
  actual: number;
}

interface BudgetVarianceChartProps {
  data: BudgetCategory[];
  title?: string;
  showChart?: boolean;
}

export function BudgetVarianceChart({
  data,
  title = "Budget Variance",
  showChart = true
}: BudgetVarianceChartProps) {
  // Calculate totals
  const totalEstimated = data.reduce((sum, item) => sum + item.estimated, 0);
  const totalActual = data.reduce((sum, item) => sum + item.actual, 0);
  const totalVariance = totalEstimated - totalActual;
  const variancePercent = totalEstimated > 0
    ? ((totalVariance / totalEstimated) * 100).toFixed(1)
    : "0";

  // Prepare chart data with variance
  const chartData = data.map(item => ({
    ...item,
    variance: item.estimated - item.actual,
    variancePercent: item.estimated > 0
      ? ((item.estimated - item.actual) / item.estimated * 100).toFixed(1)
      : "0"
  }));

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return "text-emerald-600";
    if (variance < 0) return "text-red-600";
    return "text-slate-500";
  };

  const getVarianceBgColor = (variance: number) => {
    if (variance > 0) return "bg-emerald-50 border-emerald-200";
    if (variance < 0) return "bg-red-50 border-red-200";
    return "bg-slate-50 border-slate-200";
  };

  const getVarianceIcon = (variance: number) => {
    if (variance > 0) return <TrendingDown className="h-4 w-4 text-emerald-600" />;
    if (variance < 0) return <TrendingUp className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-slate-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Estimated Total */}
        <div className="p-4 rounded-lg border bg-slate-50 border-slate-200">
          <p className="text-sm text-slate-500 mb-1">Estimated Budget</p>
          <p className="text-2xl font-bold text-slate-900">
            {formatCurrency(totalEstimated)}
          </p>
        </div>

        {/* Actual Total */}
        <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
          <p className="text-sm text-blue-600 mb-1">Actual Spend</p>
          <p className="text-2xl font-bold text-blue-900">
            {formatCurrency(totalActual)}
          </p>
        </div>

        {/* Variance */}
        <div className={`p-4 rounded-lg border ${getVarianceBgColor(totalVariance)}`}>
          <div className="flex items-center justify-between mb-1">
            <p className={`text-sm ${getVarianceColor(totalVariance)}`}>
              {totalVariance >= 0 ? "Under Budget" : "Over Budget"}
            </p>
            {getVarianceIcon(totalVariance)}
          </div>
          <p className={`text-2xl font-bold ${getVarianceColor(totalVariance)}`}>
            {totalVariance >= 0 ? "" : "-"}{formatCurrency(Math.abs(totalVariance))}
          </p>
          <p className={`text-sm ${getVarianceColor(totalVariance)}`}>
            {variancePercent}% {totalVariance >= 0 ? "savings" : "overrun"}
          </p>
        </div>
      </div>

      {/* Chart */}
      {showChart && data.length > 0 && (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                tick={{ fontSize: 12 }}
                tickLine={false}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              />
              <Legend />
              <ReferenceLine y={0} stroke="#94a3b8" />
              <Bar
                dataKey="estimated"
                fill="#94a3b8"
                name="Estimated"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="actual"
                fill="#3b82f6"
                name="Actual"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Category Breakdown */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-700">Category Breakdown</h4>
        <div className="divide-y divide-slate-100">
          {chartData.map((item) => {
            const variance = item.estimated - item.actual;
            const percentUsed = item.estimated > 0
              ? Math.min((item.actual / item.estimated) * 100, 150)
              : 0;

            return (
              <div key={item.name} className="py-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-slate-900">{item.name}</span>
                  <div className="flex items-center gap-2">
                    {getVarianceIcon(variance)}
                    <span className={`text-sm font-medium ${getVarianceColor(variance)}`}>
                      {variance >= 0 ? "+" : ""}{formatCurrency(variance)}
                    </span>
                  </div>
                </div>

                {/* Progress bar showing actual vs estimated */}
                <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
                  {/* Estimated marker at 100% */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10"
                    style={{ left: `${Math.min(100, (item.estimated / Math.max(item.estimated, item.actual)) * 100)}%` }}
                  />
                  {/* Actual bar */}
                  <div
                    className={`h-full rounded-full transition-all ${
                      variance >= 0 ? 'bg-emerald-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(percentUsed, 100)}%` }}
                  />
                  {/* Overage indicator */}
                  {percentUsed > 100 && (
                    <div
                      className="absolute top-0 bottom-0 bg-red-300 rounded-r-full"
                      style={{
                        left: '100%',
                        width: `${Math.min(percentUsed - 100, 50)}%`
                      }}
                    />
                  )}
                </div>

                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Actual: {formatCurrency(item.actual)}</span>
                  <span>Budget: {formatCurrency(item.estimated)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Compact inline variance indicator for use in tables/cards
export function BudgetVarianceInline({
  estimated,
  actual
}: {
  estimated: number;
  actual: number;
}) {
  const variance = estimated - actual;
  const percent = estimated > 0 ? ((variance / estimated) * 100).toFixed(0) : "0";

  if (variance > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
        <TrendingDown className="h-3 w-3" />
        {percent}% under
      </span>
    );
  } else if (variance < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-sm text-red-600">
        <TrendingUp className="h-3 w-3" />
        {Math.abs(Number(percent))}% over
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-sm text-slate-500">
      <Minus className="h-3 w-3" />
      On budget
    </span>
  );
}
