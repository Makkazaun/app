'use client'

/**
 * Thin forwardRef wrapper around react-signature-canvas.
 * Imported via next/dynamic to avoid SSR window access.
 */

import { forwardRef } from 'react'
import ReactSignatureCanvas from 'react-signature-canvas'
import type { SignatureCanvasProps } from 'react-signature-canvas'

const SignaturePadWrapper = forwardRef<ReactSignatureCanvas, SignatureCanvasProps>(
  (props, ref) => <ReactSignatureCanvas ref={ref} {...props} />
)
SignaturePadWrapper.displayName = 'SignaturePadWrapper'

export default SignaturePadWrapper
