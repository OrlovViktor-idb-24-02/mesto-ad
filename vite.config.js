import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  base: './',
  server: { open: true },
  // В публичной сборке учётные данные вводятся только в браузере.
  define: mode === 'public' ? { 'import.meta.env.VITE_MESTO_TOKEN': JSON.stringify('') } : {},
}));
