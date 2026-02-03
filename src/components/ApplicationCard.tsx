import Link from 'next/link'

interface ApplicationCardProps {
  id: string
  status: string
  data?: {
    property?: {
      address?: {
        street?: string
        city?: string
        state?: string
        zip?: string
      }
    }
    loan?: {
      loanAmount?: number
    }
  }
  updatedAt: string
  createdAt: string
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
  draft: {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    label: 'Draft',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    )
  },
  submitted: {
    bg: 'bg-primary-100',
    text: 'text-primary-800',
    label: 'Submitted',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  },
  in_review: {
    bg: 'bg-warning-100',
    text: 'text-warning-800',
    label: 'In Review',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  approved: {
    bg: 'bg-success-100',
    text: 'text-success-800',
    label: 'Approved',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  denied: {
    bg: 'bg-danger-100',
    text: 'text-danger-800',
    label: 'Denied',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function formatCurrency(amount?: number): string {
  if (!amount) return '-'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount)
}

function getPropertyAddress(data?: ApplicationCardProps['data']): string {
  const addr = data?.property?.address
  if (!addr) return 'No address provided'
  const parts = [addr.street, addr.city, addr.state, addr.zip].filter(Boolean)
  if (parts.length === 0) return 'No address provided'
  if (addr.street) {
    return `${addr.street}, ${addr.city || ''}, ${addr.state || ''} ${addr.zip || ''}`.trim()
  }
  return `${addr.city || ''}, ${addr.state || ''} ${addr.zip || ''}`.trim()
}

export default function ApplicationCard({ id, status, data, updatedAt, createdAt }: ApplicationCardProps) {
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.draft
  const isDraft = status === 'draft'
  const loanAmount = data?.loan?.loanAmount
  const propertyAddress = getPropertyAddress(data)

  return (
    <div className="card card-hover p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        {/* Main Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className={`badge ${statusConfig.bg} ${statusConfig.text}`}>
              {statusConfig.icon}
              <span className="ml-1.5">{statusConfig.label}</span>
            </span>
            <span className="text-xs text-gray-500 font-mono">
              #{id.slice(0, 8)}
            </span>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
            {propertyAddress}
          </h3>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatCurrency(loanAmount)}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Updated {formatDate(updatedAt || createdAt)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex sm:flex-col gap-2">
          {isDraft ? (
            <Link
              href={`/apply/${id}`}
              className="btn btn-primary btn-sm"
            >
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Continue
            </Link>
          ) : (
            <Link
              href={`/apply/${id}/review`}
              className="btn btn-secondary btn-sm"
            >
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
