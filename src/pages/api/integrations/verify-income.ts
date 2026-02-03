import type { NextApiRequest, NextApiResponse } from 'next'
import { verifyIncome, IncomeVerification, IncomeVerificationRequest } from '../../../lib/integrations/income'

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<IncomeVerification | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      employerName,
      employerPhone,
      employerAddress,
      jobTitle,
      startDate,
      statedAnnualIncome,
      employmentType,
      borrowerName,
      ssn
    } = req.body as IncomeVerificationRequest

    // Validate required fields
    if (!employerName || !jobTitle || !statedAnnualIncome || !ssn) {
      return res.status(400).json({
        error: 'Employer name, job title, stated income, and SSN are required'
      })
    }

    // Simulate income verification
    const result = verifyIncome({
      employerName,
      employerPhone,
      employerAddress,
      jobTitle,
      startDate: startDate || new Date().toISOString().split('T')[0],
      statedAnnualIncome: Number(statedAnnualIncome),
      employmentType: employmentType || 'Full-Time',
      borrowerName: borrowerName || '',
      ssn
    })

    res.status(200).json(result)
  } catch (error: any) {
    console.error('Income verification error:', error)
    res.status(500).json({ error: error.message || 'Income verification failed' })
  }
}
