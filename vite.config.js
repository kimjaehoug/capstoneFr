import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = (
    env.VITE_DEV_PROXY_TARGET ||
    process.env.VITE_DEV_PROXY_TARGET ||
    'http://backend:8787'
  ).trim();

  return {
    plugins: [react()],
    server: {
      port: 7634,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
          configure: (proxy) => {
            proxy.on('error', (err) => {
              console.error('[vite-proxy-error]', err?.message);
            });
          },
        },
      },
    },
    preview: {
      port: 7634,
    },
  };
});
