interface SLABadgeProps {
  deadline: string | null | undefined
}

export default function SLABadge({ deadline }: SLABadgeProps) {
  if (!deadline) {
    return <span className="text-xs text-gray-400">No SLA</span>
  }

  const now = new Date()
  const sla = new Date(deadline)
  const hoursLeft = (sla.getTime() - now.getTime()) / (1000 * 60 * 60)

  if (hoursLeft < 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        Overdue
      </span>
    )
  }

  if (hoursLeft < 24) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
        At Risk
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
      On Track
    </span>
  )
}
