import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

/**
 * Options for embedding a signature into a PDF
 */
export type SignatureOptions = {
  /** X coordinate (from left edge) where the signature should be placed */
  x: number
  /** Y coordinate (from bottom edge) where the signature should be placed */
  y: number
  /** Width of the signature image */
  width: number
  /** Height of the signature image */
  height: number
  /** Page number to place the signature on (0-indexed, default: last page) */
  pageNumber?: number
}

/**
 * Options for the signer information text displayed below the signature
 */
export type SignerInfo = {
  /** Full name of the signer */
  name: string
  /** Date of signing (if not provided, current date will be used) */
  date?: Date
  /** Optional title or role of the signer (e.g., "Borrower", "Co-Borrower") */
  title?: string
}

/**
 * Parameters for the signPdf function
 */
export type SignPdfParams = {
  /** The original PDF as a Uint8Array or ArrayBuffer */
  pdfBytes: Uint8Array | ArrayBuffer
  /** The signature image as a base64 PNG data URL (e.g., "data:image/png;base64,...") */
  signatureBase64: string
  /** Position and size options for the signature */
  signatureOptions: SignatureOptions
  /** Information about the signer to display below the signature */
  signerInfo: SignerInfo
  /** Font size for the signer text (default: 10) */
  textFontSize?: number
}

/**
 * Result of the signPdf function
 */
export type SignPdfResult = {
  /** The modified PDF as a Uint8Array */
  pdfBytes: Uint8Array
  /** Number of pages in the PDF */
  pageCount: number
  /** The page number where the signature was placed (0-indexed) */
  signedPage: number
}

/**
 * Embeds a signature image into a PDF document at the specified location.
 * Adds the signer's name and date below the signature.
 *
 * @param params - The parameters for signing the PDF
 * @returns Promise resolving to the signed PDF bytes and metadata
 *
 * @example
 * ```typescript
 * import { signPdf } from '@/lib/signing/pdf-signer'
 *
 * // Get the original PDF bytes (e.g., from a file upload or API)
 * const originalPdfBytes = await fetch('/api/pdf').then(r => r.arrayBuffer())
 *
 * // Get signature from SignaturePad component
 * const signatureBase64 = 'data:image/png;base64,iVBORw0KGgo...'
 *
 * // Sign the PDF
 * const result = await signPdf({
 *   pdfBytes: new Uint8Array(originalPdfBytes),
 *   signatureBase64,
 *   signatureOptions: {
 *     x: 100,
 *     y: 100,
 *     width: 200,
 *     height: 50
 *   },
 *   signerInfo: {
 *     name: 'John Doe',
 *     title: 'Borrower',
 *     date: new Date()
 *   }
 * })
 *
 * // Use the signed PDF
 * const blob = new Blob([result.pdfBytes], { type: 'application/pdf' })
 * ```
 */
export async function signPdf(params: SignPdfParams): Promise<SignPdfResult> {
  const {
    pdfBytes,
    signatureBase64,
    signatureOptions,
    signerInfo,
    textFontSize = 10
  } = params

  // Load the existing PDF
  const pdfDoc = await PDFDocument.load(pdfBytes)

  // Get the pages
  const pages = pdfDoc.getPages()
  const pageCount = pages.length

  if (pageCount === 0) {
    throw new Error('PDF has no pages')
  }

  // Determine which page to sign (default to last page)
  const signedPage = signatureOptions.pageNumber ?? pageCount - 1

  if (signedPage < 0 || signedPage >= pageCount) {
    throw new Error(`Invalid page number: ${signedPage}. PDF has ${pageCount} pages.`)
  }

  const page = pages[signedPage]

  // Extract the base64 data from the data URL
  const base64Data = extractBase64FromDataUrl(signatureBase64)
  if (!base64Data) {
    throw new Error('Invalid signature base64 data URL')
  }

  // Decode base64 to bytes
  const signatureImageBytes = base64ToUint8Array(base64Data)

  // Embed the PNG image
  const signatureImage = await pdfDoc.embedPng(signatureImageBytes)

  // Draw the signature image on the page
  page.drawImage(signatureImage, {
    x: signatureOptions.x,
    y: signatureOptions.y,
    width: signatureOptions.width,
    height: signatureOptions.height
  })

  // Embed a standard font for the text
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

  // Format the date
  const signDate = signerInfo.date || new Date()
  const dateString = formatDate(signDate)

  // Build the signer text
  let signerText = signerInfo.name
  if (signerInfo.title) {
    signerText += `, ${signerInfo.title}`
  }
  signerText += `\nSigned: ${dateString}`

  // Calculate text position (below the signature)
  const textX = signatureOptions.x
  const textY = signatureOptions.y - textFontSize - 5 // 5px gap below signature

  // Draw the name line
  page.drawText(signerInfo.name + (signerInfo.title ? `, ${signerInfo.title}` : ''), {
    x: textX,
    y: textY,
    size: textFontSize,
    font,
    color: rgb(0, 0, 0)
  })

  // Draw the date line below the name
  page.drawText(`Signed: ${dateString}`, {
    x: textX,
    y: textY - textFontSize - 2,
    size: textFontSize - 1,
    font,
    color: rgb(0.3, 0.3, 0.3) // Slightly gray
  })

  // Save the modified PDF
  const modifiedPdfBytes = await pdfDoc.save()

  return {
    pdfBytes: modifiedPdfBytes,
    pageCount,
    signedPage
  }
}

/**
 * Extracts the base64 data from a data URL
 * @param dataUrl - The data URL (e.g., "data:image/png;base64,iVBORw0KGgo...")
 * @returns The base64 string without the data URL prefix, or null if invalid
 */
function extractBase64FromDataUrl(dataUrl: string): string | null {
  if (!dataUrl || typeof dataUrl !== 'string') {
    return null
  }

  // Handle data URL format
  if (dataUrl.startsWith('data:')) {
    const matches = dataUrl.match(/^data:image\/png;base64,(.+)$/)
    if (matches && matches[1]) {
      return matches[1]
    }
    return null
  }

  // Assume it's already raw base64 if it doesn't have the prefix
  return dataUrl
}

/**
 * Converts a base64 string to a Uint8Array
 * @param base64 - The base64 encoded string
 * @returns The decoded bytes as a Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
  // Handle both browser and Node.js environments
  if (typeof window !== 'undefined' && typeof window.atob === 'function') {
    // Browser environment
    const binaryString = window.atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes
  } else {
    // Node.js environment
    return new Uint8Array(Buffer.from(base64, 'base64'))
  }
}

/**
 * Formats a date as MM/DD/YYYY
 * @param date - The date to format
 * @returns The formatted date string
 */
function formatDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const year = date.getFullYear()
  return `${month}/${day}/${year}`
}

/**
 * Validates that a base64 string is a valid PNG data URL
 * @param signatureBase64 - The base64 string to validate
 * @returns True if the string is a valid PNG data URL
 */
export function isValidSignatureDataUrl(signatureBase64: string): boolean {
  if (!signatureBase64 || typeof signatureBase64 !== 'string') {
    return false
  }

  // Check for proper PNG data URL format
  return signatureBase64.startsWith('data:image/png;base64,')
}

/**
 * Creates a placeholder signature for testing purposes
 * This is a 1x1 transparent PNG
 */
export function createPlaceholderSignature(): string {
  // A minimal valid 1x1 transparent PNG as base64
  const minimalPng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  return `data:image/png;base64,${minimalPng}`
}
