import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Builds the Chrome extension into dist-extension/, which Chrome can load
 * unpacked (chrome://extensions → Developer mode → Load unpacked). It shares
 * src/lib, the hook and the list components with the web app.
 */
export default defineConfig({
  root: resolve(import.meta.dirname, 'extension'),
  publicDir: resolve(import.meta.dirname, 'extension/public'),
  // Extension pages are served from chrome-extension://<id>/, so asset paths must be relative.
  base: './',
  plugins: [react()],
  build: {
    outDir: resolve(import.meta.dirname, 'dist-extension'),
    emptyOutDir: true,
    target: 'chrome116',
    // Chrome Web Store review reads the code; keep it readable.
    minify: false,
    rollupOptions: {
      input: {
        popup: resolve(import.meta.dirname, 'extension/popup.html'),
        background: resolve(import.meta.dirname, 'extension/src/background.ts'),
      },
      // The manifest names the service worker, so its file name can't be hashed.
      output: { entryFileNames: chunk => chunk.name === 'background' ? 'background.js' : 'assets/[name]-[hash].js' },
    },
  },
});
