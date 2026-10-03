/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Serves api/feed.ts and api/feedback.ts under `npm run dev`, so contributors don't need the
 * Vercel CLI to try a real feed. Production uses the Vercel Function itself.
 */
function localApi(): Plugin {
  return {
    name: 'jarito-local-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const route = req.url?.split('?')[0];
        if (route !== '/api/feed' && route !== '/api/feedback') return next();
        const chunks: Buffer[] = [];
        for await (const c of req) chunks.push(c as Buffer);
        const { POST } = await server.ssrLoadModule(`${route}.ts`);
        const response: Response = await POST(new Request(`http://localhost${route}`, {
          method: req.method,
          headers: { 'Content-Type': 'application/json' },
          body: req.method === 'POST' ? Buffer.concat(chunks) : undefined,
        }));
        res.statusCode = response.status;
        res.setHeader('Content-Type', 'application/json');
        res.end(await response.text());
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), localApi()],
  server: { port: 3000 },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts', 'api/**/*.test.ts'],
  },
});
