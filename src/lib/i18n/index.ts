import { en } from './en';
import { ptBR, type Messages } from './pt-BR';

export type Lang = 'pt-BR' | 'en';
export type LangPref = 'auto' | Lang;

const dictionaries: Record<Lang, Messages> = { 'pt-BR': ptBR, en };

/**
 * Português é o padrão. Inglês só quando o telefone está em inglês.
 * `languages` vem de `navigator.languages`, em ordem de preferência.
 */
export function resolveLang(pref: LangPref, languages: readonly string[]): Lang {
  if (pref !== 'auto') return pref;
  const first = languages[0]?.toLowerCase() ?? '';
  return first === 'en' || first.startsWith('en-') ? 'en' : 'pt-BR';
}

export function messages(lang: Lang): Messages {
  return dictionaries[lang];
}

export type { Messages };
