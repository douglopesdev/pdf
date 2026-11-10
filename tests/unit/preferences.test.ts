import { describe, expect, it } from 'vitest';
import { parsePrefs } from '../../src/lib/state/preferences.svelte';

describe('parsePrefs', () => {
  it('volta para automático quando não há nada salvo', () => {
    expect(parsePrefs(null)).toEqual({ theme: 'auto', lang: 'auto' });
  });

  it('lê valores válidos', () => {
    expect(parsePrefs('{"theme":"dark","lang":"en"}')).toEqual({ theme: 'dark', lang: 'en' });
  });

  it('ignora valores inválidos e JSON quebrado', () => {
    expect(parsePrefs('{"theme":"roxo","lang":42}')).toEqual({ theme: 'auto', lang: 'auto' });
    expect(parsePrefs('{quebrado')).toEqual({ theme: 'auto', lang: 'auto' });
  });
});
