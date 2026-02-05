import React, { useCallback, useEffect, useState } from 'react'
import { usePlaidLink, PlaidLinkOptions, PlaidLinkOnSuccess } from 'react-plaid-link'
import type { ConnectedBankAccount, PlaidAccount } from '../lib/integrations/plaid'

type PlaidLinkButtonProps = {
  userId: string
  onSuccess: (data: ConnectedBankAccount) => void
  onExit?: () => void
  disabled?: boolean
  className?: string
  children?: React.ReactNode
}

type PlaidLinkState = {
  linkToken: string | null
  loading: boolean
  error: string | null
  configured: boolean
}

/**
 * Plaid Link Button Component
 *
 * Handles the full Plaid Link flow:
 * 1. Fetches link token from API
 * 2. Opens Plaid Link modal
 * 3. Exchanges public token for access token
 * 4. Returns connected account data
 *
 * Works in demo mode when Plaid is not configured
 */
export function PlaidLinkButton({
  userId,
  onSuccess,
  onExit,
  disabled = false,
  className = '',
  children,
}: PlaidLinkButtonProps) {
  const [state, setState] = useState<PlaidLinkState>({
    linkToken: null,
    loading: false,
    error: null,
    configured: true,
  })
  const [showSuccess, setShowSuccess] = useState<string | null>(null)

  // Fetch link token on mount
  useEffect(() => {
    async function fetchLinkToken() {
      setState(prev => ({ ...prev, loading: true, error: null }))
      try {
        const response = await fetch('/api/plaid/create-link-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        })

        const data = await response.json()

        if (data.error) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: data.error,
            configured: data.configured ?? true,
          }))
          return
        }

        setState({
          linkToken: data.link_token,
          loading: false,
          error: null,
          configured: data.configured ?? true,
        })
      } catch (error: any) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error.message || 'Failed to initialize bank connection',
        }))
      }
    }

    if (userId) {
      fetchLinkToken()
    }
  }, [userId])

  // Handle successful Plaid Link connection
  const handleSuccess: PlaidLinkOnSuccess = useCallback(
    async (publicToken, metadata) => {
      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const response = await fetch('/api/plaid/exchange-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            public_token: publicToken,
            metadata,
          }),
        })

        const result = await response.json()

        if (!result.success) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: result.error || 'Failed to connect bank',
          }))
          return
        }

        setState(prev => ({ ...prev, loading: false }))
        // Show success toast with institution name
        const institutionName = result.data.institutionName || metadata?.institution?.name || 'your bank'
        setShowSuccess(`Successfully connected to ${institutionName}`)
        setTimeout(() => setShowSuccess(null), 5000)
        onSuccess(result.data)
      } catch (error: any) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error.message || 'Failed to connect bank',
        }))
      }
    },
    [onSuccess]
  )

  // Handle Plaid Link exit
  const handleExit = useCallback(() => {
    onExit?.()
  }, [onExit])

  // Plaid Link configuration
  const config: PlaidLinkOptions = {
    token: state.linkToken || '',
    onSuccess: handleSuccess,
    onExit: handleExit,
  }

  const { open, ready } = usePlaidLink(config)

  // Handle mock/demo mode when Plaid is not configured
  const handleDemoClick = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }))

    try {
      const response = await fetch('/api/plaid/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          public_token: 'mock-public-token',
        }),
      })

      const result = await response.json()

      if (!result.success) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Failed to connect bank',
        }))
        return
      }

      setState(prev => ({ ...prev, loading: false }))
      // Show success toast
      const institutionName = result.data.institutionName || 'Demo Bank'
      setShowSuccess(`Successfully connected to ${institutionName}`)
      setTimeout(() => setShowSuccess(null), 5000)
      onSuccess(result.data)
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to connect demo bank',
      }))
    }
  }, [onSuccess])

  const isDisabled = disabled || state.loading || (!state.configured && !state.linkToken)
  const isReady = state.configured ? ready && !!state.linkToken : true

  const handleClick = () => {
    if (!state.configured) {
      // Demo mode - use mock data
      handleDemoClick()
    } else if (isReady) {
      open()
    }
  }

  const buttonClass = className || 'btn btn-primary'

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled || !isReady}
        className={buttonClass}
      >
        {state.loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Connecting...
          </span>
        ) : (
          children || 'Connect Bank Account'
        )}
      </button>

      {showSuccess && (
        <div className="mt-3 p-3 bg-success-50 border border-success-200 rounded-lg flex items-center gap-2 text-success-800">
          <svg className="w-5 h-5 text-success-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium">{showSuccess}</span>
        </div>
      )}

      {state.error && (
        <p className="text-red-500 text-sm mt-2">{state.error}</p>
      )}

      {!state.configured && (
        <p className="text-amber-600 text-xs mt-1">
          Demo mode: Plaid not configured. Using mock data.
        </p>
      )}
    </div>
  )
}

/**
 * Connected Bank Account Display Component
 */
type ConnectedAccountsProps = {
  connection: ConnectedBankAccount
  onDisconnect: () => void
  loading?: boolean
}

export function ConnectedAccounts({
  connection,
  onDisconnect,
  loading = false,
}: ConnectedAccountsProps) {
  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '---'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const getVerificationBadge = (status: PlaidAccount['verification_status']) => {
    if (status === 'automatically_verified' || status === 'manually_verified') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
          Verified
        </span>
      )
    }
    if (status?.includes('pending')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
          Pending
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
        Connected
      </span>
    )
  }

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{connection.institutionName}</h4>
            <p className="text-xs text-gray-500">
              Connected {new Date(connection.connectedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onDisconnect}
          disabled={loading}
          className="text-sm text-red-600 hover:text-red-800 hover:underline disabled:opacity-50"
        >
          {loading ? 'Disconnecting...' : 'Disconnect'}
        </button>
      </div>

      <div className="space-y-2">
        {connection.accounts.map((account) => (
          <div
            key={account.account_id}
            className="flex justify-between items-center p-2 bg-gray-50 rounded"
          >
            <div className="flex items-center gap-3">
              <div className="text-sm">
                <p className="font-medium text-gray-800">
                  {account.name}
                  {account.mask && <span className="text-gray-500 ml-1">****{account.mask}</span>}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {account.subtype || account.type}
                </p>
              </div>
              {getVerificationBadge(account.verification_status)}
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">
                {formatCurrency(account.balances?.current ?? 0)}
              </p>
              {account.balances?.available != null && account.balances.available !== account.balances.current && (
                <p className="text-xs text-gray-500">
                  Available: {formatCurrency(account.balances.available)}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {connection.incomeVerified && connection.verifiedAnnualIncome && (
        <div className="mt-4 pt-3 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                Income Verified
              </span>
              <span className="text-sm text-gray-600">Annual Income</span>
            </div>
            <span className="font-bold text-lg text-green-700">
              {formatCurrency(connection.verifiedAnnualIncome)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Bank Connection Section Component
 * Combines the connect button and connected accounts display
 */
type BankConnectionSectionProps = {
  userId: string
  connection: ConnectedBankAccount | null
  onConnect: (data: ConnectedBankAccount) => void
  onDisconnect: () => void
  loading?: boolean
}

export function BankConnectionSection({
  userId,
  connection,
  onConnect,
  onDisconnect,
  loading = false,
}: BankConnectionSectionProps) {
  if (connection) {
    return (
      <ConnectedAccounts
        connection={connection}
        onDisconnect={onDisconnect}
        loading={loading}
      />
    )
  }

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </div>
      <h4 className="text-lg font-semibold text-gray-900 mb-1">Verify Income Instantly</h4>
      <p className="text-sm text-gray-600 mb-4">
        Connect your bank to automatically verify your income and employment.
      </p>
      <PlaidLinkButton userId={userId} onSuccess={onConnect} disabled={loading}>
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Connect Bank Account
        </span>
      </PlaidLinkButton>
      <p className="text-xs text-gray-500 mt-3">
        Secure connection powered by Plaid. Your credentials are never stored.
      </p>
    </div>
  )
}
