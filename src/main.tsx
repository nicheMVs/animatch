import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import AgeGate from './components/AgeGate';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AgeGate>
      <App />
    </AgeGate>
  </StrictMode>
);