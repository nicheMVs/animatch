import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // exposes a Network URL so you can open it on your phone (same Wi-Fi)
    port: 5173,
  },
});
