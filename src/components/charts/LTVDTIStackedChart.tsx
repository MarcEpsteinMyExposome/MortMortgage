import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'

interface RangeData {
  range: string
  approved: number
  denied: number
  approvalRate: number
}

interface LTVDTIStackedChartProps {
  data: RangeData[]
  label: string
}

export default function LTVDTIStackedChart({ data, label }: LTVDTIStackedChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No {label} data available
      </div>
    )
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="range"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6b7280', fontSize: 11 }}
            label={{ value: `${label} %`, position: 'insideBottom', offset: -5, fill: '#9ca3af', fontSize: 11 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6b7280', fontSize: 12 }}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            formatter={(value: number, name: string) => [value, name === 'approved' ? 'Approved' : 'Denied']}
          />
          <Legend />
          <Bar dataKey="approved" stackId="a" fill="#22C55E" radius={[0, 0, 0, 0]} name="Approved" />
          <Bar dataKey="denied" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} name="Denied" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
