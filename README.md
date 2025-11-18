# QR Code Generator

A fully-featured React + TypeScript application for generating QR codes with custom center images. Export as PNG or SVG.

## Features

- ✅ Generate QR codes from any URL
- ✅ Add custom center images (logos, icons, etc.)
- ✅ Export as PNG or SVG format
- ✅ Adjustable error correction levels
- ✅ Live preview
- ✅ Responsive design
- ✅ Light/Dark mode support

## Demo

Visit the live demo: `https://benschg.github.io/qr-code-vibed/` (after GitHub Pages is enabled)

## Setup GitHub Pages

To deploy this app:

1. Go to your GitHub repository settings
2. Navigate to **Pages** (under Code and automation)
3. Under **Source**, select "GitHub Actions"
4. The app will automatically deploy when you push to the main branch

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Usage

1. **Enter a URL** - Input the URL you want to encode
2. **Select Error Correction** - Choose "High (30%)" for best results with center images
3. **Upload Image** (optional) - Add a logo or icon to the center of the QR code
4. **Choose Format** - Select PNG or SVG
5. **Export** - Download your custom QR code

## Technologies

- React 18
- TypeScript
- Vite
- qrcode library
- file-saver library

## License

MIT
