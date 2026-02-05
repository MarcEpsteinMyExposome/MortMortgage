/**
 * OCR Orchestrator for AI Document Intelligence
 *
 * This module coordinates document extraction across multiple OCR providers,
 * handling fallback logic and returning consistent results.
 */

import {
  SupportedDocumentType,
  OCRProvider,
  ExtractionResult,
  OCRConfig,
  DocumentExtraction,
  ExtractedField,
  W2Extraction,
  PaystubExtraction,
  BankStatementExtraction,
  IdExtraction,
  GenericExtraction,
} from './types';
import { ClaudeVisionExtractor } from './claude-extractor';
import { TesseractExtractor } from './tesseract-extractor';

// Re-export all types for convenience
export * from './types';

// Re-export extractors
export { ClaudeVisionExtractor } from './claude-extractor';
export { TesseractExtractor } from './tesseract-extractor';

// Default configuration
const DEFAULT_CONFIG: OCRConfig = {
  preferredProvider: 'auto',
  enableFallback: true,
  mockMode: process.env.NODE_ENV === 'test' || process.env.OCR_MOCK_MODE === 'true',
};

// Provider registry
const providers: Map<string, OCRProvider> = new Map();

// TesseractExtractor is imported from './tesseract-extractor'

/**
 * Mock provider for testing
 */
class MockProvider implements OCRProvider {
  name = 'mock';

  isAvailable(): boolean {
    return true;
  }

  async extract(
    imageBuffer: Buffer,
    mimeType: string,
    documentType?: SupportedDocumentType
  ): Promise<ExtractionResult> {
    const startTime = Date.now();
    const detectedType = documentType || 'other';

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100));

    const extraction = this.createMockExtraction(detectedType);

    return {
      success: true,
      provider: 'mock',
      documentType: detectedType,
      extraction,
      overallConfidence: 85,
      processingTimeMs: Date.now() - startTime,
    };
  }

  private createMockExtraction(documentType: SupportedDocumentType): DocumentExtraction {
    const mockField = (value: string | number): ExtractedField => ({
      value,
      confidence: 85 + Math.random() * 10,
      rawText: String(value),
    });

    switch (documentType) {
      case 'w2':
        return {
          documentType: 'w2',
          employerName: mockField('Acme Corporation'),
          employerEIN: mockField('12-3456789'),
          employerAddress: mockField('123 Main St, Anytown, USA 12345'),
          employeeName: mockField('John Doe'),
          employeeSSN: mockField('6789'),
          wagesTipsCompensation: mockField(75000),
          federalIncomeTaxWithheld: mockField(12000),
          socialSecurityWages: mockField(75000),
          medicareWages: mockField(75000),
          taxYear: mockField(2024),
        } as W2Extraction;

      case 'paystub':
        return {
          documentType: 'paystub',
          employerName: mockField('Acme Corporation'),
          employeeName: mockField('John Doe'),
          payPeriodStart: mockField('2024-01-01'),
          payPeriodEnd: mockField('2024-01-15'),
          payDate: mockField('2024-01-20'),
          grossPay: mockField(3125),
          netPay: mockField(2450),
          ytdGrossPay: mockField(3125),
          ytdNetPay: mockField(2450),
        } as PaystubExtraction;

      case 'bank_statement':
        return {
          documentType: 'bank_statement',
          institutionName: mockField('First National Bank'),
          accountType: mockField('checking'),
          accountNumberLast4: mockField('4567'),
          statementPeriodStart: mockField('2024-01-01'),
          statementPeriodEnd: mockField('2024-01-31'),
          beginningBalance: mockField(5000),
          endingBalance: mockField(7500),
          totalDeposits: mockField(4000),
          totalWithdrawals: mockField(1500),
        } as BankStatementExtraction;

      case 'id':
        return {
          documentType: 'id',
          fullName: mockField('John Michael Smith'),
          dateOfBirth: mockField('1985-03-15'),
          licenseNumber: mockField('****1234'),
          expirationDate: mockField('2026-03-15'),
          issueDate: mockField('2022-03-15'),
          address: mockField('123 Main St, Austin, TX 78701'),
          state: mockField('TX'),
          idType: mockField('driver_license'),
        } as IdExtraction;

      default:
        return {
          documentType: 'other',
          rawText: 'Mock extracted text from document',
          detectedFields: {
            text: mockField('Sample document text'),
          },
        } as GenericExtraction;
    }
  }
}

// Initialize providers
providers.set('claude', new ClaudeVisionExtractor());
providers.set('tesseract', new TesseractExtractor());
providers.set('mock', new MockProvider());

/**
 * Get list of available OCR providers
 */
export function getAvailableProviders(): string[] {
  const available: string[] = [];
  const providerNames = ['claude', 'tesseract', 'mock'];
  for (const name of providerNames) {
    const provider = providers.get(name);
    if (provider?.isAvailable()) {
      available.push(name);
    }
  }
  return available;
}

/**
 * Register a custom OCR provider
 */
export function registerProvider(provider: OCRProvider): void {
  providers.set(provider.name, provider);
}

/**
 * Get a provider by name
 */
export function getProvider(name: string): OCRProvider | undefined {
  return providers.get(name);
}

/**
 * Auto-detect document type from image content
 * This is a placeholder - actual implementation will use OCR + heuristics
 */
export async function detectDocumentType(
  imageBuffer: Buffer,
  mimeType: string
): Promise<SupportedDocumentType> {
  // For now, return 'other' - actual implementation will analyze the document
  // using OCR and pattern matching to identify document type

  // Future implementation will:
  // 1. Run basic OCR on the document
  // 2. Look for key phrases like "W-2 Wage and Tax Statement", "Pay Stub", etc.
  // 3. Analyze document layout and structure
  // 4. Return the most likely document type

  return 'other';
}

/**
 * Determine the best provider to use based on config and availability
 */
function selectProvider(config: OCRConfig): OCRProvider | null {
  // In mock mode, always use mock provider
  if (config.mockMode) {
    return providers.get('mock') || null;
  }

  // If specific provider requested
  if (config.preferredProvider !== 'auto') {
    const preferred = providers.get(config.preferredProvider);
    if (preferred?.isAvailable()) {
      return preferred;
    }
    // If fallback disabled, return null
    if (!config.enableFallback) {
      return null;
    }
  }

  // Auto mode or fallback: try Claude first (better quality), then Tesseract
  const preferenceOrder = ['claude', 'tesseract'];

  for (const name of preferenceOrder) {
    const provider = providers.get(name);
    if (provider?.isAvailable()) {
      return provider;
    }
  }

  return null;
}

/**
 * Main entry point for document extraction
 *
 * @param imageBuffer - The image data as a Buffer
 * @param mimeType - MIME type of the image (e.g., 'image/png', 'image/jpeg', 'application/pdf')
 * @param documentType - Optional hint for document type, will auto-detect if not provided
 * @param config - Optional configuration overrides
 * @returns ExtractionResult with extracted data or error
 */
export async function extractDocument(
  imageBuffer: Buffer,
  mimeType: string,
  documentType?: SupportedDocumentType,
  config?: Partial<OCRConfig>
): Promise<ExtractionResult> {
  const startTime = Date.now();
  const mergedConfig: OCRConfig = { ...DEFAULT_CONFIG, ...config };

  // Validate input
  if (!imageBuffer || imageBuffer.length === 0) {
    return {
      success: false,
      provider: 'none',
      documentType: documentType || 'other',
      extraction: null,
      overallConfidence: 0,
      processingTimeMs: Date.now() - startTime,
      error: 'Invalid or empty image buffer provided',
    };
  }

  // Validate MIME type
  const supportedMimeTypes = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/gif',
    'application/pdf',
  ];

  if (!supportedMimeTypes.includes(mimeType)) {
    return {
      success: false,
      provider: 'none',
      documentType: documentType || 'other',
      extraction: null,
      overallConfidence: 0,
      processingTimeMs: Date.now() - startTime,
      error: `Unsupported MIME type: ${mimeType}. Supported types: ${supportedMimeTypes.join(', ')}`,
    };
  }

  // Auto-detect document type if not provided
  const detectedType = documentType || await detectDocumentType(imageBuffer, mimeType);

  // Select provider
  const primaryProvider = selectProvider(mergedConfig);

  if (!primaryProvider) {
    return {
      success: false,
      provider: 'none',
      documentType: detectedType,
      extraction: null,
      overallConfidence: 0,
      processingTimeMs: Date.now() - startTime,
      error: 'No OCR provider available. Please configure ANTHROPIC_API_KEY for Claude Vision.',
    };
  }

  // Try primary provider
  try {
    const result = await primaryProvider.extract(imageBuffer, mimeType, detectedType);
    result.processingTimeMs = Date.now() - startTime;
    return result;
  } catch (primaryError) {
    const errorMessage = primaryError instanceof Error ? primaryError.message : String(primaryError);

    // If fallback is disabled or this is mock mode, return error
    if (!mergedConfig.enableFallback || mergedConfig.mockMode) {
      return {
        success: false,
        provider: primaryProvider.name,
        documentType: detectedType,
        extraction: null,
        overallConfidence: 0,
        processingTimeMs: Date.now() - startTime,
        error: `Primary provider (${primaryProvider.name}) failed: ${errorMessage}`,
      };
    }

    // Try fallback providers
    const fallbackOrder = ['claude', 'tesseract'].filter(
      name => name !== primaryProvider.name
    );

    for (const fallbackName of fallbackOrder) {
      const fallbackProvider = providers.get(fallbackName);
      if (!fallbackProvider?.isAvailable()) continue;

      try {
        const result = await fallbackProvider.extract(imageBuffer, mimeType, detectedType);
        result.processingTimeMs = Date.now() - startTime;
        return result;
      } catch (fallbackError) {
        // Continue to next fallback
        continue;
      }
    }

    // All providers failed
    return {
      success: false,
      provider: primaryProvider.name,
      documentType: detectedType,
      extraction: null,
      overallConfidence: 0,
      processingTimeMs: Date.now() - startTime,
      error: `All OCR providers failed. Primary error: ${errorMessage}`,
    };
  }
}

/**
 * Helper function to calculate overall confidence from extracted fields
 */
export function calculateOverallConfidence(extraction: DocumentExtraction): number {
  if (!extraction) return 0;

  const fields: ExtractedField[] = [];

  // Collect all ExtractedField values from the extraction
  for (const [key, value] of Object.entries(extraction)) {
    if (key === 'documentType' || key === 'rawText' || key === 'detectedFields') continue;

    if (typeof value === 'object' && value !== null && 'confidence' in value) {
      fields.push(value as ExtractedField);
    }
  }

  // Handle detectedFields for generic extraction
  if ('detectedFields' in extraction && extraction.detectedFields) {
    for (const field of Object.values(extraction.detectedFields)) {
      fields.push(field);
    }
  }

  if (fields.length === 0) return 0;

  // Calculate weighted average (fields with values count more)
  let totalWeight = 0;
  let weightedSum = 0;

  for (const field of fields) {
    const weight = field.value !== null ? 2 : 1;
    totalWeight += weight;
    weightedSum += field.confidence * weight;
  }

  return Math.round(weightedSum / totalWeight);
}

/**
 * Validate extracted data against expected patterns
 */
export function validateExtraction(extraction: DocumentExtraction): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  switch (extraction.documentType) {
    case 'w2':
      if (extraction.wagesTipsCompensation.value !== null) {
        const wages = Number(extraction.wagesTipsCompensation.value);
        if (wages < 0) warnings.push('Wages cannot be negative');
        if (wages > 10000000) warnings.push('Unusually high wages detected');
      }
      if (extraction.taxYear.value !== null) {
        const year = Number(extraction.taxYear.value);
        const currentYear = new Date().getFullYear();
        if (year < currentYear - 10 || year > currentYear) {
          warnings.push(`Tax year ${year} seems unusual`);
        }
      }
      break;

    case 'paystub':
      if (extraction.grossPay.value !== null && extraction.netPay.value !== null) {
        const gross = Number(extraction.grossPay.value);
        const net = Number(extraction.netPay.value);
        if (net > gross) warnings.push('Net pay exceeds gross pay');
      }
      break;

    case 'bank_statement':
      if (extraction.beginningBalance.value !== null &&
          extraction.endingBalance.value !== null &&
          extraction.totalDeposits.value !== null &&
          extraction.totalWithdrawals.value !== null) {
        const begin = Number(extraction.beginningBalance.value);
        const end = Number(extraction.endingBalance.value);
        const deposits = Number(extraction.totalDeposits.value);
        const withdrawals = Number(extraction.totalWithdrawals.value);
        const expected = begin + deposits - withdrawals;
        if (Math.abs(expected - end) > 0.01) {
          warnings.push('Balance calculation does not match');
        }
      }
      break;
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}
