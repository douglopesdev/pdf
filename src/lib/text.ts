// Pequenas funções de texto usadas pela interface. Puras, para testar no Node.

import type { Lang } from './i18n';

/** Troca `{chave}` pelos valores: fill('Página {n}', { n: 2 }) → 'Página 2'. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

/** Escolhe entre o texto do singular e o do plural e preenche `{n}`. */
export function plural(count: number, one: string, many: string): string {
  return fill(count === 1 ? one : many, { n: count });
}

const KB = 1024;
const MB = KB * 1024;

/** Limite de anexo mais comum em sites de governo e de banco. */
export const SIZE_LIMIT_BYTES = 2 * MB;

/** '1,4 MB' em português, '1.4 MB' em inglês. Abaixo de 1 MB, em KB sem casas. */
export function formatSize(bytes: number, lang: Lang): string {
  if (bytes < MB) {
    return `${Math.max(1, Math.round(bytes / KB)).toLocaleString(lang)} KB`;
  }
  const value = (bytes / MB).toLocaleString(lang, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  return `${value} MB`;
}

export const DEFAULT_FILE_NAME = 'documento';
const MAX_NAME_LENGTH = 80;

/**
 * Nome de arquivo seguro, sem a extensão: tira `.pdf` do fim, caracteres que o
 * Android e o Windows recusam e espaços sobrando. Vazio vira o nome padrão.
 */
export function cleanFileName(raw: string): string {
  const name = raw
    .replace(/\.pdf\s*$/i, '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\\/:*?"<>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[.\s]+|[.\s]+$/g, '')
    .slice(0, MAX_NAME_LENGTH)
    .trim();
  return name || DEFAULT_FILE_NAME;
}
