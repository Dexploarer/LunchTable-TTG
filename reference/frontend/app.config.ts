import { defineConfig } from '@tanstack/start/config'
import viteReact from '@vitejs/plugin-react'
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  vite: {
    plugins: [
      viteReact(),
    ],
    resolve: {
      alias: {
        '@': join(__dirname, './src'),
      },
    },
  },
})
