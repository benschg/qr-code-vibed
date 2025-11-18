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
  const [title, setTitle] = useState<string>('')
  const [bottomText, setBottomText] = useState<string>('')
  const [showBottomText, setShowBottomText] = useState<boolean>(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Generate QR code whenever URL or center image changes
  useEffect(() => {
    if (url) {
      generateQRCode()
    }
  }, [url, centerImage, errorCorrectionLevel, title, bottomText, showBottomText])

  const generateQRCode = async () => {
    if (!url) return

    try {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // QR code size and layout calculations
      const qrSize = 512
      const padding = 40
      const titleHeight = title ? 60 : 0
      const bottomTextHeight = (showBottomText && bottomText) ? 50 : 0
      const totalHeight = titleHeight + qrSize + bottomTextHeight + (title || (showBottomText && bottomText) ? padding * 2 : 0)

      // Set canvas size
      canvas.width = qrSize + padding * 2
      canvas.height = totalHeight

      // Fill white background
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw title if present
      let qrYOffset = padding
      if (title) {
        ctx.fillStyle = '#000000'
        ctx.font = 'bold 32px Arial, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.fillText(title, canvas.width / 2, padding)
        qrYOffset = titleHeight + padding
      }

      // Create a temporary canvas for QR code
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = qrSize
      tempCanvas.height = qrSize

      await QRCode.toCanvas(tempCanvas, url, {
        errorCorrectionLevel: errorCorrectionLevel,
        width: qrSize,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })

      // Draw QR code onto main canvas
      ctx.drawImage(tempCanvas, padding, qrYOffset)

      // If there's a center image, overlay it
      if (centerImage) {
        const img = new Image()
        img.onload = () => {
          const imageSize = qrSize * 0.25
          const x = padding + (qrSize - imageSize) / 2
          const y = qrYOffset + (qrSize - imageSize) / 2

          // Draw a white background circle for the image
          const circleRadius = imageSize / 2 + 10
          ctx.fillStyle = '#FFFFFF'
          ctx.beginPath()
          ctx.arc(padding + qrSize / 2, qrYOffset + qrSize / 2, circleRadius, 0, 2 * Math.PI)
          ctx.fill()

          // Draw the center image
          ctx.save()
          ctx.beginPath()
          ctx.arc(padding + qrSize / 2, qrYOffset + qrSize / 2, imageSize / 2, 0, 2 * Math.PI)
          ctx.clip()
          ctx.drawImage(img, x, y, imageSize, imageSize)
          ctx.restore()

          // Draw bottom text if enabled
          if (showBottomText && bottomText) {
            ctx.fillStyle = '#000000'
            ctx.font = '24px Arial, sans-serif'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'top'
            ctx.fillText(bottomText, canvas.width / 2, qrYOffset + qrSize + padding)
          }

          setQrCodeDataUrl(canvas.toDataURL())
        }
        img.src = centerImage
      } else {
        // Draw bottom text if enabled (no center image case)
        if (showBottomText && bottomText) {
          ctx.fillStyle = '#000000'
          ctx.font = '24px Arial, sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'top'
          ctx.fillText(bottomText, canvas.width / 2, qrYOffset + qrSize + padding)
        }

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
      // Layout calculations
      const qrSize = 512
      const padding = 40
      const titleHeight = title ? 60 : 0
      const bottomTextHeight = (showBottomText && bottomText) ? 50 : 0
      const totalWidth = qrSize + padding * 2
      const totalHeight = titleHeight + qrSize + bottomTextHeight + (title || (showBottomText && bottomText) ? padding * 2 : 0)

      // For SVG export, we need to generate the QR code as SVG
      let qrSvgString = await QRCode.toString(url, {
        type: 'svg',
        errorCorrectionLevel: errorCorrectionLevel,
        width: qrSize,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })

      // Extract the path elements from the QR code SVG
      const qrYOffset = title ? titleHeight + padding : padding

      // Create wrapper SVG with title and bottom text
      let svgString = `<svg width="${totalWidth}" height="${totalHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${totalWidth}" height="${totalHeight}" fill="white"/>
        ${title ? `<text x="${totalWidth / 2}" y="${padding + 25}" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="black">${title}</text>` : ''}
        <g transform="translate(${padding}, ${qrYOffset})">
          ${qrSvgString.match(/<path[^>]*>/g)?.join('') || ''}
        </g>`

      // If there's a center image, embed it in the SVG
      if (centerImage) {
        const imageSize = qrSize * 0.25
        const x = padding + (qrSize - imageSize) / 2
        const y = qrYOffset + (qrSize - imageSize) / 2
        const circleRadius = imageSize / 2 + 10

        svgString += `
          <circle cx="${padding + qrSize / 2}" cy="${qrYOffset + qrSize / 2}" r="${circleRadius}" fill="white"/>
          <clipPath id="circleClip">
            <circle cx="${padding + qrSize / 2}" cy="${qrYOffset + qrSize / 2}" r="${imageSize / 2}"/>
          </clipPath>
          <image x="${x}" y="${y}" width="${imageSize}" height="${imageSize}"
                 href="${centerImage}" clip-path="url(#circleClip)"/>`
      }

      // Add bottom text if enabled
      if (showBottomText && bottomText) {
        svgString += `
          <text x="${totalWidth / 2}" y="${qrYOffset + qrSize + padding + 20}" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="black">${bottomText}</text>`
      }

      svgString += '\n</svg>'

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
          <label htmlFor="title-input">Title (optional):</label>
          <input
            id="title-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter title above QR code"
          />
        </div>

        <div className="input-group">
          <label htmlFor="bottom-text-input">Bottom Text (optional):</label>
          <input
            id="bottom-text-input"
            type="text"
            value={bottomText}
            onChange={(e) => setBottomText(e.target.value)}
            placeholder="Enter text below QR code"
            disabled={!showBottomText}
          />
        </div>

        <div className="input-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showBottomText}
              onChange={(e) => setShowBottomText(e.target.checked)}
            />
            Show bottom text
          </label>
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
