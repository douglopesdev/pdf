import { describe, expect, it } from 'vitest';
import { cleanFileName, fill, formatSize, plural, SIZE_LIMIT_BYTES } from '../../src/lib/text';

describe('fill', () => {
  it('troca as chaves pelos valores', () => {
    expect(fill('Página {page} de {total}', { page: 2, total: 3 })).toBe('Página 2 de 3');
    expect(fill('{n} e {n}', { n: 'a' })).toBe('a e a');
  });

  it('mantém a chave que não recebeu valor', () => {
    expect(fill('Olá {nome}', {})).toBe('Olá {nome}');
  });
});

describe('plural', () => {
  it('usa o singular só para 1', () => {
    expect(plural(1, '1 página', '{n} páginas')).toBe('1 página');
    expect(plural(4, '1 página', '{n} páginas')).toBe('4 páginas');
    expect(plural(0, '1 página', '{n} páginas')).toBe('0 páginas');
  });
});

describe('formatSize', () => {
  it('mostra KB sem casas abaixo de 1 MB', () => {
    expect(formatSize(300, 'pt-BR')).toBe('1 KB');
    expect(formatSize(23_027, 'pt-BR')).toBe('22 KB');
  });

  it('mostra MB com uma casa, no formato do idioma', () => {
    expect(formatSize(1.4 * 1024 * 1024, 'pt-BR')).toBe('1,4 MB');
    expect(formatSize(1.4 * 1024 * 1024, 'en')).toBe('1.4 MB');
    expect(formatSize(SIZE_LIMIT_BYTES, 'pt-BR')).toBe('2,0 MB');
  });
});

describe('cleanFileName', () => {
  it('mantém nomes comuns, com acento e espaço', () => {
    expect(cleanFileName('documentos-mae')).toBe('documentos-mae');
    expect(cleanFileName('Certidão da mãe 2026')).toBe('Certidão da mãe 2026');
  });

  it('tira a extensão .pdf digitada', () => {
    expect(cleanFileName('contrato.pdf')).toBe('contrato');
    expect(cleanFileName('contrato.PDF ')).toBe('contrato');
  });

  it('tira caracteres que o sistema de arquivos recusa', () => {
    expect(cleanFileName('a/b\\c:d*e?f"g<h>i|j')).toBe('a b c d e f g h i j');
    expect(cleanFileName('  ..oculto.. ')).toBe('oculto');
    expect(cleanFileName('linha\nnova')).toBe('linha nova');
  });

  it('usa o nome padrão quando não sobra nada', () => {
    expect(cleanFileName('')).toBe('documento');
    expect(cleanFileName('   ')).toBe('documento');
    expect(cleanFileName('///')).toBe('documento');
    expect(cleanFileName('.pdf')).toBe('documento');
  });

  it('limita o tamanho', () => {
    expect(cleanFileName('x'.repeat(200))).toHaveLength(80);
  });
});
