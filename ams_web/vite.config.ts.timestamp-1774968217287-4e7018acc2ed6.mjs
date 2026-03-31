// vite.config.ts
import path from "path";
import { defineConfig } from "file:///C:/Users/GASARO/OneDrive/Desktop/School/HISP/AMS/ams_web/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/GASARO/OneDrive/Desktop/School/HISP/AMS/ams_web/node_modules/@vitejs/plugin-react/dist/index.js";
import tailwindcss from "file:///C:/Users/GASARO/OneDrive/Desktop/School/HISP/AMS/ams_web/node_modules/@tailwindcss/vite/dist/index.mjs";
var __vite_injected_original_dirname = "C:\\Users\\GASARO\\OneDrive\\Desktop\\School\\HISP\\AMS\\ams_web";
var vite_config_default = defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    fs: {
      cachedChecks: true
    },
    watch: {
      usePolling: false
      // Testing if native events are more memory-efficient
    },
    hmr: {
      clientPort: 5173
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxHQVNBUk9cXFxcT25lRHJpdmVcXFxcRGVza3RvcFxcXFxTY2hvb2xcXFxcSElTUFxcXFxBTVNcXFxcYW1zX3dlYlwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcR0FTQVJPXFxcXE9uZURyaXZlXFxcXERlc2t0b3BcXFxcU2Nob29sXFxcXEhJU1BcXFxcQU1TXFxcXGFtc193ZWJcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL0dBU0FSTy9PbmVEcml2ZS9EZXNrdG9wL1NjaG9vbC9ISVNQL0FNUy9hbXNfd2ViL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIlxuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCdcbmltcG9ydCB0YWlsd2luZGNzcyBmcm9tICdAdGFpbHdpbmRjc3Mvdml0ZSdcblxuLy8gaHR0cHM6Ly92aXRlLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbcmVhY3QoKSwgdGFpbHdpbmRjc3MoKV0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXG4gICAgfSxcbiAgfSxcbiAgc2VydmVyOiB7XG4gICAgaG9zdDogJzAuMC4wLjAnLFxuICAgIHBvcnQ6IDUxNzMsXG4gICAgc3RyaWN0UG9ydDogdHJ1ZSxcbiAgICBmczoge1xuICAgICAgY2FjaGVkQ2hlY2tzOiB0cnVlLFxuICAgIH0sXG4gICAgd2F0Y2g6IHtcbiAgICAgIHVzZVBvbGxpbmc6IGZhbHNlLCAvLyBUZXN0aW5nIGlmIG5hdGl2ZSBldmVudHMgYXJlIG1vcmUgbWVtb3J5LWVmZmljaWVudFxuICAgIH0sXG4gICAgaG1yOiB7XG4gICAgICBjbGllbnRQb3J0OiA1MTczLFxuICAgIH0sXG4gIH0sXG59KVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUE0VyxPQUFPLFVBQVU7QUFDN1gsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxXQUFXO0FBQ2xCLE9BQU8saUJBQWlCO0FBSHhCLElBQU0sbUNBQW1DO0FBTXpDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVMsQ0FBQyxNQUFNLEdBQUcsWUFBWSxDQUFDO0FBQUEsRUFDaEMsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ3RDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sWUFBWTtBQUFBLElBQ1osSUFBSTtBQUFBLE1BQ0YsY0FBYztBQUFBLElBQ2hCO0FBQUEsSUFDQSxPQUFPO0FBQUEsTUFDTCxZQUFZO0FBQUE7QUFBQSxJQUNkO0FBQUEsSUFDQSxLQUFLO0FBQUEsTUFDSCxZQUFZO0FBQUEsSUFDZDtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
