import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './styles/heatmap.css';
import App from './App.tsx';

// Import encoding test utilities for debugging
import './utils/encodingTest';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
