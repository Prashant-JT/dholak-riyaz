import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'happy-dom',   // Provides DOM APIs (HTMLElement, document, etc.)
        include: ['tests/**/*.test.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            include: ['src/**/*.ts'],
            exclude: ['src/core/supabase.ts']  // Supabase client requires live env vars
        }
    }
});
