import React from 'react'

export type ExtractionStatusType = 'pending' | 'processing' | 'completed' | 'failed'

interface ExtractionStatusProps {
  status: ExtractionStatusType
  provider?: string
  confidence?: number
  error?: string
  onRetry?: () => void
  retryCount?: number
  maxRetries?: number
}

export default function ExtractionStatus({
  status,
  provider,
  confidence,
  error,
  onRetry,
  retryCount = 0,
  maxRetries = 3
}: ExtractionStatusProps) {
  const canRetry = onRetry && retryCount < maxRetries

  // Confidence indicator color
  function getConfidenceColor(conf: number): string {
    if (conf >= 80) return 'text-green-600 bg-green-100'
    if (conf >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  function getConfidenceLabel(conf: number): string {
    if (conf >= 80) return 'High'
    if (conf >= 60) return 'Medium'
    return 'Low'
  }

  if (status === 'pending') {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
        <span>Waiting to process</span>
      </div>
    )
  }

  if (status === 'processing') {
    return (
      <div className="flex items-center gap-2 text-sm text-blue-600">
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Analyzing document...</span>
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="flex items-center gap-2 text-red-600">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Extraction failed</span>
        </span>
        {error && (
          <span className="text-gray-500 text-xs">({error})</span>
        )}
        {canRetry && (
          <button
            onClick={onRetry}
            className="ml-2 text-blue-600 hover:underline text-xs"
          >
            Retry ({retryCount}/{maxRetries})
          </button>
        )}
        {!canRetry && retryCount >= maxRetries && (
          <span className="text-gray-400 text-xs ml-2">Max retries reached</span>
        )}
      </div>
    )
  }

  // status === 'completed'
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="flex items-center gap-1 text-green-600">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span>Extracted</span>
      </span>
      {confidence !== undefined && (
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getConfidenceColor(confidence)}`}>
          {getConfidenceLabel(confidence)} ({Math.round(confidence)}%)
        </span>
      )}
      {provider && (
        <span className="text-gray-400 text-xs">via {provider}</span>
      )}
    </div>
  )
}
