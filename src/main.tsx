import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// Note: For future deployments to different paths, consider using environment variables:
// basename={import.meta.env.VITE_BASE_PATH || '/pst-toolings'}
// This should match the base path configured in vite.config.ts
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename="/pst-toolings">
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
