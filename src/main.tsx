import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import { Animation } from './components/Animation';
import './index.css';
import './lib/polyfills';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

// Apply theme class to document before initial render
const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
const savedTheme = localStorage.getItem('theme');
const initialTheme = savedTheme || (prefersDarkMode ? 'dark' : 'light');
document.documentElement.setAttribute('data-theme', initialTheme);

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/animation" element={<Animation />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);