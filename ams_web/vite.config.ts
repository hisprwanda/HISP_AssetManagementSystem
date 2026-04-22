import path from "node:path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    {
      name: 'custom-logger',
      configureServer(server) {
        server.httpServer?.once('listening', () => {
          setTimeout(() => {
            console.log('\n  \x1b[36m➜\x1b[0m  \x1b[1mWindows Host:\x1b[0m \x1b[36mhttp://127.0.0.1:5173/\x1b[0m (Click me!)\n');
          }, 100);
        });
      }
    }
  ],
  cacheDir: '/app/node_modules/.vite_container',
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    strictPort: true,
    fs: {
      strict: false,
      cachedChecks: false,
    },
    watch: {
      usePolling: true,
      interval: 1000,
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/.vite_container/**',
      ],
    },
    hmr: {
      clientPort: 5173,
      overlay: true,
    },
  },
})
