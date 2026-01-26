import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // Ensure base is root for custom domain time.hamradio.my
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  }
})
