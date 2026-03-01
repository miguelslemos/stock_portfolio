import { defineConfig } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['pdfjs-dist'],
          react: ['react', 'react-dom'],
        },
      },
    },
  },
  publicDir: 'public',
  server: {
    port: 3000,
    open: true,
  },
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/domain/**', 'src/application/**', 'src/infrastructure/**'],
      exclude: [
        'src/infrastructure/services/MockExchangeRateService.ts',
        '**/__tests__/**',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70,
      },
    },
  },
});

