import type { NextApiRequest, NextApiResponse } from 'next'
import { createLinkToken, isPlaidConfigured } from '../../../lib/integrations/plaid'
import { Products } from 'plaid'

type SuccessResponse = {
  link_token: string
  expiration: string
  configured: boolean
}

type ErrorResponse = {
  error: string
  configured: boolean
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', configured: false })
  }

  // Check if Plaid is configured
  if (!isPlaidConfigured()) {
    // Return a mock link token for demo purposes when Plaid is not configured
    return res.status(200).json({
      link_token: 'mock-link-token-for-demo',
      expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
      configured: false,
    })
  }

  try {
    const { userId } = req.body

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required', configured: true })
    }

    // Create link token with auth and identity products
    // Income verification requires additional setup
    const result = await createLinkToken(userId, [Products.Auth, Products.Identity])

    if ('error' in result) {
      return res.status(500).json({ error: result.error, configured: true })
    }

    return res.status(200).json({
      ...result,
      configured: true,
    })
  } catch (error: any) {
    console.error('Create link token error:', error)
    return res.status(500).json({
      error: error.message || 'Failed to create link token',
      configured: true,
    })
  }
}
