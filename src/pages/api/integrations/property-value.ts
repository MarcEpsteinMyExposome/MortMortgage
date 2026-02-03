import type { NextApiRequest, NextApiResponse } from 'next'
import { getPropertyValuation, AVMResult, AVMRequest } from '../../../lib/integrations/avm'

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<AVMResult | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      address,
      city,
      state,
      zip,
      propertyType,
      purchasePrice,
      squareFeet,
      bedrooms,
      bathrooms,
      yearBuilt
    } = req.body as AVMRequest

    // Validate required fields
    if (!address || !city || !state || !zip) {
      return res.status(400).json({
        error: 'Address, city, state, and zip are required'
      })
    }

    // Simulate AVM
    const result = getPropertyValuation({
      address,
      city,
      state,
      zip,
      propertyType: propertyType || 'SingleFamily',
      purchasePrice: purchasePrice ? Number(purchasePrice) : undefined,
      squareFeet: squareFeet ? Number(squareFeet) : undefined,
      bedrooms: bedrooms ? Number(bedrooms) : undefined,
      bathrooms: bathrooms ? Number(bathrooms) : undefined,
      yearBuilt: yearBuilt ? Number(yearBuilt) : undefined
    })

    res.status(200).json(result)
  } catch (error: any) {
    console.error('Property valuation error:', error)
    res.status(500).json({ error: error.message || 'Property valuation failed' })
  }
}
