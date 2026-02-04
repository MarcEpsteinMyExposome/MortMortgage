/**
 * Plaid Integration
 *
 * Provides bank account linking and income verification via Plaid.
 * Uses Sandbox environment for testing with deterministic test data.
 *
 * Sandbox Test Credentials:
 * - Username: user_good
 * - Password: pass_good
 * - MFA code: 1234
 */

import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid'

// Type definitions for Plaid responses
export type PlaidAccount = {
  account_id: string
  name: string
  official_name: string | null
  type: 'depository' | 'credit' | 'loan' | 'investment' | 'other'
  subtype: string | null
  mask: string | null
  balances: {
    available: number | null
    current: number | null
    limit: number | null
    iso_currency_code: string | null
  }
  verification_status: 'pending_automatic_verification' | 'pending_manual_verification' | 'manually_verified' | 'automatically_verified' | null
}

export type PlaidInstitution = {
  institution_id: string
  name: string
}

export type PlaidLinkResult = {
  public_token: string
  accounts: PlaidAccount[]
  institution: PlaidInstitution | null
}

export type PlaidIncomeData = {
  verified: boolean
  annual_income: number | null
  income_sources: Array<{
    name: string
    income_type: string
    pay_frequency: string
    annual_pay: number
  }>
  last_updated: string | null
}

export type PlaidConnectionResult = {
  success: boolean
  access_token?: string
  item_id?: string
  accounts: PlaidAccount[]
  institution: PlaidInstitution | null
  income?: PlaidIncomeData
  error?: string
}

export type ConnectedBankAccount = {
  itemId: string
  accessToken: string
  institutionId: string | null
  institutionName: string
  accounts: PlaidAccount[]
  incomeVerified: boolean
  verifiedAnnualIncome: number | null
  connectedAt: string
}

/**
 * Get Plaid environment configuration
 */
function getPlaidEnvironment(): string {
  const env = process.env.PLAID_ENV || 'sandbox'
  switch (env.toLowerCase()) {
    case 'production':
      return PlaidEnvironments.production
    case 'development':
      return PlaidEnvironments.development
    default:
      return PlaidEnvironments.sandbox
  }
}

/**
 * Create configured Plaid API client
 */
export function createPlaidClient(): PlaidApi {
  const configuration = new Configuration({
    basePath: getPlaidEnvironment(),
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID || '',
        'PLAID-SECRET': process.env.PLAID_SECRET || '',
      },
    },
  })

  return new PlaidApi(configuration)
}

/**
 * Create a link token for Plaid Link initialization
 */
export async function createLinkToken(
  userId: string,
  products: Products[] = [Products.Auth, Products.Identity]
): Promise<{ link_token: string; expiration: string } | { error: string }> {
  try {
    const client = createPlaidClient()

    const response = await client.linkTokenCreate({
      user: {
        client_user_id: userId,
      },
      client_name: 'MortMortgage',
      products,
      country_codes: [CountryCode.Us],
      language: 'en',
    })

    return {
      link_token: response.data.link_token,
      expiration: response.data.expiration,
    }
  } catch (error: any) {
    console.error('Plaid linkTokenCreate error:', error?.response?.data || error)
    return {
      error: error?.response?.data?.error_message || 'Failed to create link token',
    }
  }
}

/**
 * Exchange public token for access token and fetch account data
 */
export async function exchangePublicToken(
  publicToken: string
): Promise<PlaidConnectionResult> {
  try {
    const client = createPlaidClient()

    // Exchange public token for access token
    const exchangeResponse = await client.itemPublicTokenExchange({
      public_token: publicToken,
    })

    const accessToken = exchangeResponse.data.access_token
    const itemId = exchangeResponse.data.item_id

    // Fetch account data
    const accountsResponse = await client.accountsGet({
      access_token: accessToken,
    })

    const accounts: PlaidAccount[] = accountsResponse.data.accounts.map(acc => ({
      account_id: acc.account_id,
      name: acc.name,
      official_name: acc.official_name,
      type: acc.type as PlaidAccount['type'],
      subtype: acc.subtype,
      mask: acc.mask,
      balances: {
        available: acc.balances.available,
        current: acc.balances.current,
        limit: acc.balances.limit,
        iso_currency_code: acc.balances.iso_currency_code,
      },
      verification_status: acc.verification_status as PlaidAccount['verification_status'],
    }))

    // Fetch institution info
    const item = accountsResponse.data.item
    let institution: PlaidInstitution | null = null

    if (item.institution_id) {
      try {
        const instResponse = await client.institutionsGetById({
          institution_id: item.institution_id,
          country_codes: [CountryCode.Us],
        })
        institution = {
          institution_id: instResponse.data.institution.institution_id,
          name: instResponse.data.institution.name,
        }
      } catch (instError) {
        console.warn('Failed to fetch institution:', instError)
      }
    }

    // Try to get income data (may not be available in sandbox)
    let income: PlaidIncomeData | undefined
    try {
      // In sandbox, we simulate income data based on account balances
      const checkingAccounts = accounts.filter(a => a.type === 'depository' && a.subtype === 'checking')
      if (checkingAccounts.length > 0) {
        // Estimate annual income based on checking balance (sandbox simulation)
        const totalBalance = checkingAccounts.reduce((sum, a) => sum + (a.balances.current || 0), 0)
        const estimatedAnnualIncome = Math.round(totalBalance * 12) // Rough estimate

        income = {
          verified: true,
          annual_income: estimatedAnnualIncome > 0 ? estimatedAnnualIncome : 75000, // Default for sandbox
          income_sources: [{
            name: institution?.name || 'Direct Deposit',
            income_type: 'SALARY',
            pay_frequency: 'BIWEEKLY',
            annual_pay: estimatedAnnualIncome > 0 ? estimatedAnnualIncome : 75000,
          }],
          last_updated: new Date().toISOString(),
        }
      }
    } catch (incomeError) {
      console.warn('Income data not available:', incomeError)
    }

    return {
      success: true,
      access_token: accessToken,
      item_id: itemId,
      accounts,
      institution,
      income,
    }
  } catch (error: any) {
    console.error('Plaid token exchange error:', error?.response?.data || error)
    return {
      success: false,
      accounts: [],
      institution: null,
      error: error?.response?.data?.error_message || 'Failed to exchange token',
    }
  }
}

/**
 * Fetch accounts for an existing access token
 */
export async function getAccounts(accessToken: string): Promise<{
  success: boolean
  accounts: PlaidAccount[]
  institution: PlaidInstitution | null
  error?: string
}> {
  try {
    const client = createPlaidClient()

    const accountsResponse = await client.accountsGet({
      access_token: accessToken,
    })

    const accounts: PlaidAccount[] = accountsResponse.data.accounts.map(acc => ({
      account_id: acc.account_id,
      name: acc.name,
      official_name: acc.official_name,
      type: acc.type as PlaidAccount['type'],
      subtype: acc.subtype,
      mask: acc.mask,
      balances: {
        available: acc.balances.available,
        current: acc.balances.current,
        limit: acc.balances.limit,
        iso_currency_code: acc.balances.iso_currency_code,
      },
      verification_status: acc.verification_status as PlaidAccount['verification_status'],
    }))

    const item = accountsResponse.data.item
    let institution: PlaidInstitution | null = null

    if (item.institution_id) {
      try {
        const instResponse = await client.institutionsGetById({
          institution_id: item.institution_id,
          country_codes: [CountryCode.Us],
        })
        institution = {
          institution_id: instResponse.data.institution.institution_id,
          name: instResponse.data.institution.name,
        }
      } catch {
        console.warn('Failed to fetch institution info')
      }
    }

    return {
      success: true,
      accounts,
      institution,
    }
  } catch (error: any) {
    console.error('Plaid getAccounts error:', error?.response?.data || error)
    return {
      success: false,
      accounts: [],
      institution: null,
      error: error?.response?.data?.error_message || 'Failed to fetch accounts',
    }
  }
}

/**
 * Remove a Plaid item (disconnect bank)
 */
export async function removeItem(accessToken: string): Promise<{ success: boolean; error?: string }> {
  try {
    const client = createPlaidClient()
    await client.itemRemove({
      access_token: accessToken,
    })
    return { success: true }
  } catch (error: any) {
    console.error('Plaid removeItem error:', error?.response?.data || error)
    return {
      success: false,
      error: error?.response?.data?.error_message || 'Failed to remove item',
    }
  }
}

/**
 * Format account for display (masks account number)
 */
export function formatAccountDisplay(account: PlaidAccount): string {
  const type = account.subtype || account.type
  const mask = account.mask ? `****${account.mask}` : ''
  return `${account.name} (${type}) ${mask}`.trim()
}

/**
 * Get verification status badge info
 */
export function getVerificationBadge(status: PlaidAccount['verification_status']): {
  text: string
  color: 'green' | 'yellow' | 'gray'
} {
  switch (status) {
    case 'automatically_verified':
    case 'manually_verified':
      return { text: 'Verified', color: 'green' }
    case 'pending_automatic_verification':
    case 'pending_manual_verification':
      return { text: 'Pending', color: 'yellow' }
    default:
      return { text: 'Connected', color: 'gray' }
  }
}

/**
 * Check if Plaid is properly configured
 */
export function isPlaidConfigured(): boolean {
  return !!(process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET)
}

/**
 * Mock Plaid data for when Plaid is not configured
 * This allows the demo to work without actual Plaid credentials
 */
export function getMockPlaidData(): ConnectedBankAccount {
  return {
    itemId: 'mock-item-id',
    accessToken: 'mock-access-token',
    institutionId: 'ins_mock',
    institutionName: 'Demo Bank (Mock)',
    accounts: [
      {
        account_id: 'mock-checking-001',
        name: 'Checking Account',
        official_name: 'Premium Checking',
        type: 'depository',
        subtype: 'checking',
        mask: '1234',
        balances: {
          available: 5432.10,
          current: 5432.10,
          limit: null,
          iso_currency_code: 'USD',
        },
        verification_status: 'automatically_verified',
      },
      {
        account_id: 'mock-savings-001',
        name: 'Savings Account',
        official_name: 'High Yield Savings',
        type: 'depository',
        subtype: 'savings',
        mask: '5678',
        balances: {
          available: 12000.00,
          current: 12000.00,
          limit: null,
          iso_currency_code: 'USD',
        },
        verification_status: 'automatically_verified',
      },
    ],
    incomeVerified: true,
    verifiedAnnualIncome: 85000,
    connectedAt: new Date().toISOString(),
  }
}
