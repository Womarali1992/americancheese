import { defineConfig } from 'vitest/config';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables for tests
dotenv.config();

export default defineConfig({
  test: {
    globals: true,
    projects: [
      {
        extends: true,
        test: {
          name: 'server',
          environment: 'node',
          include: ['**/__tests__/**/*.test.ts'],
          exclude: ['client/**'],
          fileParallelism: false,
          env: {
            DB_HOST: process.env.DB_HOST || 'localhost',
            DB_PORT: process.env.DB_PORT || '5432',
            DB_NAME: process.env.DB_NAME || 'project_management',
            DB_USER: process.env.DB_USER || 'postgres',
            DB_PASSWORD: process.env.DB_PASSWORD || 'richman',
          },
        },
      },
      {
        extends: true,
        test: {
          name: 'client',
          environment: 'jsdom',
          include: ['client/src/**/__tests__/**/*.test.{ts,tsx}'],
          setupFiles: ['client/src/test/setup.ts'],
        },
      },
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
});
