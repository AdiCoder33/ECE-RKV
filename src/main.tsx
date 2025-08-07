import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Attach JWT token to all fetch requests if available
const originalFetch = window.fetch;
window.fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  const headers = new Headers(init.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return originalFetch(input, { ...init, headers });
};

createRoot(document.getElementById('root')!).render(<App />);
