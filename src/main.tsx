import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'katex/dist/katex.min.css'
import App from './App'
import './index.css'

// Hide the initial loader with a smooth fade-out
const hideInitialLoader = () => {
  const loader = document.getElementById('initial-loader');
  if (loader) {
    loader.style.transition = 'opacity 0.5s ease-out';
    loader.style.opacity = '0';
    setTimeout(() => {
      loader.remove();
    }, 500);
  }
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Hide loader after a brief delay to ensure smooth transition
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    hideInitialLoader();
  });
});
