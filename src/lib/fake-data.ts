/**
 * Fake Data Generator
 * Generates random but properly formatted test data for form fields
 */

// Random number helper
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

// Random selection from array
export const randomChoice = <T>(arr: readonly T[]): T => arr[rand(0, arr.length - 1)]

// Name generators
export const fakeName = () => ({
  firstName: `FirstName_${rand(1, 100)}`,
  middleName: rand(1, 2) === 1 ? `Middle_${rand(1, 100)}` : '',
  lastName: `LastName_${rand(1, 100)}`,
  suffix: rand(1, 10) === 1 ? randomChoice(['Jr', 'Sr', 'II', 'III'] as const) : ''
})

// SSN generator (XXX-XX-XXXX format)
export const fakeSSN = () =>
  `${rand(100, 999)}-${rand(10, 99)}-${rand(1000, 9999)}`

// Date generators
export const fakeDOB = () => {
  const year = rand(1960, 2000)
  const month = String(rand(1, 12)).padStart(2, '0')
  const day = String(rand(1, 28)).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const fakePastDate = (yearsBack: number = 10) => {
  const currentYear = new Date().getFullYear()
  const year = rand(currentYear - yearsBack, currentYear - 1)
  const month = String(rand(1, 12)).padStart(2, '0')
  const day = String(rand(1, 28)).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const fakeFutureDate = (yearsAhead: number = 2) => {
  const currentYear = new Date().getFullYear()
  const year = rand(currentYear, currentYear + yearsAhead)
  const month = String(rand(1, 12)).padStart(2, '0')
  const day = String(rand(1, 28)).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Address generator
const STREET_NAMES = ['Oak', 'Maple', 'Main', 'First', 'Park', 'Cedar', 'Elm', 'Pine', 'Lake', 'Hill'] as const
const STREET_TYPES = ['St', 'Ave', 'Blvd', 'Dr', 'Ln', 'Way', 'Ct', 'Rd'] as const
const CITIES = ['Springfield', 'Riverside', 'Fairview', 'Madison', 'Georgetown', 'Franklin', 'Clinton', 'Salem', 'Bristol', 'Clayton'] as const
const STATES = ['CA', 'TX', 'FL', 'NY', 'WA', 'CO', 'AZ', 'NC', 'GA', 'VA', 'OH', 'IL'] as const
const COUNTIES = ['Sample County', 'Demo County', 'Test County', 'Example County', 'Mock County'] as const

export const fakeAddress = () => ({
  street: `${rand(100, 9999)} ${randomChoice(STREET_NAMES)} ${randomChoice(STREET_TYPES)}`,
  unit: rand(1, 5) === 1 ? `Apt ${rand(1, 500)}` : '',
  city: randomChoice(CITIES),
  state: randomChoice(STATES),
  zip: String(rand(10000, 99999)),
  county: randomChoice(COUNTIES)
})

// Currency amounts
export const fakeIncome = () => rand(3000, 15000) // Monthly income
export const fakePropertyValue = () => rand(200000, 800000)
export const fakeLoanAmount = (propertyValue?: number) => {
  const maxLoan = propertyValue ? Math.floor(propertyValue * 0.95) : 700000
  const minLoan = propertyValue ? Math.floor(propertyValue * 0.5) : 150000
  return rand(minLoan, maxLoan)
}
export const fakeDownPayment = (propertyValue?: number, loanAmount?: number) => {
  if (propertyValue && loanAmount) {
    return propertyValue - loanAmount
  }
  return rand(20000, 100000)
}
export const fakeAssetBalance = () => rand(5000, 100000)
export const fakeLiabilityBalance = () => rand(1000, 50000)
export const fakeMonthlyPayment = () => rand(100, 2000)
export const fakeMonthlyRent = () => rand(800, 3000)
export const fakeInterestRate = () => Number((rand(400, 750) / 100).toFixed(3))

// Phone number
export const fakePhone = () =>
  `(${rand(200, 999)}) ${rand(200, 999)}-${rand(1000, 9999)}`

// Email based on name
export const fakeEmail = (firstName: string, lastName: string) =>
  `${firstName.toLowerCase().replace(/_/g, '')}.${lastName.toLowerCase().replace(/_/g, '')}@example.com`

// Employment
const COMPANY_PREFIXES = ['Acme', 'Global', 'Premier', 'United', 'First', 'National', 'Pacific', 'American', 'Metro', 'Summit'] as const
const COMPANY_SUFFIXES = ['Corp', 'Inc', 'LLC', 'Industries', 'Services', 'Solutions', 'Group', 'Technologies', 'Partners', 'Enterprises'] as const
const JOB_TITLES = ['Manager', 'Engineer', 'Analyst', 'Director', 'Specialist', 'Coordinator', 'Consultant', 'Developer', 'Administrator', 'Supervisor'] as const

export const fakeEmployment = () => ({
  employerName: `${randomChoice(COMPANY_PREFIXES)} ${randomChoice(COMPANY_SUFFIXES)}`,
  position: randomChoice(JOB_TITLES),
  monthlyIncome: fakeIncome(),
  startDate: fakePastDate(8),
  selfEmployed: rand(1, 10) === 1,
  employerPhone: fakePhone(),
  employerAddress: fakeAddress()
})

// Asset types
const ASSET_TYPES = ['checking', 'savings', 'investment', 'retirement', 'other'] as const
const FINANCIAL_INSTITUTIONS = ['Chase Bank', 'Bank of America', 'Wells Fargo', 'Citibank', 'Capital One', 'TD Bank', 'PNC Bank', 'US Bank', 'Fidelity', 'Vanguard'] as const

export const fakeAsset = () => ({
  type: randomChoice(ASSET_TYPES),
  institution: randomChoice(FINANCIAL_INSTITUTIONS),
  accountNumber: String(rand(100000, 999999)),
  balance: fakeAssetBalance()
})

export const fakeAssets = (count: number = rand(2, 4)) => {
  const assets = []
  for (let i = 0; i < count; i++) {
    assets.push(fakeAsset())
  }
  return assets
}

// Liability types
const LIABILITY_TYPES = ['mortgage', 'credit_card', 'auto_loan', 'student_loan', 'heloc', 'installment', 'other'] as const
const CREDITORS = ['Chase', 'Bank of America', 'Discover', 'American Express', 'Capital One', 'Citi', 'Wells Fargo', 'Synchrony', 'US Bank', 'Sallie Mae'] as const

export const fakeLiability = () => ({
  type: randomChoice(LIABILITY_TYPES),
  creditor: randomChoice(CREDITORS),
  accountNumber: String(rand(1000, 9999)),
  monthlyPayment: fakeMonthlyPayment(),
  balance: fakeLiabilityBalance(),
  toBePaidOff: rand(1, 5) === 1
})

export const fakeLiabilities = (count: number = rand(2, 5)) => {
  const liabilities = []
  for (let i = 0; i < count; i++) {
    liabilities.push(fakeLiability())
  }
  return liabilities
}

// Property types
const PROPERTY_TYPES = ['single_family', 'condominium', 'townhouse', 'two_to_four_unit', 'manufactured_home'] as const
const OCCUPANCY_TYPES = ['primary_residence', 'second_home', 'investment'] as const

export const fakeProperty = () => {
  const propertyValue = fakePropertyValue()
  return {
    address: fakeAddress(),
    propertyType: randomChoice(PROPERTY_TYPES),
    numberOfUnits: rand(1, 4),
    propertyValue,
    occupancy: randomChoice(OCCUPANCY_TYPES),
    yearBuilt: rand(1950, 2023)
  }
}

// Loan info
const LOAN_PURPOSES = ['purchase', 'refinance'] as const
const LOAN_TYPES = ['conventional', 'fha', 'va', 'usda_rural_housing'] as const
const LOAN_TERMS = [180, 240, 360] as const // 15, 20, 30 years in months
const DOWN_PAYMENT_SOURCES = ['savings', 'gift', 'sale_of_property', 'other'] as const

export const fakeLoan = (propertyValue?: number) => {
  const propValue = propertyValue || fakePropertyValue()
  const loanAmount = fakeLoanAmount(propValue)
  const downPayment = propValue - loanAmount
  return {
    loanPurpose: randomChoice(LOAN_PURPOSES),
    loanType: randomChoice(LOAN_TYPES),
    loanAmount,
    loanTermMonths: randomChoice(LOAN_TERMS),
    interestRate: fakeInterestRate(),
    interestRateType: rand(1, 5) === 1 ? 'adjustable' : 'fixed',
    downPayment: {
      amount: downPayment,
      source: randomChoice(DOWN_PAYMENT_SOURCES)
    }
  }
}

// Declarations - generate realistic answers
export const fakeDeclarations = () => ({
  outstandingJudgments: rand(1, 20) === 1,
  declaredBankruptcy: rand(1, 20) === 1,
  propertyForeclosed: rand(1, 25) === 1,
  partyToLawsuit: rand(1, 30) === 1,
  obligatedOnForeclosedLoan: rand(1, 30) === 1,
  delinquentFederalDebt: rand(1, 30) === 1,
  alimonyChildSupport: rand(1, 10) === 1,
  borrowingDownPayment: rand(1, 15) === 1,
  coMakerOnNote: rand(1, 15) === 1,
  usCitizen: rand(1, 10) !== 1, // Usually true
  permanentResidentAlien: rand(1, 20) === 1,
  primaryResidenceIntent: rand(1, 4) !== 1, // Usually true for primary residence
  ownershipInterestPast3Years: rand(1, 3) === 1,
  firstTimeHomeBuyer: rand(1, 3) === 1
})

// Demographics (HMDA)
const ETHNICITY_OPTIONS = ['hispanic_or_latino', 'not_hispanic_or_latino', 'prefer_not_to_answer'] as const
const RACE_OPTIONS = ['american_indian_alaska_native', 'asian', 'black_african_american', 'native_hawaiian_pacific_islander', 'white', 'prefer_not_to_answer'] as const
const SEX_OPTIONS = ['female', 'male', 'prefer_not_to_answer'] as const

export const fakeDemographics = () => ({
  ethnicity: randomChoice(ETHNICITY_OPTIONS),
  race: [randomChoice(RACE_OPTIONS.filter(r => r !== 'prefer_not_to_answer'))],
  sex: randomChoice(SEX_OPTIONS)
})

// Military service
const MILITARY_STATUS_OPTIONS = ['currently_serving', 'retired_discharged_separated', 'surviving_spouse', 'never_served'] as const

export const fakeMilitaryService = () => {
  const status = randomChoice(MILITARY_STATUS_OPTIONS)
  return {
    status,
    expectedCompletionDate: status === 'currently_serving' ? fakeFutureDate(2) : undefined
  }
}

// Real estate owned
const REO_STATUS_OPTIONS = ['sold', 'pending_sale', 'retained'] as const

export const fakeRealEstateProperty = () => {
  const propertyValue = fakePropertyValue()
  const occupancy = randomChoice(OCCUPANCY_TYPES)
  return {
    address: fakeAddress(),
    propertyValue,
    status: randomChoice(REO_STATUS_OPTIONS),
    intendedOccupancy: occupancy,
    propertyType: randomChoice(PROPERTY_TYPES),
    monthlyInsurance: rand(100, 400),
    monthlyTaxes: rand(200, 800),
    monthlyHOA: rand(1, 3) === 1 ? rand(100, 500) : 0,
    monthlyRentalIncome: occupancy === 'investment' ? rand(1500, 4000) : 0,
    mortgages: rand(1, 3) === 1 ? [] : [{
      creditor: randomChoice(FINANCIAL_INSTITUTIONS),
      monthlyPayment: rand(1000, 3000),
      unpaidBalance: rand(100000, 400000),
      lienType: 'first_lien' as const,
      toBePaidOff: rand(1, 3) === 1
    }]
  }
}

export const fakeRealEstateOwned = (count: number = rand(0, 2)) => {
  const properties = []
  for (let i = 0; i < count; i++) {
    properties.push(fakeRealEstateProperty())
  }
  return { propertiesOwned: properties }
}

// Dependents
export const fakeDependents = () => {
  const count = rand(0, 4)
  const ages: number[] = []
  for (let i = 0; i < count; i++) {
    ages.push(rand(1, 18))
  }
  return { count, ages }
}

// Alternate names
export const fakeAlternateNames = () => {
  if (rand(1, 3) === 1) {
    return [`Maiden_${rand(1, 100)}`]
  }
  return []
}

// Current address with housing info
export const fakeCurrentAddress = () => ({
  address: fakeAddress(),
  housingType: randomChoice(['own', 'rent', 'no_primary_expense'] as const),
  monthlyPayment: fakeMonthlyRent(),
  durationYears: rand(0, 10),
  durationMonths: rand(0, 11)
})

// Complete borrower object
export const fakeBorrower = (isPrimary: boolean = true) => {
  const name = fakeName()
  return {
    borrowerType: isPrimary ? 'borrower' : 'co_borrower',
    name,
    alternateNames: fakeAlternateNames(),
    ssn: fakeSSN(),
    dateOfBirth: fakeDOB(),
    citizenship: randomChoice(['us_citizen', 'permanent_resident', 'non_permanent_resident'] as const),
    maritalStatus: randomChoice(['married', 'separated', 'unmarried'] as const),
    dependents: fakeDependents(),
    contact: {
      homePhone: fakePhone(),
      cellPhone: fakePhone(),
      workPhone: fakePhone(),
      email: fakeEmail(name.firstName, name.lastName)
    },
    currentAddress: fakeCurrentAddress(),
    formerAddresses: rand(1, 3) === 1 ? [fakeCurrentAddress()] : [],
    militaryService: fakeMilitaryService(),
    employment: [fakeEmployment()]
  }
}

// Complete application data
export const fakeApplicationData = () => {
  const property = fakeProperty()
  return {
    borrowers: [fakeBorrower(true)],
    loan: fakeLoan(property.propertyValue),
    property,
    assets: { assets: fakeAssets() },
    liabilities: { liabilities: fakeLiabilities() },
    realEstate: fakeRealEstateOwned(),
    declarations: { declarations: fakeDeclarations() },
    demographics: fakeDemographics()
  }
}
