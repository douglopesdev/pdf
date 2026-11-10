import { svelte } from '@sveltejs/vite-plugin-svelte';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

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
  plugins: [svelte(), cspMeta()],
  build: {
    target: 'es2022',
    sourcemap: false,
  },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
});
