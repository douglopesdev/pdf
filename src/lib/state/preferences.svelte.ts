import type { LangPref } from '../i18n';

export type ThemePref = 'auto' | 'light' | 'dark';

/** Mesma chave lida por public/theme-init.js antes da primeira pintura. */
export const PREFS_KEY = 'pdf.prefs';

interface StoredPrefs {
  theme: ThemePref;
  lang: LangPref;
}

const DEFAULTS: StoredPrefs = { theme: 'auto', lang: 'auto' };

export function parsePrefs(raw: string | null): StoredPrefs {
  if (!raw) return { ...DEFAULTS };
  try {
    const data = JSON.parse(raw) as Partial<Record<keyof StoredPrefs, unknown>>;
    const theme = data.theme;
    const lang = data.lang;
    return {
      theme: theme === 'light' || theme === 'dark' || theme === 'auto' ? theme : DEFAULTS.theme,
      lang: lang === 'pt-BR' || lang === 'en' || lang === 'auto' ? lang : DEFAULTS.lang,
    };
  } catch {
    return { ...DEFAULTS };
  }
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
  theme = $state<ThemePref>(DEFAULTS.theme);
  lang = $state<LangPref>(DEFAULTS.lang);

  constructor() {
    const stored = parsePrefs(readStorage());
    this.theme = stored.theme;
    this.lang = stored.lang;
  }

  save(): void {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ theme: this.theme, lang: this.lang }));
    } catch {
      // Sem localStorage (modo restrito): a preferência vale só até fechar o app.
    }
  }
}

export const prefs = new Preferences();
