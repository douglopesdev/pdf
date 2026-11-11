import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  COLOR_TOKENS,
  DEFAULT_CUSTOM,
  MIN_CONTRAST,
  TEXT_PAIRS,
  THEMES,
  contrast,
  cssValue,
  isDark,
  isHexColor,
  lowContrastPairs,
  luminance,
  parseCustomColors,
  type ColorToken,
} from '../../src/lib/theme';

const root = join(import.meta.dirname, '..', '..');
const css = readFileSync(join(root, 'src', 'app.css'), 'utf8');
const themeInit = readFileSync(join(root, 'public', 'theme-init.js'), 'utf8');

/** As cores `#rrggbb` de cada bloco `[data-theme='x'] { … }` de src/app.css. */
function themesInCss(): Record<string, Partial<Record<ColorToken, string>>> {
  const themes: Record<string, Partial<Record<ColorToken, string>>> = {};
  for (const [, name, body] of css.matchAll(/\[data-theme='(\w+)'\] \{([^}]+)\}/g)) {
    const colors: Partial<Record<ColorToken, string>> = {};
    for (const [, token, value] of (body ?? '').matchAll(/--([\w-]+): (#[0-9a-f]{6});/g)) {
      colors[token as ColorToken] = value;
    }
    themes[name ?? ''] = colors;
  }
  return themes;
}

describe('contraste', () => {
  it('calcula a luminância e a razão da WCAG', () => {
    expect(luminance('#000000')).toBe(0);
    expect(luminance('#ffffff')).toBeCloseTo(1, 6);
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 6);
    expect(contrast('#ffffff', '#000000')).toBeCloseTo(21, 6);
    expect(contrast('#777777', '#777777')).toBe(1);
    // Valor de referência conhecido: cinza #767676 é o limite AA sobre branco.
    expect(contrast('#767676', '#ffffff')).toBeGreaterThanOrEqual(4.5);
    expect(contrast('#777777', '#ffffff')).toBeLessThan(4.5);
  });

  it('distingue fundo claro de escuro', () => {
    expect(isDark('#0a0a0a')).toBe(true);
    expect(isDark('#1d4ed8')).toBe(true);
    expect(isDark('#fff5f8')).toBe(false);
  });

  it('aponta os pares com pouco contraste', () => {
    expect(lowContrastPairs(DEFAULT_CUSTOM)).toEqual([]);
    expect(lowContrastPairs({ ...DEFAULT_CUSTOM, bg: '#102030' })).toEqual([
      ['ink', 'bg'],
      ['muted', 'bg'],
      ['danger', 'bg'],
    ]);
  });
});

describe('temas prontos em src/app.css', () => {
  const themes = themesInCss();
  const ready = THEMES.filter((theme) => theme !== 'auto' && theme !== 'custom');

  it('todo tema de THEMES tem a sua lista de cores', () => {
    expect(Object.keys(themes).sort()).toEqual([...ready].sort());
  });

  it.each(ready)('%s define todos os tokens de cor', (theme) => {
    // O scrim é translúcido (rgb com alfa), então não aparece como #rrggbb.
    const expected = COLOR_TOKENS.filter((token) => token !== 'scrim');
    expect(Object.keys(themes[theme] ?? {}).sort()).toEqual([...expected].sort());
    expect(css).toMatch(new RegExp(`\\[data-theme='${theme}'\\] \\{[^}]*--scrim: rgb\\(`));
  });

  it.each(ready)('%s tem contraste AA em todo par de texto e fundo', (theme) => {
    const colors = themes[theme] as Record<ColorToken, string>;
    const failing = TEXT_PAIRS.filter(
      ([text, back]) => contrast(colors[text], colors[back]) < MIN_CONTRAST,
    ).map(([text, back]) => `${text}/${back} = ${contrast(colors[text], colors[back]).toFixed(2)}`);
    expect(failing).toEqual([]);
  });

  it('o ponto de partida do tema personalizado é o tema claro', () => {
    const { scrim, ...solid } = DEFAULT_CUSTOM;
    expect(themes.light).toEqual(solid);
    expect(isHexColor(scrim)).toBe(true);
  });
});

describe('public/theme-init.js', () => {
  it('conhece os mesmos temas e tokens de src/lib/theme.ts', () => {
    const list = (name: string): string[] =>
      Array.from(
        new RegExp(`var ${name} = \\[([^\\]]+)\\]`).exec(themeInit)?.[1]?.matchAll(/'([\w-]+)'/g) ??
          [],
        (match) => match[1] ?? '',
      );
    expect(list('THEMES')).toEqual(THEMES.filter((theme) => theme !== 'auto'));
    expect(list('TOKENS')).toEqual([...COLOR_TOKENS]);
  });
});

describe('cores personalizadas', () => {
  it('aceita só #rrggbb', () => {
    expect(isHexColor('#a1B2c3')).toBe(true);
    for (const value of ['#fff', 'a1b2c3', '#a1b2c3ff', 'red', 'rgb(0 0 0)', 12, null]) {
      expect(isHexColor(value), String(value)).toBe(false);
    }
  });

  it('lê as cores salvas e completa o que falta ou é inválido', () => {
    expect(parseCustomColors(null)).toEqual(DEFAULT_CUSTOM);
    expect(parseCustomColors('rosa')).toEqual(DEFAULT_CUSTOM);
    expect(
      parseCustomColors({ bg: '#FFF5F8', ink: 'url(x)', btn: '#be185d', outro: '#000000' }),
    ).toEqual({ ...DEFAULT_CUSTOM, bg: '#fff5f8', btn: '#be185d' });
  });

  it('devolve uma cópia: mudar o resultado não altera o padrão', () => {
    parseCustomColors(null).bg = '#000000';
    expect(parseCustomColors(null).bg).toBe('#ffffff');
  });

  it('só o scrim vira cor translúcida', () => {
    expect(cssValue('bg', '#102030')).toBe('#102030');
    expect(cssValue('scrim', '#102030')).toBe('color-mix(in srgb, #102030 50%, transparent)');
  });
});
