import { defineConfig } from 'vitest/config';
import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    process.env.SENTRY_AUTH_TOKEN
      ? sentryVitePlugin({
          org: "miguelslemos",
          project: "stock_portfolio",
          authToken: process.env.SENTRY_AUTH_TOKEN,
          sourcemaps: {
            // As you're enabling client source maps, you probably want to delete them after they're uploaded to Sentry.
            // Set the appropriate glob pattern for your output folder - some glob examples below:
            filesToDeleteAfterUpload: [
              "./**/*.map",
              ".*/**/public/**/*.map",
              "./dist/**/client/**/*.map",
            ],
          },
        })
      : null,
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: 'hidden',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['pdfjs-dist/legacy/build/pdf.mjs'],
          react: ['react', 'react-dom'],
          sentry: ['@sentry/react'],
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

