import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Icons library (large; isolated to keep the main app chunk smaller)
          'vendor-icons': ['lucide-react'],
          // State management
          'vendor-state': ['zustand'],
          // Recharts for analytics (loaded lazily)
          'vendor-charts': ['recharts'],
          // PDF viewer library (loaded lazily with library page)
          'vendor-pdf': ['react-pdf', 'pdfjs-dist'],
          // KaTeX for math rendering
          'vendor-math': ['katex'],
        },
      },
    },
    // Increase chunk size warning limit for PDF viewer
    chunkSizeWarningLimit: 600,
    // Enable minification
    minify: 'esbuild',
    // Source maps for production debugging (can disable for smaller builds)
    sourcemap: false,
    // Target modern browsers for smaller bundles
    target: 'es2020',
  },
  // Optimize dependencies pre-bundling
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'zustand', 'lucide-react', 'warning'],
    exclude: ['react-pdf', 'pdfjs-dist'], // Exclude heavy libs from pre-bundling
  },
  // Handle CommonJS modules that don't export default properly
  ssr: {
    noExternal: ['warning'],
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
})
