import { describe, expect, it } from 'vitest';
import { DEFAULT_OPTIONS } from '../../src/lib/core/options';
import { parsePrefs } from '../../src/lib/state/preferences.svelte';

const DEFAULTS = { theme: 'auto', lang: 'auto', pdf: DEFAULT_OPTIONS };

describe('parsePrefs', () => {
  it('volta para o padrão quando não há nada salvo', () => {
    expect(parsePrefs(null)).toEqual(DEFAULTS);
  });

  it('lê valores válidos', () => {
    expect(parsePrefs('{"theme":"dark","lang":"en"}')).toEqual({
      ...DEFAULTS,
      theme: 'dark',
      lang: 'en',
    });
  });

  it('ignora valores inválidos e JSON quebrado', () => {
    expect(parsePrefs('{"theme":"roxo","lang":42}')).toEqual(DEFAULTS);
    expect(parsePrefs('{quebrado')).toEqual(DEFAULTS);
    expect(parsePrefs('"texto"')).toEqual(DEFAULTS);
    expect(parsePrefs('null')).toEqual(DEFAULTS);
  });

  it('lê as últimas opções do PDF', () => {
    const pdf = { pageSize: 'letter', quality: 'low', margin: false, autoOrient: false };
    expect(parsePrefs(JSON.stringify({ pdf })).pdf).toEqual(pdf);
  });

  it('completa opções do PDF que faltam ou são inválidas', () => {
    const stored = { pdf: { pageSize: 'a3', quality: 'high', margin: 'sim' } };
    expect(parsePrefs(JSON.stringify(stored)).pdf).toEqual({ ...DEFAULT_OPTIONS, quality: 'high' });
    expect(parsePrefs('{"pdf":"a4"}').pdf).toEqual(DEFAULT_OPTIONS);
  });

  it('devolve uma cópia: mudar o resultado não altera o padrão', () => {
    parsePrefs(null).pdf.margin = false;
    expect(parsePrefs(null).pdf.margin).toBe(true);
  });
});
