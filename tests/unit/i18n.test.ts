import { describe, expect, it } from 'vitest';
import { messages, resolveLang } from '../../src/lib/i18n';

describe('resolveLang', () => {
  it('usa português por padrão', () => {
    expect(resolveLang('auto', ['pt-BR'])).toBe('pt-BR');
    expect(resolveLang('auto', ['es-ES', 'en-US'])).toBe('pt-BR');
    expect(resolveLang('auto', [])).toBe('pt-BR');
  });

  it('usa inglês quando o telefone está em inglês', () => {
    expect(resolveLang('auto', ['en-US', 'pt-BR'])).toBe('en');
    expect(resolveLang('auto', ['EN'])).toBe('en');
  });

  it('respeita a escolha manual', () => {
    expect(resolveLang('en', ['pt-BR'])).toBe('en');
    expect(resolveLang('pt-BR', ['en-US'])).toBe('pt-BR');
  });
});

describe('dicionários', () => {
  const keysOf = (obj: object, prefix = ''): string[] =>
    Object.entries(obj).flatMap(([k, v]) =>
      typeof v === 'string' ? [prefix + k] : keysOf(v as object, `${prefix}${k}.`),
    );

  it('pt-BR e en têm exatamente as mesmas chaves', () => {
    expect(keysOf(messages('en')).sort()).toEqual(keysOf(messages('pt-BR')).sort());
  });

  it('nenhum texto está vazio', () => {
    for (const lang of ['pt-BR', 'en'] as const) {
      const empty = keysOf(messages(lang)).filter((k) => {
        const value = k
          .split('.')
          .reduce<unknown>((o, part) => (o as Record<string, unknown>)[part], messages(lang));
        return typeof value !== 'string' || value.trim() === '';
      });
      expect(empty, lang).toEqual([]);
    }
  });
});
