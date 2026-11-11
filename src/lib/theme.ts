// Temas do app. Lógica pura: nomes, cores do tema personalizado e contraste.
// As cores dos temas prontos ficam em src/app.css.

/** `auto` segue o sistema (claro ou escuro). `custom` usa as cores do usuário. */
export const THEMES = [
  'auto',
  'light',
  'dark',
  'pink',
  'blue',
  'green',
  'purple',
  'orange',
  'custom',
] as const;

export type ThemePref = (typeof THEMES)[number];

/** Os tokens de cor de src/app.css, sem o `--`. */
export const COLOR_TOKENS = [
  'bg',
  'surface',
  'ink',
  'muted',
  'line',
  'line-strong',
  'btn',
  'btn-ink',
  'ok',
  'ok-bg',
  'danger',
  'scrim',
] as const;

export type ColorToken = (typeof COLOR_TOKENS)[number];
export type CustomColors = Record<ColorToken, string>;

/** Ponto de partida do tema personalizado: as cores do tema claro. */
export const DEFAULT_CUSTOM: Readonly<CustomColors> = {
  bg: '#ffffff',
  surface: '#f4f4f5',
  ink: '#0a0a0a',
  muted: '#5b5b63',
  line: '#e4e4e7',
  'line-strong': '#c9c9cf',
  btn: '#0a0a0a',
  'btn-ink': '#ffffff',
  ok: '#166534',
  'ok-bg': '#dcfce7',
  danger: '#b4232c',
  scrim: '#0a0a0a',
};

const HEX = /^#[0-9a-f]{6}$/i;

export function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && HEX.test(value);
}

/** Lê as cores salvas; o que faltar ou vier inválido volta para o padrão. */
export function parseCustomColors(raw: unknown): CustomColors {
  const data = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const colors = { ...DEFAULT_CUSTOM };
  for (const token of COLOR_TOKENS) {
    const value = data[token];
    if (isHexColor(value)) colors[token] = value.toLowerCase();
  }
  return colors;
}

/**
 * Valor CSS de um token do tema personalizado. O `scrim` (o escurecido atrás
 * da folha de ajustes) é translúcido; o seletor de cor só escolhe cor cheia.
 */
export function cssValue(token: ColorToken, hex: string): string {
  return token === 'scrim' ? `color-mix(in srgb, ${hex} 50%, transparent)` : hex;
}

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Luminância relativa (WCAG) de uma cor `#rrggbb`, de 0 (preto) a 1 (branco). */
export function luminance(hex: string): number {
  const n = Number.parseInt(hex.slice(1), 16);
  return (
    0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
  );
}

/** Razão de contraste (WCAG) entre duas cores, de 1 a 21. */
export function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}

/** Fundo escuro pede controles nativos (seletor de arquivo, rolagem) escuros. */
export function isDark(background: string): boolean {
  return luminance(background) < 0.4;
}

/** Contraste mínimo para texto normal (WCAG AA). */
export const MIN_CONTRAST = 4.5;

/** Os pares texto/fundo que o app usa. Todo tema precisa passar em todos. */
export const TEXT_PAIRS: readonly (readonly [ColorToken, ColorToken])[] = [
  ['ink', 'bg'],
  ['ink', 'surface'],
  ['muted', 'bg'],
  ['muted', 'surface'],
  ['btn-ink', 'btn'],
  ['ok', 'ok-bg'],
  ['danger', 'bg'],
];

/** Os pares com contraste abaixo de AA. Lista vazia = tema legível. */
export function lowContrastPairs(
  colors: Record<ColorToken, string>,
): (readonly [ColorToken, ColorToken])[] {
  return TEXT_PAIRS.filter(([text, back]) => contrast(colors[text], colors[back]) < MIN_CONTRAST);
}
