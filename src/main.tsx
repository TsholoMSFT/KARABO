import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'

import "./main.css"

// ── Self-heal stale chunk references after a new deployment ───────────────────
// Vite fires `vite:preloadError` when a dynamically-imported chunk fails to load
// (its content-hash filename changed because a new build was deployed while this
// tab was open). Reload once to pick up the fresh asset manifest; a sessionStorage
// guard prevents reload loops if a chunk is genuinely missing (broken deploy).
const CHUNK_RELOAD_KEY = 'karabo:chunk-reloaded'
window.addEventListener('vite:preloadError', (event) => {
  if (sessionStorage.getItem(CHUNK_RELOAD_KEY)) return
  event.preventDefault()
  sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()))
  window.location.reload()
})
window.addEventListener('load', () => {
  // Clear the guard shortly after a clean load so a future deploy can self-heal too.
  setTimeout(() => sessionStorage.removeItem(CHUNK_RELOAD_KEY), 10000)
})

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <App />
   </ErrorBoundary>
)
