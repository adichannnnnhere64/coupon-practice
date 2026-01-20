// src/main.tsx — ULTRA CLEAN
import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './router';
import { useAuthStore } from './stores/useAuthStore';

function AppWithAuth() {
  const auth = useAuthStore();
  return <RouterProvider router={router} context={{ auth }} />;
}

// Top-level await — cleanest possible
await useAuthStore.getState().checkAuth();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppWithAuth />
  </React.StrictMode>
);
