import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { API_BASE_URL } from './config/api';

window.API_BASE_URL = API_BASE_URL;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
