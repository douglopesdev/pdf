import { svelte } from '@sveltejs/vite-plugin-svelte';
import { readFileSync } from 'node:fs';
import type { Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { version: string };

/**
 * Content Security Policy aplicada só no build de produção.
 * `default-src 'self'` faz o próprio navegador bloquear qualquer requisição
 * para fora do app: imagens e PDFs nunca saem do aparelho.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

function cspMeta(): Plugin {
  return {
    name: 'pdf:csp-meta',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        '<!-- csp -->',
        `<meta http-equiv="Content-Security-Policy" content="${CSP}" />`,
      );
    },
  };
}

export default defineConfig({
  // Publicado em https://douglopesdev.github.io/pdf/
  base: '/pdf/',
  plugins: [
    svelte(),
    cspMeta(),
    VitePWA({
      // Service worker próprio (src/sw.ts); o plugin só injeta a lista de arquivos.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      // A versão nova espera o usuário tocar em Atualizar (src/lib/state/update.svelte.ts).
      registerType: 'prompt',
      injectRegister: false,
      // Os ícones já entram no cache pelo globPatterns abaixo.
      includeManifestIcons: false,
      injectManifest: {
        // Todo o build, menos os .woff: basta o .woff2.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
      manifest: {
        id: '/pdf/',
        name: 'PDF',
        short_name: 'PDF',
        description: 'Imagens em PDF direto no telefone. Sem anúncios, sem nuvem.',
        lang: 'pt-BR',
        display: 'standalone',
        start_url: '/pdf/',
        scope: '/pdf/',
        // Os tokens --bg e --btn do tema claro (src/app.css).
        background_color: '#ffffff',
        theme_color: '#ffffff',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          // Para os "ícones temáticos" do Android 13+: quem pinta é o sistema.
          {
            src: 'icons/monochrome-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'monochrome',
          },
        ],
        // Aparece no Compartilhar da galeria. Veja src/lib/platform/share-target.ts.
        share_target: {
          action: '/pdf/share-target',
          method: 'POST',
          enctype: 'multipart/form-data',
          params: { files: [{ name: 'images', accept: ['image/*'] }] },
        },
      },
    }),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    target: 'es2022',
    sourcemap: false,
  },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
});
