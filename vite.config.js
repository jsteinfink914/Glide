import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  build: {
    outDir: 'dist', // Where Vite outputs the final build
  },
  publicDir: 'public', // Keep static assets in public/
  server: {
    open: true, // Auto-open in browser
    historyApiFallback: true, // Allows refresh without 404 errors
    allowedHosts: [
      'a24c3a08-db38-4978-82e1-60f26bd2c2bc-00-kkzg6zvpjxpq.riker.replit.dev', // Add your Replit host
      '.replit.dev' // Allow Replit subdomains dynamically
    ]
  }
});
