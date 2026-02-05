import React from 'react'

interface Props {
  fieldsFound: number;
  confidence: number;
  onAccept: () => void;
  onDecline: () => void;
}

const SparklesIcon = ({ className }: { className?: string }) => (
  <svg className={className || 'w-5 h-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
)

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className || 'w-4 h-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className || 'w-4 h-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

function getConfidenceDescription(confidence: number): string {
  if (confidence >= 95) return 'very high'
  if (confidence >= 85) return 'high'
  if (confidence >= 70) return 'good'
  return 'moderate'
}

export default function AutoFillSuggestion({ fieldsFound, confidence, onAccept, onDecline }: Props) {
  const confidenceLevel = getConfidenceDescription(confidence)
  const showConfidenceWarning = confidence < 70

  return (
    <div className={`card overflow-hidden border-2 ${
      confidence >= 70 ? 'border-primary-200 bg-primary-50' : 'border-warning-200 bg-warning-50'
    }`}>
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 p-2 rounded-lg ${
            confidence >= 70 ? 'bg-primary-100' : 'bg-warning-100'
          }`}>
            <SparklesIcon className={`w-6 h-6 ${
              confidence >= 70 ? 'text-primary-600' : 'text-warning-600'
            }`} />
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-lg">
              We found data in your document
            </h3>
            <p className="text-gray-600 mt-1">
              {fieldsFound} field{fieldsFound !== 1 ? 's' : ''} detected with {confidenceLevel} confidence ({confidence}%).
              {' '}Would you like to auto-fill your form?
            </p>

            {showConfidenceWarning && (
              <div className="mt-3 p-3 bg-warning-100 rounded-lg border border-warning-200">
                <p className="text-sm text-warning-800">
                  <strong>Note:</strong> Some extracted values have lower confidence.
                  Please review the auto-filled data carefully.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mt-5 ml-14">
          <button
            onClick={onAccept}
            className="btn btn-primary"
          >
            <CheckIcon className="w-4 h-4 mr-2" />
            Yes, use extracted data
          </button>

          <button
            onClick={onDecline}
            className="btn btn-secondary"
          >
            <XIcon className="w-4 h-4 mr-2" />
            No, I'll enter manually
          </button>
        </div>

        {/* Info Text */}
        <p className="text-xs text-gray-500 mt-4 ml-14">
          You can always edit the auto-filled values after they're applied.
        </p>
      </div>
    </div>
  )
}
