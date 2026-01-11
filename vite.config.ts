
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    base: '/',
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false,
    },
    resolve: {
      alias: {
        '@': path.resolve('./'),
      },
    },
    // Define process.env for client-side usage
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.VITE_API_KEY || env.GEMINI_API_KEY || ''),
      'process.env.NODE_ENV': JSON.stringify(mode),
    }
  };
});
