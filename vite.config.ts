import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import { buildBootScript, buildThemeCss } from './src/themes/theme-css';

/**
 * Inlines every theme's colour variables plus a tiny boot script into app.html (the app, not the
 * landing page). The saved theme is therefore applied before the first paint: no flash of the wrong
 * theme. The source of truth for the colours is src/themes/; this only serialises it.
 */
function campuslyThemes(): Plugin {
  return {
    name: 'campusly-themes',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        if (path.basename(ctx.filename) !== 'app.html') return html;
        return {
          html,
          tags: [
            { tag: 'style', attrs: { id: 'campusly-themes' }, children: buildThemeCss(), injectTo: 'head-prepend' },
            { tag: 'script', children: buildBootScript(), injectTo: 'head-prepend' },
          ],
        };
      },
    },
  };
}

// Two pages: index.html = landing page, app.html = the Campusly app (src/main.tsx)
export default defineConfig({
  plugins: [react(), tailwindcss(), campuslyThemes()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        app: path.resolve(__dirname, 'app.html'),
      },
      output: {
        // Big libraries go into their own files so the browser can cache them
        // and the main app file stays small.
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('@supabase')) return 'vendor-supabase';
          if (id.includes('motion') || id.includes('framer-motion')) return 'vendor-motion';
          if (id.includes('react-router') || id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler')) return 'vendor-react';
          return undefined;
        },
      },
    },
  },
});
