/**
 * AI Document Intelligence - Extraction Prompts
 *
 * These prompts are designed for use with Claude's vision API to extract
 * structured data from mortgage-related documents. Each prompt specifies
 * the expected document type, fields to extract, output format, and
 * guidance for handling edge cases.
 */

// ============================================================================
// Types
// ============================================================================

export type SupportedDocumentType =
  | 'w2'
  | 'paystub'
  | 'bank_statement'
  | 'tax_return'
  | 'id'
  | 'other';

export interface ExtractionField {
  value: string | number | null;
  confidence: number; // 0-100
  rawText?: string; // Original text if different from parsed value
}

export interface W2ExtractionResult {
  documentType: 'w2';
  taxYear: ExtractionField;
  employer: {
    name: ExtractionField;
    ein: ExtractionField;
    address: ExtractionField;
  };
  employee: {
    name: ExtractionField;
    ssn: ExtractionField;
    address: ExtractionField;
  };
  wages: {
    box1_wages: ExtractionField;
    box2_federalTaxWithheld: ExtractionField;
    box3_socialSecurityWages: ExtractionField;
    box4_socialSecurityTaxWithheld: ExtractionField;
    box5_medicareWages: ExtractionField;
    box6_medicareTaxWithheld: ExtractionField;
  };
  stateInfo?: {
    state: ExtractionField;
    stateWages: ExtractionField;
    stateTaxWithheld: ExtractionField;
  }[];
  extractionNotes: string[];
}

export interface PaystubExtractionResult {
  documentType: 'paystub';
  employer: {
    name: ExtractionField;
    address: ExtractionField;
  };
  employee: {
    name: ExtractionField;
    employeeId: ExtractionField;
    address: ExtractionField;
  };
  payPeriod: {
    startDate: ExtractionField;
    endDate: ExtractionField;
    payDate: ExtractionField;
  };
  earnings: {
    grossPay: ExtractionField;
    netPay: ExtractionField;
    regularHours: ExtractionField;
    regularRate: ExtractionField;
    overtimeHours: ExtractionField;
    overtimeRate: ExtractionField;
  };
  ytdAmounts: {
    grossPay: ExtractionField;
    netPay: ExtractionField;
    federalTax: ExtractionField;
    socialSecurity: ExtractionField;
    medicare: ExtractionField;
  };
  deductions: {
    name: string;
    currentAmount: ExtractionField;
    ytdAmount: ExtractionField;
  }[];
  extractionNotes: string[];
}

export interface BankStatementExtractionResult {
  documentType: 'bank_statement';
  institution: {
    name: ExtractionField;
    address: ExtractionField;
  };
  account: {
    holderName: ExtractionField;
    type: ExtractionField; // checking, savings, etc.
    numberLast4: ExtractionField;
  };
  statementPeriod: {
    startDate: ExtractionField;
    endDate: ExtractionField;
  };
  balances: {
    beginning: ExtractionField;
    ending: ExtractionField;
    averageDaily: ExtractionField;
  };
  totals: {
    deposits: ExtractionField;
    withdrawals: ExtractionField;
    numberOfDeposits: ExtractionField;
    numberOfWithdrawals: ExtractionField;
  };
  largeDeposits?: {
    date: ExtractionField;
    amount: ExtractionField;
    description: ExtractionField;
  }[];
  extractionNotes: string[];
}

export interface DocumentTypeDetectionResult {
  documentType: SupportedDocumentType;
  confidence: number;
  reasoning: string;
  alternativeTypes?: {
    type: SupportedDocumentType;
    confidence: number;
  }[];
}

export interface GenericExtractionResult {
  documentType: 'other';
  detectedType: string | null;
  keyValuePairs: {
    key: string;
    value: ExtractionField;
  }[];
  tables?: {
    headers: string[];
    rows: string[][];
  }[];
  rawText: string;
  extractionNotes: string[];
}

export interface IdExtractionResult {
  documentType: 'id';
  personal: {
    fullName: ExtractionField;
    dateOfBirth: ExtractionField;
    address: ExtractionField;
  };
  license: {
    number: ExtractionField; // Last 4 digits only
    expirationDate: ExtractionField;
    issueDate: ExtractionField;
    state: ExtractionField;
    idType: ExtractionField; // driver_license, state_id, passport
  };
  physical?: {
    gender: ExtractionField;
    height: ExtractionField;
    eyeColor: ExtractionField;
  };
  extractionNotes: string[];
}

// ============================================================================
// Extraction Prompts
// ============================================================================

export const W2_EXTRACTION_PROMPT = `You are an expert document analyst specializing in tax forms. You are analyzing a W-2 Wage and Tax Statement form.

## Document Description
A W-2 form is an annual tax document that employers provide to employees and the IRS. It shows:
- Total wages earned during the tax year
- Federal, state, and local taxes withheld
- Social Security and Medicare information
- Employer and employee identification

## Fields to Extract

### Tax Year
- Located at top of form, typically says "20XX" or "Tax Year 20XX"

### Employer Information
- **Box a**: Employer's social security number (not always present)
- **Box b**: Employer identification number (EIN) - Format: XX-XXXXXXX
- **Box c**: Employer's name, address, and ZIP code

### Employee Information
- **Box d**: Control number (optional, employer-assigned)
- **Box e**: Employee's social security number - Format: XXX-XX-XXXX
- **Box f**: Employee's first name, middle initial, last name

### Wage and Tax Amounts (all in USD)
- **Box 1**: Wages, tips, other compensation
- **Box 2**: Federal income tax withheld
- **Box 3**: Social security wages
- **Box 4**: Social security tax withheld
- **Box 5**: Medicare wages and tips
- **Box 6**: Medicare tax withheld

### State/Local Information (Boxes 15-20)
- State, employer's state ID, state wages, state income tax

## Confidence Scoring Guidelines
- **90-100**: Text is clearly legible, in standard position, unambiguous
- **70-89**: Text is readable but may have minor quality issues or unusual formatting
- **50-69**: Text is partially legible, some inference required
- **30-49**: Text is difficult to read, significant uncertainty
- **0-29**: Text is illegible or missing, value is a best guess or null

## Edge Cases to Handle
1. **Blurry or low-resolution images**: Set lower confidence scores, note in extractionNotes
2. **Rotated or skewed documents**: Attempt to read, note orientation issues
3. **Multiple W-2s on one page**: Extract only the primary/first one, note others exist
4. **Corrected W-2 (W-2c)**: Note if this is a correction form
5. **Missing boxes**: Return null with confidence 0, note what's missing
6. **Handwritten additions**: Note if values appear handwritten vs printed
7. **Partial visibility**: Extract what's visible, note truncated fields

## Output Format
Return ONLY valid JSON with this exact structure (no markdown, no explanation):

{
  "documentType": "w2",
  "taxYear": {"value": "2023", "confidence": 95},
  "employer": {
    "name": {"value": "Acme Corporation", "confidence": 90},
    "ein": {"value": "12-3456789", "confidence": 95},
    "address": {"value": "123 Main St, City, ST 12345", "confidence": 85}
  },
  "employee": {
    "name": {"value": "John M Smith", "confidence": 95},
    "ssn": {"value": "XXX-XX-1234", "confidence": 90, "rawText": "***-**-1234"},
    "address": {"value": "456 Oak Ave, Town, ST 67890", "confidence": 85}
  },
  "wages": {
    "box1_wages": {"value": 75000.00, "confidence": 95},
    "box2_federalTaxWithheld": {"value": 12500.00, "confidence": 95},
    "box3_socialSecurityWages": {"value": 75000.00, "confidence": 90},
    "box4_socialSecurityTaxWithheld": {"value": 4650.00, "confidence": 90},
    "box5_medicareWages": {"value": 75000.00, "confidence": 90},
    "box6_medicareTaxWithheld": {"value": 1087.50, "confidence": 90}
  },
  "stateInfo": [
    {
      "state": {"value": "CA", "confidence": 95},
      "stateWages": {"value": 75000.00, "confidence": 90},
      "stateTaxWithheld": {"value": 5000.00, "confidence": 90}
    }
  ],
  "extractionNotes": [
    "Document is clear and well-formatted",
    "SSN partially redacted in source document"
  ]
}

## Important Notes
- For SSN, mask all but last 4 digits in the value field, put original format in rawText
- All monetary values should be numbers (not strings), without $ or commas
- If a field is completely missing or illegible, use null for value and 0 for confidence
- Include any observations about document quality or anomalies in extractionNotes`;

export const PAYSTUB_EXTRACTION_PROMPT = `You are an expert document analyst specializing in payroll documents. You are analyzing an employee paystub/pay statement.

## Document Description
A paystub (pay statement, pay slip) shows:
- Employer and employee information
- Pay period dates and payment date
- Gross earnings, deductions, and net pay
- Year-to-date totals for earnings and deductions

## Fields to Extract

### Employer Information
- Company name
- Company address (if shown)

### Employee Information
- Employee name
- Employee ID or number (if shown)
- Employee address (if shown)

### Pay Period Information
- Pay period start date
- Pay period end date
- Pay date (check date, payment date)

### Current Period Earnings
- Gross pay (total before deductions)
- Net pay (take-home amount)
- Regular hours worked
- Regular hourly rate
- Overtime hours (if applicable)
- Overtime rate (if applicable)

### Year-to-Date (YTD) Totals
- YTD gross pay
- YTD net pay
- YTD federal tax withheld
- YTD Social Security withheld
- YTD Medicare withheld

### Deductions
- List all deductions with current and YTD amounts
- Common types: Federal tax, State tax, Social Security, Medicare, 401k, Health insurance, etc.

## Confidence Scoring Guidelines
- **90-100**: Text is clearly legible, in standard position, unambiguous
- **70-89**: Text is readable but may have minor quality issues or unusual formatting
- **50-69**: Text is partially legible, some inference required
- **30-49**: Text is difficult to read, significant uncertainty
- **0-29**: Text is illegible or missing, value is a best guess or null

## Edge Cases to Handle
1. **Various paystub formats**: Different employers use different layouts
2. **Salaried vs hourly**: Salaried may not show hours/rate
3. **Multiple pay rates**: Note if employee has multiple pay rates
4. **Commission or bonus**: Include in earnings section
5. **Negative adjustments**: Handle negative numbers for corrections
6. **Electronic vs paper**: May have different formatting
7. **Partial paystub**: Note if image is cut off

## Output Format
Return ONLY valid JSON with this exact structure (no markdown, no explanation):

{
  "documentType": "paystub",
  "employer": {
    "name": {"value": "Acme Corporation", "confidence": 95},
    "address": {"value": "123 Main St, City, ST 12345", "confidence": 80}
  },
  "employee": {
    "name": {"value": "John Smith", "confidence": 95},
    "employeeId": {"value": "EMP12345", "confidence": 90},
    "address": {"value": "456 Oak Ave, Town, ST 67890", "confidence": 75}
  },
  "payPeriod": {
    "startDate": {"value": "2024-01-01", "confidence": 95},
    "endDate": {"value": "2024-01-15", "confidence": 95},
    "payDate": {"value": "2024-01-20", "confidence": 95}
  },
  "earnings": {
    "grossPay": {"value": 3500.00, "confidence": 95},
    "netPay": {"value": 2650.00, "confidence": 95},
    "regularHours": {"value": 80, "confidence": 90},
    "regularRate": {"value": 43.75, "confidence": 90},
    "overtimeHours": {"value": null, "confidence": 0},
    "overtimeRate": {"value": null, "confidence": 0}
  },
  "ytdAmounts": {
    "grossPay": {"value": 7000.00, "confidence": 90},
    "netPay": {"value": 5300.00, "confidence": 90},
    "federalTax": {"value": 875.00, "confidence": 85},
    "socialSecurity": {"value": 434.00, "confidence": 85},
    "medicare": {"value": 101.50, "confidence": 85}
  },
  "deductions": [
    {
      "name": "Federal Income Tax",
      "currentAmount": {"value": 437.50, "confidence": 90},
      "ytdAmount": {"value": 875.00, "confidence": 90}
    },
    {
      "name": "Social Security",
      "currentAmount": {"value": 217.00, "confidence": 90},
      "ytdAmount": {"value": 434.00, "confidence": 90}
    },
    {
      "name": "Medicare",
      "currentAmount": {"value": 50.75, "confidence": 90},
      "ytdAmount": {"value": 101.50, "confidence": 90}
    },
    {
      "name": "Health Insurance",
      "currentAmount": {"value": 145.00, "confidence": 85},
      "ytdAmount": {"value": 290.00, "confidence": 85}
    }
  ],
  "extractionNotes": [
    "Standard bi-weekly paystub format",
    "No overtime recorded this period"
  ]
}

## Important Notes
- Dates should be in YYYY-MM-DD format when possible
- All monetary values should be numbers (not strings), without $ or commas
- Hours should be numeric
- If a field is completely missing or illegible, use null for value and 0 for confidence
- Include any observations about document quality or anomalies in extractionNotes`;

export const BANK_STATEMENT_EXTRACTION_PROMPT = `You are an expert document analyst specializing in financial documents. You are analyzing a bank statement.

## Document Description
A bank statement shows:
- Account holder and bank information
- Statement period
- Beginning and ending balances
- Transaction summary (deposits and withdrawals)
- May include individual transaction details

## Fields to Extract

### Financial Institution
- Bank/credit union name
- Bank address (if shown)

### Account Information
- Account holder name(s)
- Account type (checking, savings, money market, etc.)
- Account number (LAST 4 DIGITS ONLY - for security)

### Statement Period
- Statement start date
- Statement end date

### Balance Information
- Beginning balance
- Ending balance
- Average daily balance (if shown)

### Transaction Summary
- Total deposits
- Total withdrawals
- Number of deposits
- Number of withdrawals

### Large Deposits (for mortgage underwriting purposes)
- Extract deposits over $1,000
- Include date, amount, and description/source if available

## Confidence Scoring Guidelines
- **90-100**: Text is clearly legible, in standard position, unambiguous
- **70-89**: Text is readable but may have minor quality issues or unusual formatting
- **50-69**: Text is partially legible, some inference required
- **30-49**: Text is difficult to read, significant uncertainty
- **0-29**: Text is illegible or missing, value is a best guess or null

## Edge Cases to Handle
1. **Multiple pages**: This may be one page of a multi-page statement
2. **Joint accounts**: Multiple account holders
3. **Online statement vs paper**: Different formatting
4. **Business vs personal**: Note if this appears to be a business account
5. **Foreign currency**: Note if not USD
6. **Negative balances**: Handle overdraft situations
7. **Redacted account numbers**: Only extract visible digits

## Output Format
Return ONLY valid JSON with this exact structure (no markdown, no explanation):

{
  "documentType": "bank_statement",
  "institution": {
    "name": {"value": "First National Bank", "confidence": 95},
    "address": {"value": "789 Finance Blvd, Metro City, ST 11111", "confidence": 80}
  },
  "account": {
    "holderName": {"value": "John Smith", "confidence": 95},
    "type": {"value": "checking", "confidence": 90},
    "numberLast4": {"value": "4567", "confidence": 95}
  },
  "statementPeriod": {
    "startDate": {"value": "2024-01-01", "confidence": 95},
    "endDate": {"value": "2024-01-31", "confidence": 95}
  },
  "balances": {
    "beginning": {"value": 15234.56, "confidence": 95},
    "ending": {"value": 18456.78, "confidence": 95},
    "averageDaily": {"value": 16500.00, "confidence": 85}
  },
  "totals": {
    "deposits": {"value": 8500.00, "confidence": 90},
    "withdrawals": {"value": 5277.78, "confidence": 90},
    "numberOfDeposits": {"value": 4, "confidence": 85},
    "numberOfWithdrawals": {"value": 23, "confidence": 85}
  },
  "largeDeposits": [
    {
      "date": {"value": "2024-01-15", "confidence": 90},
      "amount": {"value": 3500.00, "confidence": 95},
      "description": {"value": "ACH DEPOSIT - ACME CORP PAYROLL", "confidence": 85}
    },
    {
      "date": {"value": "2024-01-31", "confidence": 90},
      "amount": {"value": 3500.00, "confidence": 95},
      "description": {"value": "ACH DEPOSIT - ACME CORP PAYROLL", "confidence": 85}
    }
  ],
  "extractionNotes": [
    "Standard monthly checking account statement",
    "Two regular payroll deposits identified",
    "Account number partially visible, extracted last 4 digits only"
  ]
}

## Important Notes
- ONLY extract last 4 digits of account number for security
- Dates should be in YYYY-MM-DD format when possible
- All monetary values should be numbers (not strings), without $ or commas
- If a field is completely missing or illegible, use null for value and 0 for confidence
- Large deposits are important for mortgage underwriting - note any that seem unusual
- Include any observations about document quality or anomalies in extractionNotes`;

export const DOCUMENT_TYPE_DETECTION_PROMPT = `You are an expert document classifier specializing in mortgage-related documents. Your task is to identify what type of document is shown in the image.

## Supported Document Types

### w2
- Annual tax form from employer
- Shows "W-2" prominently
- Contains boxes labeled 1-20
- Shows employer EIN and employee SSN
- Lists wages, tips, and tax withholdings

### paystub
- Pay statement from employer
- Shows pay period dates
- Lists gross pay, deductions, net pay
- May show hours worked
- Includes YTD totals

### bank_statement
- Monthly account statement
- Shows bank logo/name
- Lists beginning/ending balance
- Shows transactions or summary
- Includes account number (often partial)

### tax_return
- IRS Form 1040 or state equivalent
- Shows "Form 1040" or similar
- Multiple pages with schedules
- Shows filing status, income, deductions
- May include W-2s as attachments

### id
- Government-issued identification
- Driver's license, passport, state ID
- Shows photo, name, DOB
- Has ID number and expiration date
- May have barcode or security features

### other
- Document doesn't match above types
- Could be: utility bill, employment letter, asset statement, etc.

## Classification Guidelines

1. Look for distinctive markers:
   - Form numbers (W-2, 1040, etc.)
   - Document titles
   - Layout patterns
   - Logo/letterhead

2. Consider context clues:
   - Tax forms have specific box layouts
   - Paystubs show earnings breakdowns
   - Bank statements list transactions
   - IDs have photos and security features

3. When uncertain:
   - Choose the most likely type
   - List alternatives with confidence scores
   - Explain your reasoning

## Confidence Scoring
- **90-100**: Clear identifying features, unambiguous
- **70-89**: Strong indicators but some uncertainty
- **50-69**: Likely match but could be another type
- **30-49**: Significant uncertainty
- **0-29**: Very unclear, essentially guessing

## Output Format
Return ONLY valid JSON with this exact structure (no markdown, no explanation):

{
  "documentType": "w2",
  "confidence": 95,
  "reasoning": "Document clearly shows 'W-2 Wage and Tax Statement' header, standard box layout with numbered boxes 1-20, employer EIN in box b, and employee SSN in box e.",
  "alternativeTypes": [
    {
      "type": "tax_return",
      "confidence": 5
    }
  ]
}

## Edge Cases
1. **Multi-page documents**: Classify based on the visible page
2. **Poor quality images**: Lower confidence, explain limitations
3. **Partial documents**: Note what's visible and classify accordingly
4. **Multiple documents**: Identify the primary/largest document
5. **Non-English documents**: Note language, attempt classification
6. **Blank or unreadable**: Return "other" with low confidence`;

export const GENERIC_EXTRACTION_PROMPT = `You are an expert document analyst. You are analyzing a document that doesn't match standard mortgage document types. Your task is to extract any useful information from it.

## Extraction Goals

1. **Identify the document type** if possible
   - Employment verification letter
   - Utility bill
   - Insurance declaration
   - Award letter
   - Retirement account statement
   - Gift letter
   - Divorce decree
   - Other financial/legal document

2. **Extract key-value pairs**
   - Look for labeled fields
   - Names, dates, addresses
   - Account numbers (mask sensitive data)
   - Dollar amounts
   - Important dates

3. **Extract tabular data** if present
   - Identify column headers
   - Extract row data

4. **Capture raw text**
   - Important paragraphs
   - Key statements
   - Relevant terms

## What to Look For in Mortgage Documents

- Names (borrower, co-borrower, institutions)
- Addresses (current, previous, property)
- Dates (employment, account opening, statement dates)
- Dollar amounts (income, assets, debts, payments)
- Account numbers (mask all but last 4 digits)
- Employment information
- Asset values
- Debt obligations
- Legal statements

## Confidence Scoring Guidelines
- **90-100**: Text is clearly legible and unambiguous
- **70-89**: Text is readable but may have minor quality issues
- **50-69**: Text is partially legible, some inference required
- **30-49**: Text is difficult to read, significant uncertainty
- **0-29**: Text is illegible or missing

## Output Format
Return ONLY valid JSON with this exact structure (no markdown, no explanation):

{
  "documentType": "other",
  "detectedType": "employment_verification_letter",
  "keyValuePairs": [
    {
      "key": "Employee Name",
      "value": {"value": "John Smith", "confidence": 95}
    },
    {
      "key": "Employer",
      "value": {"value": "Acme Corporation", "confidence": 95}
    },
    {
      "key": "Employment Start Date",
      "value": {"value": "2020-03-15", "confidence": 90}
    },
    {
      "key": "Annual Salary",
      "value": {"value": 85000, "confidence": 90}
    },
    {
      "key": "Employment Status",
      "value": {"value": "Full-time, Active", "confidence": 95}
    },
    {
      "key": "Letter Date",
      "value": {"value": "2024-01-15", "confidence": 95}
    },
    {
      "key": "HR Contact",
      "value": {"value": "Jane Doe, HR Manager", "confidence": 85}
    }
  ],
  "tables": [
    {
      "headers": ["Year", "Base Salary", "Bonus", "Total"],
      "rows": [
        ["2023", "$85,000", "$5,000", "$90,000"],
        ["2022", "$80,000", "$4,500", "$84,500"]
      ]
    }
  ],
  "rawText": "This letter confirms that John Smith has been employed by Acme Corporation since March 15, 2020. Mr. Smith currently holds the position of Senior Engineer and earns an annual salary of $85,000. His employment status is full-time and active.",
  "extractionNotes": [
    "Document is an employment verification letter on company letterhead",
    "Includes salary history table",
    "Letter is signed and dated"
  ]
}

## Important Notes
- Mask sensitive information (SSN, full account numbers) - show only last 4 digits
- Dates should be in YYYY-MM-DD format when possible
- Dollar amounts should be numbers when extracting to value field
- Include raw text for important paragraphs that provide context
- Note any stamps, signatures, or official markings
- If document appears to be personal/non-financial, note that in extractionNotes`;

export const ID_EXTRACTION_PROMPT = `You are an expert document analyst specializing in government-issued identification documents. You are analyzing a driver's license, state ID, or similar government-issued identification.

## Document Description
A government-issued ID (driver's license, state ID, passport) shows:
- Personal identification information (name, date of birth)
- Address information
- License/ID number and validity dates
- Physical description (optional)
- Photo and security features

## Fields to Extract

### Personal Information
- **Full Name**: First, middle, and last name as shown
- **Date of Birth**: DOB, BIRTH DATE, or similar field
- **Address**: Full mailing address including city, state, ZIP

### License/ID Information
- **License/ID Number**: The unique identifier (MASK ALL BUT LAST 4 DIGITS)
- **Expiration Date**: When the ID expires
- **Issue Date**: When the ID was issued
- **State**: Issuing state (2-letter code)
- **ID Type**: driver_license, state_id, or passport

### Physical Description (if visible)
- **Gender**: M, F, or X
- **Height**: In feet and inches (e.g., 5'10")
- **Eye Color**: BRN, BLU, GRN, HAZ, etc.

## Confidence Scoring Guidelines
- **90-100**: Text is clearly legible, in standard position, unambiguous
- **70-89**: Text is readable but may have minor quality issues or unusual formatting
- **50-69**: Text is partially legible, some inference required
- **30-49**: Text is difficult to read, significant uncertainty
- **0-29**: Text is illegible or missing, value is a best guess or null

## Edge Cases to Handle
1. **Expired IDs**: Note if the ID is expired in extractionNotes
2. **Poor photo quality**: Lower confidence scores, note in extractionNotes
3. **Different state formats**: Each state has different layouts - adapt accordingly
4. **Vertical vs Horizontal**: Under-21 IDs are often vertical
5. **Multiple barcodes**: May have 1D and 2D barcodes - focus on text fields
6. **Redacted information**: Return null for redacted fields
7. **Non-US IDs**: Note the country if not a US ID
8. **Real ID compliant**: Note if the star/flag indicator is present

## Output Format
Return ONLY valid JSON with this exact structure (no markdown, no explanation):

{
  "documentType": "id",
  "personal": {
    "fullName": {"value": "John Michael Smith", "confidence": 95},
    "dateOfBirth": {"value": "1985-03-15", "confidence": 90},
    "address": {"value": "123 Main St, Austin, TX 78701", "confidence": 85}
  },
  "license": {
    "number": {"value": "****1234", "confidence": 95, "rawText": "DL12345671234"},
    "expirationDate": {"value": "2026-03-15", "confidence": 95},
    "issueDate": {"value": "2022-03-15", "confidence": 90},
    "state": {"value": "TX", "confidence": 95},
    "idType": {"value": "driver_license", "confidence": 95}
  },
  "physical": {
    "gender": {"value": "M", "confidence": 90},
    "height": {"value": "5'10\"", "confidence": 85},
    "eyeColor": {"value": "BRN", "confidence": 85}
  },
  "extractionNotes": [
    "Document is a Texas driver's license",
    "ID is valid (not expired)",
    "Real ID compliant (star indicator present)"
  ]
}

## Important Notes
- SECURITY: Mask license/ID numbers - show only last 4 digits in value, full number in rawText if needed
- Dates should be in YYYY-MM-DD format
- State should be 2-letter abbreviation
- If a field is completely missing or illegible, use null for value and 0 for confidence
- Note the ID type (driver_license, state_id, passport) based on document indicators
- Include any observations about document validity or anomalies in extractionNotes`;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the appropriate extraction prompt for a document type
 */
export function getExtractionPrompt(documentType: SupportedDocumentType): string {
  switch (documentType) {
    case 'w2':
      return W2_EXTRACTION_PROMPT;
    case 'paystub':
      return PAYSTUB_EXTRACTION_PROMPT;
    case 'bank_statement':
      return BANK_STATEMENT_EXTRACTION_PROMPT;
    case 'tax_return':
      // Tax returns are complex - use generic extraction for now
      return GENERIC_EXTRACTION_PROMPT;
    case 'id':
      return ID_EXTRACTION_PROMPT;
    case 'other':
    default:
      return GENERIC_EXTRACTION_PROMPT;
  }
}

/**
 * Get the document type detection prompt
 */
export function getDocumentTypeDetectionPrompt(): string {
  return DOCUMENT_TYPE_DETECTION_PROMPT;
}

/**
 * Validate that a confidence score is within valid range
 */
export function isValidConfidence(confidence: number): boolean {
  return typeof confidence === 'number' && confidence >= 0 && confidence <= 100;
}

/**
 * Get confidence level label from numeric score
 */
export function getConfidenceLevel(confidence: number): 'high' | 'medium' | 'low' | 'very_low' {
  if (confidence >= 90) return 'high';
  if (confidence >= 70) return 'medium';
  if (confidence >= 50) return 'low';
  return 'very_low';
}

/**
 * Create a standard extraction field with value and confidence
 */
export function createExtractionField(
  value: string | number | null,
  confidence: number,
  rawText?: string
): ExtractionField {
  return {
    value,
    confidence: Math.max(0, Math.min(100, confidence)),
    ...(rawText && { rawText }),
  };
}

/**
 * Parse and validate an extraction result from Claude's response
 */
export function parseExtractionResponse<T>(
  response: string,
  expectedType: SupportedDocumentType
): T | null {
  try {
    // Remove any markdown code blocks if present
    let cleanResponse = response.trim();
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.slice(7);
    } else if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.slice(3);
    }
    if (cleanResponse.endsWith('```')) {
      cleanResponse = cleanResponse.slice(0, -3);
    }
    cleanResponse = cleanResponse.trim();

    const parsed = JSON.parse(cleanResponse);

    // Basic validation
    if (!parsed || typeof parsed !== 'object') {
      console.error('Extraction response is not an object');
      return null;
    }

    // For document type detection, validate the structure
    if (expectedType === 'other' && 'documentType' in parsed && 'confidence' in parsed) {
      return parsed as T;
    }

    // For extraction results, validate documentType matches or is a valid type
    if (parsed.documentType && parsed.documentType !== expectedType && parsed.documentType !== 'other') {
      console.warn(`Document type mismatch: expected ${expectedType}, got ${parsed.documentType}`);
    }

    return parsed as T;
  } catch (error) {
    console.error('Failed to parse extraction response:', error);
    return null;
  }
}

/**
 * Mask sensitive data (like SSN) for storage, keeping only last 4 digits
 */
export function maskSensitiveData(value: string, showLast: number = 4): string {
  if (!value || value.length <= showLast) {
    return value;
  }
  const visiblePart = value.slice(-showLast);
  const maskedPart = 'X'.repeat(value.length - showLast);
  return maskedPart + visiblePart;
}

/**
 * Format extracted fields into a summary for display
 */
export function summarizeExtraction(
  result: W2ExtractionResult | PaystubExtractionResult | BankStatementExtractionResult | IdExtractionResult
): string {
  switch (result.documentType) {
    case 'w2':
      return `W-2 (${result.taxYear.value}): ${result.employer.name.value} - $${result.wages.box1_wages.value?.toLocaleString() ?? 'N/A'}`;
    case 'paystub':
      return `Paystub: ${result.employer.name.value} - Gross: $${result.earnings.grossPay.value?.toLocaleString() ?? 'N/A'}`;
    case 'bank_statement':
      return `Bank Statement: ${result.institution.name.value} - Ending Balance: $${result.balances.ending.value?.toLocaleString() ?? 'N/A'}`;
    case 'id':
      return `ID (${result.license.state.value ?? 'Unknown'}): ${result.personal.fullName.value ?? 'Unknown'} - Expires: ${result.license.expirationDate.value ?? 'N/A'}`;
    default:
      return 'Document extracted';
  }
}
