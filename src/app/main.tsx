import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppRouter } from './router/AppRouter';
import {QueryProvider} from "@app/providers/QueryProvider.tsx";
import { AuthProvider } from '@/features/auth/model/AuthContext';
import '@app/styles/globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </QueryProvider>
  </StrictMode>,
);
