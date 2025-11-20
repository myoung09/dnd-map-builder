// Router configuration for the application

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import { DMPage } from './pages/DMPage';
import { PlayerPage } from './pages/PlayerPage';

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main builder route */}
        <Route path="/" element={<App />} />
        
        {/* DM route */}
        <Route path="/dm" element={<DMPage />} />
        
        {/* Player route */}
        <Route path="/player" element={<PlayerPage />} />
        
        {/* Redirect unknown routes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
