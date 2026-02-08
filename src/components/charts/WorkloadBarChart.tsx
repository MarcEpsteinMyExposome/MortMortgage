import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'

interface WorkloadData {
  name: string
  activeQueue: number
}

interface WorkloadBarChartProps {
  data: WorkloadData[]
}

function getCapacityColor(count: number): string {
  if (count >= 8) return '#EF4444'  // red
  if (count >= 5) return '#F59E0B'  // yellow
  return '#22C55E'                   // green
}

export default function WorkloadBarChart({ data }: WorkloadBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No caseworker data available
      </div>
    )
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
          <XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6b7280', fontSize: 12 }}
            allowDecimals={false}
          />
          <YAxis
            dataKey="name"
            type="category"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#374151', fontSize: 13 }}
            width={75}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            formatter={(value: number) => [value, 'Active Cases']}
          />
          <Bar dataKey="activeQueue" radius={[0, 4, 4, 0]} maxBarSize={30}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getCapacityColor(entry.activeQueue)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
