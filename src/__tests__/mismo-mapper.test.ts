import { mapToMISMO, mismoToXML, validateMISMO } from '../lib/mismo-mapper'

describe('MISMO Mapper', () => {
  const sampleApp = {
    id: 'test-app-123',
    status: 'draft',
    data: {
      loan: {
        loanPurpose: 'purchase',
        loanType: 'conventional',
        loanAmount: 280000,
        loanTermMonths: 360,
        interestRateType: 'fixed'
      },
      property: {
        address: {
          street: '123 Main St',
          city: 'Springfield',
          state: 'IL',
          zip: '62701'
        },
        propertyType: 'single_family',
        numberOfUnits: 1,
        propertyValue: 350000,
        occupancy: 'primary_residence'
      },
      assets: {
        assets: [
          { type: 'checking', institution: 'Bank of America', balance: 25000 },
          { type: 'savings', institution: 'Chase', balance: 50000 }
        ]
      },
      liabilities: {
        liabilities: [
          { type: 'credit_card', creditor: 'Chase', monthlyPayment: 200, balance: 5000 }
        ]
      },
      declarations: {
        declarations: {
          outstandingJudgments: false,
          declaredBankruptcy: false,
          primaryResidenceIntent: true
        }
      },
      demographics: {
        ethnicity: 'not_hispanic_or_latino',
        race: ['white'],
        sex: 'male'
      }
    },
    borrowers: [
      {
        borrowerType: 'borrower',
        name: { firstName: 'John', middleName: 'Q', lastName: 'Public' },
        ssn: '123-45-6789',
        citizenship: 'us_citizen',
        contact: { email: 'john@example.com', cellPhone: '555-123-4567' },
        currentAddress: {
          address: {
            street: '456 Oak Ave',
            city: 'Springfield',
            state: 'IL',
            zip: '62702'
          },
          housingType: 'rent',
          monthlyRent: 1500,
          durationYears: 2,
          durationMonths: 6
        },
        employment: [
          {
            current: true,
            employerName: 'Acme Corp',
            position: 'Engineer',
            monthlyIncome: 8000,
            selfEmployed: false
          }
        ]
      }
    ]
  }

  describe('mapToMISMO', () => {
    it('should create valid MISMO document structure', () => {
      const mismo = mapToMISMO(sampleApp)

      expect(mismo.ABOUT_VERSIONS.MISMOVersionIdentifier).toBe('3.4')
      expect(mismo.DEAL_SETS.DEAL_SET.DEALS.DEAL).toBeDefined()
    })

    it('should map loan information correctly', () => {
      const mismo = mapToMISMO(sampleApp)
      const loan = mismo.DEAL_SETS.DEAL_SET.DEALS.DEAL.LOANS.LOAN

      expect(loan.TERMS_OF_LOAN.BaseLoanAmount).toBe(280000)
      expect(loan.TERMS_OF_LOAN.LoanPurposeType).toBe('Purchase')
      expect(loan.TERMS_OF_LOAN.MortgageType).toBe('Conventional')
      expect(loan.AMORTIZATION.LoanAmortizationPeriodCount).toBe(360)
    })

    it('should map borrower information correctly', () => {
      const mismo = mapToMISMO(sampleApp)
      const party = mismo.DEAL_SETS.DEAL_SET.DEALS.DEAL.PARTIES.PARTY[0]

      expect(party.INDIVIDUAL.NAME.FirstName).toBe('John')
      expect(party.INDIVIDUAL.NAME.LastName).toBe('Public')
      expect(party.ROLES.ROLE.ROLE_DETAIL.PartyRoleType).toBe('Borrower')
    })

    it('should map property information correctly', () => {
      const mismo = mapToMISMO(sampleApp)
      const property = mismo.DEAL_SETS.DEAL_SET.DEALS.DEAL.COLLATERALS.COLLATERAL.SUBJECT_PROPERTY

      expect(property.ADDRESS.CityName).toBe('Springfield')
      expect(property.ADDRESS.StateCode).toBe('IL')
      expect(property.PROPERTY_DETAIL.PropertyEstimatedValueAmount).toBe(350000)
      expect(property.PROPERTY_DETAIL.PropertyUsageType).toBe('PrimaryResidence')
    })

    it('should map assets correctly', () => {
      const mismo = mapToMISMO(sampleApp)
      const assets = mismo.DEAL_SETS.DEAL_SET.DEALS.DEAL.ASSETS

      expect(assets.ASSET).toHaveLength(2)
      expect(assets.ASSET[0].ASSET_DETAIL.AssetType).toBe('CheckingAccount')
      expect(assets.ASSET[0].ASSET_DETAIL.AssetCashOrMarketValueAmount).toBe(25000)
    })

    it('should map liabilities correctly', () => {
      const mismo = mapToMISMO(sampleApp)
      const liabilities = mismo.DEAL_SETS.DEAL_SET.DEALS.DEAL.LIABILITIES

      expect(liabilities.LIABILITY).toHaveLength(1)
      expect(liabilities.LIABILITY[0].LIABILITY_DETAIL.LiabilityType).toBe('Revolving')
      expect(liabilities.LIABILITY[0].LIABILITY_DETAIL.LiabilityMonthlyPaymentAmount).toBe(200)
    })

    it('should map declarations correctly', () => {
      const mismo = mapToMISMO(sampleApp)
      const borrower = mismo.DEAL_SETS.DEAL_SET.DEALS.DEAL.PARTIES.PARTY[0].ROLES.ROLE.BORROWER
      const decl = borrower.DECLARATION.DECLARATION_DETAIL

      expect(decl.OutstandingJudgmentsIndicator).toBe(false)
      expect(decl.BankruptcyIndicator).toBe(false)
      expect(decl.IntentToOccupyIndicator).toBe(true)
    })

    it('should map demographics correctly', () => {
      const mismo = mapToMISMO(sampleApp)
      const borrower = mismo.DEAL_SETS.DEAL_SET.DEALS.DEAL.PARTIES.PARTY[0].ROLES.ROLE.BORROWER
      const demo = borrower.GOVERNMENT_MONITORING.GOVERNMENT_MONITORING_DETAIL

      expect(demo.HMDAEthnicityType).toBe('NotHispanicOrLatino')
      expect(demo.HMDARaceType).toContain('White')
      expect(demo.HMDAGenderType).toBe('Male')
    })
  })

  describe('validateMISMO', () => {
    it('should validate a complete MISMO document', () => {
      const mismo = mapToMISMO(sampleApp)
      const result = validateMISMO(mismo)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect missing version', () => {
      const invalid = { DEAL_SETS: {} } as any
      const result = validateMISMO(invalid)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Missing MISMO version identifier')
    })

    it('should detect missing deal structure', () => {
      const invalid = {
        ABOUT_VERSIONS: { MISMOVersionIdentifier: '3.4' },
        DEAL_SETS: {}
      } as any
      const result = validateMISMO(invalid)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Missing DEAL structure')
    })
  })

  describe('mismoToXML', () => {
    it('should generate valid XML', () => {
      const mismo = mapToMISMO(sampleApp)
      const xml = mismoToXML(mismo)

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
      expect(xml).toContain('<MESSAGE')
      expect(xml).toContain('xmlns="http://www.mismo.org/residential/2009/schemas"')
      expect(xml).toContain('<MISMOVersionIdentifier>3.4</MISMOVersionIdentifier>')
      expect(xml).toContain('<BaseLoanAmount>280000</BaseLoanAmount>')
      expect(xml).toContain('<FirstName>John</FirstName>')
    })

    it('should escape special characters in XML', () => {
      const appWithSpecialChars = {
        ...sampleApp,
        borrowers: [{
          ...sampleApp.borrowers[0],
          name: { firstName: 'John & Jane', lastName: 'O\'Brien<Jr>' }
        }]
      }
      const mismo = mapToMISMO(appWithSpecialChars)
      const xml = mismoToXML(mismo)

      expect(xml).toContain('&amp;')
      expect(xml).toContain('&apos;')
      expect(xml).toContain('&lt;')
      expect(xml).toContain('&gt;')
    })
  })
})
