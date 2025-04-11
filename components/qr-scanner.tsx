"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Loader2, Camera, X } from "lucide-react"
import jsQR from "jsqr"

interface QRScannerProps {
  onScan: (data: string) => void
  onClose: () => void
  onError?: (error: string) => void
  className?: string
}

export function QRScanner({ onScan, onClose, onError, className }: QRScannerProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [scanning, setScanning] = useState(true)

  useEffect(() => {
    let animationFrameId: number
    let videoStream: MediaStream | null = null

    const startScanner = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get access to the camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        })
        videoStream = stream

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }

        setLoading(false)

        // Start scanning for QR codes
        const scanQRCode = () => {
          if (!scanning) return

          if (videoRef.current && canvasRef.current) {
            const canvas = canvasRef.current
            const video = videoRef.current

            if (video.readyState === video.HAVE_ENOUGH_DATA) {
              const ctx = canvas.getContext("2d")
              if (!ctx) return

              canvas.height = video.videoHeight
              canvas.width = video.videoWidth

              ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
              const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
              })

              if (code) {
                // QR code detected
                setScanning(false)
                onScan(code.data)
              }
            }
          }

          animationFrameId = requestAnimationFrame(scanQRCode)
        }

        scanQRCode()
      } catch (err: any) {
        console.error("Error accessing camera:", err)
        const errorMessage = err.message || "Failed to access camera"
        setError(errorMessage)
        if (onError) {
          onError(errorMessage)
        }
        setLoading(false)
      }
    }

    startScanner()

    return () => {
      // Clean up
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
      if (videoStream) {
        videoStream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [onScan, scanning, onError])

  return (
    <Card className={`relative overflow-hidden ${className || ""}`}>
      <div className="absolute top-2 right-2 z-10">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">Scan Prescription QR Code</h3>
        <p className="text-sm text-muted-foreground mb-4">Position the QR code within the camera view</p>

        <div className="relative aspect-video bg-black rounded-md overflow-hidden">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-center p-4">
                <p className="text-red-400 mb-2">{error}</p>
                <Button variant="secondary" size="sm" onClick={() => setScanning(true)}>
                  Retry
                </Button>
              </div>
            </div>
          )}

          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
            style={{ display: loading || error ? "none" : "block" }}
          />
          <canvas ref={canvasRef} className="hidden" />

          <div className="absolute inset-0 border-2 border-dashed border-white/50 m-8 pointer-events-none"></div>
        </div>

        <div className="mt-4 flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => setScanning(true)} disabled={loading}>
            <Camera className="mr-2 h-4 w-4" /> Scan Again
          </Button>
        </div>
      </div>
    </Card>
  )
}
