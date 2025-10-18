import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Note: StrictMode disabled to prevent WebSocket connection issues during development
// StrictMode intentionally double-mounts components which causes WebSocket to close prematurely
createRoot(document.getElementById('root')).render(
  <App />
)
