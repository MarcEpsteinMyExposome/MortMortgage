import {
  validateIdentityStep,
  validateAddressStep,
  validateEmploymentStep,
  validateAssetsStep,
  validateLiabilitiesStep,
  validatePropertyStep,
  validateLoanStep,
  validateDeclarationsStep,
  validateRealEstateStep,
  validateStep,
  validateAllSteps,
  isApplicationComplete,
  type ValidationResult
} from '../lib/form-validator'

describe('Form Validator', () => {
  describe('validateIdentityStep', () => {
    it('should pass with valid identity data', () => {
      const data = {
        borrowers: [{
          name: { firstName: 'John', lastName: 'Doe' },
          citizenship: 'us_citizen',
          ssn: '123-45-6789',
          dob: '1990-01-15',
          contact: { email: 'john@example.com' }
        }]
      }
      const result = validateIdentityStep(data)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail when first name is missing', () => {
      const data = {
        borrowers: [{
          name: { lastName: 'Doe' },
          citizenship: 'us_citizen'
        }]
      }
      const result = validateIdentityStep(data)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('First name is required')
    })

    it('should fail when last name is missing', () => {
      const data = {
        borrowers: [{
          name: { firstName: 'John' },
          citizenship: 'us_citizen'
        }]
      }
      const result = validateIdentityStep(data)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Last name is required')
    })

    it('should fail when citizenship is missing', () => {
      const data = {
        borrowers: [{
          name: { firstName: 'John', lastName: 'Doe' }
        }]
      }
      const result = validateIdentityStep(data)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Citizenship status is required')
    })

    it('should fail with invalid SSN format', () => {
      const data = {
        borrowers: [{
          name: { firstName: 'John', lastName: 'Doe' },
          citizenship: 'us_citizen',
          ssn: '12345678' // Invalid format
        }]
      }
      const result = validateIdentityStep(data)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('SSN must be in XXX-XX-XXXX format')
    })

    it('should warn when DOB is missing', () => {
      const data = {
        borrowers: [{
          name: { firstName: 'John', lastName: 'Doe' },
          citizenship: 'us_citizen',
          contact: { email: 'john@example.com' }
        }]
      }
      const result = validateIdentityStep(data)
      expect(result.valid).toBe(true)
      expect(result.warnings).toContain('Date of birth not provided')
    })

    it('should warn when email is missing', () => {
      const data = {
        borrowers: [{
          name: { firstName: 'John', lastName: 'Doe' },
          citizenship: 'us_citizen',
          dob: '1990-01-15'
        }]
      }
      const result = validateIdentityStep(data)
      expect(result.valid).toBe(true)
      expect(result.warnings).toContain('Email not provided')
    })

    it('should handle empty borrowers array', () => {
      const data = { borrowers: [] }
      const result = validateIdentityStep(data)
      expect(result.valid).toBe(false)
    })

    it('should handle undefined data', () => {
      const result = validateIdentityStep({})
      expect(result.valid).toBe(false)
    })
  })

  describe('validateAddressStep', () => {
    it('should pass with valid address data', () => {
      const data = {
        borrowers: [{
          currentAddress: {
            address: {
              street: '123 Main St',
              city: 'Springfield',
              state: 'IL',
              zip: '62701'
            },
            housingType: 'rent',
            monthlyRent: 1500,
            durationYears: 3,
            durationMonths: 0
          }
        }]
      }
      const result = validateAddressStep(data)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail when street is missing', () => {
      const data = {
        borrowers: [{
          currentAddress: {
            address: { city: 'Springfield', state: 'IL', zip: '62701' },
            housingType: 'own'
          }
        }]
      }
      const result = validateAddressStep(data)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Street address is required')
    })

    it('should fail with invalid ZIP format', () => {
      const data = {
        borrowers: [{
          currentAddress: {
            address: {
              street: '123 Main St',
              city: 'Springfield',
              state: 'IL',
              zip: '1234' // Invalid
            },
            housingType: 'own'
          }
        }]
      }
      const result = validateAddressStep(data)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Invalid ZIP format')
    })

    it('should accept ZIP+4 format', () => {
      const data = {
        borrowers: [{
          currentAddress: {
            address: {
              street: '123 Main St',
              city: 'Springfield',
              state: 'IL',
              zip: '62701-1234'
            },
            housingType: 'own',
            durationYears: 5
          }
        }]
      }
      const result = validateAddressStep(data)
      expect(result.valid).toBe(true)
    })

    it('should require monthly rent when housing type is rent', () => {
      const data = {
        borrowers: [{
          currentAddress: {
            address: {
              street: '123 Main St',
              city: 'Springfield',
              state: 'IL',
              zip: '62701'
            },
            housingType: 'rent'
          }
        }]
      }
      const result = validateAddressStep(data)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Monthly rent is required')
    })

    it('should warn when duration is less than 2 years', () => {
      const data = {
        borrowers: [{
          currentAddress: {
            address: {
              street: '123 Main St',
              city: 'Springfield',
              state: 'IL',
              zip: '62701'
            },
            housingType: 'own',
            durationYears: 1,
            durationMonths: 6
          }
        }]
      }
      const result = validateAddressStep(data)
      expect(result.valid).toBe(true)
      expect(result.warnings).toContain('Less than 2 years at current address - previous address may be required')
    })
  })

  describe('validateEmploymentStep', () => {
    it('should pass with valid employment data', () => {
      const data = {
        borrowers: [{
          employment: [{
            current: true,
            employerName: 'Acme Corp',
            monthlyIncome: 8000
          }]
        }]
      }
      const result = validateEmploymentStep(data)
      expect(result.valid).toBe(true)
    })

    it('should fail when no employment records', () => {
      const data = {
        borrowers: [{ employment: [] }]
      }
      const result = validateEmploymentStep(data)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('At least one employment record is required')
    })

    it('should fail when no current employment', () => {
      const data = {
        borrowers: [{
          employment: [{
            current: false,
            employerName: 'Old Job',
            monthlyIncome: 5000
          }]
        }]
      }
      const result = validateEmploymentStep(data)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Current employment is required')
    })

    it('should fail when employer name is missing', () => {
      const data = {
        borrowers: [{
          employment: [{
            current: true,
            monthlyIncome: 8000
          }]
        }]
      }
      const result = validateEmploymentStep(data)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Employer name is required')
    })

    it('should fail when monthly income is zero or missing', () => {
      const data = {
        borrowers: [{
          employment: [{
            current: true,
            employerName: 'Acme Corp',
            monthlyIncome: 0
          }]
        }]
      }
      const result = validateEmploymentStep(data)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Monthly income is required')
    })

    it('should warn when income is low', () => {
      const data = {
        borrowers: [{
          employment: [{
            current: true,
            employerName: 'Part Time Job',
            monthlyIncome: 500
          }]
        }]
      }
      const result = validateEmploymentStep(data)
      expect(result.valid).toBe(true)
      expect(result.warnings).toContain('Monthly income appears low for mortgage qualification')
    })

    it('should handle employment as non-array (defensive)', () => {
      const data = {
        borrowers: [{
          employment: { current: true, employerName: 'Test' } // Object instead of array
        }]
      }
      const result = validateEmploymentStep(data)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('At least one employment record is required')
    })
  })

  describe('validateAssetsStep', () => {
    it('should pass with valid assets', () => {
      const data = {
        assets: {
          assets: [
            { type: 'checking', balance: 25000 },
            { type: 'savings', balance: 50000 }
          ]
        }
      }
      const result = validateAssetsStep(data)
      expect(result.valid).toBe(true)
    })

    it('should warn when no assets listed', () => {
      const data = { assets: { assets: [] } }
      const result = validateAssetsStep(data)
      expect(result.valid).toBe(true)
      expect(result.warnings).toContain('No assets listed - this may affect loan qualification')
    })

    it('should warn when assets less than down payment', () => {
      const data = {
        assets: {
          assets: [{ type: 'checking', balance: 10000 }]
        },
        loan: {
          loanAmount: 280000,
          downPayment: { amount: 50000 }
        }
      }
      const result = validateAssetsStep(data)
      expect(result.valid).toBe(true)
      expect(result.warnings).toContain('Total assets are less than down payment amount')
    })
  })

  describe('validateLiabilitiesStep', () => {
    it('should pass with valid liabilities', () => {
      const data = {
        liabilities: {
          liabilities: [
            { type: 'credit_card', monthlyPayment: 200 }
          ]
        },
        borrowers: [{
          employment: [{ current: true, monthlyIncome: 8000 }]
        }]
      }
      const result = validateLiabilitiesStep(data)
      expect(result.valid).toBe(true)
    })

    it('should warn when DTI exceeds 43%', () => {
      const data = {
        liabilities: {
          liabilities: [
            { type: 'credit_card', monthlyPayment: 4000 }
          ]
        },
        borrowers: [{
          employment: [{ current: true, monthlyIncome: 8000 }]
        }]
      }
      const result = validateLiabilitiesStep(data)
      expect(result.valid).toBe(true)
      expect(result.warnings.some(w => w.includes('Debt-to-income ratio'))).toBe(true)
    })
  })

  describe('validatePropertyStep', () => {
    it('should pass with valid property data', () => {
      const data = {
        property: {
          address: {
            street: '789 Oak St',
            city: 'Chicago',
            state: 'IL',
            zip: '60601'
          },
          propertyType: 'single_family',
          propertyValue: 350000,
          occupancy: 'primary_residence'
        }
      }
      const result = validatePropertyStep(data)
      expect(result.valid).toBe(true)
    })

    it('should fail when property address is incomplete', () => {
      const data = {
        property: {
          address: { street: '789 Oak St' },
          propertyType: 'single_family',
          propertyValue: 350000,
          occupancy: 'primary_residence'
        }
      }
      const result = validatePropertyStep(data)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Property city is required')
      expect(result.errors).toContain('Property state is required')
      expect(result.errors).toContain('Property ZIP code is required')
    })

    it('should fail when property value is missing', () => {
      const data = {
        property: {
          address: {
            street: '789 Oak St',
            city: 'Chicago',
            state: 'IL',
            zip: '60601'
          },
          propertyType: 'single_family',
          occupancy: 'primary_residence'
        }
      }
      const result = validatePropertyStep(data)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Property value is required')
    })
  })

  describe('validateLoanStep', () => {
    it('should pass with valid loan data', () => {
      const data = {
        loan: {
          loanPurpose: 'purchase',
          loanType: 'conventional',
          loanAmount: 280000
        },
        property: { propertyValue: 350000 }
      }
      const result = validateLoanStep(data)
      expect(result.valid).toBe(true)
    })

    it('should fail when LTV exceeds 97%', () => {
      const data = {
        loan: {
          loanPurpose: 'purchase',
          loanType: 'conventional',
          loanAmount: 350000 // 100% LTV
        },
        property: { propertyValue: 350000 }
      }
      const result = validateLoanStep(data)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('LTV cannot exceed 97%')
    })

    it('should warn when LTV over 80% (PMI required)', () => {
      const data = {
        loan: {
          loanPurpose: 'purchase',
          loanType: 'conventional',
          loanAmount: 315000 // 90% LTV
        },
        property: { propertyValue: 350000 }
      }
      const result = validateLoanStep(data)
      expect(result.valid).toBe(true)
      expect(result.warnings).toContain('LTV over 80% - PMI may be required')
    })

    it('should warn when down payment mismatch', () => {
      const data = {
        loan: {
          loanPurpose: 'purchase',
          loanType: 'conventional',
          loanAmount: 280000,
          downPayment: { amount: 50000 } // Should be 70000
        },
        property: { propertyValue: 350000 }
      }
      const result = validateLoanStep(data)
      expect(result.valid).toBe(true)
      expect(result.warnings).toContain('Down payment does not match difference between property value and loan amount')
    })
  })

  describe('validateDeclarationsStep', () => {
    it('should pass with clean declarations', () => {
      const data = {
        declarations: {
          declarations: {
            outstandingJudgments: false,
            declaredBankruptcy: false
          }
        }
      }
      const result = validateDeclarationsStep(data)
      expect(result.valid).toBe(true)
      expect(result.warnings).toHaveLength(0)
    })

    it('should warn when risk factors present', () => {
      const data = {
        declarations: {
          declarations: {
            outstandingJudgments: true,
            declaredBankruptcy: true,
            propertyForeclosed: false
          }
        }
      }
      const result = validateDeclarationsStep(data)
      expect(result.valid).toBe(true)
      expect(result.warnings.some(w => w.includes('declaration(s) may require additional documentation'))).toBe(true)
    })
  })

  describe('validateRealEstateStep', () => {
    it('should pass with no real estate owned', () => {
      const data = { realEstate: { propertiesOwned: [] } }
      const result = validateRealEstateStep(data)
      expect(result.valid).toBe(true)
    })

    it('should pass with valid real estate', () => {
      const data = {
        realEstate: {
          propertiesOwned: [{
            address: { street: '123 Main St' },
            propertyValue: 300000,
            status: 'retained'
          }]
        }
      }
      const result = validateRealEstateStep(data)
      expect(result.valid).toBe(true)
    })

    it('should fail when property value missing', () => {
      const data = {
        realEstate: {
          propertiesOwned: [{
            address: { street: '123 Main St' },
            status: 'retained'
          }]
        }
      }
      const result = validateRealEstateStep(data)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('Property value required'))).toBe(true)
    })
  })

  describe('validateStep (dispatcher)', () => {
    it('should route to correct validator', () => {
      const data = {
        borrowers: [{
          name: { firstName: 'John', lastName: 'Doe' },
          citizenship: 'us_citizen'
        }]
      }
      const result = validateStep('identity', data)
      expect(result.valid).toBe(true)
    })

    it('should return valid for unknown step', () => {
      const result = validateStep('unknown_step', {})
      expect(result.valid).toBe(true)
    })
  })

  describe('validateAllSteps', () => {
    it('should validate all steps and return results', () => {
      const data = {
        borrowers: [{
          name: { firstName: 'John', lastName: 'Doe' },
          citizenship: 'us_citizen'
        }]
      }
      const results = validateAllSteps(data)
      expect(results.length).toBeGreaterThan(0)
      expect(results.find(r => r.stepId === 'identity')).toBeDefined()
    })
  })

  describe('isApplicationComplete', () => {
    it('should return false for incomplete application', () => {
      const data = { borrowers: [] }
      expect(isApplicationComplete(data)).toBe(false)
    })
  })
})
