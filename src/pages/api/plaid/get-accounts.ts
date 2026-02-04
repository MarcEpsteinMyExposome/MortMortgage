import type { NextApiRequest, NextApiResponse } from 'next'
import {
  getAccounts,
  removeItem,
  isPlaidConfigured,
  getMockPlaidData,
  PlaidAccount,
  PlaidInstitution,
} from '../../../lib/integrations/plaid'

type GetAccountsResponse = {
  success: boolean
  accounts: PlaidAccount[]
  institution: PlaidInstitution | null
  error?: string
}

type RemoveResponse = {
  success: boolean
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GetAccountsResponse | RemoveResponse>
) {
  if (req.method === 'GET') {
    // Fetch accounts
    const { access_token } = req.query

    if (!access_token || typeof access_token !== 'string') {
      return res.status(400).json({
        success: false,
        accounts: [],
        institution: null,
        error: 'Access token is required',
      })
    }

    // Mock response for demo when Plaid is not configured
    if (!isPlaidConfigured() || access_token === 'mock-access-token') {
      const mockData = getMockPlaidData()
      return res.status(200).json({
        success: true,
        accounts: mockData.accounts,
        institution: {
          institution_id: mockData.institutionId || 'mock-inst',
          name: mockData.institutionName,
        },
      })
    }

    try {
      const result = await getAccounts(access_token)
      return res.status(200).json(result)
    } catch (error: any) {
      console.error('Get accounts error:', error)
      return res.status(500).json({
        success: false,
        accounts: [],
        institution: null,
        error: error.message || 'Failed to fetch accounts',
      })
    }
  } else if (req.method === 'DELETE') {
    // Remove/disconnect bank
    const { access_token } = req.body

    if (!access_token || typeof access_token !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Access token is required',
      })
    }

    // Mock response for demo
    if (!isPlaidConfigured() || access_token === 'mock-access-token') {
      return res.status(200).json({ success: true })
    }

    try {
      const result = await removeItem(access_token)
      return res.status(200).json(result)
    } catch (error: any) {
      console.error('Remove item error:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to disconnect bank',
      })
    }
  } else {
    return res.status(405).json({
      success: false,
      accounts: [],
      institution: null,
      error: 'Method not allowed',
    })
  }
}
