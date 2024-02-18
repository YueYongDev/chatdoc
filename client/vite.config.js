import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import svgLoader from 'vite-svg-loader'
import {resolve} from 'path'
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue(), svgLoader()],
    resolve: {
        alias: {
            '@': resolve('src'),
        }
    },
    server: {
        proxy: {
            "/api": {
                target: "http://60.204.218.131:8999",
                changeOrigin: true,
                ws: true,
                rewrite: path => path.replace(RegExp("/api"), ''),
            }
        },
        compress: false,
    }
})
