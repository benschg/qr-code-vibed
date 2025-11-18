import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import QRCodeGenerator from './QRCodeGenerator'

// Mock the qrcode library
vi.mock('qrcode', () => ({
  default: {
    toCanvas: vi.fn(() => {
      return Promise.resolve()
    }),
    toString: vi.fn(() => {
      return Promise.resolve('<svg></svg>')
    }),
  },
}))

// Mock file-saver
vi.mock('file-saver', () => ({
  saveAs: vi.fn(),
}))

describe('QRCodeGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all input fields', () => {
    render(<QRCodeGenerator />)

    expect(screen.getByLabelText(/Enter URL/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Error Correction Level/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Center Image/i)).toBeInTheDocument()
    expect(screen.getByText(/Export Format/i)).toBeInTheDocument()
  })

  it('renders format radio buttons', () => {
    render(<QRCodeGenerator />)

    const pngRadio = screen.getByRole('radio', { name: /PNG/i })
    const svgRadio = screen.getByRole('radio', { name: /SVG/i })

    expect(pngRadio).toBeInTheDocument()
    expect(svgRadio).toBeInTheDocument()
    expect(pngRadio).toBeChecked()
  })

  it('renders export button as disabled when no URL is entered', () => {
    render(<QRCodeGenerator />)

    const exportButton = screen.getByRole('button', { name: /Export as PNG/i })
    expect(exportButton).toBeDisabled()
  })

  it('enables export button when URL is entered', async () => {
    const user = userEvent.setup()
    render(<QRCodeGenerator />)

    const urlInput = screen.getByLabelText(/Enter URL/i)
    await user.type(urlInput, 'https://example.com')

    await waitFor(() => {
      const exportButton = screen.getByRole('button', { name: /Export as PNG/i })
      expect(exportButton).not.toBeDisabled()
    })
  })

  it('updates export button text when format changes', async () => {
    const user = userEvent.setup()
    render(<QRCodeGenerator />)

    const svgRadio = screen.getByRole('radio', { name: /SVG/i })
    await user.click(svgRadio)

    expect(screen.getByRole('button', { name: /Export as SVG/i })).toBeInTheDocument()
  })

  it('shows placeholder when no QR code is generated', () => {
    render(<QRCodeGenerator />)

    expect(screen.getByText(/Enter a URL to generate QR code/i)).toBeInTheDocument()
  })

  it('renders preview section', () => {
    render(<QRCodeGenerator />)

    expect(screen.getByRole('heading', { name: /Preview/i })).toBeInTheDocument()
  })

  it('renders error correction level options', () => {
    render(<QRCodeGenerator />)

    const select = screen.getByLabelText(/Error Correction Level/i)
    expect(select).toBeInTheDocument()

    // Check if High is selected by default
    expect(select).toHaveValue('H')
  })

  it('allows changing error correction level', async () => {
    const user = userEvent.setup()
    render(<QRCodeGenerator />)

    const select = screen.getByLabelText(/Error Correction Level/i)
    await user.selectOptions(select, 'M')

    expect(select).toHaveValue('M')
  })

  it('allows uploading an image file', async () => {
    const user = userEvent.setup()
    render(<QRCodeGenerator />)

    const file = new File(['image'], 'test.png', { type: 'image/png' })
    const input = screen.getByLabelText(/Center Image/i)

    await user.upload(input, file)

    expect(input).toBeInTheDocument()
  })

  it('shows remove image button after image is uploaded', async () => {
    const user = userEvent.setup()
    render(<QRCodeGenerator />)

    const file = new File(['image'], 'test.png', { type: 'image/png' })
    const input = screen.getByLabelText(/Center Image/i)

    // Create a mock FileReader
    const mockFileReader = {
      readAsDataURL: vi.fn(),
      onload: vi.fn(),
      result: 'data:image/png;base64,test',
    }

    vi.spyOn(window, 'FileReader').mockImplementation(() => mockFileReader as any)

    await user.upload(input, file)

    // Simulate FileReader onload
    mockFileReader.onload?.({ target: { result: 'data:image/png;base64,test' } } as any)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Remove Image/i })).toBeInTheDocument()
    })
  })
})
