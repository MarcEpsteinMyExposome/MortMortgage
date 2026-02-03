import type { NextApiRequest, NextApiResponse } from 'next'
import { simulateCreditPull, CreditReport, CreditPullRequest } from '../../../lib/integrations/credit'

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<CreditReport | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { ssn, firstName, lastName, dateOfBirth, currentAddress } = req.body as CreditPullRequest

    // Validate required fields
    if (!ssn || !firstName || !lastName) {
      return res.status(400).json({ error: 'SSN, first name, and last name are required' })
    }

    // Simulate credit pull
    const result = simulateCreditPull({
      ssn,
      firstName,
      lastName,
      dateOfBirth: dateOfBirth || '',
      currentAddress: currentAddress || { street: '', city: '', state: '', zip: '' }
    })

    res.status(200).json(result)
  } catch (error: any) {
    console.error('Credit pull error:', error)
    res.status(500).json({ error: error.message || 'Credit pull failed' })
  }
}
