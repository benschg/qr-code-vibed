import { useState, useRef, useEffect } from 'react'
import QRCode from 'qrcode'
import { saveAs } from 'file-saver'
import './QRCodeGenerator.css'

type ExportFormat = 'png' | 'svg'

const QRCodeGenerator = () => {
  const [url, setUrl] = useState<string>('')
  const [centerImage, setCenterImage] = useState<string | null>(null)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png')
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState<'L' | 'M' | 'Q' | 'H'>('H')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Generate QR code whenever URL or center image changes
  useEffect(() => {
    if (url) {
      generateQRCode()
    }
  }, [url, centerImage, errorCorrectionLevel])

  const generateQRCode = async () => {
    if (!url) return

    try {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Generate QR code with higher error correction to accommodate center image
      const qrSize = 512
      canvas.width = qrSize
      canvas.height = qrSize

      await QRCode.toCanvas(canvas, url, {
        errorCorrectionLevel: errorCorrectionLevel,
        width: qrSize,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })

      // If there's a center image, overlay it
      if (centerImage) {
        const img = new Image()
        img.onload = () => {
          const imageSize = qrSize * 0.25 // Center image takes 25% of QR code size
          const x = (qrSize - imageSize) / 2
          const y = (qrSize - imageSize) / 2

          // Draw a white background circle for the image
          const circleRadius = imageSize / 2 + 10
          ctx.fillStyle = '#FFFFFF'
          ctx.beginPath()
          ctx.arc(qrSize / 2, qrSize / 2, circleRadius, 0, 2 * Math.PI)
          ctx.fill()

          // Draw the center image
          ctx.save()
          ctx.beginPath()
          ctx.arc(qrSize / 2, qrSize / 2, imageSize / 2, 0, 2 * Math.PI)
          ctx.clip()
          ctx.drawImage(img, x, y, imageSize, imageSize)
          ctx.restore()

          // Update the data URL for preview
          setQrCodeDataUrl(canvas.toDataURL())
        }
        img.src = centerImage
      } else {
        setQrCodeDataUrl(canvas.toDataURL())
      }
    } catch (error) {
      console.error('Error generating QR code:', error)
      alert('Error generating QR code. Please check your URL.')
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setCenterImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setCenterImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const exportQRCode = async () => {
    if (!url) {
      alert('Please enter a URL first')
      return
    }

    if (exportFormat === 'png') {
      exportAsPNG()
    } else {
      exportAsSVG()
    }
  }

  const exportAsPNG = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.toBlob((blob) => {
      if (blob) {
        saveAs(blob, 'qrcode.png')
      }
    })
  }

  const exportAsSVG = async () => {
    try {
      // For SVG export, we need to generate the QR code as SVG
      let svgString = await QRCode.toString(url, {
        type: 'svg',
        errorCorrectionLevel: errorCorrectionLevel,
        width: 512,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })

      // If there's a center image, we need to embed it in the SVG
      if (centerImage) {
        const qrSize = 512
        const imageSize = qrSize * 0.25
        const x = (qrSize - imageSize) / 2
        const y = (qrSize - imageSize) / 2
        const circleRadius = imageSize / 2 + 10

        // Insert the center image into the SVG
        const insertPos = svgString.lastIndexOf('</svg>')
        const imageElement = `
          <circle cx="${qrSize / 2}" cy="${qrSize / 2}" r="${circleRadius}" fill="white"/>
          <clipPath id="circleClip">
            <circle cx="${qrSize / 2}" cy="${qrSize / 2}" r="${imageSize / 2}"/>
          </clipPath>
          <image x="${x}" y="${y}" width="${imageSize}" height="${imageSize}"
                 href="${centerImage}" clip-path="url(#circleClip)"/>
        `
        svgString = svgString.slice(0, insertPos) + imageElement + svgString.slice(insertPos)
      }

      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
      saveAs(blob, 'qrcode.svg')
    } catch (error) {
      console.error('Error exporting SVG:', error)
      alert('Error exporting as SVG')
    }
  }

  return (
    <div className="qr-generator">
      <div className="controls">
        <div className="input-group">
          <label htmlFor="url-input">Enter URL:</label>
          <input
            id="url-input"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
          />
        </div>

        <div className="input-group">
          <label htmlFor="error-correction">Error Correction Level:</label>
          <select
            id="error-correction"
            value={errorCorrectionLevel}
            onChange={(e) => setErrorCorrectionLevel(e.target.value as 'L' | 'M' | 'Q' | 'H')}
          >
            <option value="L">Low (7%)</option>
            <option value="M">Medium (15%)</option>
            <option value="Q">Quartile (25%)</option>
            <option value="H">High (30%) - Recommended for center images</option>
          </select>
        </div>

        <div className="input-group">
          <label htmlFor="image-upload">Center Image (optional):</label>
          <div className="image-upload-controls">
            <input
              id="image-upload"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
            />
            {centerImage && (
              <button onClick={handleRemoveImage} className="remove-image-btn">
                Remove Image
              </button>
            )}
          </div>
        </div>

        <div className="input-group">
          <label htmlFor="export-format">Export Format:</label>
          <div className="format-selector">
            <label className="radio-label">
              <input
                type="radio"
                name="format"
                value="png"
                checked={exportFormat === 'png'}
                onChange={() => setExportFormat('png')}
              />
              PNG
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="format"
                value="svg"
                checked={exportFormat === 'svg'}
                onChange={() => setExportFormat('svg')}
              />
              SVG
            </label>
          </div>
        </div>

        <button onClick={exportQRCode} className="export-btn" disabled={!url}>
          Export as {exportFormat.toUpperCase()}
        </button>
      </div>

      <div className="preview-section">
        <h2>Preview</h2>
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        {qrCodeDataUrl ? (
          <div className="qr-preview">
            <img src={qrCodeDataUrl} alt="QR Code Preview" />
          </div>
        ) : (
          <div className="qr-placeholder">
            <p>Enter a URL to generate QR code</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default QRCodeGenerator
