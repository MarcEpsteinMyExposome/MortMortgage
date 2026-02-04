import React from 'react'

type BorrowerTabsProps = {
  hasCoBorrower: boolean
  activeBorrowerIndex: number
  onTabChange: (index: number) => void
  onToggleCoBorrower: (enabled: boolean) => void
  showToggle?: boolean
  primaryLabel?: string
  coBorrowerLabel?: string
  borrowerValidation?: { primary: boolean; coBorrower: boolean }
}

export default function BorrowerTabs({
  hasCoBorrower,
  activeBorrowerIndex,
  onTabChange,
  onToggleCoBorrower,
  showToggle = true,
  primaryLabel = 'Primary Borrower',
  coBorrowerLabel = 'Co-Borrower',
  borrowerValidation
}: BorrowerTabsProps) {
  return (
    <div className="mb-6">
      {/* Co-Borrower Toggle - only show on Identity step */}
      {showToggle && (
        <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasCoBorrower}
                onChange={(e) => onToggleCoBorrower(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700">Add Co-Borrower</span>
            </label>
            <span className="text-xs text-gray-500">
              (spouse, partner, or additional applicant)
            </span>
          </div>
          {hasCoBorrower && (
            <button
              type="button"
              onClick={() => onToggleCoBorrower(false)}
              className="text-xs text-danger-600 hover:text-danger-700 font-medium"
            >
              Remove Co-Borrower
            </button>
          )}
        </div>
      )}

      {/* Borrower Tabs */}
      {hasCoBorrower && (
        <div className="flex border-b border-gray-200">
          <button
            type="button"
            onClick={() => onTabChange(0)}
            className={`
              relative px-5 py-3 text-sm font-medium transition-colors
              ${activeBorrowerIndex === 0
                ? 'text-primary-600 border-b-2 border-primary-500 -mb-px bg-white'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <UserIcon />
              <span>{primaryLabel}</span>
              {borrowerValidation && (
                <ValidationIndicator isValid={borrowerValidation.primary} />
              )}
            </div>
          </button>
          <button
            type="button"
            onClick={() => onTabChange(1)}
            className={`
              relative px-5 py-3 text-sm font-medium transition-colors
              ${activeBorrowerIndex === 1
                ? 'text-primary-600 border-b-2 border-primary-500 -mb-px bg-white'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <UsersIcon />
              <span>{coBorrowerLabel}</span>
              {borrowerValidation && (
                <ValidationIndicator isValid={borrowerValidation.coBorrower} />
              )}
            </div>
          </button>
        </div>
      )}

      {/* Active borrower indicator when co-borrower exists */}
      {hasCoBorrower && (
        <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
          <span>Currently editing:</span>
          <span className="font-medium text-primary-600">
            {activeBorrowerIndex === 0 ? primaryLabel : coBorrowerLabel}
          </span>
        </div>
      )}
    </div>
  )
}

// Simple user icon
function UserIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}

// Users icon for co-borrower
function UsersIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}

// Validation indicator dot
function ValidationIndicator({ isValid }: { isValid: boolean }) {
  return (
    <span
      className={`
        w-2 h-2 rounded-full
        ${isValid ? 'bg-success-500' : 'bg-danger-500'}
      `}
      title={isValid ? 'Complete' : 'Incomplete'}
    />
  )
}
