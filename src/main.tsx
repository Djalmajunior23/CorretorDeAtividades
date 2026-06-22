import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

window.API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://31.97.41.64:8080";

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
