// Document types we support extraction for
export type SupportedDocumentType = 'w2' | 'paystub' | 'bank_statement' | 'tax_return' | 'id' | 'other';

// Extraction result for a single field
export interface ExtractedField {
  value: string | number | null;
  confidence: number; // 0-100
  rawText?: string;   // Original text from document
}

// W2 extraction result
export interface W2Extraction {
  documentType: 'w2';
  employerName: ExtractedField;
  employerEIN: ExtractedField;
  employerAddress: ExtractedField;
  employeeName: ExtractedField;
  employeeSSN: ExtractedField; // Last 4 digits only
  wagesTipsCompensation: ExtractedField; // Box 1
  federalIncomeTaxWithheld: ExtractedField; // Box 2
  socialSecurityWages: ExtractedField; // Box 3
  medicareWages: ExtractedField; // Box 5
  taxYear: ExtractedField;
}

// Paystub extraction result
export interface PaystubExtraction {
  documentType: 'paystub';
  employerName: ExtractedField;
  employeeName: ExtractedField;
  payPeriodStart: ExtractedField;
  payPeriodEnd: ExtractedField;
  payDate: ExtractedField;
  grossPay: ExtractedField;
  netPay: ExtractedField;
  ytdGrossPay: ExtractedField;
  ytdNetPay: ExtractedField;
}

// Bank statement extraction result
export interface BankStatementExtraction {
  documentType: 'bank_statement';
  institutionName: ExtractedField;
  accountType: ExtractedField; // checking, savings, etc.
  accountNumberLast4: ExtractedField;
  statementPeriodStart: ExtractedField;
  statementPeriodEnd: ExtractedField;
  beginningBalance: ExtractedField;
  endingBalance: ExtractedField;
  totalDeposits: ExtractedField;
  totalWithdrawals: ExtractedField;
}

// ID/Driver's License extraction result
export interface IdExtraction {
  documentType: 'id';
  fullName: ExtractedField;
  dateOfBirth: ExtractedField;
  licenseNumber: ExtractedField; // Last 4 digits only for security
  expirationDate: ExtractedField;
  issueDate: ExtractedField;
  address: ExtractedField;
  state: ExtractedField;
  idType: ExtractedField; // driver_license, state_id, passport, etc.
}

// Generic extraction for unsupported types
export interface GenericExtraction {
  documentType: 'other';
  rawText: string;
  detectedFields: Record<string, ExtractedField>;
}

// Union of all extraction types
export type DocumentExtraction = W2Extraction | PaystubExtraction | BankStatementExtraction | IdExtraction | GenericExtraction;

// OCR Provider interface
export interface OCRProvider {
  name: string;
  extract(imageBuffer: Buffer, mimeType: string, documentType?: SupportedDocumentType): Promise<ExtractionResult>;
  isAvailable(): boolean;
}

// Result from extraction
export interface ExtractionResult {
  success: boolean;
  provider: string;
  documentType: SupportedDocumentType;
  extraction: DocumentExtraction | null;
  overallConfidence: number;
  processingTimeMs: number;
  error?: string;
}

// Configuration for OCR
export interface OCRConfig {
  preferredProvider: 'claude' | 'tesseract' | 'auto';
  enableFallback: boolean;
  mockMode: boolean;
}
