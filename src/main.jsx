import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// import './custom/landing.css'
import App from './App.jsx'
import './i18n.js'
import Loader from './components/commons/Loader'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* <App /> */}
    <Suspense fallback={<Loader message="Loading..." />}>
      <App />
    </Suspense>
  </StrictMode>,
)
