// Aplica o tema no documento: atributo data-theme, cores do tema
// personalizado, barra de status do Android e ícone da aba.
// public/theme-init.js faz a parte das cores antes da primeira pintura.

import { COLOR_TOKENS, cssValue, isDark, type CustomColors, type ThemePref } from '../theme';

export function applyTheme(theme: ThemePref, custom: CustomColors): void {
  const root = document.documentElement;

  if (theme === 'auto') delete root.dataset.theme;
  else root.dataset.theme = theme;

  for (const token of COLOR_TOKENS) {
    if (theme === 'custom') root.style.setProperty(`--${token}`, cssValue(token, custom[token]));
    else root.style.removeProperty(`--${token}`);
  }
  root.style.colorScheme = theme === 'custom' ? (isDark(custom.bg) ? 'dark' : 'light') : '';

  syncChrome();
}

function token(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
}

/**
 * Leva as cores do tema para fora da página: a barra de status do Android
 * (meta theme-color) e o ícone da aba. Chamado de novo quando o sistema
 * troca entre claro e escuro, por causa do tema automático.
 */
export function syncChrome(): void {
  const background = token('bg');
  for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
    meta.content = background;
  }

  const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (icon) icon.href = faviconUrl(token('btn'), token('btn-ink'));
}

/** O mesmo desenho de public/favicon.svg, com as cores do botão do tema. */
function faviconUrl(fill: string, stroke: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">` +
    `<rect width="64" height="64" rx="16" fill="${fill}"/>` +
    `<g fill="none" stroke="${stroke}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">` +
    `<path d="M36 14H22a4 4 0 0 0-4 4v28a4 4 0 0 0 4 4h20a4 4 0 0 0 4-4V24z"/>` +
    `<path d="M36 14v10h10"/><path d="M26 35l4 4 8-8"/></g></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
