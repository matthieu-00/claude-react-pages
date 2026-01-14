import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, useNavigate } from 'react-router-dom'
import App from './App'
import './index.css'

// Handle redirect from 404.html for GitHub Pages SPA routing
function RedirectHandler() {
  const navigate = useNavigate()
  
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const redirectPath = urlParams.get('/')
    
    if (redirectPath) {
      // Decode the path (replace ~and~ with &)
      const decodedPath = redirectPath.replace(/~and~/g, '&')
      // Navigate to the decoded path
      navigate(decodedPath, { replace: true })
    }
  }, [navigate])
  
  return null
}

// Note: For future deployments to different paths, consider using environment variables:
// basename={import.meta.env.VITE_BASE_PATH || '/pst-toolings'}
// This should match the base path configured in vite.config.ts
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename="/pst-toolings">
      <RedirectHandler />
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
