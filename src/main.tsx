import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Razor Pages veya başka bir host uygulamada kullanmak için:
// <div id="survengine-root"></div> veya <div id="root"></div> koymanız yeterli.
const containerId = 'survengine-root';
const container = document.getElementById(containerId) || document.getElementById('root');

if (container) {
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
} else {
  console.error(
    `[SurvEngine] Mount element bulunamadı. Sayfanıza <div id="${containerId}"></div> ekleyin.`
  );
}
