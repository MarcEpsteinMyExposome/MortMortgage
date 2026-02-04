/**
 * Form validation for URLA wizard steps
 * Provides step-specific validation before allowing navigation
 */

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

function validateSingleBorrowerIdentity(borrower: any, label: string): { errors: string[], warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []
  const name = borrower.name || {}

  if (!name.firstName?.trim()) errors.push(`${label}: First name is required`)
  if (!name.lastName?.trim()) errors.push(`${label}: Last name is required`)
  if (!borrower.citizenship) errors.push(`${label}: Citizenship status is required`)

  if (borrower.ssn && !/^\d{3}-\d{2}-\d{4}$/.test(borrower.ssn)) {
    errors.push(`${label}: SSN must be in XXX-XX-XXXX format`)
  }

  if (!borrower.dob) warnings.push(`${label}: Date of birth not provided`)
  if (!borrower.contact?.email) warnings.push(`${label}: Email not provided`)

  return { errors, warnings }
}

export function validateIdentityStep(data: any): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const hasCoBorrower = data.borrowers?.length > 1

  // Validate primary borrower
  const primary = validateSingleBorrowerIdentity(data.borrowers?.[0] || {}, hasCoBorrower ? 'Primary Borrower' : 'Borrower')
  errors.push(...primary.errors)
  warnings.push(...primary.warnings)

  // Validate co-borrower if present
  if (hasCoBorrower) {
    const coBorrowerResult = validateSingleBorrowerIdentity(data.borrowers?.[1] || {}, 'Co-Borrower')
    errors.push(...coBorrowerResult.errors)
    warnings.push(...coBorrowerResult.warnings)
  }

  return { valid: errors.length === 0, errors, warnings }
}

function validateSingleBorrowerAddress(borrower: any, label: string): { errors: string[], warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []
  const currentAddress = borrower.currentAddress || {}
  const address = currentAddress.address || {}

  if (!address.street?.trim()) errors.push(`${label}: Street address is required`)
  if (!address.city?.trim()) errors.push(`${label}: City is required`)
  if (!address.state) errors.push(`${label}: State is required`)
  if (!address.zip?.trim()) errors.push(`${label}: ZIP code is required`)
  else if (!/^\d{5}(-\d{4})?$/.test(address.zip)) errors.push(`${label}: Invalid ZIP format`)

  if (!currentAddress.housingType) errors.push(`${label}: Housing type is required`)
  if (currentAddress.housingType === 'rent' && !currentAddress.monthlyRent) {
    errors.push(`${label}: Monthly rent is required`)
  }

  const totalMonths = ((currentAddress.durationYears || 0) * 12) + (currentAddress.durationMonths || 0)
  if (totalMonths < 24) {
    warnings.push(`${label}: Less than 2 years at current address - previous address may be required`)
  }

  return { errors, warnings }
}

export function validateAddressStep(data: any): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const hasCoBorrower = data.borrowers?.length > 1

  // Validate primary borrower
  const primary = validateSingleBorrowerAddress(data.borrowers?.[0] || {}, hasCoBorrower ? 'Primary Borrower' : 'Borrower')
  errors.push(...primary.errors)
  warnings.push(...primary.warnings)

  // Validate co-borrower if present
  if (hasCoBorrower) {
    const coBorrowerResult = validateSingleBorrowerAddress(data.borrowers?.[1] || {}, 'Co-Borrower')
    errors.push(...coBorrowerResult.errors)
    warnings.push(...coBorrowerResult.warnings)
  }

  return { valid: errors.length === 0, errors, warnings }
}

export function validateMilitaryStep(data: any): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const borrower = data.borrowers?.[0] || {}
  const military = borrower.militaryService || {}

  if (!military.status) {
    errors.push('Military service status is required')
  }

  if (military.status === 'expired_less_than_90_days' && !military.expectedCompletionDate) {
    warnings.push('Expected completion date recommended for active duty expiring soon')
  }

  return { valid: errors.length === 0, errors, warnings }
}

function validateSingleBorrowerEmployment(borrower: any, label: string): { errors: string[], warnings: string[], totalIncome: number } {
  const errors: string[] = []
  const warnings: string[] = []
  const employment = Array.isArray(borrower.employment) ? borrower.employment : []

  if (employment.length === 0) {
    errors.push(`${label}: At least one employment record is required`)
    return { errors, warnings, totalIncome: 0 }
  }

  const currentEmployment = employment.find((e: any) => e.current)
  if (!currentEmployment) {
    errors.push(`${label}: Current employment is required`)
  } else {
    if (!currentEmployment.employerName?.trim()) errors.push(`${label}: Employer name is required`)
    if (!currentEmployment.monthlyIncome || currentEmployment.monthlyIncome <= 0) {
      errors.push(`${label}: Monthly income is required`)
    }
  }

  const totalIncome = employment
    .filter((e: any) => e.current)
    .reduce((sum: number, e: any) => sum + (e.monthlyIncome || 0), 0)

  return { errors, warnings, totalIncome }
}

export function validateEmploymentStep(data: any): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const hasCoBorrower = data.borrowers?.length > 1

  // Validate primary borrower
  const primary = validateSingleBorrowerEmployment(data.borrowers?.[0] || {}, hasCoBorrower ? 'Primary Borrower' : 'Borrower')
  errors.push(...primary.errors)
  warnings.push(...primary.warnings)

  // Validate co-borrower if present
  let coBorrowerIncome = 0
  if (hasCoBorrower) {
    const coBorrowerResult = validateSingleBorrowerEmployment(data.borrowers?.[1] || {}, 'Co-Borrower')
    errors.push(...coBorrowerResult.errors)
    warnings.push(...coBorrowerResult.warnings)
    coBorrowerIncome = coBorrowerResult.totalIncome
  }

  // Combined income warning
  const totalCombinedIncome = primary.totalIncome + coBorrowerIncome
  if (totalCombinedIncome < 1000) {
    warnings.push('Combined monthly income appears low for mortgage qualification')
  }

  return { valid: errors.length === 0, errors, warnings }
}

export function validateAssetsStep(data: any): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const assets = Array.isArray(data.assets?.assets) ? data.assets.assets : []

  // Assets are optional but recommended
  if (assets.length === 0) {
    warnings.push('No assets listed - this may affect loan qualification')
  }

  const totalAssets = assets.reduce((sum: number, a: any) => sum + (a.balance || 0), 0)
  const loanAmount = data.loan?.loanAmount || 0
  const downPayment = data.loan?.downPayment?.amount || 0

  if (loanAmount > 0 && totalAssets < downPayment) {
    warnings.push('Total assets are less than down payment amount')
  }

  return { valid: errors.length === 0, errors, warnings }
}

export function validateLiabilitiesStep(data: any): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const liabilities = Array.isArray(data.liabilities?.liabilities) ? data.liabilities.liabilities : []

  // Liabilities are optional
  const monthlyDebt = liabilities.reduce((sum: number, l: any) => sum + (l.monthlyPayment || 0), 0)
  const borrowerEmployment = data.borrowers?.[0]?.employment
  const employment = Array.isArray(borrowerEmployment) ? borrowerEmployment : []
  const monthlyIncome = employment
    .filter((e: any) => e.current)
    .reduce((sum: number, e: any) => sum + (e.monthlyIncome || 0), 0)

  if (monthlyIncome > 0 && monthlyDebt > 0) {
    const dti = (monthlyDebt / monthlyIncome) * 100
    if (dti > 43) {
      warnings.push(`Debt-to-income ratio (${dti.toFixed(1)}%) exceeds 43% guideline`)
    }
  }

  return { valid: errors.length === 0, errors, warnings }
}

export function validatePropertyStep(data: any): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const property = data.property || {}
  const address = property.address || {}

  if (!address.street?.trim()) errors.push('Property street address is required')
  if (!address.city?.trim()) errors.push('Property city is required')
  if (!address.state) errors.push('Property state is required')
  if (!address.zip?.trim()) errors.push('Property ZIP code is required')
  else if (!/^\d{5}(-\d{4})?$/.test(address.zip)) errors.push('Invalid ZIP format')

  if (!property.propertyType) errors.push('Property type is required')
  if (!property.propertyValue || property.propertyValue <= 0) {
    errors.push('Property value is required')
  }
  if (!property.occupancy) errors.push('Occupancy type is required')

  return { valid: errors.length === 0, errors, warnings }
}

export function validateLoanStep(data: any): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const loan = data.loan || {}
  const property = data.property || {}

  if (!loan.loanPurpose) errors.push('Loan purpose is required')
  if (!loan.loanType) errors.push('Loan type is required')
  if (!loan.loanAmount || loan.loanAmount <= 0) errors.push('Loan amount is required')

  if (loan.loanAmount && property.propertyValue) {
    const ltv = (loan.loanAmount / property.propertyValue) * 100
    if (ltv > 97) {
      errors.push('LTV cannot exceed 97%')
    } else if (ltv > 80) {
      warnings.push('LTV over 80% - PMI may be required')
    }
  }

  const downPayment = loan.downPayment?.amount || 0
  if (property.propertyValue && loan.loanAmount) {
    const expectedDown = property.propertyValue - loan.loanAmount
    if (Math.abs(downPayment - expectedDown) > 1000) {
      warnings.push('Down payment does not match difference between property value and loan amount')
    }
  }

  return { valid: errors.length === 0, errors, warnings }
}

export function validateDeclarationsStep(data: any): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const declarations = data.declarations?.declarations || {}

  // Check for any "yes" answers that may need explanation
  const riskFactors = [
    'outstandingJudgments',
    'delinquentFederalDebt',
    'declaredBankruptcy',
    'propertyForeclosed',
    'conveyedTitleInLieu'
  ]

  const activeRisks = riskFactors.filter(key => declarations[key] === true)
  if (activeRisks.length > 0) {
    warnings.push(`${activeRisks.length} declaration(s) may require additional documentation`)
  }

  return { valid: errors.length === 0, errors, warnings }
}

export function validateDemographicsStep(data: any): ValidationResult {
  // Demographics are optional per HMDA
  return { valid: true, errors: [], warnings: [] }
}

export function validateDocumentsStep(data: any): ValidationResult {
  // Documents are handled separately via file upload
  // This just returns valid since docs are checked in the component
  return { valid: true, errors: [], warnings: [] }
}

export function validateRealEstateStep(data: any): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const properties = data.realEstate?.propertiesOwned || []

  // Real estate owned is optional, but if provided should have valid data
  properties.forEach((prop: any, index: number) => {
    if (prop.address && !prop.address.street?.trim()) {
      errors.push(`Property ${index + 1}: Street address required`)
    }
    if (!prop.propertyValue || prop.propertyValue <= 0) {
      errors.push(`Property ${index + 1}: Property value required`)
    }
    if (!prop.status) {
      errors.push(`Property ${index + 1}: Status required`)
    }
  })

  return { valid: errors.length === 0, errors, warnings }
}

// Map step IDs to validators
const STEP_VALIDATORS: Record<string, (data: any) => ValidationResult> = {
  identity: validateIdentityStep,
  address: validateAddressStep,
  military: validateMilitaryStep,
  employment: validateEmploymentStep,
  realEstate: validateRealEstateStep,
  assets: validateAssetsStep,
  liabilities: validateLiabilitiesStep,
  property: validatePropertyStep,
  loan: validateLoanStep,
  declarations: validateDeclarationsStep,
  demographics: validateDemographicsStep,
  documents: validateDocumentsStep
}

export function validateStep(stepId: string, data: any): ValidationResult {
  const validator = STEP_VALIDATORS[stepId]
  if (!validator) {
    return { valid: true, errors: [], warnings: [] }
  }
  return validator(data)
}

export function validateAllSteps(data: any): { stepId: string; result: ValidationResult }[] {
  return Object.keys(STEP_VALIDATORS).map(stepId => ({
    stepId,
    result: validateStep(stepId, data)
  }))
}

export function isApplicationComplete(data: any): boolean {
  const results = validateAllSteps(data)
  return results.every(r => r.result.valid)
}
