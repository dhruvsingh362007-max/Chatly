import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ParkingProvider } from './context/ParkingContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ParkingProvider>
      <App />
    </ParkingProvider>
  </React.StrictMode>
);

