import {
  getCreditRiskBadge,
  getDTIRiskBadge,
  getLTVRiskBadge,
  getIncomeRiskBadge,
  getPropertyConfidenceRiskBadge,
  calculateQualification,
  formatCurrency,
  formatPercent,
  formatDateTime,
  getQualificationBadge
} from '../lib/underwriting-utils'
import type { UnderwritingData } from '../types/underwriting'

describe('Underwriting Utils', () => {
  describe('getCreditRiskBadge', () => {
    it('should return low risk for scores >= 740', () => {
      const badge = getCreditRiskBadge(750)
      expect(badge.level).toBe('low')
      expect(badge.label).toBe('Excellent')
      expect(badge.colorClass).toContain('green')
    })

    it('should return medium risk for scores 680-739', () => {
      const badge = getCreditRiskBadge(700)
      expect(badge.level).toBe('medium')
      expect(badge.label).toBe('Good')
      expect(badge.colorClass).toContain('yellow')
    })

    it('should return high risk for scores < 680', () => {
      const badge = getCreditRiskBadge(620)
      expect(badge.level).toBe('high')
      expect(badge.label).toBe('Below Standard')
      expect(badge.colorClass).toContain('red')
    })

    it('should handle boundary cases', () => {
      expect(getCreditRiskBadge(740).level).toBe('low')
      expect(getCreditRiskBadge(739).level).toBe('medium')
      expect(getCreditRiskBadge(680).level).toBe('medium')
      expect(getCreditRiskBadge(679).level).toBe('high')
    })
  })

  describe('getDTIRiskBadge', () => {
    it('should return low risk for DTI <= 36%', () => {
      const badge = getDTIRiskBadge(30)
      expect(badge.level).toBe('low')
      expect(badge.label).toBe('Low DTI')
    })

    it('should return medium risk for DTI 37-43%', () => {
      const badge = getDTIRiskBadge(40)
      expect(badge.level).toBe('medium')
      expect(badge.label).toBe('Acceptable')
    })

    it('should return high risk for DTI > 43%', () => {
      const badge = getDTIRiskBadge(50)
      expect(badge.level).toBe('high')
      expect(badge.label).toBe('High DTI')
    })

    it('should handle boundary cases', () => {
      expect(getDTIRiskBadge(36).level).toBe('low')
      expect(getDTIRiskBadge(37).level).toBe('medium')
      expect(getDTIRiskBadge(43).level).toBe('medium')
      expect(getDTIRiskBadge(44).level).toBe('high')
    })
  })

  describe('getLTVRiskBadge', () => {
    it('should return low risk (No PMI) for LTV <= 80%', () => {
      const badge = getLTVRiskBadge(75)
      expect(badge.level).toBe('low')
      expect(badge.label).toBe('No PMI')
    })

    it('should return medium risk (PMI Required) for LTV 81-95%', () => {
      const badge = getLTVRiskBadge(90)
      expect(badge.level).toBe('medium')
      expect(badge.label).toBe('PMI Required')
    })

    it('should return high risk for LTV > 95%', () => {
      const badge = getLTVRiskBadge(97)
      expect(badge.level).toBe('high')
      expect(badge.label).toBe('High LTV')
    })

    it('should handle boundary cases', () => {
      expect(getLTVRiskBadge(80).level).toBe('low')
      expect(getLTVRiskBadge(81).level).toBe('medium')
      expect(getLTVRiskBadge(95).level).toBe('medium')
      expect(getLTVRiskBadge(96).level).toBe('high')
    })
  })

  describe('getIncomeRiskBadge', () => {
    it('should return low risk for Verified income', () => {
      const badge = getIncomeRiskBadge('Verified')
      expect(badge.level).toBe('low')
      expect(badge.label).toBe('Verified')
    })

    it('should return medium risk for Discrepancy Found', () => {
      const badge = getIncomeRiskBadge('Discrepancy Found')
      expect(badge.level).toBe('medium')
      expect(badge.label).toBe('Discrepancy')
    })

    it('should return high risk for Unable to Verify', () => {
      const badge = getIncomeRiskBadge('Unable to Verify')
      expect(badge.level).toBe('high')
      expect(badge.label).toBe('Unverified')
    })
  })

  describe('getPropertyConfidenceRiskBadge', () => {
    it('should return low risk for High confidence', () => {
      const badge = getPropertyConfidenceRiskBadge('High')
      expect(badge.level).toBe('low')
      expect(badge.label).toBe('High Confidence')
    })

    it('should return medium risk for Medium confidence', () => {
      const badge = getPropertyConfidenceRiskBadge('Medium')
      expect(badge.level).toBe('medium')
      expect(badge.label).toBe('Medium Confidence')
    })

    it('should return high risk for Low confidence', () => {
      const badge = getPropertyConfidenceRiskBadge('Low')
      expect(badge.level).toBe('high')
      expect(badge.label).toBe('Low Confidence')
    })
  })

  describe('calculateQualification', () => {
    it('should return pending when no checks run', () => {
      const underwriting: UnderwritingData = {}
      const result = calculateQualification(underwriting)
      expect(result.status).toBe('pending')
      expect(result.reasons).toContain('Run underwriting checks to determine qualification')
    })

    it('should return qualified when all checks pass', () => {
      const underwriting: UnderwritingData = {
        credit: {
          result: {
            success: true,
            referenceNumber: 'CR-123',
            pullDate: new Date().toISOString(),
            scores: [],
            averageScore: 750,
            scoreCategory: 'Excellent',
            tradelines: [],
            totalDebt: 0,
            totalCreditLimit: 0,
            utilizationRate: 0,
            inquiries: 0,
            publicRecords: 0,
            collections: 0
          },
          pulledAt: new Date().toISOString()
        },
        income: {
          result: {
            success: true,
            referenceNumber: 'IV-123',
            verificationDate: new Date().toISOString(),
            employer: { name: 'Test Corp', verified: true },
            employment: {
              status: 'Verified',
              startDate: '2020-01-01',
              jobTitle: 'Engineer',
              employmentType: 'Full-Time'
            },
            income: {
              verified: true,
              statedAnnual: 120000,
              verifiedAnnual: 120000,
              variance: 0,
              variancePercent: 0,
              withinTolerance: true
            },
            notes: []
          },
          verifiedAt: new Date().toISOString()
        }
      }
      const result = calculateQualification(underwriting)
      expect(result.status).toBe('qualified')
    })

    it('should return not_qualified when credit score below 620', () => {
      const underwriting: UnderwritingData = {
        credit: {
          result: {
            success: true,
            referenceNumber: 'CR-123',
            pullDate: new Date().toISOString(),
            scores: [],
            averageScore: 580,
            scoreCategory: 'Poor',
            tradelines: [],
            totalDebt: 0,
            totalCreditLimit: 0,
            utilizationRate: 0,
            inquiries: 0,
            publicRecords: 0,
            collections: 0
          },
          pulledAt: new Date().toISOString()
        }
      }
      const result = calculateQualification(underwriting)
      expect(result.status).toBe('not_qualified')
      expect(result.reasons.some(r => r.includes('Credit score') && r.includes('below minimum'))).toBe(true)
    })

    it('should return conditionally_qualified when credit score below 680', () => {
      const underwriting: UnderwritingData = {
        credit: {
          result: {
            success: true,
            referenceNumber: 'CR-123',
            pullDate: new Date().toISOString(),
            scores: [],
            averageScore: 650,
            scoreCategory: 'Fair',
            tradelines: [],
            totalDebt: 0,
            totalCreditLimit: 0,
            utilizationRate: 0,
            inquiries: 0,
            publicRecords: 0,
            collections: 0
          },
          pulledAt: new Date().toISOString()
        }
      }
      const result = calculateQualification(underwriting)
      expect(result.status).toBe('conditionally_qualified')
      expect(result.reasons.some(r => r.includes('limit loan options'))).toBe(true)
    })

    it('should return not_qualified when income cannot be verified', () => {
      const underwriting: UnderwritingData = {
        income: {
          result: {
            success: false,
            referenceNumber: 'IV-123',
            verificationDate: new Date().toISOString(),
            employer: { name: 'Unknown Corp', verified: false },
            employment: {
              status: 'Unable to Verify',
              startDate: '2020-01-01',
              jobTitle: 'Unknown',
              employmentType: 'Full-Time'
            },
            income: {
              verified: false,
              statedAnnual: 120000,
              verifiedAnnual: 0,
              variance: 0,
              variancePercent: 0,
              withinTolerance: false
            },
            notes: []
          },
          verifiedAt: new Date().toISOString()
        }
      }
      const result = calculateQualification(underwriting)
      expect(result.status).toBe('not_qualified')
      expect(result.reasons).toContain('Income could not be verified')
    })
  })

  describe('formatCurrency', () => {
    it('should format currency values', () => {
      expect(formatCurrency(350000)).toBe('$350,000')
      expect(formatCurrency(1500.50)).toBe('$1,501') // Rounds to whole
      expect(formatCurrency(0)).toBe('$0')
    })
  })

  describe('formatPercent', () => {
    it('should format percentage values', () => {
      expect(formatPercent(6.75)).toBe('6.8%')
      expect(formatPercent(80)).toBe('80.0%')
      expect(formatPercent(43.123, 2)).toBe('43.12%')
    })
  })

  describe('formatDateTime', () => {
    it('should format ISO date strings', () => {
      const formatted = formatDateTime('2026-02-03T10:30:00.000Z')
      expect(formatted).toContain('Feb')
      expect(formatted).toContain('2026')
    })
  })

  describe('getQualificationBadge', () => {
    it('should return correct badge for qualified status', () => {
      const badge = getQualificationBadge('qualified')
      expect(badge.label).toBe('Qualified')
      expect(badge.colorClass).toContain('green')
    })

    it('should return correct badge for conditionally_qualified status', () => {
      const badge = getQualificationBadge('conditionally_qualified')
      expect(badge.label).toBe('Conditional')
      expect(badge.colorClass).toContain('yellow')
    })

    it('should return correct badge for not_qualified status', () => {
      const badge = getQualificationBadge('not_qualified')
      expect(badge.label).toBe('Not Qualified')
      expect(badge.colorClass).toContain('red')
    })

    it('should return correct badge for pending status', () => {
      const badge = getQualificationBadge('pending')
      expect(badge.label).toBe('Pending')
      expect(badge.colorClass).toContain('gray')
    })
  })
})
