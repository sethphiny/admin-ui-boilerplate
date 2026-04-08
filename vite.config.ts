import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: ['chart.js', 'react-chartjs-2'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React core libraries - keep React and ReactDOM together
          // This prevents the "__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED" error
          if (
            id.includes('react') ||
            id.includes('react-dom') ||
            id.includes('react-router')
          ) {
            // Keep React and ReactDOM in the same chunk to maintain internal references
            return 'react-vendor'
          }

          // React Query and related
          if (id.includes('@tanstack/react-query') || id.includes('@tanstack/query')) {
            return 'query-vendor'
          }

          // Radix UI components
          if (id.includes('@radix-ui')) {
            return 'ui-vendor'
          }

          // Form libraries
          if (
            id.includes('react-hook-form') ||
            id.includes('@hookform') ||
            id.includes('zod')
          ) {
            return 'form-vendor'
          }

          // Utility libraries
          if (
            id.includes('axios') ||
            id.includes('date-fns') ||
            id.includes('zustand') ||
            id.includes('react-icons') ||
            id.includes('clsx') ||
            id.includes('tailwind-merge') ||
            id.includes('class-variance-authority')
          ) {
            return 'utils-vendor'
          }

          // Node modules that aren't in other chunks
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        },
      },
    },
  },
})

