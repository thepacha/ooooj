import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // The third argument '' ensures we load all env vars, not just those starting with VITE_
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve('./'),
      },
    },
    // We must define process.env.API_KEY to be available in the browser.
    // This replaces `process.env.API_KEY` in your code with the actual string value during build.
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.VITE_API_KEY || env.GEMINI_API_KEY),
      'process.env.NODE_ENV': JSON.stringify(mode),
    }
  };
});