import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['server/src/__tests__/**/*.test.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    deps: {
      interopDefault: true,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '^(\\.{1,2}/.*)\\.js$': '$1',
    },
  },
  esbuild: {
    // 让 esbuild 处理 .js 扩展名
    loader: 'ts',
  },
});
