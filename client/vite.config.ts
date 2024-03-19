import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            "/api": {
                target: "http://60.204.218.131:8999",
                changeOrigin: true,
                ws: true,
                rewrite: path => path.replace(RegExp("/api"), ''),
            }
        }
    }
});
