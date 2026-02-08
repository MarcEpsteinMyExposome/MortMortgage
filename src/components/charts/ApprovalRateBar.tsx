interface ApprovalRateBarProps {
  rate: number
}

export default function ApprovalRateBar({ rate }: ApprovalRateBarProps) {
  const color = rate >= 80 ? 'bg-green-500' : rate >= 60 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[80px]">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.min(rate, 100)}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-700 w-10">{rate}%</span>
    </div>
  )
}
