/**
 * Mock Automated Valuation Model (AVM) Integration
 *
 * Simulates property valuation for demo purposes.
 * Returns deterministic results based on property characteristics.
 */

export type PropertyType = 'SingleFamily' | 'Condo' | 'Townhouse' | 'MultiFamily' | 'PUD'

export type ComparableSale = {
  address: string
  salePrice: number
  saleDate: string
  squareFeet: number
  bedrooms: number
  bathrooms: number
  distance: number // miles from subject
  adjustedPrice: number
}

export type AVMConfidence = 'High' | 'Medium' | 'Low'

export type AVMResult = {
  success: boolean
  referenceNumber: string
  valuationDate: string
  property: {
    address: string
    city: string
    state: string
    zip: string
    propertyType: PropertyType
  }
  valuation: {
    estimatedValue: number
    lowRange: number
    highRange: number
    confidenceScore: number
    confidence: AVMConfidence
    pricePerSqFt: number
  }
  comparables: ComparableSale[]
  marketTrends: {
    yearOverYearChange: number
    monthOverMonthChange: number
    medianDaysOnMarket: number
    inventoryLevel: 'Low' | 'Normal' | 'High'
  }
  propertyDetails: {
    squareFeet: number
    lotSize: number
    yearBuilt: number
    bedrooms: number
    bathrooms: number
  }
  notes: string[]
}

export type AVMRequest = {
  address: string
  city: string
  state: string
  zip: string
  propertyType: PropertyType
  purchasePrice?: number
  squareFeet?: number
  bedrooms?: number
  bathrooms?: number
  yearBuilt?: number
}

/**
 * Base price per square foot by state (simplified)
 */
const STATE_BASE_PRICES: Record<string, number> = {
  CA: 550, NY: 450, TX: 180, FL: 280, WA: 400,
  CO: 350, AZ: 280, MA: 420, IL: 200, GA: 220,
  NC: 200, PA: 180, NJ: 320, VA: 280, OH: 150,
  // Default for other states
  DEFAULT: 200
}

/**
 * Property type multiplier
 */
const PROPERTY_TYPE_MULTIPLIER: Record<PropertyType, number> = {
  SingleFamily: 1.0,
  Townhouse: 0.9,
  Condo: 0.85,
  PUD: 0.95,
  MultiFamily: 1.1
}

/**
 * Generate a deterministic but realistic valuation
 */
function calculateValuation(request: AVMRequest): { value: number; confidence: AVMConfidence; confidenceScore: number } {
  const basePrice = STATE_BASE_PRICES[request.state] || STATE_BASE_PRICES.DEFAULT
  const typeMultiplier = PROPERTY_TYPE_MULTIPLIER[request.propertyType]
  const sqFt = request.squareFeet || 1800

  // Base value
  let value = basePrice * typeMultiplier * sqFt

  // Adjust for age (newer = slightly higher)
  if (request.yearBuilt) {
    const age = new Date().getFullYear() - request.yearBuilt
    if (age < 5) value *= 1.05
    else if (age < 10) value *= 1.02
    else if (age > 50) value *= 0.95
  }

  // Adjust for bedrooms/bathrooms
  const beds = request.bedrooms || 3
  const baths = request.bathrooms || 2
  if (beds >= 4) value *= 1.05
  if (baths >= 3) value *= 1.03

  // Round to nearest $1000
  value = Math.round(value / 1000) * 1000

  // Determine confidence based on available data
  let confidenceScore = 70
  if (request.squareFeet) confidenceScore += 10
  if (request.yearBuilt) confidenceScore += 5
  if (request.bedrooms && request.bathrooms) confidenceScore += 10

  const confidence: AVMConfidence =
    confidenceScore >= 90 ? 'High' :
    confidenceScore >= 75 ? 'Medium' : 'Low'

  return { value, confidence, confidenceScore }
}

/**
 * Generate comparable sales
 */
function generateComparables(baseValue: number, sqFt: number, beds: number, baths: number): ComparableSale[] {
  const streets = ['Oak St', 'Maple Ave', 'Pine Dr', 'Cedar Ln', 'Elm Way']
  const comparables: ComparableSale[] = []

  for (let i = 0; i < 4; i++) {
    const variance = (Math.random() * 0.2 - 0.1) // -10% to +10%
    const sqFtVariance = Math.floor(Math.random() * 400 - 200) // -200 to +200
    const compSqFt = Math.max(1000, sqFt + sqFtVariance)
    const compPrice = Math.round((baseValue * (1 + variance)) / 1000) * 1000

    // Generate a date within the last 6 months
    const daysAgo = Math.floor(Math.random() * 180)
    const saleDate = new Date()
    saleDate.setDate(saleDate.getDate() - daysAgo)

    comparables.push({
      address: `${100 + i * 20 + Math.floor(Math.random() * 10)} ${streets[i]}`,
      salePrice: compPrice,
      saleDate: saleDate.toISOString().split('T')[0],
      squareFeet: compSqFt,
      bedrooms: beds + (Math.random() > 0.7 ? 1 : 0) - (Math.random() > 0.7 ? 1 : 0),
      bathrooms: baths + (Math.random() > 0.8 ? 0.5 : 0),
      distance: Math.round((0.2 + Math.random() * 1.5) * 10) / 10,
      adjustedPrice: Math.round((compPrice * (sqFt / compSqFt)) / 1000) * 1000
    })
  }

  return comparables.sort((a, b) => a.distance - b.distance)
}

/**
 * Simulate property valuation (AVM)
 */
export function getPropertyValuation(request: AVMRequest): AVMResult {
  const { value, confidence, confidenceScore } = calculateValuation(request)

  // Range is tighter for higher confidence
  const rangePercent = confidence === 'High' ? 0.05 : confidence === 'Medium' ? 0.08 : 0.12
  const lowRange = Math.round((value * (1 - rangePercent)) / 1000) * 1000
  const highRange = Math.round((value * (1 + rangePercent)) / 1000) * 1000

  const sqFt = request.squareFeet || 1800
  const beds = request.bedrooms || 3
  const baths = request.bathrooms || 2

  const comparables = generateComparables(value, sqFt, beds, baths)

  const notes: string[] = []
  notes.push(`Valuation based on ${comparables.length} comparable sales within 2 miles.`)
  notes.push(`Market activity indicates ${confidence.toLowerCase()} confidence level.`)

  if (request.purchasePrice) {
    const priceDiff = ((value - request.purchasePrice) / request.purchasePrice) * 100
    if (priceDiff > 5) {
      notes.push(`Estimated value is ${priceDiff.toFixed(1)}% above purchase price - favorable.`)
    } else if (priceDiff < -5) {
      notes.push(`Estimated value is ${Math.abs(priceDiff).toFixed(1)}% below purchase price - may require review.`)
    } else {
      notes.push(`Estimated value is within 5% of purchase price - reasonable.`)
    }
  }

  // Market trends (simulated based on state)
  const marketTrends = {
    yearOverYearChange: STATE_BASE_PRICES[request.state] >= 350 ? 8.5 : 5.2,
    monthOverMonthChange: 0.4,
    medianDaysOnMarket: STATE_BASE_PRICES[request.state] >= 350 ? 14 : 28,
    inventoryLevel: (STATE_BASE_PRICES[request.state] >= 350 ? 'Low' : 'Normal') as 'Low' | 'Normal' | 'High'
  }

  return {
    success: true,
    referenceNumber: `AVM-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    valuationDate: new Date().toISOString(),
    property: {
      address: request.address,
      city: request.city,
      state: request.state,
      zip: request.zip,
      propertyType: request.propertyType
    },
    valuation: {
      estimatedValue: value,
      lowRange,
      highRange,
      confidenceScore,
      confidence,
      pricePerSqFt: Math.round(value / sqFt)
    },
    comparables,
    marketTrends,
    propertyDetails: {
      squareFeet: sqFt,
      lotSize: sqFt * 3, // Rough estimate
      yearBuilt: request.yearBuilt || 2000,
      bedrooms: beds,
      bathrooms: baths
    },
    notes
  }
}

/**
 * Calculate Loan-to-Value ratio
 */
export function calculateLTV(loanAmount: number, propertyValue: number): { ltv: number; riskLevel: string } {
  const ltv = Math.round((loanAmount / propertyValue) * 1000) / 10 // One decimal place

  let riskLevel: string
  if (ltv <= 80) riskLevel = 'Low - No PMI required'
  else if (ltv <= 90) riskLevel = 'Moderate - PMI required'
  else if (ltv <= 95) riskLevel = 'Elevated - Higher PMI'
  else if (ltv <= 97) riskLevel = 'High - Maximum conventional'
  else riskLevel = 'Exceeds conventional limits'

  return { ltv, riskLevel }
}

/**
 * Check if property value supports the loan
 */
export function validatePropertyValue(
  purchasePrice: number,
  appraisedValue: number,
  loanAmount: number
): { valid: boolean; usableValue: number; ltv: number; notes: string[] } {
  // Use lower of purchase price or appraised value
  const usableValue = Math.min(purchasePrice, appraisedValue)
  const { ltv } = calculateLTV(loanAmount, usableValue)

  const notes: string[] = []
  let valid = true

  if (appraisedValue < purchasePrice) {
    notes.push(`Appraised value ($${appraisedValue.toLocaleString()}) is below purchase price ($${purchasePrice.toLocaleString()}).`)
    notes.push('Loan amount will be based on appraised value.')
  }

  if (ltv > 97) {
    valid = false
    notes.push('LTV exceeds 97% - does not meet conventional loan requirements.')
  } else if (ltv > 95) {
    notes.push('LTV exceeds 95% - limited loan program options.')
  } else if (ltv > 80) {
    notes.push('LTV exceeds 80% - Private Mortgage Insurance (PMI) required.')
  }

  return { valid, usableValue, ltv, notes }
}
