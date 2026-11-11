import { DEFAULT_OPTIONS, type PdfOptions } from '../core/options';
import type { LangPref } from '../i18n';
import {
  DEFAULT_CUSTOM,
  THEMES,
  parseCustomColors,
  type CustomColors,
  type ThemePref,
} from '../theme';

export type { ThemePref };

/** Mesma chave lida por public/theme-init.js antes da primeira pintura. */
export const PREFS_KEY = 'pdf.prefs';

interface StoredPrefs {
  theme: ThemePref;
  lang: LangPref;
  /** Últimas opções usadas no PDF. */
  pdf: PdfOptions;
  /** Cores do tema personalizado. Ficam guardadas mesmo com outro tema ativo. */
  custom: CustomColors;
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function parsePdfOptions(raw: unknown): PdfOptions {
  const data = (raw && typeof raw === 'object' ? raw : {}) as Partial<
    Record<keyof PdfOptions, unknown>
  >;
  return {
    pageSize: oneOf(data.pageSize, ['a4', 'letter', 'original'], DEFAULT_OPTIONS.pageSize),
    quality: oneOf(data.quality, ['high', 'medium', 'low'], DEFAULT_OPTIONS.quality),
    margin: typeof data.margin === 'boolean' ? data.margin : DEFAULT_OPTIONS.margin,
    autoOrient: typeof data.autoOrient === 'boolean' ? data.autoOrient : DEFAULT_OPTIONS.autoOrient,
  };
}

export function parsePrefs(raw: string | null): StoredPrefs {
  let data: Partial<Record<keyof StoredPrefs, unknown>> = {};
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === 'object') data = parsed;
  } catch {
    // JSON quebrado: volta tudo para o padrão.
  }
  return {
    theme: oneOf(data.theme, THEMES, 'auto'),
    lang: oneOf(data.lang, ['auto', 'pt-BR', 'en'], 'auto'),
    pdf: parsePdfOptions(data.pdf),
    custom: parseCustomColors(data.custom),
  };
}

function readStorage(): string | null {
  try {
    return localStorage.getItem(PREFS_KEY);
  } catch {
    return null;
  }
}

/**
 * Preferências do usuário. É o único dado que o app guarda:
 * imagens e PDFs nunca são gravados.
 */
class Preferences {
  theme = $state<ThemePref>('auto');
  lang = $state<LangPref>('auto');
  pdf = $state<PdfOptions>({ ...DEFAULT_OPTIONS });
  custom = $state<CustomColors>({ ...DEFAULT_CUSTOM });

  constructor() {
    const stored = parsePrefs(readStorage());
    this.theme = stored.theme;
    this.lang = stored.lang;
    this.pdf = stored.pdf;
    this.custom = stored.custom;
  }

  save(): void {
    try {
      localStorage.setItem(
        PREFS_KEY,
        JSON.stringify({ theme: this.theme, lang: this.lang, pdf: this.pdf, custom: this.custom }),
      );
    } catch {
      // Sem localStorage (modo restrito): a preferência vale só até fechar o app.
    }
  }
}

export const prefs = new Preferences();
