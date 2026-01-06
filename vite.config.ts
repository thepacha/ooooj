import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Prevent Vite from aggressively replacing process.env keys which can lead to secrets leaking in bundles.
  // We rely on the runtime polyfill in index.html for variable injection.
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
  }
});