import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/cinzel/latin-400.css';
import '@fontsource/cinzel/latin-500.css';
import '@fontsource/rajdhani/latin-400.css';
import '@fontsource/rajdhani/latin-500.css';
import '@fontsource/rajdhani/latin-600.css';
import App from './src/App.jsx';
import './style.css';

createRoot(document.getElementById('root')).render(<App />);
