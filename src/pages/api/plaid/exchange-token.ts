import type { NextApiRequest, NextApiResponse } from 'next'
import {
  exchangePublicToken,
  isPlaidConfigured,
  getMockPlaidData,
  ConnectedBankAccount,
} from '../../../lib/integrations/plaid'

type SuccessResponse = {
  success: true
  data: ConnectedBankAccount
}

type ErrorResponse = {
  success: false
  error: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const { public_token } = req.body

  if (!public_token) {
    return res.status(400).json({ success: false, error: 'Public token is required' })
  }

  // If Plaid is not configured, return mock data for demo
  if (!isPlaidConfigured() || public_token === 'mock-public-token') {
    const mockData = getMockPlaidData()
    return res.status(200).json({
      success: true,
      data: mockData,
    })
  }

  try {
    const result = await exchangePublicToken(public_token)

    if (!result.success || result.error) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to exchange token',
      })
    }

    // Build connected account response
    const connectedAccount: ConnectedBankAccount = {
      itemId: result.item_id || '',
      accessToken: result.access_token || '', // In production, store securely and don't return to client
      institutionId: result.institution?.institution_id || null,
      institutionName: result.institution?.name || 'Unknown Bank',
      accounts: result.accounts,
      incomeVerified: result.income?.verified || false,
      verifiedAnnualIncome: result.income?.annual_income || null,
      connectedAt: new Date().toISOString(),
    }

    // Note: In production, you would:
    // 1. Store access_token securely in database (encrypted)
    // 2. NOT return access_token to the client
    // 3. Use item_id as the client reference
    // For this demo, we return everything for simplicity

    return res.status(200).json({
      success: true,
      data: connectedAccount,
    })
  } catch (error: any) {
    console.error('Exchange token error:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to exchange token',
    })
  }
}
