import React from 'react'

interface Props {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  confidence?: number;
  error?: string;
  onRetry?: () => void;
}

const SpinnerIcon = ({ className }: { className?: string }) => (
  <svg className={`animate-spin ${className || 'w-5 h-5'}`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
)

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className || 'w-5 h-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className || 'w-5 h-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className || 'w-5 h-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const RefreshIcon = ({ className }: { className?: string }) => (
  <svg className={className || 'w-4 h-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

export default function ExtractionStatus({ status, confidence, error, onRetry }: Props) {
  if (status === 'pending') {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <ClockIcon className="w-5 h-5" />
        <span className="text-sm font-medium">Waiting to process</span>
      </div>
    )
  }

  if (status === 'processing') {
    return (
      <div className="flex items-center gap-2 text-primary-600">
        <SpinnerIcon className="w-5 h-5" />
        <span className="text-sm font-medium">Analyzing document...</span>
      </div>
    )
  }

  if (status === 'completed') {
    const confidencePercent = confidence ?? 0
    const confidenceColor = confidencePercent >= 90
      ? 'text-success-600'
      : confidencePercent >= 70
        ? 'text-warning-600'
        : 'text-danger-600'

    return (
      <div className="flex items-center gap-2">
        <CheckIcon className="w-5 h-5 text-success-600" />
        <span className="text-sm font-medium text-success-600">Analysis complete</span>
        {confidence !== undefined && (
          <span className={`badge ${
            confidencePercent >= 90
              ? 'bg-success-100 text-success-800'
              : confidencePercent >= 70
                ? 'bg-warning-100 text-warning-800'
                : 'bg-danger-100 text-danger-800'
          }`}>
            {confidencePercent}% confidence
          </span>
        )}
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-danger-600">
          <XIcon className="w-5 h-5" />
          <span className="text-sm font-medium">Analysis failed</span>
        </div>
        {error && (
          <p className="text-sm text-danger-600 ml-7">{error}</p>
        )}
        {onRetry && (
          <button
            onClick={onRetry}
            className="btn btn-secondary btn-sm ml-7 w-fit"
          >
            <RefreshIcon className="w-4 h-4 mr-1.5" />
            Retry
          </button>
        )}
      </div>
    )
  }

  return null
}
