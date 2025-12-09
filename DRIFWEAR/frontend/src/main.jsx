import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Import only the main CSS file
import './css/style.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);