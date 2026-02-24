/// <reference types="vitest" />
/// <reference types="vitest/coverage" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import eslint from 'vite-plugin-eslint';
import path from 'path';
import deadFile from 'vite-plugin-deadfile';

const mobile = !!/android|ios/.exec(process.env.TAURI_ENV_PLATFORM || '');
const hmrHost = process.env.VITE_HMR_HOST || 'localhost';

// https://vitejs.dev/config/
/** @type {import('vite').UserConfig} */
export default defineConfig((env) => ({
  plugins: [
    react(),
    env.mode !== 'test' && eslint(),
    deadFile({
      root: 'src',
      exclude: [
        '**/*.test.*',
        '**/*.http',
        'assets/**',
        '**/*.d.ts',
        'theme/**',
      ],
    }),
  ],

  build: {
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core React dependencies
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react';
          }
          // React Router
          if (id.includes('node_modules/react-router')) {
            return 'vendor-router';
          }
          // Ionic UI framework
          if (id.includes('node_modules/@ionic/')) {
            return 'vendor-ionic';
          }
          // TanStack Query
          if (id.includes('node_modules/@tanstack/')) {
            return 'vendor-query';
          }
          // Tauri
          if (id.includes('node_modules/@tauri-apps/')) {
            return 'vendor-tauri';
          }
          // Axios
          if (id.includes('node_modules/axios/')) {
            return 'vendor-axios';
          }
          // Ionicons
          if (id.includes('node_modules/ionicons/')) {
            return 'vendor-icons';
          }
          // Swiper
          if (id.includes('node_modules/swiper/')) {
            return 'vendor-swiper';
          }
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: mobile ? '0.0.0.0' : false,
    hmr: mobile
      ? {
          protocol: 'ws',
          host: hmrHost,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ['**/src-tauri/**'],
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    reporters: ['default', 'html'],
    outputFile: './tests/vitest-report.html',
    css: true,
    coverage: {
      enabled: true,
      provider: 'istanbul', // or 'v8'
      reportsDirectory: './tests/coverage',
    },
    browser: {
      enabled: false,
      name: 'chrome', // browser name is required
    },
  },
  resolve: {
    alias: {
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@store': path.resolve(__dirname, './src/store'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@models': path.resolve(__dirname, './src/types'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@providers': path.resolve(__dirname, './src/providers'),
    },
  },
}));
