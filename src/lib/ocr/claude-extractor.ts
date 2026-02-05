/**
 * Claude Vision Extractor for AI Document Intelligence
 *
 * This module implements document extraction using Claude's vision capabilities
 * to analyze mortgage-related documents (W-2s, paystubs, bank statements, etc.).
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  SupportedDocumentType,
  OCRProvider,
  ExtractionResult,
  DocumentExtraction,
  ExtractedField,
  W2Extraction,
  PaystubExtraction,
  BankStatementExtraction,
  IdExtraction,
  GenericExtraction,
} from './types';
import {
  getExtractionPrompt,
  getDocumentTypeDetectionPrompt,
  parseExtractionResponse,
  W2ExtractionResult,
  PaystubExtractionResult,
  BankStatementExtractionResult,
  IdExtractionResult,
  GenericExtractionResult,
  DocumentTypeDetectionResult,
  maskSensitiveData,
} from './extraction-prompts';
import {
  parseCurrency,
  parseDate,
  maskSSN,
  normalizeName,
  normalizeAddress,
} from './field-parsers';

// Supported MIME types for Claude Vision
const SUPPORTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

type SupportedMediaType = typeof SUPPORTED_MIME_TYPES[number];

/**
 * Claude Vision Extractor
 *
 * Implements the OCRProvider interface using Claude's vision API to extract
 * structured data from document images.
 */
export class ClaudeVisionExtractor implements OCRProvider {
  name = 'claude';
  private client: Anthropic | null = null;
  private model = 'claude-sonnet-4-20250514';

  constructor() {
    // Initialize client lazily to allow checking availability first
  }

  /**
   * Check if the Claude Vision provider is available
   */
  isAvailable(): boolean {
    return !!process.env.ANTHROPIC_API_KEY;
  }

  /**
   * Get or create the Anthropic client
   */
  private getClient(): Anthropic {
    if (!this.client) {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error(
          'ANTHROPIC_API_KEY environment variable is not set. ' +
          'Please set it to use Claude Vision for document extraction.'
        );
      }
      this.client = new Anthropic({ apiKey });
    }
    return this.client;
  }

  /**
   * Convert a Buffer to base64 string
   */
  private bufferToBase64(buffer: Buffer): string {
    return buffer.toString('base64');
  }

  /**
   * Validate and normalize MIME type for Claude API
   */
  private validateMimeType(mimeType: string): SupportedMediaType {
    // Normalize common variations
    const normalizedMime = mimeType.toLowerCase().trim();

    // Handle 'image/jpg' -> 'image/jpeg'
    if (normalizedMime === 'image/jpg') {
      return 'image/jpeg';
    }

    // Check if supported
    if (SUPPORTED_MIME_TYPES.includes(normalizedMime as SupportedMediaType)) {
      return normalizedMime as SupportedMediaType;
    }

    // Handle PDF - not directly supported by Claude Vision
    if (normalizedMime === 'application/pdf') {
      throw new Error(
        'PDF files are not directly supported by Claude Vision. ' +
        'Please convert the PDF to an image (PNG, JPEG, WebP, or GIF) before uploading, ' +
        'or upload only the first page as an image.'
      );
    }

    throw new Error(
      `Unsupported MIME type: ${mimeType}. ` +
      `Supported types: ${SUPPORTED_MIME_TYPES.join(', ')}`
    );
  }

  /**
   * Extract data from a document image
   *
   * @param imageBuffer - The image data as a Buffer
   * @param mimeType - MIME type of the image
   * @param documentType - Optional hint for document type (will auto-detect if not provided)
   * @returns ExtractionResult with extracted data
   */
  async extract(
    imageBuffer: Buffer,
    mimeType: string,
    documentType?: SupportedDocumentType
  ): Promise<ExtractionResult> {
    const startTime = Date.now();

    try {
      // Validate MIME type
      const validatedMimeType = this.validateMimeType(mimeType);

      // Convert image to base64
      const base64Image = this.bufferToBase64(imageBuffer);

      // Get or create client
      const client = this.getClient();

      // If no document type provided, detect it first
      let detectedType = documentType;
      if (!detectedType) {
        detectedType = await this.detectDocumentType(client, base64Image, validatedMimeType);
      }

      // Get the appropriate extraction prompt
      const extractionPrompt = getExtractionPrompt(detectedType);

      // Call Claude Vision API for extraction
      const response = await client.messages.create({
        model: this.model,
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: validatedMimeType,
                  data: base64Image,
                },
              },
              {
                type: 'text',
                text: extractionPrompt,
              },
            ],
          },
        ],
      });

      // Extract text content from response
      const responseText = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map((block) => block.text)
        .join('');

      // Parse the response based on document type
      const extraction = this.parseResponse(responseText, detectedType);

      if (!extraction) {
        return {
          success: false,
          provider: this.name,
          documentType: detectedType,
          extraction: null,
          overallConfidence: 0,
          processingTimeMs: Date.now() - startTime,
          error: 'Failed to parse extraction response from Claude',
        };
      }

      // Calculate overall confidence
      const overallConfidence = this.calculateOverallConfidence(extraction);

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
        documentType: documentType || 'other',
        extraction: null,
        overallConfidence: 0,
        processingTimeMs: Date.now() - startTime,
        error: `Claude Vision extraction failed: ${errorMessage}`,
      };
    }
  }

  /**
   * Detect document type using Claude Vision
   */
  private async detectDocumentType(
    client: Anthropic,
    base64Image: string,
    mimeType: SupportedMediaType
  ): Promise<SupportedDocumentType> {
    try {
      const detectionPrompt = getDocumentTypeDetectionPrompt();

      const response = await client.messages.create({
        model: this.model,
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mimeType,
                  data: base64Image,
                },
              },
              {
                type: 'text',
                text: detectionPrompt,
              },
            ],
          },
        ],
      });

      const responseText = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map((block) => block.text)
        .join('');

      const detection = parseExtractionResponse<DocumentTypeDetectionResult>(
        responseText,
        'other'
      );

      if (detection && detection.documentType) {
        // Map to our supported types
        const typeMapping: Record<string, SupportedDocumentType> = {
          w2: 'w2',
          paystub: 'paystub',
          bank_statement: 'bank_statement',
          tax_return: 'tax_return',
          id: 'id',
          other: 'other',
        };
        return typeMapping[detection.documentType] || 'other';
      }

      return 'other';
    } catch (error) {
      // If detection fails, default to 'other'
      console.warn('Document type detection failed, defaulting to "other":', error);
      return 'other';
    }
  }

  /**
   * Parse Claude's response into a DocumentExtraction
   */
  private parseResponse(
    responseText: string,
    documentType: SupportedDocumentType
  ): DocumentExtraction | null {
    try {
      switch (documentType) {
        case 'w2':
          return this.parseW2Response(responseText);
        case 'paystub':
          return this.parsePaystubResponse(responseText);
        case 'bank_statement':
          return this.parseBankStatementResponse(responseText);
        case 'id':
          return this.parseIdResponse(responseText);
        default:
          return this.parseGenericResponse(responseText);
      }
    } catch (error) {
      console.error('Failed to parse response:', error);
      return null;
    }
  }

  /**
   * Parse W-2 extraction response
   */
  private parseW2Response(responseText: string): W2Extraction | null {
    const parsed = parseExtractionResponse<W2ExtractionResult>(responseText, 'w2');
    if (!parsed) return null;

    const createField = (field: { value: string | number | null; confidence: number; rawText?: string } | undefined): ExtractedField => ({
      value: field?.value ?? null,
      confidence: field?.confidence ?? 0,
      rawText: field?.rawText,
    });

    return {
      documentType: 'w2',
      employerName: createField(parsed.employer?.name),
      employerEIN: createField(parsed.employer?.ein),
      employerAddress: createField(parsed.employer?.address),
      employeeName: createField(parsed.employee?.name),
      employeeSSN: {
        value: parsed.employee?.ssn?.value ? maskSSN(String(parsed.employee.ssn.value)) : null,
        confidence: parsed.employee?.ssn?.confidence ?? 0,
        rawText: parsed.employee?.ssn?.rawText,
      },
      wagesTipsCompensation: {
        value: this.normalizeNumericField(parsed.wages?.box1_wages?.value),
        confidence: parsed.wages?.box1_wages?.confidence ?? 0,
        rawText: parsed.wages?.box1_wages?.rawText,
      },
      federalIncomeTaxWithheld: {
        value: this.normalizeNumericField(parsed.wages?.box2_federalTaxWithheld?.value),
        confidence: parsed.wages?.box2_federalTaxWithheld?.confidence ?? 0,
        rawText: parsed.wages?.box2_federalTaxWithheld?.rawText,
      },
      socialSecurityWages: {
        value: this.normalizeNumericField(parsed.wages?.box3_socialSecurityWages?.value),
        confidence: parsed.wages?.box3_socialSecurityWages?.confidence ?? 0,
        rawText: parsed.wages?.box3_socialSecurityWages?.rawText,
      },
      medicareWages: {
        value: this.normalizeNumericField(parsed.wages?.box5_medicareWages?.value),
        confidence: parsed.wages?.box5_medicareWages?.confidence ?? 0,
        rawText: parsed.wages?.box5_medicareWages?.rawText,
      },
      taxYear: createField(parsed.taxYear),
    };
  }

  /**
   * Parse paystub extraction response
   */
  private parsePaystubResponse(responseText: string): PaystubExtraction | null {
    const parsed = parseExtractionResponse<PaystubExtractionResult>(responseText, 'paystub');
    if (!parsed) return null;

    const createField = (field: { value: string | number | null; confidence: number; rawText?: string } | undefined): ExtractedField => ({
      value: field?.value ?? null,
      confidence: field?.confidence ?? 0,
      rawText: field?.rawText,
    });

    return {
      documentType: 'paystub',
      employerName: createField(parsed.employer?.name),
      employeeName: createField(parsed.employee?.name),
      payPeriodStart: {
        value: parsed.payPeriod?.startDate?.value
          ? parseDate(String(parsed.payPeriod.startDate.value))
          : null,
        confidence: parsed.payPeriod?.startDate?.confidence ?? 0,
        rawText: parsed.payPeriod?.startDate?.rawText,
      },
      payPeriodEnd: {
        value: parsed.payPeriod?.endDate?.value
          ? parseDate(String(parsed.payPeriod.endDate.value))
          : null,
        confidence: parsed.payPeriod?.endDate?.confidence ?? 0,
        rawText: parsed.payPeriod?.endDate?.rawText,
      },
      payDate: {
        value: parsed.payPeriod?.payDate?.value
          ? parseDate(String(parsed.payPeriod.payDate.value))
          : null,
        confidence: parsed.payPeriod?.payDate?.confidence ?? 0,
        rawText: parsed.payPeriod?.payDate?.rawText,
      },
      grossPay: {
        value: this.normalizeNumericField(parsed.earnings?.grossPay?.value),
        confidence: parsed.earnings?.grossPay?.confidence ?? 0,
        rawText: parsed.earnings?.grossPay?.rawText,
      },
      netPay: {
        value: this.normalizeNumericField(parsed.earnings?.netPay?.value),
        confidence: parsed.earnings?.netPay?.confidence ?? 0,
        rawText: parsed.earnings?.netPay?.rawText,
      },
      ytdGrossPay: {
        value: this.normalizeNumericField(parsed.ytdAmounts?.grossPay?.value),
        confidence: parsed.ytdAmounts?.grossPay?.confidence ?? 0,
        rawText: parsed.ytdAmounts?.grossPay?.rawText,
      },
      ytdNetPay: {
        value: this.normalizeNumericField(parsed.ytdAmounts?.netPay?.value),
        confidence: parsed.ytdAmounts?.netPay?.confidence ?? 0,
        rawText: parsed.ytdAmounts?.netPay?.rawText,
      },
    };
  }

  /**
   * Parse bank statement extraction response
   */
  private parseBankStatementResponse(responseText: string): BankStatementExtraction | null {
    const parsed = parseExtractionResponse<BankStatementExtractionResult>(responseText, 'bank_statement');
    if (!parsed) return null;

    const createField = (field: { value: string | number | null; confidence: number; rawText?: string } | undefined): ExtractedField => ({
      value: field?.value ?? null,
      confidence: field?.confidence ?? 0,
      rawText: field?.rawText,
    });

    return {
      documentType: 'bank_statement',
      institutionName: createField(parsed.institution?.name),
      accountType: createField(parsed.account?.type),
      accountNumberLast4: {
        value: parsed.account?.numberLast4?.value ?? null,
        confidence: parsed.account?.numberLast4?.confidence ?? 0,
        rawText: parsed.account?.numberLast4?.rawText,
      },
      statementPeriodStart: {
        value: parsed.statementPeriod?.startDate?.value
          ? parseDate(String(parsed.statementPeriod.startDate.value))
          : null,
        confidence: parsed.statementPeriod?.startDate?.confidence ?? 0,
        rawText: parsed.statementPeriod?.startDate?.rawText,
      },
      statementPeriodEnd: {
        value: parsed.statementPeriod?.endDate?.value
          ? parseDate(String(parsed.statementPeriod.endDate.value))
          : null,
        confidence: parsed.statementPeriod?.endDate?.confidence ?? 0,
        rawText: parsed.statementPeriod?.endDate?.rawText,
      },
      beginningBalance: {
        value: this.normalizeNumericField(parsed.balances?.beginning?.value),
        confidence: parsed.balances?.beginning?.confidence ?? 0,
        rawText: parsed.balances?.beginning?.rawText,
      },
      endingBalance: {
        value: this.normalizeNumericField(parsed.balances?.ending?.value),
        confidence: parsed.balances?.ending?.confidence ?? 0,
        rawText: parsed.balances?.ending?.rawText,
      },
      totalDeposits: {
        value: this.normalizeNumericField(parsed.totals?.deposits?.value),
        confidence: parsed.totals?.deposits?.confidence ?? 0,
        rawText: parsed.totals?.deposits?.rawText,
      },
      totalWithdrawals: {
        value: this.normalizeNumericField(parsed.totals?.withdrawals?.value),
        confidence: parsed.totals?.withdrawals?.confidence ?? 0,
        rawText: parsed.totals?.withdrawals?.rawText,
      },
    };
  }

  /**
   * Parse ID/Driver's License extraction response
   */
  private parseIdResponse(responseText: string): IdExtraction | null {
    const parsed = parseExtractionResponse<IdExtractionResult>(responseText, 'id');
    if (!parsed) return null;

    const createField = (field: { value: string | number | null; confidence: number; rawText?: string } | undefined): ExtractedField => ({
      value: field?.value ?? null,
      confidence: field?.confidence ?? 0,
      rawText: field?.rawText,
    });

    // Mask license number - only show last 4 digits
    const licenseNumber = parsed.license?.number?.value;
    const maskedLicenseNumber = licenseNumber
      ? maskSensitiveData(String(licenseNumber), 4)
      : null;

    return {
      documentType: 'id',
      fullName: createField(parsed.personal?.fullName),
      dateOfBirth: {
        value: parsed.personal?.dateOfBirth?.value
          ? parseDate(String(parsed.personal.dateOfBirth.value))
          : null,
        confidence: parsed.personal?.dateOfBirth?.confidence ?? 0,
        rawText: parsed.personal?.dateOfBirth?.rawText,
      },
      licenseNumber: {
        value: maskedLicenseNumber,
        confidence: parsed.license?.number?.confidence ?? 0,
        rawText: parsed.license?.number?.rawText,
      },
      expirationDate: {
        value: parsed.license?.expirationDate?.value
          ? parseDate(String(parsed.license.expirationDate.value))
          : null,
        confidence: parsed.license?.expirationDate?.confidence ?? 0,
        rawText: parsed.license?.expirationDate?.rawText,
      },
      issueDate: {
        value: parsed.license?.issueDate?.value
          ? parseDate(String(parsed.license.issueDate.value))
          : null,
        confidence: parsed.license?.issueDate?.confidence ?? 0,
        rawText: parsed.license?.issueDate?.rawText,
      },
      address: createField(parsed.personal?.address),
      state: createField(parsed.license?.state),
      idType: createField(parsed.license?.idType),
    };
  }

  /**
   * Parse generic extraction response
   */
  private parseGenericResponse(responseText: string): GenericExtraction | null {
    const parsed = parseExtractionResponse<GenericExtractionResult>(responseText, 'other');
    if (!parsed) return null;

    const detectedFields: Record<string, ExtractedField> = {};

    if (parsed.keyValuePairs) {
      for (const kvp of parsed.keyValuePairs) {
        detectedFields[kvp.key] = {
          value: kvp.value?.value ?? null,
          confidence: kvp.value?.confidence ?? 0,
          rawText: kvp.value?.rawText,
        };
      }
    }

    return {
      documentType: 'other',
      rawText: parsed.rawText || '',
      detectedFields,
    };
  }

  /**
   * Normalize numeric field values
   */
  private normalizeNumericField(value: string | number | null | undefined): number | null {
    if (value === null || value === undefined) {
      return null;
    }
    if (typeof value === 'number') {
      return value;
    }
    // Try to parse as currency (handles $, commas, etc.)
    const parsed = parseCurrency(value);
    if (parsed !== null) {
      return parsed;
    }
    // Try direct parse
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  }

  /**
   * Calculate overall confidence from extraction
   */
  private calculateOverallConfidence(extraction: DocumentExtraction): number {
    const confidences: number[] = [];

    // Collect all confidence values from extracted fields
    for (const [key, value] of Object.entries(extraction)) {
      if (key === 'documentType' || key === 'rawText' || key === 'detectedFields') {
        continue;
      }

      if (
        typeof value === 'object' &&
        value !== null &&
        'confidence' in value &&
        typeof (value as ExtractedField).confidence === 'number'
      ) {
        const field = value as ExtractedField;
        // Only include fields that have values
        if (field.value !== null) {
          confidences.push(field.confidence);
        }
      }
    }

    // Handle detectedFields for generic extraction
    if ('detectedFields' in extraction && extraction.detectedFields) {
      for (const field of Object.values(extraction.detectedFields)) {
        if (field.value !== null) {
          confidences.push(field.confidence);
        }
      }
    }

    if (confidences.length === 0) {
      return 0;
    }

    // Calculate weighted average (round to integer)
    const average = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
    return Math.round(average);
  }
}

/**
 * Create a new ClaudeVisionExtractor instance
 */
export function createClaudeExtractor(): ClaudeVisionExtractor {
  return new ClaudeVisionExtractor();
}

// Export default instance
export default ClaudeVisionExtractor;
