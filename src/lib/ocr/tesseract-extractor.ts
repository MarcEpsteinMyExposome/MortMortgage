/**
 * Tesseract.js OCR Extractor
 *
 * A fallback OCR provider that uses Tesseract.js for text extraction
 * and regex patterns to identify and extract document fields.
 *
 * This provider is always available (no external API needed) and works
 * entirely client-side, making it ideal as a fallback when Claude Vision
 * is not available.
 */

import * as Tesseract from 'tesseract.js';
import {
  OCRProvider,
  ExtractionResult,
  SupportedDocumentType,
  DocumentExtraction,
  ExtractedField,
  W2Extraction,
  PaystubExtraction,
  BankStatementExtraction,
  IdExtraction,
  GenericExtraction,
} from './types';
import {
  W2_PATTERNS,
  PAYSTUB_PATTERNS,
  BANK_STATEMENT_PATTERNS,
  ID_PATTERNS,
  tryPatterns,
  tryCurrencyPatterns,
  tryDatePatterns,
  extractCurrency,
  extractSSNLast4,
  extractEIN,
  extractYear,
  extractDate,
  extractLicenseNumberLast4,
} from './text-patterns';

// Base confidence for Tesseract extraction (lower than Claude)
const BASE_TESSERACT_CONFIDENCE = 60;

// Confidence adjustments based on pattern match quality
const CONFIDENCE_ADJUSTMENTS = {
  exactMatch: 15,      // Pattern matched exactly as expected
  partialMatch: 5,     // Pattern matched but value might be partial
  lowQualityOCR: -20,  // OCR confidence was low
  highQualityOCR: 10,  // OCR confidence was high
};

/**
 * Create an ExtractedField with computed confidence
 */
function createField(
  value: string | number | null,
  rawText?: string,
  baseConfidence: number = BASE_TESSERACT_CONFIDENCE
): ExtractedField {
  // Adjust confidence based on value presence
  let confidence = baseConfidence;
  if (value === null) {
    confidence = 0;
  } else if (typeof value === 'string' && value.length > 0) {
    confidence += CONFIDENCE_ADJUSTMENTS.partialMatch;
  } else if (typeof value === 'number') {
    confidence += CONFIDENCE_ADJUSTMENTS.exactMatch;
  }

  // Cap confidence at 75% for Tesseract (it's less reliable than Claude)
  confidence = Math.min(75, Math.max(0, confidence));

  return {
    value,
    confidence,
    rawText,
  };
}

/**
 * Extract W2 fields from raw OCR text
 */
function extractW2Fields(text: string, ocrConfidence: number): W2Extraction {
  const confidenceBase = BASE_TESSERACT_CONFIDENCE +
    (ocrConfidence > 80 ? CONFIDENCE_ADJUSTMENTS.highQualityOCR :
     ocrConfidence < 50 ? CONFIDENCE_ADJUSTMENTS.lowQualityOCR : 0);

  // Extract employer name
  const employerNameRaw = tryPatterns(text, W2_PATTERNS.employerName);

  // Extract employer EIN
  const employerEINRaw = tryPatterns(text, W2_PATTERNS.employerEIN);
  const employerEIN = employerEINRaw ? extractEIN(employerEINRaw) || employerEINRaw : null;

  // Extract employee name
  const employeeNameRaw = tryPatterns(text, W2_PATTERNS.employeeName);

  // Extract employee SSN (last 4 only)
  const employeeSSN = extractSSNLast4(text);

  // Extract wages (Box 1)
  const wagesRaw = tryCurrencyPatterns(text, W2_PATTERNS.wagesTipsCompensation);

  // Extract federal tax withheld (Box 2)
  const federalTaxRaw = tryCurrencyPatterns(text, W2_PATTERNS.federalIncomeTaxWithheld);

  // Extract social security wages (Box 3)
  const ssWagesRaw = tryCurrencyPatterns(text, W2_PATTERNS.socialSecurityWages);

  // Extract medicare wages (Box 5)
  const medicareWagesRaw = tryCurrencyPatterns(text, W2_PATTERNS.medicareWages);

  // Try to extract tax year from the text
  const taxYear = extractYear(text);

  // Try to extract employer address (everything after employer name until next field)
  const addressMatch = text.match(/(?:employer['']?s?\s+(?:name,?\s*)?(?:address|addr)[,:\s]*(?:and\s+)?(?:zip\s*code)?[:\s]*)([\s\S]*?)(?=\n\s*\n|\d{2}[-\s]?\d{7}|employee|wages)/i);
  const employerAddress = addressMatch ? addressMatch[1].trim().replace(/\n/g, ', ') : null;

  return {
    documentType: 'w2',
    employerName: createField(employerNameRaw, employerNameRaw || undefined, confidenceBase),
    employerEIN: createField(employerEIN, employerEINRaw || undefined, confidenceBase),
    employerAddress: createField(employerAddress, employerAddress || undefined, confidenceBase - 5),
    employeeName: createField(employeeNameRaw, employeeNameRaw || undefined, confidenceBase),
    employeeSSN: createField(employeeSSN, employeeSSN ? `****${employeeSSN}` : undefined, confidenceBase),
    wagesTipsCompensation: createField(wagesRaw, wagesRaw?.toString(), confidenceBase),
    federalIncomeTaxWithheld: createField(federalTaxRaw, federalTaxRaw?.toString(), confidenceBase),
    socialSecurityWages: createField(ssWagesRaw, ssWagesRaw?.toString(), confidenceBase),
    medicareWages: createField(medicareWagesRaw, medicareWagesRaw?.toString(), confidenceBase),
    taxYear: createField(taxYear, taxYear?.toString(), confidenceBase),
  };
}

/**
 * Extract paystub fields from raw OCR text
 */
function extractPaystubFields(text: string, ocrConfidence: number): PaystubExtraction {
  const confidenceBase = BASE_TESSERACT_CONFIDENCE +
    (ocrConfidence > 80 ? CONFIDENCE_ADJUSTMENTS.highQualityOCR :
     ocrConfidence < 50 ? CONFIDENCE_ADJUSTMENTS.lowQualityOCR : 0);

  // Extract employer name
  const employerNameRaw = tryPatterns(text, PAYSTUB_PATTERNS.employerName);

  // Extract employee name
  const employeeNameRaw = tryPatterns(text, PAYSTUB_PATTERNS.employeeName);

  // Extract pay period dates
  const payPeriodStartRaw = tryDatePatterns(text, PAYSTUB_PATTERNS.payPeriodStart);
  const payPeriodEndRaw = tryDatePatterns(text, PAYSTUB_PATTERNS.payPeriodEnd);
  const payDateRaw = tryDatePatterns(text, PAYSTUB_PATTERNS.payDate);

  // Extract gross pay
  const grossPayRaw = tryCurrencyPatterns(text, PAYSTUB_PATTERNS.grossPay);

  // Extract net pay
  const netPayRaw = tryCurrencyPatterns(text, PAYSTUB_PATTERNS.netPay);

  // Extract YTD values
  const ytdGrossPayRaw = tryCurrencyPatterns(text, PAYSTUB_PATTERNS.ytdGrossPay);
  const ytdNetPayRaw = tryCurrencyPatterns(text, PAYSTUB_PATTERNS.ytdNetPay);

  return {
    documentType: 'paystub',
    employerName: createField(employerNameRaw, employerNameRaw || undefined, confidenceBase),
    employeeName: createField(employeeNameRaw, employeeNameRaw || undefined, confidenceBase),
    payPeriodStart: createField(payPeriodStartRaw, payPeriodStartRaw || undefined, confidenceBase),
    payPeriodEnd: createField(payPeriodEndRaw, payPeriodEndRaw || undefined, confidenceBase),
    payDate: createField(payDateRaw, payDateRaw || undefined, confidenceBase),
    grossPay: createField(grossPayRaw, grossPayRaw?.toString(), confidenceBase),
    netPay: createField(netPayRaw, netPayRaw?.toString(), confidenceBase),
    ytdGrossPay: createField(ytdGrossPayRaw, ytdGrossPayRaw?.toString(), confidenceBase),
    ytdNetPay: createField(ytdNetPayRaw, ytdNetPayRaw?.toString(), confidenceBase),
  };
}

/**
 * Extract bank statement fields from raw OCR text
 */
function extractBankStatementFields(text: string, ocrConfidence: number): BankStatementExtraction {
  const confidenceBase = BASE_TESSERACT_CONFIDENCE +
    (ocrConfidence > 80 ? CONFIDENCE_ADJUSTMENTS.highQualityOCR :
     ocrConfidence < 50 ? CONFIDENCE_ADJUSTMENTS.lowQualityOCR : 0);

  // Extract institution name
  const institutionNameRaw = tryPatterns(text, BANK_STATEMENT_PATTERNS.institutionName);

  // Extract account type
  const accountTypeRaw = tryPatterns(text, BANK_STATEMENT_PATTERNS.accountType);

  // Extract account number (last 4)
  const accountNumberLast4Raw = tryPatterns(text, BANK_STATEMENT_PATTERNS.accountNumberLast4);

  // Extract statement period
  const statementPeriodStartRaw = tryDatePatterns(text, BANK_STATEMENT_PATTERNS.statementPeriodStart);
  const statementPeriodEndRaw = tryDatePatterns(text, BANK_STATEMENT_PATTERNS.statementPeriodEnd);

  // Extract balances
  const beginningBalanceRaw = tryCurrencyPatterns(text, BANK_STATEMENT_PATTERNS.beginningBalance);
  const endingBalanceRaw = tryCurrencyPatterns(text, BANK_STATEMENT_PATTERNS.endingBalance);

  // Extract deposits and withdrawals
  const totalDepositsRaw = tryCurrencyPatterns(text, BANK_STATEMENT_PATTERNS.totalDeposits);
  const totalWithdrawalsRaw = tryCurrencyPatterns(text, BANK_STATEMENT_PATTERNS.totalWithdrawals);

  return {
    documentType: 'bank_statement',
    institutionName: createField(institutionNameRaw, institutionNameRaw || undefined, confidenceBase),
    accountType: createField(accountTypeRaw, accountTypeRaw || undefined, confidenceBase),
    accountNumberLast4: createField(accountNumberLast4Raw, accountNumberLast4Raw ? `****${accountNumberLast4Raw}` : undefined, confidenceBase),
    statementPeriodStart: createField(statementPeriodStartRaw, statementPeriodStartRaw || undefined, confidenceBase),
    statementPeriodEnd: createField(statementPeriodEndRaw, statementPeriodEndRaw || undefined, confidenceBase),
    beginningBalance: createField(beginningBalanceRaw, beginningBalanceRaw?.toString(), confidenceBase),
    endingBalance: createField(endingBalanceRaw, endingBalanceRaw?.toString(), confidenceBase),
    totalDeposits: createField(totalDepositsRaw, totalDepositsRaw?.toString(), confidenceBase),
    totalWithdrawals: createField(totalWithdrawalsRaw, totalWithdrawalsRaw?.toString(), confidenceBase),
  };
}

/**
 * Extract ID/Driver's License fields from raw OCR text
 */
function extractIdFields(text: string, ocrConfidence: number): IdExtraction {
  const confidenceBase = BASE_TESSERACT_CONFIDENCE +
    (ocrConfidence > 80 ? CONFIDENCE_ADJUSTMENTS.highQualityOCR :
     ocrConfidence < 50 ? CONFIDENCE_ADJUSTMENTS.lowQualityOCR : 0);

  // Extract full name
  const fullNameRaw = tryPatterns(text, ID_PATTERNS.fullName);

  // Extract date of birth
  const dobRaw = tryDatePatterns(text, ID_PATTERNS.dateOfBirth);

  // Extract license number (last 4 only for security)
  const licenseNumberLast4 = extractLicenseNumberLast4(text);

  // Extract expiration date
  const expirationDateRaw = tryDatePatterns(text, ID_PATTERNS.expirationDate);

  // Extract issue date
  const issueDateRaw = tryDatePatterns(text, ID_PATTERNS.issueDate);

  // Extract address
  const addressRaw = tryPatterns(text, ID_PATTERNS.address);

  // Extract state - first try direct patterns, then try to extract from address
  let stateRaw = tryPatterns(text, ID_PATTERNS.state);
  if (!stateRaw && addressRaw) {
    const stateFromAddress = addressRaw.match(/,\s*([A-Z]{2})\s+\d{5}/);
    if (stateFromAddress) {
      stateRaw = stateFromAddress[1];
    }
  }

  // Detect ID type
  let idType: string | null = null;
  const textUpper = text.toUpperCase();
  if (textUpper.includes('DRIVER') || textUpper.includes('DL ') || textUpper.includes('DRIVING')) {
    idType = 'driver_license';
  } else if (textUpper.includes('STATE ID') || textUpper.includes('IDENTIFICATION CARD')) {
    idType = 'state_id';
  } else if (textUpper.includes('PASSPORT')) {
    idType = 'passport';
  }

  return {
    documentType: 'id',
    fullName: createField(fullNameRaw, fullNameRaw || undefined, confidenceBase),
    dateOfBirth: createField(dobRaw, dobRaw || undefined, confidenceBase),
    licenseNumber: createField(
      licenseNumberLast4 ? `****${licenseNumberLast4}` : null,
      licenseNumberLast4 ? `****${licenseNumberLast4}` : undefined,
      confidenceBase
    ),
    expirationDate: createField(expirationDateRaw, expirationDateRaw || undefined, confidenceBase),
    issueDate: createField(issueDateRaw, issueDateRaw || undefined, confidenceBase),
    address: createField(addressRaw, addressRaw || undefined, confidenceBase - 5),
    state: createField(stateRaw, stateRaw || undefined, confidenceBase),
    idType: createField(idType, idType || undefined, confidenceBase),
  };
}

/**
 * Extract generic fields from raw OCR text
 */
function extractGenericFields(text: string, ocrConfidence: number): GenericExtraction {
  const confidenceBase = BASE_TESSERACT_CONFIDENCE +
    (ocrConfidence > 80 ? CONFIDENCE_ADJUSTMENTS.highQualityOCR :
     ocrConfidence < 50 ? CONFIDENCE_ADJUSTMENTS.lowQualityOCR : 0);

  const detectedFields: Record<string, ExtractedField> = {};

  // Try to find any currency values
  const currencyMatches = text.match(/\$\s*[\d,]+(?:\.\d{2})?/g);
  if (currencyMatches && currencyMatches.length > 0) {
    currencyMatches.slice(0, 5).forEach((match, index) => {
      const value = extractCurrency(match);
      if (value !== null) {
        detectedFields[`amount_${index + 1}`] = createField(value, match, confidenceBase - 10);
      }
    });
  }

  // Try to find any dates
  const dateMatches = text.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g);
  if (dateMatches && dateMatches.length > 0) {
    dateMatches.slice(0, 3).forEach((match, index) => {
      detectedFields[`date_${index + 1}`] = createField(match, match, confidenceBase - 10);
    });
  }

  return {
    documentType: 'other',
    rawText: text,
    detectedFields,
  };
}

/**
 * Calculate overall confidence from extraction
 */
function calculateOverallConfidence(extraction: DocumentExtraction): number {
  let totalConfidence = 0;
  let fieldCount = 0;

  // Get all fields that have values
  for (const [key, value] of Object.entries(extraction)) {
    if (key === 'documentType' || key === 'rawText' || key === 'detectedFields') continue;

    if (typeof value === 'object' && value !== null && 'confidence' in value) {
      const field = value as ExtractedField;
      if (field.value !== null) {
        totalConfidence += field.confidence;
        fieldCount++;
      }
    }
  }

  // Handle detectedFields for generic extraction
  if ('detectedFields' in extraction && extraction.detectedFields) {
    for (const field of Object.values(extraction.detectedFields)) {
      if (field.value !== null) {
        totalConfidence += field.confidence;
        fieldCount++;
      }
    }
  }

  if (fieldCount === 0) return 30; // Low confidence if no fields extracted

  return Math.round(totalConfidence / fieldCount);
}

/**
 * TesseractExtractor - Implements OCRProvider using Tesseract.js
 *
 * This is a fallback OCR provider that works entirely client-side.
 * It uses Tesseract.js for text extraction and regex patterns for
 * field identification.
 *
 * Pros:
 * - Always available (no API key needed)
 * - Works offline
 * - Free to use
 *
 * Cons:
 * - Slower than cloud-based solutions
 * - Less accurate than Claude Vision
 * - Relies on regex patterns which may miss variations
 */
export class TesseractExtractor implements OCRProvider {
  name = 'tesseract';

  /**
   * Tesseract is always available as it's a pure JS implementation
   */
  isAvailable(): boolean {
    return true;
  }

  /**
   * Extract document fields using Tesseract OCR
   */
  async extract(
    imageBuffer: Buffer,
    mimeType: string,
    documentType?: SupportedDocumentType
  ): Promise<ExtractionResult> {
    const startTime = Date.now();
    const detectedType = documentType || 'other';

    try {
      // Convert buffer to base64 data URL for Tesseract
      const base64 = imageBuffer.toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64}`;

      // Run Tesseract OCR
      const result = await Tesseract.recognize(dataUrl, 'eng', {
        logger: () => {}, // Suppress progress logging
      });

      const text = result.data.text;
      const ocrConfidence = result.data.confidence;

      // Handle empty or very low confidence OCR results
      if (!text || text.trim().length < 10) {
        return {
          success: false,
          provider: this.name,
          documentType: detectedType,
          extraction: null,
          overallConfidence: 0,
          processingTimeMs: Date.now() - startTime,
          error: 'OCR could not extract meaningful text from the image',
        };
      }

      if (ocrConfidence < 30) {
        return {
          success: false,
          provider: this.name,
          documentType: detectedType,
          extraction: null,
          overallConfidence: 0,
          processingTimeMs: Date.now() - startTime,
          error: `OCR confidence too low (${ocrConfidence}%). Image may be unclear or unreadable.`,
        };
      }

      // Extract fields based on document type
      let extraction: DocumentExtraction;

      switch (detectedType) {
        case 'w2':
          extraction = extractW2Fields(text, ocrConfidence);
          break;
        case 'paystub':
          extraction = extractPaystubFields(text, ocrConfidence);
          break;
        case 'bank_statement':
          extraction = extractBankStatementFields(text, ocrConfidence);
          break;
        case 'id':
          extraction = extractIdFields(text, ocrConfidence);
          break;
        default:
          extraction = extractGenericFields(text, ocrConfidence);
      }

      const overallConfidence = calculateOverallConfidence(extraction);

      return {
        success: true,
        provider: this.name,
        documentType: detectedType,
        extraction,
        overallConfidence,
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      return {
        success: false,
        provider: this.name,
        documentType: detectedType,
        extraction: null,
        overallConfidence: 0,
        processingTimeMs: Date.now() - startTime,
        error: `Tesseract OCR failed: ${errorMessage}`,
      };
    }
  }
}

// Export a singleton instance for convenience
export const tesseractExtractor = new TesseractExtractor();
