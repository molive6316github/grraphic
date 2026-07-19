import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      // Proxy API routes to Supabase Edge Functions in development
      '/api/request.bot/oauth': {
        target: process.env.VITE_SUPABASE_URL || 'https://snqpircwrkwadzceqjuc.supabase.co',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/request\.bot\/oauth/, '/functions/v1/oauth'),
      },
      '/api/request.bot/api': {
        target: process.env.VITE_SUPABASE_URL || 'https://snqpircwrkwadzceqjuc.supabase.co',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/request\.bot\/api/, '/functions/v1/api'),
      },
    },
  },
});
