/**
 * URLA to MISMO v3.x Mapper
 * Maps URLA 2020 application data to MISMO v3.4 format
 */

// Type mappings from URLA to MISMO
const LOAN_PURPOSE_MAP: Record<string, string> = {
  purchase: 'Purchase',
  refinance: 'Refinance',
  other: 'Other'
}

const LOAN_TYPE_MAP: Record<string, string> = {
  conventional: 'Conventional',
  fha: 'FHA',
  va: 'VA',
  usda_rural_housing: 'USDARuralHousing'
}

const PROPERTY_TYPE_MAP: Record<string, string> = {
  single_family: 'SingleFamily',
  condominium: 'Condominium',
  townhouse: 'Townhouse',
  two_to_four_unit: 'TwoToFourFamily',
  manufactured_home: 'ManufacturedHousing',
  cooperative: 'Cooperative',
  pud: 'PlannedUnitDevelopment'
}

const OCCUPANCY_MAP: Record<string, string> = {
  primary_residence: 'PrimaryResidence',
  second_home: 'SecondHome',
  investment: 'Investment'
}

const ASSET_TYPE_MAP: Record<string, string> = {
  checking: 'CheckingAccount',
  savings: 'SavingsAccount',
  investment: 'StocksBondsMutualFunds',
  retirement: 'RetirementFund',
  cash_value_life: 'LifeInsuranceCashValue',
  other: 'Other'
}

const LIABILITY_TYPE_MAP: Record<string, string> = {
  mortgage: 'MortgageLoan',
  credit_card: 'Revolving',
  auto_loan: 'Installment',
  student_loan: 'Installment',
  heloc: 'HELOC',
  installment: 'Installment',
  other: 'Other'
}

const ETHNICITY_MAP: Record<string, string> = {
  hispanic_or_latino: 'HispanicOrLatino',
  not_hispanic_or_latino: 'NotHispanicOrLatino',
  prefer_not_to_answer: 'InformationNotProvidedByApplicantInMailInternetOrTelephoneApplication'
}

const RACE_MAP: Record<string, string> = {
  american_indian_alaska_native: 'AmericanIndianOrAlaskaNative',
  asian: 'Asian',
  black_african_american: 'BlackOrAfricanAmerican',
  native_hawaiian_pacific_islander: 'NativeHawaiianOrOtherPacificIslander',
  white: 'White',
  prefer_not_to_answer: 'InformationNotProvidedByApplicantInMailInternetOrTelephoneApplication'
}

const SEX_MAP: Record<string, string> = {
  female: 'Female',
  male: 'Male',
  prefer_not_to_answer: 'InformationNotProvidedByApplicantInMailInternetOrTelephoneApplication'
}

export interface URLAApplication {
  id: string
  status: string
  data: {
    loan?: any
    property?: any
    assets?: any
    liabilities?: any
    declarations?: any
    demographics?: any
  }
  borrowers: any[]
}

export interface MISMODocument {
  ABOUT_VERSIONS: {
    MISMOVersionIdentifier: string
  }
  DEAL_SETS: {
    DEAL_SET: {
      DEALS: {
        DEAL: {
          LOANS: any
          PARTIES: any
          COLLATERALS: any
          ASSETS?: any
          LIABILITIES?: any
        }
      }
    }
  }
}

function mapAddress(address: any) {
  if (!address) return null
  return {
    AddressLineText: address.street,
    AddressUnitIdentifier: address.unit || undefined,
    CityName: address.city,
    StateCode: address.state,
    PostalCode: address.zip,
    CountryCode: address.country || 'US'
  }
}

function mapBorrower(borrower: any, index: number, declarations: any, demographics: any) {
  const name = borrower.name || {}
  const contact = borrower.contact || {}
  const currentAddress = borrower.currentAddress || {}
  const employment = borrower.employment || []

  const contactPoints: any[] = []
  if (contact.email) {
    contactPoints.push({
      CONTACT_POINT_EMAIL: {
        ContactPointEmailValue: contact.email
      }
    })
  }
  if (contact.cellPhone) {
    contactPoints.push({
      CONTACT_POINT_TELEPHONE: {
        ContactPointTelephoneValue: contact.cellPhone
      }
    })
  }

  const residences: any[] = []
  if (currentAddress.address) {
    residences.push({
      ADDRESS: mapAddress(currentAddress.address),
      RESIDENCE_DETAIL: {
        BorrowerResidencyType: currentAddress.housingType === 'own' ? 'Own' :
                               currentAddress.housingType === 'rent' ? 'Rent' : 'LivingRentFree',
        BorrowerResidencyDurationMonthsCount:
          ((currentAddress.durationYears || 0) * 12) + (currentAddress.durationMonths || 0)
      }
    })
  }

  const employers: any[] = employment.map((emp: any) => ({
    EMPLOYMENT: {
      EmploymentStatusType: emp.current ? 'Current' : 'Previous',
      EmploymentStartDate: emp.startDate,
      EmploymentEndDate: emp.endDate,
      EmploymentMonthlyIncomeAmount: emp.monthlyIncome,
      EmploymentPositionDescription: emp.position,
      SpecialBorrowerEmployerRelationshipIndicator: emp.selfEmployed || false
    },
    LEGAL_ENTITY: {
      LEGAL_ENTITY_DETAIL: {
        FullName: emp.employerName
      }
    }
  }))

  const decl = declarations?.declarations || {}
  const demo = demographics || {}

  return {
    ROLES: {
      ROLE: {
        ROLE_DETAIL: {
          PartyRoleType: index === 0 ? 'Borrower' : 'CoBorrower'
        },
        BORROWER: {
          DECLARATION: {
            DECLARATION_DETAIL: {
              BankruptcyIndicator: decl.declaredBankruptcy || false,
              OutstandingJudgmentsIndicator: decl.outstandingJudgments || false,
              PartyToLawsuitIndicator: decl.partyToLawsuit || false,
              PresentlyDelinquentIndicator: decl.delinquentFederalDebt || false,
              PropertyForeclosedPastSevenYearsIndicator: decl.propertyForeclosed || false,
              IntentToOccupyIndicator: decl.primaryResidenceIntent ?? true,
              HomeownerPastThreeYearsIndicator: decl.ownershipInterestPast3Years || false,
              AlimonyChildSupportObligationIndicator: decl.alimonyChildSupport || false,
              BorrowedDownPaymentIndicator: decl.borrowingDownPayment || false,
              CoMakerEndorserOfNoteIndicator: decl.coMakerOnNote || false
            }
          },
          GOVERNMENT_MONITORING: {
            GOVERNMENT_MONITORING_DETAIL: {
              HMDAEthnicityType: demo.ethnicity ? ETHNICITY_MAP[demo.ethnicity] : undefined,
              HMDARaceType: demo.race?.map((r: string) => RACE_MAP[r]),
              HMDAGenderType: demo.sex ? SEX_MAP[demo.sex] : undefined
            }
          },
          RESIDENCES: {
            RESIDENCE: residences
          },
          EMPLOYERS: {
            EMPLOYER: employers
          }
        }
      }
    },
    INDIVIDUAL: {
      NAME: {
        FirstName: name.firstName,
        MiddleName: name.middleName,
        LastName: name.lastName,
        SuffixName: name.suffix
      },
      CONTACT_POINTS: {
        CONTACT_POINT: contactPoints
      }
    },
    TAXPAYER_IDENTIFIERS: borrower.ssn ? {
      TAXPAYER_IDENTIFIER: {
        TaxpayerIdentifierType: 'SocialSecurityNumber',
        TaxpayerIdentifierValue: borrower.ssn
      }
    } : undefined
  }
}

function mapAssets(assets: any) {
  if (!assets?.assets || assets.assets.length === 0) return undefined

  return {
    ASSET: assets.assets.map((asset: any) => ({
      ASSET_DETAIL: {
        AssetType: ASSET_TYPE_MAP[asset.type] || 'Other',
        AssetCashOrMarketValueAmount: asset.balance || asset.value || 0
      },
      ASSET_HOLDER: asset.institution ? {
        NAME: {
          FullName: asset.institution
        }
      } : undefined
    }))
  }
}

function mapLiabilities(liabilities: any) {
  if (!liabilities?.liabilities || liabilities.liabilities.length === 0) return undefined

  return {
    LIABILITY: liabilities.liabilities.map((liability: any) => ({
      LIABILITY_DETAIL: {
        LiabilityType: LIABILITY_TYPE_MAP[liability.type] || 'Other',
        LiabilityMonthlyPaymentAmount: liability.monthlyPayment || 0,
        LiabilityUnpaidBalanceAmount: liability.balance || 0
      },
      LIABILITY_HOLDER: liability.creditor ? {
        NAME: {
          FullName: liability.creditor
        }
      } : undefined
    }))
  }
}

/**
 * Maps a URLA application to MISMO v3.4 format
 */
export function mapToMISMO(app: URLAApplication): MISMODocument {
  const loan = app.data?.loan || {}
  const property = app.data?.property || {}
  const declarations = app.data?.declarations || {}
  const demographics = app.data?.demographics || {}

  return {
    ABOUT_VERSIONS: {
      MISMOVersionIdentifier: '3.4'
    },
    DEAL_SETS: {
      DEAL_SET: {
        DEALS: {
          DEAL: {
            LOANS: {
              LOAN: {
                LOAN_IDENTIFIERS: {
                  LOAN_IDENTIFIER: {
                    LoanIdentifier: app.id,
                    LoanIdentifierType: 'LenderLoan'
                  }
                },
                TERMS_OF_LOAN: {
                  BaseLoanAmount: loan.loanAmount || 0,
                  LoanPurposeType: LOAN_PURPOSE_MAP[loan.loanPurpose] || 'Purchase',
                  MortgageType: LOAN_TYPE_MAP[loan.loanType] || 'Conventional',
                  LienPriorityType: 'FirstLien'
                },
                AMORTIZATION: {
                  AmortizationType: loan.interestRateType === 'adjustable' ? 'AdjustableRate' : 'Fixed',
                  LoanAmortizationPeriodCount: loan.loanTermMonths || 360,
                  LoanAmortizationPeriodType: 'Month'
                },
                INTEREST_RATE: {
                  InterestRatePercent: loan.interestRate || undefined,
                  InterestRateType: loan.interestRateType === 'adjustable' ? 'AdjustableRate' : 'FixedRate'
                },
                LOAN_PRODUCT: {
                  LOAN_PRODUCT_DATA: {
                    LoanProductDescription: loan.product || `${loan.loanTermMonths / 12 || 30}-Year ${loan.interestRateType === 'adjustable' ? 'ARM' : 'Fixed'}`
                  }
                }
              }
            },
            PARTIES: {
              PARTY: app.borrowers.map((borrower, index) =>
                mapBorrower(borrower, index, declarations, demographics)
              )
            },
            COLLATERALS: {
              COLLATERAL: {
                SUBJECT_PROPERTY: {
                  ADDRESS: mapAddress(property.address),
                  PROPERTY_DETAIL: {
                    PropertyEstimatedValueAmount: property.propertyValue || 0,
                    PropertyUsageType: OCCUPANCY_MAP[property.occupancy] || 'PrimaryResidence',
                    FinancedUnitCount: property.numberOfUnits || 1,
                    PropertyType: PROPERTY_TYPE_MAP[property.propertyType] || 'SingleFamily'
                  }
                }
              }
            },
            ASSETS: mapAssets(app.data?.assets),
            LIABILITIES: mapLiabilities(app.data?.liabilities)
          }
        }
      }
    }
  }
}

/**
 * Converts MISMO JSON to XML format
 */
export function mismoToXML(mismo: MISMODocument): string {
  function jsonToXml(obj: any, rootName: string, indent: number = 0): string {
    const spaces = '  '.repeat(indent)

    if (obj === null || obj === undefined) {
      return ''
    }

    if (typeof obj !== 'object') {
      return `${spaces}<${rootName}>${escapeXml(String(obj))}</${rootName}>\n`
    }

    if (Array.isArray(obj)) {
      return obj.map(item => jsonToXml(item, rootName, indent)).join('')
    }

    const children = Object.entries(obj)
      .filter(([_, v]) => v !== undefined && v !== null)
      .map(([key, value]) => jsonToXml(value, key, indent + 1))
      .join('')

    if (!children) {
      return ''
    }

    return `${spaces}<${rootName}>\n${children}${spaces}</${rootName}>\n`
  }

  function escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<MESSAGE xmlns="http://www.mismo.org/residential/2009/schemas" ' +
    'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n' +
    jsonToXml(mismo, 'MESSAGE_BODY', 1).replace(/^  <MESSAGE_BODY>\n/, '').replace(/<\/MESSAGE_BODY>\n$/, '') +
    '</MESSAGE>\n'

  return xml
}

/**
 * Validates MISMO document structure (basic validation)
 */
export function validateMISMO(mismo: MISMODocument): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!mismo.ABOUT_VERSIONS?.MISMOVersionIdentifier) {
    errors.push('Missing MISMO version identifier')
  }

  const deal = mismo.DEAL_SETS?.DEAL_SET?.DEALS?.DEAL
  if (!deal) {
    errors.push('Missing DEAL structure')
  } else {
    if (!deal.LOANS?.LOAN) {
      errors.push('Missing LOAN information')
    }
    if (!deal.PARTIES?.PARTY || deal.PARTIES.PARTY.length === 0) {
      errors.push('Missing PARTY (borrower) information')
    }
    if (!deal.COLLATERALS?.COLLATERAL?.SUBJECT_PROPERTY) {
      errors.push('Missing SUBJECT_PROPERTY information')
    }
  }

  return { valid: errors.length === 0, errors }
}
