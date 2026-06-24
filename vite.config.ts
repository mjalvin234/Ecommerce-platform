import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const isProduction = mode === 'production';
  return {
    // 生产环境使用 GitHub Pages 路径，开发环境使用根路径
    base: isProduction ? '/Ecommerce-platform/' : '/',
    build: {
      target: 'es2015',
      assetsInlineLimit: 100000000,
      chunkSizeWarningLimit: 100000000,
      cssCodeSplit: false,
      rollupOptions: {
        output: {
          format: 'iife',
          inlineDynamicImports: true,
        },
      },
    },
    // The viteSingleFile plugin automatically configures rollup to inline dynamic imports and not to use manualChunks!
    plugins: [react(), tailwindcss(), viteSingleFile()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: false, // 只允许本地访问，禁止外部网络访问
      port: 3000,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
    // Vitest 配置
    test: {
      globals: true,
      environment: 'node',
      include: ['server/src/__tests__/**/*.test.ts'],
      testTimeout: 30000,
      hookTimeout: 30000,
    },
  };
});
