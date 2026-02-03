import type { NextApiRequest, NextApiResponse } from 'next'
import { calculatePricing, PricingResult, PricingRequest } from '../../../lib/integrations/pricing'

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<PricingResult | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      loanAmount,
      propertyValue,
      creditScore,
      loanType,
      loanPurpose,
      termMonths,
      propertyOccupancy,
      propertyType,
      state,
      isFirstTimeBuyer
    } = req.body as PricingRequest

    // Validate required fields
    if (!loanAmount || !propertyValue || !creditScore) {
      return res.status(400).json({
        error: 'Loan amount, property value, and credit score are required'
      })
    }

    // Validate LTV
    const ltv = (Number(loanAmount) / Number(propertyValue)) * 100
    if (ltv > 100) {
      return res.status(400).json({
        error: 'Loan amount cannot exceed property value'
      })
    }

    // Calculate pricing
    const result = calculatePricing({
      loanAmount: Number(loanAmount),
      propertyValue: Number(propertyValue),
      creditScore: Number(creditScore),
      loanType: loanType || 'Conventional',
      loanPurpose: loanPurpose || 'Purchase',
      termMonths: termMonths ? Number(termMonths) : 360,
      propertyOccupancy: propertyOccupancy || 'PrimaryResidence',
      propertyType: propertyType || 'SingleFamily',
      state: state || 'CA',
      isFirstTimeBuyer: Boolean(isFirstTimeBuyer)
    })

    res.status(200).json(result)
  } catch (error: any) {
    console.error('Pricing calculation error:', error)
    res.status(500).json({ error: error.message || 'Pricing calculation failed' })
  }
}
