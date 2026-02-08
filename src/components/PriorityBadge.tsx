const PRIORITY_CONFIG: Record<string, { dot: string; text: string; label: string }> = {
  urgent: { dot: 'bg-red-500', text: 'text-red-700', label: 'Urgent' },
  high: { dot: 'bg-orange-500', text: 'text-orange-700', label: 'High' },
  normal: { dot: 'bg-blue-500', text: 'text-blue-700', label: 'Normal' },
  low: { dot: 'bg-gray-400', text: 'text-gray-600', label: 'Low' }
}

interface PriorityBadgeProps {
  priority: string
  showLabel?: boolean
}

export default function PriorityBadge({ priority, showLabel = true }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.normal

  return (
    <span className={`inline-flex items-center gap-1.5 ${config.text}`}>
      <span className={`w-2 h-2 rounded-full ${config.dot}`} />
      {showLabel && <span className="text-xs font-medium">{config.label}</span>}
    </span>
  )
}
