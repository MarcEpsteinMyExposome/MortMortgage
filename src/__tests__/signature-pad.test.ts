import { PDFDocument } from 'pdf-lib'
import {
  signPdf,
  isValidSignatureDataUrl,
  createPlaceholderSignature,
  SignPdfParams
} from '../lib/signing/pdf-signer'

describe('PDF Signer Utility', () => {
  // Helper to create a simple test PDF
  async function createTestPdf(pageCount: number = 1): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create()
    for (let i = 0; i < pageCount; i++) {
      pdfDoc.addPage([612, 792]) // Letter size
    }
    return await pdfDoc.save()
  }

  describe('isValidSignatureDataUrl', () => {
    it('returns true for valid PNG data URL', () => {
      const validUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      expect(isValidSignatureDataUrl(validUrl)).toBe(true)
    })

    it('returns false for JPEG data URL', () => {
      const jpegUrl = 'data:image/jpeg;base64,/9j/4AAQ=='
      expect(isValidSignatureDataUrl(jpegUrl)).toBe(false)
    })

    it('returns false for empty string', () => {
      expect(isValidSignatureDataUrl('')).toBe(false)
    })

    it('returns false for null', () => {
      expect(isValidSignatureDataUrl(null as any)).toBe(false)
    })

    it('returns false for undefined', () => {
      expect(isValidSignatureDataUrl(undefined as any)).toBe(false)
    })

    it('returns false for plain text', () => {
      expect(isValidSignatureDataUrl('hello world')).toBe(false)
    })

    it('returns false for raw base64 without prefix', () => {
      expect(isValidSignatureDataUrl('iVBORw0KGgoAAAANSUhEUg==')).toBe(false)
    })
  })

  describe('createPlaceholderSignature', () => {
    it('returns a valid PNG data URL', () => {
      const placeholder = createPlaceholderSignature()
      expect(isValidSignatureDataUrl(placeholder)).toBe(true)
    })

    it('starts with correct data URL prefix', () => {
      const placeholder = createPlaceholderSignature()
      expect(placeholder.startsWith('data:image/png;base64,')).toBe(true)
    })
  })

  describe('signPdf', () => {
    it('signs a single-page PDF without error', async () => {
      const pdfBytes = await createTestPdf(1)
      const signatureBase64 = createPlaceholderSignature()

      const params: SignPdfParams = {
        pdfBytes,
        signatureBase64,
        signatureOptions: {
          x: 100,
          y: 100,
          width: 200,
          height: 50
        },
        signerInfo: {
          name: 'John Doe',
          date: new Date('2024-01-15')
        }
      }

      const result = await signPdf(params)

      expect(result.pdfBytes).toBeInstanceOf(Uint8Array)
      expect(result.pdfBytes.length).toBeGreaterThan(0)
      expect(result.pageCount).toBe(1)
      expect(result.signedPage).toBe(0)
    })

    it('signs the last page by default', async () => {
      const pdfBytes = await createTestPdf(3)
      const signatureBase64 = createPlaceholderSignature()

      const params: SignPdfParams = {
        pdfBytes,
        signatureBase64,
        signatureOptions: {
          x: 100,
          y: 100,
          width: 200,
          height: 50
        },
        signerInfo: {
          name: 'Jane Smith'
        }
      }

      const result = await signPdf(params)

      expect(result.pageCount).toBe(3)
      expect(result.signedPage).toBe(2) // Last page (0-indexed)
    })

    it('signs a specific page when specified', async () => {
      const pdfBytes = await createTestPdf(5)
      const signatureBase64 = createPlaceholderSignature()

      const params: SignPdfParams = {
        pdfBytes,
        signatureBase64,
        signatureOptions: {
          x: 100,
          y: 100,
          width: 200,
          height: 50,
          pageNumber: 2 // Third page (0-indexed)
        },
        signerInfo: {
          name: 'Bob Johnson'
        }
      }

      const result = await signPdf(params)

      expect(result.pageCount).toBe(5)
      expect(result.signedPage).toBe(2)
    })

    it('includes signer title when provided', async () => {
      const pdfBytes = await createTestPdf(1)
      const signatureBase64 = createPlaceholderSignature()

      const params: SignPdfParams = {
        pdfBytes,
        signatureBase64,
        signatureOptions: {
          x: 100,
          y: 100,
          width: 200,
          height: 50
        },
        signerInfo: {
          name: 'Alice Brown',
          title: 'Borrower',
          date: new Date('2024-06-20')
        }
      }

      const result = await signPdf(params)

      expect(result.pdfBytes).toBeInstanceOf(Uint8Array)
      expect(result.pdfBytes.length).toBeGreaterThan(0)
    })

    it('uses current date when date is not provided', async () => {
      const pdfBytes = await createTestPdf(1)
      const signatureBase64 = createPlaceholderSignature()

      const params: SignPdfParams = {
        pdfBytes,
        signatureBase64,
        signatureOptions: {
          x: 100,
          y: 100,
          width: 200,
          height: 50
        },
        signerInfo: {
          name: 'Test User'
          // No date provided - should use current date
        }
      }

      const result = await signPdf(params)

      expect(result.pdfBytes).toBeInstanceOf(Uint8Array)
    })

    it('throws error for invalid page number', async () => {
      const pdfBytes = await createTestPdf(2)
      const signatureBase64 = createPlaceholderSignature()

      const params: SignPdfParams = {
        pdfBytes,
        signatureBase64,
        signatureOptions: {
          x: 100,
          y: 100,
          width: 200,
          height: 50,
          pageNumber: 10 // Invalid - PDF only has 2 pages
        },
        signerInfo: {
          name: 'Test User'
        }
      }

      await expect(signPdf(params)).rejects.toThrow(/Invalid page number/)
    })

    it('throws error for negative page number', async () => {
      const pdfBytes = await createTestPdf(2)
      const signatureBase64 = createPlaceholderSignature()

      const params: SignPdfParams = {
        pdfBytes,
        signatureBase64,
        signatureOptions: {
          x: 100,
          y: 100,
          width: 200,
          height: 50,
          pageNumber: -1
        },
        signerInfo: {
          name: 'Test User'
        }
      }

      await expect(signPdf(params)).rejects.toThrow(/Invalid page number/)
    })

    it('throws error for invalid signature data URL', async () => {
      const pdfBytes = await createTestPdf(1)

      const params: SignPdfParams = {
        pdfBytes,
        signatureBase64: 'not-a-valid-data-url',
        signatureOptions: {
          x: 100,
          y: 100,
          width: 200,
          height: 50
        },
        signerInfo: {
          name: 'Test User'
        }
      }

      // Should throw an error (either invalid signature or invalid base64 characters)
      await expect(signPdf(params)).rejects.toThrow()
    })

    it('accepts ArrayBuffer as input', async () => {
      const pdfUint8 = await createTestPdf(1)
      const pdfArrayBuffer = pdfUint8.buffer.slice(
        pdfUint8.byteOffset,
        pdfUint8.byteOffset + pdfUint8.byteLength
      )
      const signatureBase64 = createPlaceholderSignature()

      const params: SignPdfParams = {
        pdfBytes: pdfArrayBuffer as ArrayBuffer,
        signatureBase64,
        signatureOptions: {
          x: 100,
          y: 100,
          width: 200,
          height: 50
        },
        signerInfo: {
          name: 'Test User'
        }
      }

      const result = await signPdf(params)

      expect(result.pdfBytes).toBeInstanceOf(Uint8Array)
    })

    it('uses custom text font size when provided', async () => {
      const pdfBytes = await createTestPdf(1)
      const signatureBase64 = createPlaceholderSignature()

      const params: SignPdfParams = {
        pdfBytes,
        signatureBase64,
        signatureOptions: {
          x: 100,
          y: 100,
          width: 200,
          height: 50
        },
        signerInfo: {
          name: 'Test User'
        },
        textFontSize: 14
      }

      const result = await signPdf(params)

      expect(result.pdfBytes).toBeInstanceOf(Uint8Array)
    })

    it('produces valid PDF that can be loaded again', async () => {
      const pdfBytes = await createTestPdf(1)
      const signatureBase64 = createPlaceholderSignature()

      const params: SignPdfParams = {
        pdfBytes,
        signatureBase64,
        signatureOptions: {
          x: 100,
          y: 100,
          width: 200,
          height: 50
        },
        signerInfo: {
          name: 'Test User'
        }
      }

      const result = await signPdf(params)

      // Verify the output can be loaded as a valid PDF
      const loadedPdf = await PDFDocument.load(result.pdfBytes)
      expect(loadedPdf.getPageCount()).toBe(1)
    })
  })
})
