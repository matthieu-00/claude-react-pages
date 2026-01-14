import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, useNavigate } from 'react-router-dom'
import App from './App'
import './index.css'

// Handle redirect from 404.html for GitHub Pages SPA routing
function RedirectHandler() {
  const navigate = useNavigate()
  
  React.useEffect(() => {
    const search = window.location.search
    
    // Check if this is a redirect from 404.html (format: ?/path)
    if (search.startsWith('?/')) {
      // Extract the path after ?/
      let redirectPath = search.slice(2) // Remove '?/'
      
      // Ensure path starts with / for React Router
      if (!redirectPath.startsWith('/')) {
        redirectPath = '/' + redirectPath
      }
      
      // Handle query parameters that might be in the path (format: path&key=value)
      const ampersandIndex = redirectPath.indexOf('&')
      if (ampersandIndex !== -1) {
        // Split path and query params
        const pathPart = redirectPath.slice(0, ampersandIndex)
        const queryPart = redirectPath.slice(ampersandIndex + 1)
        
        // Decode the path (replace ~and~ with &)
        const decodedPath = pathPart.replace(/~and~/g, '&')
        
        // Parse and add query parameters back
        const queryParams = new URLSearchParams(queryPart.replace(/~and~/g, '&'))
        const queryString = queryParams.toString()
        
        // Navigate with path and query string
        navigate(decodedPath + (queryString ? '?' + queryString : ''), { replace: true })
      } else {
        // No query params, just decode the path
        redirectPath = redirectPath.replace(/~and~/g, '&')
        navigate(redirectPath, { replace: true })
      }
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
