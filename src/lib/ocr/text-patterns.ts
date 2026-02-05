/**
 * Regex Patterns for Extracting Document Fields from OCR Text
 *
 * These patterns are used by the Tesseract extractor to find and extract
 * specific fields from raw OCR text output.
 */

// ============================================================================
// Common Value Patterns
// ============================================================================

/**
 * Pattern to match currency values (e.g., $1,234.56, 1234.56, $1,234)
 */
export const CURRENCY_PATTERN = /\$?\s*[\d,]+(?:\.\d{2})?/g;

/**
 * Extract a currency value from text
 */
export function extractCurrency(text: string): number | null {
  const match = text.match(/\$?\s*([\d,]+(?:\.\d{2})?)/);
  if (!match) return null;
  const cleaned = match[1].replace(/,/g, '');
  const value = parseFloat(cleaned);
  return isNaN(value) ? null : value;
}

/**
 * Pattern to match dates in various formats
 */
export const DATE_PATTERNS = [
  // MM/DD/YYYY or MM-DD-YYYY
  /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/g,
  // YYYY-MM-DD (ISO)
  /(\d{4})-(\d{2})-(\d{2})/g,
  // Month DD, YYYY
  /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})/gi,
  // Abbreviated month
  /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),?\s+(\d{4})/gi,
];

/**
 * Extract a date from text (returns ISO format YYYY-MM-DD)
 */
export function extractDate(text: string): string | null {
  // Try MM/DD/YYYY or MM-DD-YYYY
  let match = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (match) {
    const [, month, day, year] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Try YYYY-MM-DD
  match = text.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return match[0];
  }

  // Try Month DD, YYYY
  const monthNames: Record<string, string> = {
    january: '01', jan: '01',
    february: '02', feb: '02',
    march: '03', mar: '03',
    april: '04', apr: '04',
    may: '05',
    june: '06', jun: '06',
    july: '07', jul: '07',
    august: '08', aug: '08',
    september: '09', sep: '09', sept: '09',
    october: '10', oct: '10',
    november: '11', nov: '11',
    december: '12', dec: '12',
  };

  match = text.match(/(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+(\d{1,2}),?\s+(\d{4})/i);
  if (match) {
    const month = monthNames[match[1].toLowerCase()];
    const day = match[2].padStart(2, '0');
    const year = match[3];
    if (month) {
      return `${year}-${month}-${day}`;
    }
  }

  return null;
}

/**
 * Pattern to match SSN (full or partial)
 * Note: We only extract last 4 digits for security
 */
export const SSN_PATTERN = /\b\d{3}[-\s]?\d{2}[-\s]?(\d{4})\b/;

/**
 * Extract last 4 digits of SSN
 */
export function extractSSNLast4(text: string): string | null {
  const match = text.match(/\b\d{3}[-\s]?\d{2}[-\s]?(\d{4})\b/);
  if (match) {
    return match[1];
  }
  // Try finding just 4 digits that could be last 4 of SSN
  // after keywords like "SSN" or "Social Security"
  const ssnKeywordMatch = text.match(/(?:SSN|Social\s*Security)[:\s#]*[\*xX\-\s]*(\d{4})\b/i);
  if (ssnKeywordMatch) {
    return ssnKeywordMatch[1];
  }
  return null;
}

/**
 * Pattern to match EIN (Employer Identification Number)
 */
export const EIN_PATTERN = /\b(\d{2})[-\s]?(\d{7})\b/;

/**
 * Extract EIN
 */
export function extractEIN(text: string): string | null {
  const match = text.match(/\b(\d{2})[-\s]?(\d{7})\b/);
  if (match) {
    return `${match[1]}-${match[2]}`;
  }
  return null;
}

/**
 * Pattern for year (4 digits)
 */
export const YEAR_PATTERN = /\b(20\d{2}|19\d{2})\b/;

/**
 * Extract tax year
 */
export function extractYear(text: string): number | null {
  const match = text.match(/\b(20\d{2}|19\d{2})\b/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}

// ============================================================================
// W2 Specific Patterns
// ============================================================================

export const W2_PATTERNS = {
  // Employer name - often appears after "Employer's name" or in box c
  employerName: [
    /(?:employer['']?s?\s+name|box\s*c)[:\s]*([A-Za-z0-9\s&.,'-]+?)(?:\n|$)/i,
    /(?:c\s+)?employer['']?s?\s+name[,:]?\s*(?:address[,:]?\s*(?:and\s*)?(?:zip\s*code)?[:\s]*)?([A-Za-z0-9\s&.,'-]+?)(?:\n|$)/i,
  ],

  // Employer EIN - box b
  employerEIN: [
    /(?:employer['']?s?\s+identification\s+number|EIN|box\s*b)[:\s#]*(\d{2}[-\s]?\d{7})/i,
    /\bb\s+(?:employer\s+identification\s+number)[:\s]*(\d{2}[-\s]?\d{7})/i,
  ],

  // Employee name - often in box e
  employeeName: [
    /(?:employee['']?s?\s+(?:first\s+)?name|box\s*e)[:\s]*([A-Za-z\s.,'-]+?)(?:\n|$)/i,
    /\be\s+employee['']?s?\s+(?:first\s+)?name[:\s]*([A-Za-z\s.,'-]+?)(?:\n|$)/i,
  ],

  // Wages, tips, compensation - box 1
  wagesTipsCompensation: [
    /(?:wages[,\s]+tips[,\s]+(?:other\s+)?compensation|box\s*1)[:\s$]*(\$?\s*[\d,]+(?:\.\d{2})?)/i,
    /\b1\s+wages[,\s]+tips[,\s]+(?:other\s+)?comp(?:ensation)?[:\s$]*(\$?\s*[\d,]+(?:\.\d{2})?)/i,
  ],

  // Federal income tax withheld - box 2
  federalIncomeTaxWithheld: [
    /(?:federal\s+income\s+tax\s+withheld|box\s*2)[:\s$]*(\$?\s*[\d,]+(?:\.\d{2})?)/i,
    /\b2\s+federal\s+income\s+tax\s+withheld[:\s$]*(\$?\s*[\d,]+(?:\.\d{2})?)/i,
  ],

  // Social security wages - box 3
  socialSecurityWages: [
    /(?:social\s+security\s+wages|box\s*3)[:\s$]*(\$?\s*[\d,]+(?:\.\d{2})?)/i,
    /\b3\s+social\s+security\s+wages[:\s$]*(\$?\s*[\d,]+(?:\.\d{2})?)/i,
  ],

  // Medicare wages - box 5
  medicareWages: [
    /(?:medicare\s+wages\s+(?:and\s+)?tips?|box\s*5)[:\s$]*(\$?\s*[\d,]+(?:\.\d{2})?)/i,
    /\b5\s+medicare\s+wages[:\s$]*(\$?\s*[\d,]+(?:\.\d{2})?)/i,
  ],
};

// ============================================================================
// Paystub Specific Patterns
// ============================================================================

export const PAYSTUB_PATTERNS = {
  // Employer name
  employerName: [
    /(?:employer|company|from)[:\s]*([A-Za-z0-9\s&.,'-]+?)(?:\n|$)/i,
  ],

  // Employee name
  employeeName: [
    /(?:employee|pay\s+to|name)[:\s]*([A-Za-z\s.,'-]+?)(?:\n|$)/i,
  ],

  // Pay period
  payPeriodStart: [
    /(?:pay\s+period|period\s+(?:start|begin(?:ning)?)|from)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /(?:period)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s*(?:to|-|through)/i,
  ],

  payPeriodEnd: [
    /(?:(?:to|through|ending|end(?:s)?)[:\s]*|[-\s]+)(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})(?:\s*(?:pay\s+date)?)/i,
    /(?:period\s+end(?:ing)?|thru)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
  ],

  payDate: [
    /(?:pay\s+date|check\s+date|date\s+paid)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
  ],

  // Gross pay
  grossPay: [
    /(?:gross\s+pay|gross\s+earnings|total\s+earnings|current\s+gross)[:\s$]*(\$?\s*[\d,]+(?:\.\d{2})?)/i,
    /(?:gross)[:\s$]*(\$?\s*[\d,]+(?:\.\d{2})?)/i,
  ],

  // Net pay
  netPay: [
    /(?:net\s+pay|take\s+home|net\s+amount|net\s+check)[:\s$]*(\$?\s*[\d,]+(?:\.\d{2})?)/i,
    /(?:net)[:\s$]*(\$?\s*[\d,]+(?:\.\d{2})?)/i,
  ],

  // YTD values
  ytdGrossPay: [
    /(?:ytd\s+gross|year\s+to\s+date\s+gross|ytd\s+earnings)[:\s$]*(\$?\s*[\d,]+(?:\.\d{2})?)/i,
    /(?:gross).*(?:ytd)[:\s$]*(\$?\s*[\d,]+(?:\.\d{2})?)/i,
  ],

  ytdNetPay: [
    /(?:ytd\s+net|year\s+to\s+date\s+net)[:\s$]*(\$?\s*[\d,]+(?:\.\d{2})?)/i,
  ],
};

// ============================================================================
// Bank Statement Specific Patterns
// ============================================================================

export const BANK_STATEMENT_PATTERNS = {
  // Institution name
  institutionName: [
    /(?:^|\n)([A-Za-z\s&]+(?:Bank|Credit\s+Union|Federal|Financial|FCU|CU))/i,
  ],

  // Account type
  accountType: [
    /(?:account\s+type|type)[:\s]*(checking|savings|money\s+market)/i,
    /(checking|savings)\s+(?:account|statement)/i,
  ],

  // Account number (last 4 only)
  accountNumberLast4: [
    /(?:account\s*(?:number|#|no\.?))[:\s]*[\*xX\-]*(\d{4})\b/i,
    /(?:acct)[:\s#]*[\*xX\-]*(\d{4})\b/i,
  ],

  // Statement period
  statementPeriodStart: [
    /(?:statement\s+period|from)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
  ],

  statementPeriodEnd: [
    /(?:through|to|ending)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
  ],

  // Balances
  beginningBalance: [
    /(?:beginning\s+balance|opening\s+balance|previous\s+balance)[:\s$]*(\$?\s*[\d,]+(?:\.\d{2})?)/i,
  ],

  endingBalance: [
    /(?:ending\s+balance|closing\s+balance|current\s+balance|available\s+balance)[:\s$]*(\$?\s*[\d,]+(?:\.\d{2})?)/i,
  ],

  // Deposits and withdrawals
  totalDeposits: [
    /(?:total\s+deposits|deposits\s+(?:and\s+)?(?:other\s+)?credits)[:\s$]*(\$?\s*[\d,]+(?:\.\d{2})?)/i,
  ],

  totalWithdrawals: [
    /(?:total\s+withdrawals|withdrawals\s+(?:and\s+)?(?:other\s+)?debits|total\s+debits)[:\s$]*(\$?\s*[\d,]+(?:\.\d{2})?)/i,
  ],
};

// ============================================================================
// ID/Driver's License Specific Patterns
// ============================================================================

export const ID_PATTERNS = {
  // Full name - appears in various formats
  fullName: [
    /(?:name|full\s+name)[:\s]*([A-Za-z\s.,'-]+?)(?:\n|$)/i,
    /^([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){1,3})(?:\n|$)/m, // Name at start of line
    /(?:LN|FN)[:\s]*([A-Za-z\s.,'-]+?)(?:\n|$)/i, // LN/FN format
  ],

  // Date of birth
  dateOfBirth: [
    /(?:date\s+of\s+birth|dob|birth\s*date|born)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /(?:DOB)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
  ],

  // License/ID number - many state formats
  licenseNumber: [
    /(?:license\s*(?:number|no\.?|#)?|DL\s*(?:number|no\.?|#)?|ID\s*(?:number|no\.?|#)?)[:\s]*([A-Z0-9\-]+)/i,
    /(?:DL|LIC|ID)[:\s#]*([A-Z]?\d{6,12})/i,
    /\b([A-Z]\d{7,8})\b/, // Common format: Letter + 7-8 digits
  ],

  // Expiration date
  expirationDate: [
    /(?:expir(?:ation|es)?|exp\s*(?:date)?|valid\s*(?:through|until|thru))[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /(?:EXP)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
  ],

  // Issue date
  issueDate: [
    /(?:issue(?:d)?(?:\s+date)?|iss\s*(?:date)?|valid\s*from)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /(?:ISS)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
  ],

  // Address
  address: [
    /(?:address|addr|street)[:\s]*([A-Za-z0-9\s.,#'-]+(?:,\s*[A-Za-z\s]+,?\s*[A-Z]{2}\s*\d{5}(?:-\d{4})?))/i,
    /(\d+\s+[A-Za-z\s.,]+(?:St|Ave|Rd|Dr|Blvd|Ln|Way|Ct|Pl)\.?[,\s]+[A-Za-z\s]+,?\s*[A-Z]{2}\s*\d{5})/i,
  ],

  // State (2-letter code)
  state: [
    /(?:state|st)[:\s]*([A-Z]{2})\b/i,
    /\b([A-Z]{2})\s+(?:driver'?s?\s+license|DL|ID)/i,
    /,\s*([A-Z]{2})\s+\d{5}/, // Extract from address (City, ST 12345)
  ],

  // ID type
  idType: [
    /(?:driver'?s?\s+license|DL|DRIVER\s+LICENSE)/i,
    /(?:state\s+(?:id|identification)|STATE\s+ID)/i,
    /(?:passport)/i,
  ],

  // Physical description fields
  gender: [
    /(?:sex|gender)[:\s]*([MFX])\b/i,
    /\b(MALE|FEMALE|M|F)\b/,
  ],

  height: [
    /(?:height|ht|hgt)[:\s]*(\d['']?\s*-?\s*\d{1,2}"?)/i,
    /(?:height|ht|hgt)[:\s]*(\d{1,3}\s*(?:in|cm))/i,
  ],

  eyeColor: [
    /(?:eyes?|eye\s*color)[:\s]*(BRN|BLU|GRN|HAZ|GRY|BLK|AMB|BROWN|BLUE|GREEN|HAZEL|GRAY|BLACK|AMBER)/i,
  ],
};

/**
 * Extract last 4 digits of license number for security
 */
export function extractLicenseNumberLast4(text: string): string | null {
  for (const pattern of ID_PATTERNS.licenseNumber) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const licNum = match[1].replace(/[-\s]/g, '');
      if (licNum.length >= 4) {
        return licNum.slice(-4);
      }
    }
  }
  return null;
}

// ============================================================================
// Generic Field Extraction Helper
// ============================================================================

/**
 * Try multiple patterns to extract a field value
 */
export function tryPatterns(text: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

/**
 * Try multiple patterns to extract a currency value
 */
export function tryCurrencyPatterns(text: string, patterns: RegExp[]): number | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return extractCurrency(match[1]);
    }
  }
  return null;
}

/**
 * Try multiple patterns to extract a date value
 */
export function tryDatePatterns(text: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const dateStr = match[1].trim();
      return extractDate(dateStr);
    }
  }
  return null;
}
