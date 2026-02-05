/**
 * Field Parsing and Normalization Utilities for AI Document Intelligence
 *
 * These utilities parse and normalize extracted field values from OCR/document
 * processing pipelines into standardized formats for mortgage applications.
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Supported document types for extraction normalization
 */
export type SupportedDocumentType =
  | 'w2'
  | 'paystub'
  | 'bank_statement'
  | 'tax_return'
  | 'drivers_license'
  | 'passport'
  | 'social_security_card'
  | 'utility_bill'
  | '1099'
  | 'other'

/**
 * Confidence level for an extracted field
 */
export type FieldConfidence = {
  value: number // 0-1
  source: 'ocr' | 'ml' | 'rule' | 'manual'
}

/**
 * A single extracted field with its value and confidence
 */
export type ExtractedField<T = unknown> = {
  raw: string | null
  parsed: T | null
  confidence: FieldConfidence
  fieldName: string
}

/**
 * Parsed address components
 */
export type ParsedAddress = {
  street: string | null
  unit: string | null
  city: string | null
  state: string | null
  zip: string | null
  full: string
}

/**
 * Parsed name components
 */
export type ParsedName = {
  first: string | null
  middle: string | null
  last: string | null
  suffix: string | null
  full: string
}

/**
 * Document extraction result after normalization
 */
export type DocumentExtraction = {
  documentType: SupportedDocumentType
  extractedAt: string
  overallConfidence: number
  fields: Record<string, ExtractedField>
  rawData?: Record<string, unknown>
}

/**
 * Weight configuration for confidence calculation
 */
export type FieldWeights = Record<string, number>

// ============================================================================
// Currency Parser
// ============================================================================

/**
 * Parse currency strings into numeric values.
 *
 * Handles various formats:
 * - "$1,234.56" → 1234.56
 * - "$1234" → 1234
 * - "1,234" → 1234
 * - "1234.00" → 1234
 * - "$1,234.56 USD" → 1234.56
 * - "(1,234.56)" → -1234.56 (accounting negative)
 * - "-$1,234.56" → -1234.56
 *
 * @param value - The raw currency string to parse
 * @returns The numeric value or null if unparseable
 *
 * @example
 * parseCurrency("$1,234.56") // 1234.56
 * parseCurrency("$1234") // 1234
 * parseCurrency(null) // null
 * parseCurrency("invalid") // null
 */
export function parseCurrency(value: string | null | undefined): number | null {
  if (value === null || value === undefined || value.trim() === '') {
    return null
  }

  let cleaned = value.trim()

  // Check for accounting-style negative (parentheses)
  const isAccountingNegative = /^\(.*\)$/.test(cleaned)
  if (isAccountingNegative) {
    cleaned = cleaned.slice(1, -1)
  }

  // Check for regular negative sign
  const isNegative = cleaned.startsWith('-') || isAccountingNegative
  cleaned = cleaned.replace(/^-/, '')

  // Remove currency symbols and codes
  cleaned = cleaned.replace(/[$€£¥₹]/g, '')
  cleaned = cleaned.replace(/\s*(USD|EUR|GBP|CAD|AUD)\s*/gi, '')

  // Remove thousands separators (commas)
  cleaned = cleaned.replace(/,/g, '')

  // Remove any remaining whitespace
  cleaned = cleaned.trim()

  // Validate the remaining string is a valid number
  if (!/^\d+(\.\d+)?$/.test(cleaned)) {
    return null
  }

  const result = parseFloat(cleaned)

  if (isNaN(result)) {
    return null
  }

  return isNegative ? -result : result
}

// ============================================================================
// Date Parser
// ============================================================================

/**
 * Month name mappings for date parsing
 */
const MONTH_NAMES: Record<string, number> = {
  january: 0,
  jan: 0,
  february: 1,
  feb: 1,
  march: 2,
  mar: 2,
  april: 3,
  apr: 3,
  may: 4,
  june: 5,
  jun: 5,
  july: 6,
  jul: 6,
  august: 7,
  aug: 7,
  september: 8,
  sep: 8,
  sept: 8,
  october: 9,
  oct: 9,
  november: 10,
  nov: 10,
  december: 11,
  dec: 11,
}

/**
 * Parse various date formats into ISO date strings.
 *
 * Handles formats:
 * - "01/15/2026" (MM/DD/YYYY)
 * - "1/15/26" (M/D/YY)
 * - "January 15, 2026"
 * - "Jan 15, 2026"
 * - "15 January 2026"
 * - "2026-01-15" (ISO format)
 * - "01-15-2026" (MM-DD-YYYY)
 *
 * @param value - The raw date string to parse
 * @returns ISO date string (YYYY-MM-DD) or null if unparseable
 *
 * @example
 * parseDate("01/15/2026") // "2026-01-15"
 * parseDate("January 15, 2026") // "2026-01-15"
 * parseDate(null) // null
 */
export function parseDate(value: string | null | undefined): string | null {
  if (value === null || value === undefined || value.trim() === '') {
    return null
  }

  const cleaned = value.trim()

  // Try ISO format first (YYYY-MM-DD)
  const isoMatch = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (isoMatch) {
    const [, year, month, day] = isoMatch
    return formatISODate(parseInt(year), parseInt(month) - 1, parseInt(day))
  }

  // Try MM/DD/YYYY or MM-DD-YYYY format
  const usMatch = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/)
  if (usMatch) {
    const [, month, day, yearStr] = usMatch
    let year = parseInt(yearStr)
    // Handle 2-digit years (assume 2000s for 00-99)
    if (year < 100) {
      year = year >= 50 ? 1900 + year : 2000 + year
    }
    return formatISODate(year, parseInt(month) - 1, parseInt(day))
  }

  // Try "Month DD, YYYY" or "Month DD YYYY" format
  const monthNameMatch = cleaned.match(
    /^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/i
  )
  if (monthNameMatch) {
    const [, monthName, day, year] = monthNameMatch
    const monthNum = MONTH_NAMES[monthName.toLowerCase()]
    if (monthNum !== undefined) {
      return formatISODate(parseInt(year), monthNum, parseInt(day))
    }
  }

  // Try "DD Month YYYY" format
  const dayFirstMatch = cleaned.match(
    /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/i
  )
  if (dayFirstMatch) {
    const [, day, monthName, year] = dayFirstMatch
    const monthNum = MONTH_NAMES[monthName.toLowerCase()]
    if (monthNum !== undefined) {
      return formatISODate(parseInt(year), monthNum, parseInt(day))
    }
  }

  // Try Date constructor as last resort
  const parsed = new Date(cleaned)
  if (!isNaN(parsed.getTime())) {
    return formatISODate(
      parsed.getFullYear(),
      parsed.getMonth(),
      parsed.getDate()
    )
  }

  return null
}

/**
 * Format a date as ISO string, validating the date is real
 */
function formatISODate(year: number, month: number, day: number): string | null {
  // Validate ranges
  if (month < 0 || month > 11 || day < 1 || day > 31 || year < 1900 || year > 2100) {
    return null
  }

  const date = new Date(year, month, day)

  // Check the date didn't roll over (e.g., Feb 30 → Mar 2)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null
  }

  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')

  return `${yyyy}-${mm}-${dd}`
}

// ============================================================================
// SSN Masker
// ============================================================================

/**
 * Mask a Social Security Number, returning only the last 4 digits.
 *
 * IMPORTANT: This function NEVER returns or stores the full SSN.
 * It is designed to safely extract only the last 4 digits for display.
 *
 * @param value - The raw SSN (full or partial)
 * @returns Masked SSN in format "****1234" or null if no valid digits found
 *
 * @example
 * maskSSN("123-45-6789") // "****6789"
 * maskSSN("123456789") // "****6789"
 * maskSSN("****6789") // "****6789"
 * maskSSN(null) // null
 */
export function maskSSN(value: string | null | undefined): string | null {
  if (value === null || value === undefined || value.trim() === '') {
    return null
  }

  // Extract only digits from the value
  const digits = value.replace(/\D/g, '')

  // Need at least 4 digits to get last 4
  if (digits.length < 4) {
    return null
  }

  // Get last 4 digits only
  const last4 = digits.slice(-4)

  return `****${last4}`
}

/**
 * Validate that a value looks like an SSN (for verification, not storage).
 *
 * This does NOT return the SSN - only validates format.
 *
 * @param value - The raw value to check
 * @returns true if the value appears to be a valid SSN format
 */
export function isValidSSNFormat(value: string | null | undefined): boolean {
  if (value === null || value === undefined) {
    return false
  }

  const digits = value.replace(/\D/g, '')

  // Full SSN should have exactly 9 digits
  // Don't allow all zeros or sequential patterns
  if (digits.length !== 9) {
    return false
  }

  // Check for obviously invalid SSNs
  if (
    digits === '000000000' ||
    digits === '111111111' ||
    digits === '123456789' ||
    digits.startsWith('000') ||
    digits.startsWith('666') ||
    digits.startsWith('9')
  ) {
    return false
  }

  return true
}

// ============================================================================
// Percentage Parser
// ============================================================================

/**
 * Parse percentage values into a normalized percentage number.
 *
 * Handles formats:
 * - "4.5%" → 4.5
 * - "4.5" → 4.5 (assumes percentage)
 * - "0.045" → 4.5 (decimal converted to percentage)
 * - "4.5 %" → 4.5
 * - "4.5 percent" → 4.5
 *
 * @param value - The raw percentage string
 * @returns Percentage as a number (e.g., 4.5 for 4.5%) or null
 *
 * @example
 * parsePercentage("4.5%") // 4.5
 * parsePercentage("0.045") // 4.5
 * parsePercentage(null) // null
 */
export function parsePercentage(value: string | null | undefined): number | null {
  if (value === null || value === undefined || value.trim() === '') {
    return null
  }

  let cleaned = value.trim().toLowerCase()

  // Remove percent sign and word "percent"
  const hadPercentSymbol = cleaned.includes('%') || cleaned.includes('percent')
  cleaned = cleaned.replace(/%/g, '').replace(/percent/g, '').trim()

  // Parse the number
  const num = parseFloat(cleaned)

  if (isNaN(num)) {
    return null
  }

  // If the value is between 0 and 1 and didn't have a % symbol,
  // it's likely a decimal representation (0.045 = 4.5%)
  if (!hadPercentSymbol && num > 0 && num < 1) {
    return num * 100
  }

  return num
}

// ============================================================================
// Account Number Parser
// ============================================================================

/**
 * Extract and mask account numbers, returning only the last 4 digits.
 *
 * Handles formats:
 * - "****1234"
 * - "XXXX1234"
 * - "...1234"
 * - "1234567890" (full account)
 *
 * @param value - The raw account number
 * @returns Masked account in format "****1234" or null
 *
 * @example
 * parseAccountNumber("****1234") // "****1234"
 * parseAccountNumber("1234567890") // "****7890"
 * parseAccountNumber(null) // null
 */
export function parseAccountNumber(value: string | null | undefined): string | null {
  if (value === null || value === undefined || value.trim() === '') {
    return null
  }

  const cleaned = value.trim()

  // Extract only digits
  const digits = cleaned.replace(/\D/g, '')

  // Need at least 4 digits
  if (digits.length < 4) {
    return null
  }

  // Return masked format with last 4
  const last4 = digits.slice(-4)
  return `****${last4}`
}

/**
 * Extract just the last 4 digits of an account number as a string.
 *
 * @param value - The raw account number
 * @returns Last 4 digits or null
 */
export function getAccountLast4(value: string | null | undefined): string | null {
  if (value === null || value === undefined || value.trim() === '') {
    return null
  }

  const digits = value.replace(/\D/g, '')

  if (digits.length < 4) {
    return null
  }

  return digits.slice(-4)
}

// ============================================================================
// Name Normalizer
// ============================================================================

/**
 * Common name suffixes
 */
const NAME_SUFFIXES = ['jr', 'jr.', 'sr', 'sr.', 'ii', 'iii', 'iv', 'v', 'esq', 'phd', 'md']

/**
 * Normalize and parse a name string.
 *
 * Handles:
 * - Trimming whitespace
 * - "LAST, FIRST" → "First Last"
 * - Title case conversion
 * - Name suffixes (Jr., Sr., II, III, etc.)
 *
 * @param value - The raw name string
 * @returns Parsed name components and normalized full name, or null
 *
 * @example
 * parseName("SMITH, JOHN") // { first: "John", last: "Smith", full: "John Smith" }
 * parseName("john doe jr.") // { first: "John", last: "Doe", suffix: "Jr.", full: "John Doe Jr." }
 * parseName(null) // null
 */
export function parseName(value: string | null | undefined): ParsedName | null {
  if (value === null || value === undefined || value.trim() === '') {
    return null
  }

  let cleaned = value.trim()

  // Replace multiple spaces with single space
  cleaned = cleaned.replace(/\s+/g, ' ')

  // Check for "LAST, FIRST" or "LAST, FIRST MIDDLE" format
  let parts: string[]
  if (cleaned.includes(',')) {
    const [lastPart, ...restParts] = cleaned.split(',').map((s) => s.trim())
    const firstMiddle = restParts.join(' ').trim()
    parts = [...firstMiddle.split(' '), lastPart]
  } else {
    parts = cleaned.split(' ')
  }

  // Filter out empty parts
  parts = parts.filter((p) => p.length > 0)

  if (parts.length === 0) {
    return null
  }

  // Check for suffix in last part
  let suffix: string | null = null
  const lastPart = parts[parts.length - 1].toLowerCase().replace(/\.$/, '')
  if (NAME_SUFFIXES.includes(lastPart) || NAME_SUFFIXES.includes(lastPart + '.')) {
    suffix = toTitleCase(parts.pop()!)
  }

  // Parse name components
  let first: string | null = null
  let middle: string | null = null
  let last: string | null = null

  if (parts.length >= 1) {
    first = toTitleCase(parts[0])
  }
  if (parts.length >= 3) {
    middle = toTitleCase(parts.slice(1, -1).join(' '))
    last = toTitleCase(parts[parts.length - 1])
  } else if (parts.length === 2) {
    last = toTitleCase(parts[1])
  }

  // Build full name
  const fullParts = [first, middle, last, suffix].filter(Boolean)
  const full = fullParts.join(' ')

  return {
    first,
    middle,
    last,
    suffix,
    full,
  }
}

/**
 * Simple name normalizer that returns just the full normalized name.
 *
 * @param value - The raw name string
 * @returns Normalized full name or null
 */
export function normalizeName(value: string | null | undefined): string | null {
  const parsed = parseName(value)
  return parsed?.full ?? null
}

/**
 * Convert a string to title case.
 *
 * @param str - The string to convert
 * @returns Title-cased string
 */
function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => {
      if (word.length === 0) return word
      // Handle McName, O'Name, etc.
      if (word.startsWith('mc') && word.length > 2) {
        return 'Mc' + word.charAt(2).toUpperCase() + word.slice(3)
      }
      if (word.includes("'") && word.length > 2) {
        const [prefix, rest] = word.split("'")
        return prefix.charAt(0).toUpperCase() + prefix.slice(1) + "'" +
               (rest.charAt(0)?.toUpperCase() ?? '') + rest.slice(1)
      }
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

// ============================================================================
// Address Parser
// ============================================================================

/**
 * US State abbreviation mappings
 */
const STATE_ABBREVS: Record<string, string> = {
  alabama: 'AL',
  alaska: 'AK',
  arizona: 'AZ',
  arkansas: 'AR',
  california: 'CA',
  colorado: 'CO',
  connecticut: 'CT',
  delaware: 'DE',
  florida: 'FL',
  georgia: 'GA',
  hawaii: 'HI',
  idaho: 'ID',
  illinois: 'IL',
  indiana: 'IN',
  iowa: 'IA',
  kansas: 'KS',
  kentucky: 'KY',
  louisiana: 'LA',
  maine: 'ME',
  maryland: 'MD',
  massachusetts: 'MA',
  michigan: 'MI',
  minnesota: 'MN',
  mississippi: 'MS',
  missouri: 'MO',
  montana: 'MT',
  nebraska: 'NE',
  nevada: 'NV',
  'new hampshire': 'NH',
  'new jersey': 'NJ',
  'new mexico': 'NM',
  'new york': 'NY',
  'north carolina': 'NC',
  'north dakota': 'ND',
  ohio: 'OH',
  oklahoma: 'OK',
  oregon: 'OR',
  pennsylvania: 'PA',
  'rhode island': 'RI',
  'south carolina': 'SC',
  'south dakota': 'SD',
  tennessee: 'TN',
  texas: 'TX',
  utah: 'UT',
  vermont: 'VT',
  virginia: 'VA',
  washington: 'WA',
  'west virginia': 'WV',
  wisconsin: 'WI',
  wyoming: 'WY',
  'district of columbia': 'DC',
}

/**
 * Reverse state mapping (abbreviation to full name)
 */
const STATE_NAMES: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_ABBREVS).map(([name, abbrev]) => [abbrev, name])
)

/**
 * Parse and normalize a US address string.
 *
 * Attempts to extract:
 * - Street address (including number and street name)
 * - Unit/Apt number
 * - City
 * - State (normalized to abbreviation)
 * - ZIP code
 *
 * @param value - The raw address string
 * @returns Parsed address components or null
 *
 * @example
 * parseAddress("123 Main St, Apt 4, New York, NY 10001")
 * // { street: "123 Main St", unit: "Apt 4", city: "New York", state: "NY", zip: "10001", full: "..." }
 */
export function parseAddress(value: string | null | undefined): ParsedAddress | null {
  if (value === null || value === undefined || value.trim() === '') {
    return null
  }

  let cleaned = value.trim()

  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, ' ')

  // Initialize result
  const result: ParsedAddress = {
    street: null,
    unit: null,
    city: null,
    state: null,
    zip: null,
    full: cleaned,
  }

  // Try to extract ZIP code (5 digits or 5+4)
  const zipMatch = cleaned.match(/\b(\d{5})(?:-(\d{4}))?\s*$/i)
  if (zipMatch) {
    result.zip = zipMatch[2] ? `${zipMatch[1]}-${zipMatch[2]}` : zipMatch[1]
    cleaned = cleaned.slice(0, zipMatch.index).trim()
  }

  // Try to extract state (last word before ZIP, or 2-letter abbreviation)
  const stateMatch = cleaned.match(/,?\s*([A-Za-z]{2}|\w+(?:\s+\w+)?)\s*$/i)
  if (stateMatch) {
    const stateCandidate = stateMatch[1].toLowerCase()
    // Check if it's a state abbreviation
    if (stateCandidate.length === 2 && STATE_NAMES[stateCandidate.toUpperCase()]) {
      result.state = stateCandidate.toUpperCase()
      cleaned = cleaned.slice(0, stateMatch.index).trim().replace(/,\s*$/, '')
    } else if (STATE_ABBREVS[stateCandidate]) {
      result.state = STATE_ABBREVS[stateCandidate]
      cleaned = cleaned.slice(0, stateMatch.index).trim().replace(/,\s*$/, '')
    }
  }

  // Split remaining by comma
  const parts = cleaned.split(',').map((p) => p.trim()).filter(Boolean)

  if (parts.length >= 2) {
    // Last part is likely city
    result.city = toTitleCase(parts[parts.length - 1])

    // Check if second-to-last is unit
    const potentialUnit = parts.length >= 3 ? parts[parts.length - 2] : null
    if (potentialUnit && /^(apt|unit|suite|ste|#|bldg|building)\s*/i.test(potentialUnit)) {
      result.unit = potentialUnit
      result.street = parts.slice(0, -2).join(', ')
    } else {
      result.street = parts.slice(0, -1).join(', ')
    }
  } else if (parts.length === 1) {
    // Single part, assume it's the street
    result.street = parts[0]
  }

  // Check if street contains unit info (e.g., "123 Main St Apt 4")
  if (result.street && !result.unit) {
    const unitInStreet = result.street.match(
      /\s+(apt|unit|suite|ste|#|bldg|building)\.?\s*(\d+\w*)\s*$/i
    )
    if (unitInStreet) {
      result.unit = `${unitInStreet[1]} ${unitInStreet[2]}`
      result.street = result.street.slice(0, unitInStreet.index).trim()
    }
  }

  // Build normalized full address
  const fullParts = [
    result.street,
    result.unit,
    result.city,
    result.state,
    result.zip,
  ].filter(Boolean)
  result.full = fullParts.join(', ')

  return result
}

/**
 * Simple address normalizer that returns the normalized full address.
 *
 * @param value - The raw address string
 * @returns Normalized full address or null
 */
export function normalizeAddress(value: string | null | undefined): string | null {
  const parsed = parseAddress(value)
  return parsed?.full ?? null
}

/**
 * Normalize a state name or abbreviation to the 2-letter abbreviation.
 *
 * @param value - State name or abbreviation
 * @returns 2-letter state abbreviation or null
 */
export function normalizeState(value: string | null | undefined): string | null {
  if (value === null || value === undefined || value.trim() === '') {
    return null
  }

  const cleaned = value.trim().toLowerCase()

  // Check if already an abbreviation
  if (cleaned.length === 2 && STATE_NAMES[cleaned.toUpperCase()]) {
    return cleaned.toUpperCase()
  }

  // Try to find full name
  if (STATE_ABBREVS[cleaned]) {
    return STATE_ABBREVS[cleaned]
  }

  return null
}

// ============================================================================
// Confidence Calculator
// ============================================================================

/**
 * Default field weights for confidence calculation.
 * Higher weights indicate more important fields.
 */
const DEFAULT_FIELD_WEIGHTS: FieldWeights = {
  // Identity fields (high importance)
  ssn: 3.0,
  name: 2.5,
  dateOfBirth: 2.5,

  // Income fields (high importance)
  grossIncome: 3.0,
  netIncome: 2.5,
  employerName: 2.0,

  // Financial fields (high importance)
  accountBalance: 2.5,
  accountNumber: 2.0,

  // Address fields (medium importance)
  address: 1.5,
  city: 1.0,
  state: 1.0,
  zip: 1.0,

  // Other fields (standard importance)
  default: 1.0,
}

/**
 * Calculate overall confidence from individual field confidences.
 *
 * Uses weighted average where more important fields (like income, SSN)
 * have higher weights than less critical fields.
 *
 * @param fieldConfidences - Map of field names to their confidence scores (0-1)
 * @param weights - Optional custom weight configuration
 * @returns Overall confidence score (0-1)
 *
 * @example
 * calculateConfidence({
 *   name: 0.95,
 *   ssn: 0.90,
 *   address: 0.85,
 * }) // ~0.90 (weighted)
 */
export function calculateConfidence(
  fieldConfidences: Record<string, number>,
  weights: FieldWeights = DEFAULT_FIELD_WEIGHTS
): number {
  const entries = Object.entries(fieldConfidences)

  if (entries.length === 0) {
    return 0
  }

  let totalWeight = 0
  let weightedSum = 0

  for (const [field, confidence] of entries) {
    // Get weight for this field, falling back to default
    const weight = weights[field] ?? weights.default ?? 1.0

    // Clamp confidence to 0-1 range
    const clampedConfidence = Math.max(0, Math.min(1, confidence))

    totalWeight += weight
    weightedSum += weight * clampedConfidence
  }

  if (totalWeight === 0) {
    return 0
  }

  return weightedSum / totalWeight
}

/**
 * Calculate confidence from ExtractedField objects.
 *
 * @param fields - Record of ExtractedField objects
 * @param weights - Optional custom weight configuration
 * @returns Overall confidence score (0-1)
 */
export function calculateFieldsConfidence(
  fields: Record<string, ExtractedField>,
  weights: FieldWeights = DEFAULT_FIELD_WEIGHTS
): number {
  const confidenceMap: Record<string, number> = {}

  for (const [name, field] of Object.entries(fields)) {
    if (field.parsed !== null) {
      confidenceMap[name] = field.confidence.value
    }
  }

  return calculateConfidence(confidenceMap, weights)
}

// ============================================================================
// Document-Specific Extraction Normalizers
// ============================================================================

/**
 * Field parser configuration for each document type
 */
type FieldParserConfig = {
  parser: (value: string | null | undefined) => unknown
  weight: number
}

/**
 * Document type field configurations
 */
const DOCUMENT_FIELD_CONFIGS: Record<SupportedDocumentType, Record<string, FieldParserConfig>> = {
  w2: {
    employerName: { parser: normalizeName, weight: 2.0 },
    employerEIN: { parser: (v) => v?.replace(/\D/g, '') ?? null, weight: 1.5 },
    employerAddress: { parser: normalizeAddress, weight: 1.0 },
    employeeName: { parser: normalizeName, weight: 2.5 },
    employeeSSN: { parser: maskSSN, weight: 3.0 },
    employeeAddress: { parser: normalizeAddress, weight: 1.0 },
    wagesTips: { parser: parseCurrency, weight: 3.0 },
    federalTaxWithheld: { parser: parseCurrency, weight: 2.0 },
    socialSecurityWages: { parser: parseCurrency, weight: 2.0 },
    socialSecurityTax: { parser: parseCurrency, weight: 1.5 },
    medicareWages: { parser: parseCurrency, weight: 2.0 },
    medicareTax: { parser: parseCurrency, weight: 1.5 },
    taxYear: { parser: (v) => v?.replace(/\D/g, '') ?? null, weight: 2.0 },
  },

  paystub: {
    employeeName: { parser: normalizeName, weight: 2.5 },
    employeeSSN: { parser: maskSSN, weight: 3.0 },
    employerName: { parser: normalizeName, weight: 2.0 },
    payPeriodStart: { parser: parseDate, weight: 1.5 },
    payPeriodEnd: { parser: parseDate, weight: 1.5 },
    payDate: { parser: parseDate, weight: 2.0 },
    grossPay: { parser: parseCurrency, weight: 3.0 },
    netPay: { parser: parseCurrency, weight: 2.5 },
    ytdGross: { parser: parseCurrency, weight: 2.5 },
    ytdNet: { parser: parseCurrency, weight: 2.0 },
    federalTax: { parser: parseCurrency, weight: 1.5 },
    stateTax: { parser: parseCurrency, weight: 1.5 },
    hoursWorked: { parser: (v) => parseFloat(v ?? '') || null, weight: 1.0 },
    hourlyRate: { parser: parseCurrency, weight: 1.5 },
  },

  bank_statement: {
    accountHolderName: { parser: normalizeName, weight: 2.5 },
    accountNumber: { parser: parseAccountNumber, weight: 2.0 },
    bankName: { parser: (v) => v?.trim() ?? null, weight: 1.5 },
    statementPeriodStart: { parser: parseDate, weight: 1.5 },
    statementPeriodEnd: { parser: parseDate, weight: 1.5 },
    beginningBalance: { parser: parseCurrency, weight: 2.5 },
    endingBalance: { parser: parseCurrency, weight: 3.0 },
    totalDeposits: { parser: parseCurrency, weight: 2.0 },
    totalWithdrawals: { parser: parseCurrency, weight: 2.0 },
    averageDailyBalance: { parser: parseCurrency, weight: 2.0 },
  },

  tax_return: {
    taxpayerName: { parser: normalizeName, weight: 2.5 },
    taxpayerSSN: { parser: maskSSN, weight: 3.0 },
    spouseName: { parser: normalizeName, weight: 2.0 },
    spouseSSN: { parser: maskSSN, weight: 2.5 },
    taxYear: { parser: (v) => v?.replace(/\D/g, '') ?? null, weight: 2.0 },
    filingStatus: { parser: (v) => v?.trim().toLowerCase() ?? null, weight: 1.5 },
    totalIncome: { parser: parseCurrency, weight: 3.0 },
    adjustedGrossIncome: { parser: parseCurrency, weight: 3.0 },
    taxableIncome: { parser: parseCurrency, weight: 2.5 },
    totalTax: { parser: parseCurrency, weight: 2.0 },
    refundAmount: { parser: parseCurrency, weight: 1.5 },
    amountOwed: { parser: parseCurrency, weight: 1.5 },
  },

  drivers_license: {
    fullName: { parser: normalizeName, weight: 3.0 },
    licenseNumber: { parser: (v) => v?.replace(/\s/g, '') ?? null, weight: 2.5 },
    dateOfBirth: { parser: parseDate, weight: 3.0 },
    expirationDate: { parser: parseDate, weight: 2.0 },
    issueDate: { parser: parseDate, weight: 1.5 },
    address: { parser: normalizeAddress, weight: 2.0 },
    state: { parser: normalizeState, weight: 1.5 },
    sex: { parser: (v) => v?.trim().toUpperCase().charAt(0) ?? null, weight: 1.0 },
    height: { parser: (v) => v?.trim() ?? null, weight: 0.5 },
    eyeColor: { parser: (v) => v?.trim().toUpperCase() ?? null, weight: 0.5 },
  },

  passport: {
    fullName: { parser: normalizeName, weight: 3.0 },
    passportNumber: { parser: (v) => v?.replace(/\s/g, '') ?? null, weight: 2.5 },
    nationality: { parser: (v) => v?.trim() ?? null, weight: 2.0 },
    dateOfBirth: { parser: parseDate, weight: 3.0 },
    placeOfBirth: { parser: (v) => v?.trim() ?? null, weight: 1.5 },
    issueDate: { parser: parseDate, weight: 1.5 },
    expirationDate: { parser: parseDate, weight: 2.0 },
    sex: { parser: (v) => v?.trim().toUpperCase().charAt(0) ?? null, weight: 1.0 },
  },

  social_security_card: {
    fullName: { parser: normalizeName, weight: 3.0 },
    ssn: { parser: maskSSN, weight: 3.0 },
  },

  utility_bill: {
    accountHolderName: { parser: normalizeName, weight: 2.5 },
    accountNumber: { parser: parseAccountNumber, weight: 1.5 },
    serviceAddress: { parser: normalizeAddress, weight: 3.0 },
    billingAddress: { parser: normalizeAddress, weight: 2.0 },
    utilityProvider: { parser: (v) => v?.trim() ?? null, weight: 1.5 },
    billDate: { parser: parseDate, weight: 2.0 },
    dueDate: { parser: parseDate, weight: 1.5 },
    amountDue: { parser: parseCurrency, weight: 2.0 },
    previousBalance: { parser: parseCurrency, weight: 1.0 },
    currentCharges: { parser: parseCurrency, weight: 1.5 },
  },

  '1099': {
    recipientName: { parser: normalizeName, weight: 2.5 },
    recipientSSN: { parser: maskSSN, weight: 3.0 },
    recipientAddress: { parser: normalizeAddress, weight: 1.5 },
    payerName: { parser: normalizeName, weight: 2.0 },
    payerEIN: { parser: (v) => v?.replace(/\D/g, '') ?? null, weight: 1.5 },
    taxYear: { parser: (v) => v?.replace(/\D/g, '') ?? null, weight: 2.0 },
    nonemployeeCompensation: { parser: parseCurrency, weight: 3.0 },
    federalTaxWithheld: { parser: parseCurrency, weight: 2.0 },
    stateTaxWithheld: { parser: parseCurrency, weight: 1.5 },
  },

  other: {
    // Generic fields for unknown document types
    name: { parser: normalizeName, weight: 2.0 },
    date: { parser: parseDate, weight: 1.5 },
    amount: { parser: parseCurrency, weight: 2.0 },
    address: { parser: normalizeAddress, weight: 1.5 },
    accountNumber: { parser: parseAccountNumber, weight: 1.5 },
  },
}

// ============================================================================
// Main Normalization Function
// ============================================================================

/**
 * Normalize a raw document extraction by applying appropriate parsers
 * based on the document type.
 *
 * This function:
 * 1. Identifies the document type
 * 2. Applies appropriate parsers to each field
 * 3. Calculates field-level and overall confidence
 * 4. Returns a structured DocumentExtraction object
 *
 * @param raw - Raw extraction data with field names as keys
 * @param documentType - The type of document being processed
 * @returns Normalized DocumentExtraction object
 *
 * @example
 * const raw = {
 *   employeeName: { value: "JOHN DOE", confidence: 0.95 },
 *   grossPay: { value: "$5,000.00", confidence: 0.90 },
 * }
 * const result = normalizeExtraction(raw, 'paystub')
 * // result.fields.employeeName.parsed = "John Doe"
 * // result.fields.grossPay.parsed = 5000
 */
export function normalizeExtraction(
  raw: Record<string, { value: string | null; confidence: number; source?: string }>,
  documentType: SupportedDocumentType
): DocumentExtraction {
  const fieldConfig = DOCUMENT_FIELD_CONFIGS[documentType] ?? DOCUMENT_FIELD_CONFIGS.other
  const fields: Record<string, ExtractedField> = {}
  const weights: FieldWeights = {}

  for (const [fieldName, rawField] of Object.entries(raw)) {
    const config = fieldConfig[fieldName] ?? { parser: (v: string | null | undefined) => v?.trim() ?? null, weight: 1.0 }

    let parsed: unknown = null
    try {
      parsed = config.parser(rawField.value)
    } catch {
      // If parsing fails, leave as null
      parsed = null
    }

    fields[fieldName] = {
      raw: rawField.value,
      parsed,
      confidence: {
        value: Math.max(0, Math.min(1, rawField.confidence)),
        source: (rawField.source as 'ocr' | 'ml' | 'rule' | 'manual') ?? 'ocr',
      },
      fieldName,
    }

    weights[fieldName] = config.weight
  }

  // Calculate overall confidence using field weights
  const confidenceMap: Record<string, number> = {}
  for (const [name, field] of Object.entries(fields)) {
    if (field.parsed !== null) {
      confidenceMap[name] = field.confidence.value
    }
  }

  const overallConfidence = calculateConfidence(confidenceMap, weights)

  return {
    documentType,
    extractedAt: new Date().toISOString(),
    overallConfidence,
    fields,
    rawData: raw,
  }
}

/**
 * Create an ExtractedField from a raw value with manual confidence.
 *
 * Utility for creating fields programmatically.
 *
 * @param fieldName - Name of the field
 * @param rawValue - Raw string value
 * @param parser - Parser function to apply
 * @param confidence - Confidence score (0-1)
 * @returns ExtractedField object
 */
export function createField<T>(
  fieldName: string,
  rawValue: string | null,
  parser: (value: string | null | undefined) => T | null,
  confidence: number = 1.0
): ExtractedField<T> {
  let parsed: T | null = null
  try {
    parsed = parser(rawValue)
  } catch {
    parsed = null
  }

  return {
    raw: rawValue,
    parsed,
    confidence: {
      value: Math.max(0, Math.min(1, confidence)),
      source: 'manual',
    },
    fieldName,
  }
}
