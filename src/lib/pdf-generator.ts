/**
 * URLA PDF Generator
 * Generates a filled URLA 1003-style PDF from application data
 */

/* eslint-disable @typescript-eslint/no-var-requires */
const pdfmake = require('pdfmake')
import type { TDocumentDefinitions, Content, TableCell } from 'pdfmake/interfaces'

// Configure fonts for pdfmake (using standard PDF fonts)
pdfmake.setFonts({
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  }
})

// Type mappings for display
const LOAN_PURPOSE_DISPLAY: Record<string, string> = {
  purchase: 'Purchase',
  refinance: 'Refinance',
  other: 'Other'
}

const LOAN_TYPE_DISPLAY: Record<string, string> = {
  conventional: 'Conventional',
  fha: 'FHA',
  va: 'VA',
  usda_rural_housing: 'USDA Rural Housing'
}

const PROPERTY_TYPE_DISPLAY: Record<string, string> = {
  single_family: 'Single Family',
  condominium: 'Condominium',
  townhouse: 'Townhouse',
  two_to_four_unit: '2-4 Unit',
  manufactured_home: 'Manufactured Home',
  cooperative: 'Cooperative',
  pud: 'PUD'
}

const OCCUPANCY_DISPLAY: Record<string, string> = {
  primary_residence: 'Primary Residence',
  second_home: 'Second Home',
  investment: 'Investment Property'
}

const ASSET_TYPE_DISPLAY: Record<string, string> = {
  checking: 'Checking Account',
  savings: 'Savings Account',
  investment: 'Stocks/Bonds/Mutual Funds',
  retirement: 'Retirement Account',
  cash_value_life: 'Life Insurance Cash Value',
  other: 'Other'
}

const LIABILITY_TYPE_DISPLAY: Record<string, string> = {
  mortgage: 'Mortgage',
  credit_card: 'Credit Card',
  auto_loan: 'Auto Loan',
  student_loan: 'Student Loan',
  heloc: 'HELOC',
  installment: 'Installment Loan',
  other: 'Other'
}

const ETHNICITY_DISPLAY: Record<string, string> = {
  hispanic_or_latino: 'Hispanic or Latino',
  not_hispanic_or_latino: 'Not Hispanic or Latino',
  prefer_not_to_answer: 'Information not provided'
}

const RACE_DISPLAY: Record<string, string> = {
  american_indian_alaska_native: 'American Indian or Alaska Native',
  asian: 'Asian',
  black_african_american: 'Black or African American',
  native_hawaiian_pacific_islander: 'Native Hawaiian or Pacific Islander',
  white: 'White',
  prefer_not_to_answer: 'Information not provided'
}

const SEX_DISPLAY: Record<string, string> = {
  female: 'Female',
  male: 'Male',
  prefer_not_to_answer: 'Information not provided'
}

const MILITARY_STATUS_DISPLAY: Record<string, string> = {
  currently_serving: 'Currently Serving on Active Duty',
  expired_less_than_90_days: 'Active Duty (expiring < 90 days)',
  retired_discharged_separated: 'Retired/Discharged/Separated',
  surviving_spouse: 'Surviving Spouse of Veteran',
  never_served: 'Never Served'
}

const REO_STATUS_DISPLAY: Record<string, string> = {
  sold: 'Sold',
  pending_sale: 'Pending Sale',
  retained: 'Retained'
}

export interface PDFApplication {
  id: string
  status: string
  data: {
    loan?: any
    property?: any
    assets?: any
    liabilities?: any
    declarations?: any
    demographics?: any
    realEstate?: any
  }
  borrowers: any[]
  createdAt?: string
  updatedAt?: string
}

// Utility functions
function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return '$0.00'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return 'N/A'
  try {
    return new Date(dateStr).toLocaleDateString('en-US')
  } catch {
    return dateStr
  }
}

function maskSSN(ssn: string | undefined | null): string {
  if (!ssn) return 'N/A'
  // Show only last 4 digits
  const cleaned = ssn.replace(/\D/g, '')
  if (cleaned.length >= 4) {
    return `***-**-${cleaned.slice(-4)}`
  }
  return '***-**-****'
}

function formatAddress(address: any): string {
  if (!address) return 'N/A'
  const parts = [
    address.street,
    address.unit ? `Unit ${address.unit}` : null,
    address.city,
    address.state,
    address.zip
  ].filter(Boolean)
  return parts.join(', ') || 'N/A'
}

function safeString(value: any, fallback: string = 'N/A'): string {
  if (value === undefined || value === null || value === '') return fallback
  return String(value)
}

// Section builders
function buildHeader(appId: string): Content {
  return {
    stack: [
      {
        text: 'UNIFORM RESIDENTIAL LOAN APPLICATION',
        style: 'header',
        alignment: 'center',
        margin: [0, 0, 0, 5]
      },
      {
        text: `Application ID: ${appId}`,
        alignment: 'center',
        fontSize: 10,
        color: '#666666',
        margin: [0, 0, 0, 15]
      }
    ]
  }
}

function buildBorrowerSection(borrowers: any[]): Content {
  if (!borrowers || borrowers.length === 0) {
    return {
      stack: [
        { text: 'SECTION 1: BORROWER INFORMATION', style: 'sectionHeader' },
        { text: 'No borrower information provided', italics: true, color: '#666666' }
      ]
    }
  }

  const borrowerContent: Content[] = []

  borrowers.forEach((borrower, index) => {
    const name = borrower.name || {}
    const contact = borrower.contact || {}
    const currentAddress = borrower.currentAddress || {}
    const employment = Array.isArray(borrower.employment) ? borrower.employment : []

    const fullName = [name.firstName, name.middleName, name.lastName, name.suffix]
      .filter(Boolean)
      .join(' ') || 'N/A'

    borrowerContent.push({
      text: index === 0 ? 'Primary Borrower' : `Co-Borrower ${index}`,
      style: 'subHeader',
      margin: [0, index > 0 ? 15 : 0, 0, 5]
    })

    // Format dependents
    const deps = borrower.dependents || {}
    const dependentsDisplay = deps.count > 0
      ? `${deps.count} (ages: ${(deps.ages || []).join(', ')})`
      : 'None'

    // Format alternate names
    const altNames = Array.isArray(borrower.alternateNames) && borrower.alternateNames.length > 0
      ? borrower.alternateNames.join(', ')
      : 'None'

    // Personal Information Table
    borrowerContent.push({
      table: {
        widths: ['25%', '25%', '25%', '25%'],
        body: [
          [
            { text: 'Name:', style: 'label' },
            { text: fullName, colSpan: 3 },
            {},
            {}
          ],
          [
            { text: 'SSN:', style: 'label' },
            { text: maskSSN(borrower.ssn) },
            { text: 'Date of Birth:', style: 'label' },
            { text: formatDate(borrower.dateOfBirth || borrower.dob) }
          ],
          [
            { text: 'Citizenship:', style: 'label' },
            { text: safeString(borrower.citizenship) },
            { text: 'Marital Status:', style: 'label' },
            { text: safeString(borrower.maritalStatus) }
          ],
          [
            { text: 'Email:', style: 'label' },
            { text: safeString(contact.email) },
            { text: 'Cell Phone:', style: 'label' },
            { text: safeString(contact.cellPhone) }
          ],
          [
            { text: 'Dependents:', style: 'label' },
            { text: dependentsDisplay },
            { text: 'Alternate Names:', style: 'label' },
            { text: altNames }
          ]
        ]
      },
      layout: 'lightHorizontalLines',
      margin: [0, 0, 0, 10]
    } as Content)

    // Current Address
    borrowerContent.push({
      text: 'Current Address',
      style: 'fieldLabel',
      margin: [0, 5, 0, 3]
    })

    borrowerContent.push({
      table: {
        widths: ['25%', '25%', '25%', '25%'],
        body: [
          [
            { text: 'Address:', style: 'label' },
            { text: formatAddress(currentAddress.address), colSpan: 3 },
            {},
            {}
          ],
          [
            { text: 'Housing:', style: 'label' },
            { text: safeString(currentAddress.housingType) },
            { text: 'Monthly Payment:', style: 'label' },
            { text: formatCurrency(currentAddress.monthlyPayment) }
          ],
          [
            { text: 'Years at Address:', style: 'label' },
            { text: `${currentAddress.durationYears || 0} years, ${currentAddress.durationMonths || 0} months`, colSpan: 3 },
            {},
            {}
          ]
        ]
      },
      layout: 'lightHorizontalLines',
      margin: [0, 0, 0, 10]
    } as Content)

    // Employment
    if (employment.length > 0) {
      borrowerContent.push({
        text: 'Employment',
        style: 'fieldLabel',
        margin: [0, 5, 0, 3]
      })

      employment.forEach((emp: any, empIndex: number) => {
        borrowerContent.push({
          table: {
            widths: ['25%', '25%', '25%', '25%'],
            body: [
              [
                { text: 'Employer:', style: 'label' },
                { text: safeString(emp.employerName), colSpan: 3 },
                {},
                {}
              ],
              [
                { text: 'Position:', style: 'label' },
                { text: safeString(emp.position) },
                { text: 'Monthly Income:', style: 'label' },
                { text: formatCurrency(emp.monthlyIncome) }
              ],
              [
                { text: 'Start Date:', style: 'label' },
                { text: formatDate(emp.startDate) },
                { text: 'Self-Employed:', style: 'label' },
                { text: emp.selfEmployed ? 'Yes' : 'No' }
              ]
            ]
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, empIndex < employment.length - 1 ? 5 : 0]
        } as Content)
      })
    }
  })

  return {
    stack: [
      { text: 'SECTION 1: BORROWER INFORMATION', style: 'sectionHeader' },
      ...borrowerContent
    ]
  }
}

function buildLoanSection(loan: any): Content {
  if (!loan) {
    return {
      stack: [
        { text: 'SECTION 4a: LOAN INFORMATION', style: 'sectionHeader' },
        { text: 'No loan information provided', italics: true, color: '#666666' }
      ]
    }
  }

  const termYears = loan.loanTermMonths ? Math.floor(loan.loanTermMonths / 12) : 'N/A'

  return {
    stack: [
      { text: 'SECTION 4a: LOAN INFORMATION', style: 'sectionHeader' },
      {
        table: {
          widths: ['25%', '25%', '25%', '25%'],
          body: [
            [
              { text: 'Loan Amount:', style: 'label' },
              { text: formatCurrency(loan.loanAmount) },
              { text: 'Loan Purpose:', style: 'label' },
              { text: LOAN_PURPOSE_DISPLAY[loan.loanPurpose] || safeString(loan.loanPurpose) }
            ],
            [
              { text: 'Loan Type:', style: 'label' },
              { text: LOAN_TYPE_DISPLAY[loan.loanType] || safeString(loan.loanType) },
              { text: 'Loan Term:', style: 'label' },
              { text: `${termYears} years` }
            ],
            [
              { text: 'Interest Rate:', style: 'label' },
              { text: loan.interestRate ? `${loan.interestRate}%` : 'TBD' },
              { text: 'Rate Type:', style: 'label' },
              { text: loan.interestRateType === 'adjustable' ? 'Adjustable (ARM)' : 'Fixed' }
            ],
            [
              { text: 'Down Payment:', style: 'label' },
              { text: formatCurrency(loan.downPayment?.amount) },
              { text: 'Down Payment Source:', style: 'label' },
              { text: safeString(loan.downPayment?.source) }
            ]
          ]
        },
        layout: 'lightHorizontalLines'
      }
    ]
  }
}

function buildPropertySection(property: any): Content {
  if (!property) {
    return {
      stack: [
        { text: 'SECTION 4b: PROPERTY INFORMATION', style: 'sectionHeader' },
        { text: 'No property information provided', italics: true, color: '#666666' }
      ]
    }
  }

  return {
    stack: [
      { text: 'SECTION 4b: PROPERTY INFORMATION', style: 'sectionHeader' },
      {
        table: {
          widths: ['25%', '75%'],
          body: [
            [
              { text: 'Property Address:', style: 'label' },
              { text: formatAddress(property.address) }
            ]
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 5]
      } as Content,
      {
        table: {
          widths: ['25%', '25%', '25%', '25%'],
          body: [
            [
              { text: 'Property Value:', style: 'label' },
              { text: formatCurrency(property.propertyValue) },
              { text: 'Property Type:', style: 'label' },
              { text: PROPERTY_TYPE_DISPLAY[property.propertyType] || safeString(property.propertyType) }
            ],
            [
              { text: 'Occupancy:', style: 'label' },
              { text: OCCUPANCY_DISPLAY[property.occupancy] || safeString(property.occupancy) },
              { text: 'Number of Units:', style: 'label' },
              { text: safeString(property.numberOfUnits, '1') }
            ],
            [
              { text: 'Year Built:', style: 'label' },
              { text: safeString(property.yearBuilt) },
              { text: 'County:', style: 'label' },
              { text: safeString(property.address?.county) }
            ]
          ]
        },
        layout: 'lightHorizontalLines'
      }
    ]
  }
}

function buildAssetsSection(assets: any): Content {
  const assetList = assets?.assets || []

  if (assetList.length === 0) {
    return {
      stack: [
        { text: 'SECTION 2a: ASSETS', style: 'sectionHeader' },
        { text: 'No assets reported', italics: true, color: '#666666' }
      ]
    }
  }

  const tableBody: TableCell[][] = [
    [
      { text: 'Type', style: 'tableHeader' },
      { text: 'Institution', style: 'tableHeader' },
      { text: 'Account #', style: 'tableHeader' },
      { text: 'Value', style: 'tableHeader' }
    ]
  ]

  let totalAssets = 0
  assetList.forEach((asset: any) => {
    const value = asset.balance || asset.value || 0
    totalAssets += value
    tableBody.push([
      { text: ASSET_TYPE_DISPLAY[asset.type] || safeString(asset.type) },
      { text: safeString(asset.institution) },
      { text: asset.accountNumber ? `****${asset.accountNumber.slice(-4)}` : 'N/A' },
      { text: formatCurrency(value), alignment: 'right' }
    ])
  })

  tableBody.push([
    { text: 'TOTAL ASSETS', style: 'tableHeader', colSpan: 3 },
    {},
    {},
    { text: formatCurrency(totalAssets), style: 'tableHeader', alignment: 'right' }
  ])

  return {
    stack: [
      { text: 'SECTION 2a: ASSETS', style: 'sectionHeader' },
      {
        table: {
          widths: ['25%', '30%', '20%', '25%'],
          body: tableBody
        },
        layout: 'lightHorizontalLines'
      }
    ]
  }
}

function buildLiabilitiesSection(liabilities: any): Content {
  const liabilityList = liabilities?.liabilities || []

  if (liabilityList.length === 0) {
    return {
      stack: [
        { text: 'SECTION 2b: LIABILITIES', style: 'sectionHeader' },
        { text: 'No liabilities reported', italics: true, color: '#666666' }
      ]
    }
  }

  const tableBody: TableCell[][] = [
    [
      { text: 'Type', style: 'tableHeader' },
      { text: 'Creditor', style: 'tableHeader' },
      { text: 'Monthly Payment', style: 'tableHeader' },
      { text: 'Balance', style: 'tableHeader' }
    ]
  ]

  let totalMonthly = 0
  let totalBalance = 0
  liabilityList.forEach((liability: any) => {
    totalMonthly += liability.monthlyPayment || 0
    totalBalance += liability.balance || 0
    tableBody.push([
      { text: LIABILITY_TYPE_DISPLAY[liability.type] || safeString(liability.type) },
      { text: safeString(liability.creditor) },
      { text: formatCurrency(liability.monthlyPayment), alignment: 'right' },
      { text: formatCurrency(liability.balance), alignment: 'right' }
    ])
  })

  tableBody.push([
    { text: 'TOTAL LIABILITIES', style: 'tableHeader', colSpan: 2 },
    {},
    { text: formatCurrency(totalMonthly), style: 'tableHeader', alignment: 'right' },
    { text: formatCurrency(totalBalance), style: 'tableHeader', alignment: 'right' }
  ])

  return {
    stack: [
      { text: 'SECTION 2b: LIABILITIES', style: 'sectionHeader' },
      {
        table: {
          widths: ['25%', '30%', '20%', '25%'],
          body: tableBody
        },
        layout: 'lightHorizontalLines'
      }
    ]
  }
}

function buildDeclarationsSection(declarations: any): Content {
  if (!declarations?.declarations) {
    return {
      stack: [
        { text: 'SECTION 5: DECLARATIONS', style: 'sectionHeader' },
        { text: 'No declarations provided', italics: true, color: '#666666' }
      ]
    }
  }

  const decl = declarations.declarations
  const declarationItems = [
    { label: 'Outstanding judgments against you?', value: decl.outstandingJudgments },
    { label: 'Declared bankruptcy within past 7 years?', value: decl.declaredBankruptcy },
    { label: 'Property foreclosed upon in past 7 years?', value: decl.propertyForeclosed },
    { label: 'Party to a lawsuit?', value: decl.partyToLawsuit },
    { label: 'Obligated on any loan resulting in foreclosure?', value: decl.obligatedOnForeclosedLoan },
    { label: 'Delinquent on any Federal debt?', value: decl.delinquentFederalDebt },
    { label: 'Obligated to pay alimony or child support?', value: decl.alimonyChildSupport },
    { label: 'Borrowing any part of down payment?', value: decl.borrowingDownPayment },
    { label: 'Co-maker or endorser on a note?', value: decl.coMakerOnNote },
    { label: 'US Citizen?', value: decl.usCitizen },
    { label: 'Permanent resident alien?', value: decl.permanentResidentAlien },
    { label: 'Intend to occupy property as primary residence?', value: decl.primaryResidenceIntent },
    { label: 'Ownership interest in property in past 3 years?', value: decl.ownershipInterestPast3Years },
    { label: 'First-time homebuyer?', value: decl.firstTimeHomeBuyer }
  ]

  const tableBody: TableCell[][] = declarationItems.map(item => [
    { text: item.label },
    { text: item.value === true ? 'YES' : item.value === false ? 'NO' : 'N/A', alignment: 'center', bold: item.value === true }
  ])

  return {
    stack: [
      { text: 'SECTION 5: DECLARATIONS', style: 'sectionHeader' },
      {
        table: {
          widths: ['85%', '15%'],
          body: tableBody
        },
        layout: 'lightHorizontalLines'
      }
    ]
  }
}

function buildDemographicsSection(demographics: any): Content {
  if (!demographics || Object.keys(demographics).length === 0) {
    return {
      stack: [
        { text: 'SECTION 8: DEMOGRAPHIC INFORMATION', style: 'sectionHeader' },
        { text: 'Information not provided (optional per HMDA)', italics: true, color: '#666666' }
      ]
    }
  }

  const ethnicityDisplay = ETHNICITY_DISPLAY[demographics.ethnicity] || 'Not provided'

  let raceDisplay = 'Not provided'
  if (Array.isArray(demographics.race) && demographics.race.length > 0) {
    raceDisplay = demographics.race
      .map((r: string) => RACE_DISPLAY[r] || r)
      .join(', ')
  } else if (typeof demographics.race === 'string') {
    raceDisplay = RACE_DISPLAY[demographics.race] || demographics.race
  }

  const sexDisplay = SEX_DISPLAY[demographics.sex] || 'Not provided'

  return {
    stack: [
      { text: 'SECTION 8: DEMOGRAPHIC INFORMATION', style: 'sectionHeader' },
      {
        table: {
          widths: ['25%', '75%'],
          body: [
            [
              { text: 'Ethnicity:', style: 'label' },
              { text: ethnicityDisplay }
            ],
            [
              { text: 'Race:', style: 'label' },
              { text: raceDisplay }
            ],
            [
              { text: 'Sex:', style: 'label' },
              { text: sexDisplay }
            ]
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 10]
      } as Content,
      {
        text: 'This information is requested by the Federal Government to monitor compliance with Federal statutes that prohibit discrimination in housing. You are not required to provide this information, but are encouraged to do so.',
        fontSize: 8,
        italics: true,
        color: '#666666',
        margin: [0, 5, 0, 0]
      }
    ]
  }
}

function buildMilitaryServiceSection(borrowers: any[]): Content {
  const hasMilitaryInfo = borrowers.some(b => b.militaryService?.status)

  if (!hasMilitaryInfo) {
    return {
      stack: [
        { text: 'MILITARY SERVICE', style: 'sectionHeader' },
        { text: 'No military service information provided', italics: true, color: '#666666' }
      ]
    }
  }

  const militaryContent: Content[] = []

  borrowers.forEach((borrower, index) => {
    if (!borrower.militaryService?.status) return

    const name = borrower.name || {}
    const fullName = [name.firstName, name.lastName].filter(Boolean).join(' ') || `Borrower ${index + 1}`
    const military = borrower.militaryService

    militaryContent.push({
      table: {
        widths: ['25%', '25%', '25%', '25%'],
        body: [
          [
            { text: 'Borrower:', style: 'label' },
            { text: fullName },
            { text: 'Service Status:', style: 'label' },
            { text: MILITARY_STATUS_DISPLAY[military.status] || military.status }
          ],
          ...(military.expectedCompletionDate ? [[
            { text: 'Expected Completion:', style: 'label' },
            { text: formatDate(military.expectedCompletionDate), colSpan: 3 },
            {},
            {}
          ]] : [])
        ]
      },
      layout: 'lightHorizontalLines',
      margin: [0, 0, 0, index < borrowers.length - 1 ? 10 : 0]
    } as Content)
  })

  return {
    stack: [
      { text: 'MILITARY SERVICE', style: 'sectionHeader' },
      ...militaryContent
    ]
  }
}

function buildRealEstateSection(realEstate: any): Content {
  const properties = realEstate?.propertiesOwned || []

  if (properties.length === 0) {
    return {
      stack: [
        { text: 'SECTION 3: REAL ESTATE OWNED', style: 'sectionHeader' },
        { text: 'No real estate owned', italics: true, color: '#666666' }
      ]
    }
  }

  const tableBody: TableCell[][] = [
    [
      { text: 'Property Address', style: 'tableHeader' },
      { text: 'Value', style: 'tableHeader' },
      { text: 'Status', style: 'tableHeader' },
      { text: 'Monthly Expenses', style: 'tableHeader' },
      { text: 'Mortgage Balance', style: 'tableHeader' }
    ]
  ]

  let totalValue = 0
  let totalExpenses = 0
  let totalMortgage = 0

  properties.forEach((prop: any) => {
    const value = prop.propertyValue || 0
    totalValue += value

    const monthlyExpenses = (prop.monthlyInsurance || 0) +
      (prop.monthlyTaxes || 0) +
      (prop.monthlyHOA || 0)
    totalExpenses += monthlyExpenses

    let mortgageBalance = 0
    if (Array.isArray(prop.mortgages)) {
      mortgageBalance = prop.mortgages.reduce((sum: number, m: any) => sum + (m.unpaidBalance || 0), 0)
    }
    totalMortgage += mortgageBalance

    tableBody.push([
      { text: formatAddress(prop.address) },
      { text: formatCurrency(value), alignment: 'right' },
      { text: REO_STATUS_DISPLAY[prop.status] || prop.status },
      { text: formatCurrency(monthlyExpenses), alignment: 'right' },
      { text: formatCurrency(mortgageBalance), alignment: 'right' }
    ])
  })

  tableBody.push([
    { text: 'TOTALS', style: 'tableHeader' },
    { text: formatCurrency(totalValue), style: 'tableHeader', alignment: 'right' },
    { text: '', style: 'tableHeader' },
    { text: formatCurrency(totalExpenses), style: 'tableHeader', alignment: 'right' },
    { text: formatCurrency(totalMortgage), style: 'tableHeader', alignment: 'right' }
  ])

  return {
    stack: [
      { text: 'SECTION 3: REAL ESTATE OWNED', style: 'sectionHeader' },
      {
        table: {
          widths: ['30%', '15%', '15%', '20%', '20%'],
          body: tableBody
        },
        layout: 'lightHorizontalLines'
      }
    ]
  }
}

function buildFooter(status: string): Content {
  return {
    stack: [
      {
        canvas: [
          { type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#cccccc' }
        ],
        margin: [0, 20, 0, 10]
      },
      {
        columns: [
          {
            text: `Application Status: ${status.toUpperCase()}`,
            fontSize: 9,
            color: '#666666'
          },
          {
            text: `Generated: ${new Date().toLocaleString('en-US')}`,
            fontSize: 9,
            color: '#666666',
            alignment: 'right'
          }
        ]
      },
      {
        text: 'This document was generated by MortMortgage Demo Application',
        fontSize: 8,
        color: '#999999',
        alignment: 'center',
        margin: [0, 10, 0, 0]
      }
    ]
  }
}

/**
 * Generates a URLA PDF document from application data
 */
export async function generateURLAPdf(application: PDFApplication): Promise<Buffer> {
  const docDefinition: TDocumentDefinitions = {
    pageSize: 'LETTER',
    pageMargins: [40, 40, 40, 60],
    defaultStyle: {
      font: 'Helvetica',
      fontSize: 10
    },
    styles: {
      header: {
        fontSize: 16,
        bold: true
      },
      sectionHeader: {
        fontSize: 12,
        bold: true,
        fillColor: '#f0f0f0',
        margin: [0, 15, 0, 8]
      },
      subHeader: {
        fontSize: 11,
        bold: true,
        color: '#333333'
      },
      label: {
        bold: true,
        color: '#555555'
      },
      fieldLabel: {
        fontSize: 10,
        bold: true,
        color: '#444444'
      },
      tableHeader: {
        bold: true,
        fillColor: '#e8e8e8'
      }
    },
    content: [
      buildHeader(application.id),
      buildBorrowerSection(application.borrowers),
      buildMilitaryServiceSection(application.borrowers),
      buildLoanSection(application.data?.loan),
      buildPropertySection(application.data?.property),
      buildRealEstateSection(application.data?.realEstate),
      buildAssetsSection(application.data?.assets),
      buildLiabilitiesSection(application.data?.liabilities),
      buildDeclarationsSection(application.data?.declarations),
      buildDemographicsSection(application.data?.demographics),
      buildFooter(application.status)
    ]
  }

  const pdfDoc = pdfmake.createPdf(docDefinition)
  return pdfDoc.getBuffer()
}
