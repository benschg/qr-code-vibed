import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders the main heading', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /QR Code Generator/i })).toBeInTheDocument()
  })

  it('renders the subtitle', () => {
    render(<App />)
    expect(screen.getByText(/Generate QR codes with custom center images/i)).toBeInTheDocument()
  })

  it('renders the QRCodeGenerator component', () => {
    render(<App />)
    // Check if URL input field is present (part of QRCodeGenerator)
    expect(screen.getByLabelText(/Enter URL/i)).toBeInTheDocument()
  })
})
