import QRCodeGenerator from './components/QRCodeGenerator'
import './App.css'

function App() {
  return (
    <div className="App">
      <h1>QR Code Generator</h1>
      <p className="subtitle">Generate QR codes with custom center images</p>
      <QRCodeGenerator />
    </div>
  )
}

export default App
