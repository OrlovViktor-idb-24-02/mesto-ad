import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ command, mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), 'VITE_MESTO_'), ...process.env };
  if (command === 'build' && (!env.VITE_MESTO_TOKEN || !env.VITE_MESTO_COHORT)) {
    throw new Error('Для сборки настройте VITE_MESTO_TOKEN и VITE_MESTO_COHORT в .env или окружении CI.');
  }
  return {
    base: './',
    server: { open: true },
  };
});
