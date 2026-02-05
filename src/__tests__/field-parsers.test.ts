import {
  parseCurrency,
  parseDate,
  maskSSN,
  isValidSSNFormat,
  parsePercentage,
  parseAccountNumber,
  getAccountLast4,
  parseName,
  normalizeName,
  parseAddress,
  normalizeAddress,
  normalizeState,
  calculateConfidence,
  normalizeExtraction,
  createField,
  type SupportedDocumentType,
} from '../lib/ocr/field-parsers'

describe('Field Parsers', () => {
  describe('parseCurrency', () => {
    it('should parse standard currency formats', () => {
      expect(parseCurrency('$1,234.56')).toBe(1234.56)
      expect(parseCurrency('$1234')).toBe(1234)
      expect(parseCurrency('1,234')).toBe(1234)
      expect(parseCurrency('1234.00')).toBe(1234)
    })

    it('should handle currency with code suffix', () => {
      expect(parseCurrency('$1,234.56 USD')).toBe(1234.56)
      expect(parseCurrency('$5000 usd')).toBe(5000)
    })

    it('should handle negative values', () => {
      expect(parseCurrency('-$1,234.56')).toBe(-1234.56)
      expect(parseCurrency('($1,234.56)')).toBe(-1234.56)
    })

    it('should handle other currency symbols', () => {
      expect(parseCurrency('€1,234.56')).toBe(1234.56)
      expect(parseCurrency('£500')).toBe(500)
    })

    it('should return null for invalid values', () => {
      expect(parseCurrency(null)).toBeNull()
      expect(parseCurrency(undefined)).toBeNull()
      expect(parseCurrency('')).toBeNull()
      expect(parseCurrency('invalid')).toBeNull()
      expect(parseCurrency('abc123')).toBeNull()
    })

    it('should handle whitespace', () => {
      expect(parseCurrency('  $1,234.56  ')).toBe(1234.56)
    })
  })

  describe('parseDate', () => {
    it('should parse ISO format', () => {
      expect(parseDate('2026-01-15')).toBe('2026-01-15')
    })

    it('should parse US format MM/DD/YYYY', () => {
      expect(parseDate('01/15/2026')).toBe('2026-01-15')
      expect(parseDate('1/15/2026')).toBe('2026-01-15')
    })

    it('should parse 2-digit years', () => {
      expect(parseDate('1/15/26')).toBe('2026-01-15')
      expect(parseDate('1/15/99')).toBe('1999-01-15')
    })

    it('should parse month name formats', () => {
      expect(parseDate('January 15, 2026')).toBe('2026-01-15')
      expect(parseDate('Jan 15, 2026')).toBe('2026-01-15')
      expect(parseDate('15 January 2026')).toBe('2026-01-15')
    })

    it('should parse dash-separated format', () => {
      expect(parseDate('01-15-2026')).toBe('2026-01-15')
    })

    it('should return null for invalid dates', () => {
      expect(parseDate(null)).toBeNull()
      expect(parseDate(undefined)).toBeNull()
      expect(parseDate('')).toBeNull()
      expect(parseDate('invalid')).toBeNull()
      expect(parseDate('13/45/2026')).toBeNull() // invalid month/day
    })

    it('should validate date rollover', () => {
      expect(parseDate('02/30/2026')).toBeNull() // Feb 30 doesn't exist
    })
  })

  describe('maskSSN', () => {
    it('should mask full SSN', () => {
      expect(maskSSN('123-45-6789')).toBe('****6789')
      expect(maskSSN('123456789')).toBe('****6789')
    })

    it('should handle already masked SSN', () => {
      expect(maskSSN('****6789')).toBe('****6789')
      expect(maskSSN('XXX-XX-6789')).toBe('****6789')
    })

    it('should return null for invalid values', () => {
      expect(maskSSN(null)).toBeNull()
      expect(maskSSN(undefined)).toBeNull()
      expect(maskSSN('')).toBeNull()
      expect(maskSSN('123')).toBeNull() // too short
    })
  })

  describe('isValidSSNFormat', () => {
    it('should validate proper SSN format', () => {
      expect(isValidSSNFormat('234-56-7890')).toBe(true)
      expect(isValidSSNFormat('234567890')).toBe(true)
      expect(isValidSSNFormat('078-05-1120')).toBe(true) // Valid format
    })

    it('should reject invalid SSNs', () => {
      expect(isValidSSNFormat(null)).toBe(false)
      expect(isValidSSNFormat('000-00-0000')).toBe(false) // all zeros
      expect(isValidSSNFormat('666-12-3456')).toBe(false) // starts with 666
      expect(isValidSSNFormat('900-12-3456')).toBe(false) // starts with 9
      expect(isValidSSNFormat('123-45-678')).toBe(false) // too short
    })
  })

  describe('parsePercentage', () => {
    it('should parse percentage with symbol', () => {
      expect(parsePercentage('4.5%')).toBe(4.5)
      expect(parsePercentage('4.5 %')).toBe(4.5)
      expect(parsePercentage('100%')).toBe(100)
    })

    it('should parse percentage word', () => {
      expect(parsePercentage('4.5 percent')).toBe(4.5)
    })

    it('should handle decimal format', () => {
      expect(parsePercentage('0.045')).toBe(4.5)
      expect(parsePercentage('0.5')).toBe(50)
    })

    it('should handle plain numbers as percentages', () => {
      expect(parsePercentage('4.5')).toBe(4.5)
      expect(parsePercentage('50')).toBe(50)
    })

    it('should return null for invalid values', () => {
      expect(parsePercentage(null)).toBeNull()
      expect(parsePercentage('')).toBeNull()
      expect(parsePercentage('abc')).toBeNull()
    })
  })

  describe('parseAccountNumber', () => {
    it('should mask and return last 4 digits', () => {
      expect(parseAccountNumber('1234567890')).toBe('****7890')
      expect(parseAccountNumber('****1234')).toBe('****1234')
      expect(parseAccountNumber('XXXX1234')).toBe('****1234')
    })

    it('should handle various formats', () => {
      expect(parseAccountNumber('...1234')).toBe('****1234')
      expect(parseAccountNumber('Account: 1234567890')).toBe('****7890')
    })

    it('should return null for invalid values', () => {
      expect(parseAccountNumber(null)).toBeNull()
      expect(parseAccountNumber('')).toBeNull()
      expect(parseAccountNumber('123')).toBeNull() // too short
    })
  })

  describe('getAccountLast4', () => {
    it('should return only last 4 digits', () => {
      expect(getAccountLast4('1234567890')).toBe('7890')
      expect(getAccountLast4('****1234')).toBe('1234')
    })

    it('should return null for invalid values', () => {
      expect(getAccountLast4(null)).toBeNull()
      expect(getAccountLast4('12')).toBeNull()
    })
  })

  describe('parseName', () => {
    it('should parse simple names', () => {
      const result = parseName('John Doe')
      expect(result?.first).toBe('John')
      expect(result?.last).toBe('Doe')
      expect(result?.full).toBe('John Doe')
    })

    it('should handle LAST, FIRST format', () => {
      const result = parseName('SMITH, JOHN')
      expect(result?.first).toBe('John')
      expect(result?.last).toBe('Smith')
    })

    it('should handle middle names', () => {
      const result = parseName('John Michael Doe')
      expect(result?.first).toBe('John')
      expect(result?.middle).toBe('Michael')
      expect(result?.last).toBe('Doe')
    })

    it('should handle suffixes', () => {
      const result = parseName('John Doe Jr.')
      expect(result?.first).toBe('John')
      expect(result?.last).toBe('Doe')
      expect(result?.suffix).toBe('Jr.')
    })

    it('should convert to title case', () => {
      const result = parseName('JOHN DOE')
      expect(result?.full).toBe('John Doe')
    })

    it('should return null for invalid values', () => {
      expect(parseName(null)).toBeNull()
      expect(parseName('')).toBeNull()
      expect(parseName('   ')).toBeNull()
    })
  })

  describe('normalizeName', () => {
    it('should return full normalized name', () => {
      expect(normalizeName('SMITH, JOHN')).toBe('John Smith')
      expect(normalizeName('john doe')).toBe('John Doe')
    })
  })

  describe('parseAddress', () => {
    it('should parse complete address', () => {
      const result = parseAddress('123 Main St, New York, NY 10001')
      expect(result?.street).toBe('123 Main St')
      expect(result?.city).toBe('New York')
      expect(result?.state).toBe('NY')
      expect(result?.zip).toBe('10001')
    })

    it('should handle unit numbers', () => {
      const result = parseAddress('123 Main St, Apt 4, Boston, MA 02101')
      expect(result?.street).toBe('123 Main St')
      expect(result?.unit).toBe('Apt 4')
      expect(result?.city).toBe('Boston')
    })

    it('should handle ZIP+4', () => {
      const result = parseAddress('123 Main St, Chicago, IL 60601-1234')
      expect(result?.zip).toBe('60601-1234')
    })

    it('should normalize state names', () => {
      const result = parseAddress('123 Main St, Los Angeles, California 90001')
      expect(result?.state).toBe('CA')
    })

    it('should return null for invalid values', () => {
      expect(parseAddress(null)).toBeNull()
      expect(parseAddress('')).toBeNull()
    })
  })

  describe('normalizeState', () => {
    it('should return abbreviation for state names', () => {
      expect(normalizeState('California')).toBe('CA')
      expect(normalizeState('new york')).toBe('NY')
    })

    it('should validate existing abbreviations', () => {
      expect(normalizeState('CA')).toBe('CA')
      expect(normalizeState('ny')).toBe('NY')
    })

    it('should return null for invalid states', () => {
      expect(normalizeState('XX')).toBeNull()
      expect(normalizeState('Invalid State')).toBeNull()
    })
  })

  describe('calculateConfidence', () => {
    it('should calculate weighted average', () => {
      const result = calculateConfidence({
        name: 0.9,
        ssn: 0.8,
        address: 0.7,
      })
      expect(result).toBeGreaterThan(0)
      expect(result).toBeLessThanOrEqual(1)
    })

    it('should return 0 for empty input', () => {
      expect(calculateConfidence({})).toBe(0)
    })

    it('should clamp confidence values', () => {
      const result = calculateConfidence({
        name: 1.5, // over 1
        ssn: -0.5, // under 0
      })
      expect(result).toBeGreaterThanOrEqual(0)
      expect(result).toBeLessThanOrEqual(1)
    })
  })

  describe('normalizeExtraction', () => {
    it('should normalize W2 extraction', () => {
      const raw = {
        employeeName: { value: 'JOHN DOE', confidence: 0.95 },
        wagesTips: { value: '$50,000.00', confidence: 0.90 },
        employeeSSN: { value: '123-45-6789', confidence: 0.85 },
      }

      const result = normalizeExtraction(raw, 'w2')

      expect(result.documentType).toBe('w2')
      expect(result.fields.employeeName.parsed).toBe('John Doe')
      expect(result.fields.wagesTips.parsed).toBe(50000)
      expect(result.fields.employeeSSN.parsed).toBe('****6789')
      expect(result.overallConfidence).toBeGreaterThan(0)
    })

    it('should normalize paystub extraction', () => {
      const raw = {
        grossPay: { value: '$5,000.00', confidence: 0.92 },
        payDate: { value: '01/15/2026', confidence: 0.88 },
      }

      const result = normalizeExtraction(raw, 'paystub')

      expect(result.fields.grossPay.parsed).toBe(5000)
      expect(result.fields.payDate.parsed).toBe('2026-01-15')
    })

    it('should handle unknown fields gracefully', () => {
      const raw = {
        unknownField: { value: '  some value  ', confidence: 0.80 },
      }

      const result = normalizeExtraction(raw, 'other')

      expect(result.fields.unknownField.parsed).toBe('some value')
    })

    it('should include extractedAt timestamp', () => {
      const result = normalizeExtraction({}, 'w2')
      expect(result.extractedAt).toBeDefined()
      expect(new Date(result.extractedAt).getTime()).not.toBeNaN()
    })
  })

  describe('createField', () => {
    it('should create field with parsed value', () => {
      const field = createField('amount', '$1,234.56', parseCurrency, 0.95)

      expect(field.raw).toBe('$1,234.56')
      expect(field.parsed).toBe(1234.56)
      expect(field.confidence.value).toBe(0.95)
      expect(field.confidence.source).toBe('manual')
      expect(field.fieldName).toBe('amount')
    })

    it('should handle null values', () => {
      const field = createField('amount', null, parseCurrency)

      expect(field.raw).toBeNull()
      expect(field.parsed).toBeNull()
    })

    it('should default confidence to 1.0', () => {
      const field = createField('amount', '$100', parseCurrency)
      expect(field.confidence.value).toBe(1.0)
    })
  })
})
