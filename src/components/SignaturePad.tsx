import React, { useRef, useEffect, useCallback } from 'react'
import SignaturePadLib from 'signature_pad'

export type SignaturePadProps = {
  /** Callback when user saves the signature, receives base64 PNG string */
  onSave: (signatureBase64: string) => void
  /** Callback when user cancels */
  onCancel: () => void
  /** Optional width for the canvas (default: 100% of container) */
  width?: number
  /** Optional height for the canvas (default: 200px) */
  height?: number
  /** Optional pen color (default: black) */
  penColor?: string
  /** Optional background color (default: white) */
  backgroundColor?: string
}

/**
 * SignaturePad Component
 *
 * A touch-friendly signature pad component that uses the signature_pad library.
 * Works on both desktop and mobile devices.
 *
 * @example
 * ```tsx
 * <SignaturePad
 *   onSave={(base64) => console.log('Signature:', base64)}
 *   onCancel={() => console.log('Cancelled')}
 * />
 * ```
 */
export default function SignaturePad({
  onSave,
  onCancel,
  width,
  height = 200,
  penColor = '#000000',
  backgroundColor = '#ffffff'
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const signaturePadRef = useRef<SignaturePadLib | null>(null)

  /**
   * Resize the canvas to match its display size while maintaining proper resolution.
   * This ensures the signature looks crisp on high-DPI displays.
   */
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    // Get the actual display width of the container
    const displayWidth = width || container.clientWidth
    const displayHeight = height

    // Get the device pixel ratio for crisp rendering
    const ratio = Math.max(window.devicePixelRatio || 1, 1)

    // Set the canvas internal resolution
    canvas.width = displayWidth * ratio
    canvas.height = displayHeight * ratio

    // Set the display size
    canvas.style.width = `${displayWidth}px`
    canvas.style.height = `${displayHeight}px`

    // Scale the context to match the device pixel ratio
    const context = canvas.getContext('2d')
    if (context) {
      context.scale(ratio, ratio)
    }

    // Clear and redraw after resize if there's an existing signature pad
    if (signaturePadRef.current) {
      // Store current data
      const data = signaturePadRef.current.toData()

      // Clear and fill with background color
      signaturePadRef.current.clear()

      // Restore data if any
      if (data && data.length > 0) {
        signaturePadRef.current.fromData(data)
      }
    }
  }, [width, height])

  // Initialize the signature pad
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Create the signature pad instance
    signaturePadRef.current = new SignaturePadLib(canvas, {
      penColor,
      backgroundColor
    })

    // Initial resize
    resizeCanvas()

    // Handle window resize
    const handleResize = () => {
      resizeCanvas()
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      if (signaturePadRef.current) {
        signaturePadRef.current.off()
      }
    }
  }, [penColor, backgroundColor, resizeCanvas])

  /**
   * Clear the signature pad
   */
  const handleClear = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear()
    }
  }

  /**
   * Save the signature as a base64 PNG string
   */
  const handleSave = () => {
    if (!signaturePadRef.current) return

    if (signaturePadRef.current.isEmpty()) {
      alert('Please provide a signature before saving.')
      return
    }

    // Get the signature as a base64 PNG data URL
    const dataUrl = signaturePadRef.current.toDataURL('image/png')
    onSave(dataUrl)
  }

  /**
   * Handle cancel action
   */
  const handleCancel = () => {
    onCancel()
  }

  return (
    <div className="w-full">
      {/* Canvas Container */}
      <div
        ref={containerRef}
        className="w-full border border-gray-300 rounded-lg overflow-hidden bg-white"
      >
        <canvas
          ref={canvasRef}
          className="touch-none cursor-crosshair"
          style={{
            display: 'block',
            width: '100%',
            height: `${height}px`
          }}
        />
      </div>

      {/* Instructions */}
      <p className="text-xs text-gray-500 mt-2 text-center">
        Sign above using your mouse or finger on touch devices
      </p>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 mt-4">
        <button
          type="button"
          onClick={handleClear}
          className="btn btn-secondary"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="btn btn-secondary"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="btn btn-primary"
        >
          Save Signature
        </button>
      </div>
    </div>
  )
}
