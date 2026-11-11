<script lang="ts">
  import { RadioGroup } from 'bits-ui';
  import Icon from '../components/Icon.svelte';
  import type { Lang, LangPref, Messages } from '../lib/i18n';
  import { prefs } from '../lib/state/preferences.svelte';
  import { fill } from '../lib/text';
  import {
    COLOR_TOKENS,
    DEFAULT_CUSTOM,
    cssValue,
    isHexColor,
    lowContrastPairs,
    type ColorToken,
    type ThemePref,
  } from '../lib/theme';

  let { t, lang, onback }: { t: Messages; lang: Lang; onback: () => void } = $props();

  const themes = $derived<{ value: ThemePref; label: string }[]>([
    { value: 'auto', label: t.settings.themeAuto },
    { value: 'light', label: t.settings.themeLight },
    { value: 'dark', label: t.settings.themeDark },
    { value: 'pink', label: t.settings.themePink },
    { value: 'blue', label: t.settings.themeBlue },
    { value: 'green', label: t.settings.themeGreen },
    { value: 'purple', label: t.settings.themePurple },
    { value: 'orange', label: t.settings.themeOrange },
    { value: 'custom', label: t.settings.themeCustom },
  ]);

  /** 'line-strong' → a chave 'lineStrong' das traduções. */
  function colorName(token: ColorToken): string {
    const key = token.replace(/-(\w)/g, (_, letter: string) => letter.toUpperCase());
    return t.settings.colors[key as keyof Messages['settings']['colors']];
  }

  /** As cores do tema personalizado, como variáveis CSS para a amostra dele. */
  const customStyle = $derived(
    COLOR_TOKENS.map((token) => `--${token}: ${cssValue(token, prefs.custom[token])}`).join('; '),
  );

  const lowContrast = $derived(
    lowContrastPairs(prefs.custom)
      .map(([text, back]) => `${colorName(text)} / ${colorName(back)}`)
      .join(', '),
  );

  const languages = $derived<{ value: LangPref; label: string; sub?: string }[]>([
    {
      value: 'auto',
      label: t.settings.langAuto,
      sub: fill(t.settings.langAutoSub, {
        lang: lang === 'en' ? t.settings.langNameEn : t.settings.langNamePt,
      }),
    },
    { value: 'pt-BR', label: t.settings.langPt },
    { value: 'en', label: t.settings.langEn },
  ]);

  // Aberto pelo ícone da tela inicial (PWA instalado, Fase 3).
  const installed = matchMedia('(display-mode: standalone)').matches;

  function setTheme(value: string): void {
    const theme = value as ThemePref;
    // Na primeira vez, o tema personalizado parte das cores que estão na tela.
    if (theme === 'custom' && COLOR_TOKENS.every((k) => prefs.custom[k] === DEFAULT_CUSTOM[k])) {
      const current = getComputedStyle(document.documentElement);
      for (const token of COLOR_TOKENS) {
        const color = current.getPropertyValue(`--${token}`).trim();
        if (isHexColor(color)) prefs.custom[token] = color.toLowerCase();
      }
    }
    prefs.theme = theme;
    prefs.save();
  }

  function setColor(token: ColorToken, color: string): void {
    if (!isHexColor(color)) return;
    prefs.custom[token] = color.toLowerCase();
    prefs.save();
  }

  function resetColors(): void {
    prefs.custom = { ...DEFAULT_CUSTOM };
    prefs.save();
  }

  function setLang(value: string): void {
    prefs.lang = value as LangPref;
    prefs.save();
  }
</script>

<main class="screen">
  <header class="topbar">
    <button class="icon-btn" type="button" aria-label={t.common.back} onclick={onback}>
      <Icon name="back" stroke={2} />
    </button>
    <h1>{t.settings.title}</h1>
  </header>

  <section class="group">
    <span class="field-label" id="theme-label">{t.settings.theme}</span>
    <RadioGroup.Root
      class="themes"
      aria-labelledby="theme-label"
      value={prefs.theme}
      onValueChange={setTheme}
    >
      {#each themes as option (option.value)}
        <RadioGroup.Item class="theme" value={option.value}>
          <!-- Cada amostra carrega o próprio data-theme, então usa os tokens daquele tema. -->
          {#if option.value === 'auto'}
            <span class="swatch split" aria-hidden="true">
              <span class="half" data-theme="light"><span class="chip"></span></span>
              <span class="half" data-theme="dark"><span class="chip"></span></span>
            </span>
          {:else if option.value === 'custom'}
            <span class="swatch" style={customStyle} aria-hidden="true">
              <span class="chip"></span>
            </span>
          {:else}
            <span class="swatch" data-theme={option.value} aria-hidden="true">
              <span class="chip"></span>
            </span>
          {/if}
          {option.label}
        </RadioGroup.Item>
      {/each}
    </RadioGroup.Root>
  </section>

  {#if prefs.theme === 'custom'}
    <section class="group">
      <span class="field-label">{t.settings.customTitle}</span>
      <p class="hint">{t.settings.customHint}</p>
      <ul class="colors">
        {#each COLOR_TOKENS as token (token)}
          <li>
            <label>
              <span>{colorName(token)}</span>
              <input
                type="color"
                value={prefs.custom[token]}
                oninput={(event) => setColor(token, event.currentTarget.value)}
              />
            </label>
          </li>
        {/each}
      </ul>
      <!-- A região existe sempre, para o leitor de tela anunciar quando o aviso chega. -->
      <p class="warning" role="status">
        {#if lowContrast}{fill(t.settings.lowContrast, { pairs: lowContrast })}{/if}
      </p>
      <button class="btn" type="button" onclick={resetColors}>{t.settings.customReset}</button>
    </section>
  {/if}

  <section class="group">
    <span class="field-label" id="lang-label">{t.settings.language}</span>
    <RadioGroup.Root
      class="radios"
      aria-labelledby="lang-label"
      value={prefs.lang}
      onValueChange={setLang}
    >
      {#each languages as option (option.value)}
        <RadioGroup.Item class="radio" value={option.value}>
          <span class="dot" aria-hidden="true"></span>
          <span class="radio-text">
            <strong>{option.label}</strong>
            {#if option.sub}<span>{option.sub}</span>{/if}
          </span>
        </RadioGroup.Item>
      {/each}
    </RadioGroup.Root>
  </section>

  <section class="group">
    <span class="field-label">{t.settings.privacy}</span>
    <p class="privacy">
      <Icon name="shield" size={22} stroke={1.8} />
      {t.settings.privacyText}
    </p>
    {#if installed}
      <p class="installed">
        <Icon name="phoneCheck" />
        {t.settings.installed}
      </p>
    {/if}
  </section>

  <p class="version">{fill(t.settings.version, { v: __APP_VERSION__ })}</p>
</main>

<style>
  .screen {
    gap: 22px;
  }

  .group {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .group :global(.themes) {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .group :global(.theme) {
    min-height: 84px;
    padding: 8px 6px;
    border-radius: var(--radius);
    border: 1px solid var(--line);
    background: transparent;
    color: var(--ink);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 700;
    overflow-wrap: anywhere;
  }

  .group :global(.theme[data-state='checked']) {
    border-color: var(--ink);
    box-shadow: inset 0 0 0 1px var(--ink);
  }

  .swatch {
    width: 100%;
    height: 40px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--line-strong);
    background: var(--bg);
    display: grid;
    place-items: center;
    overflow: hidden;
  }

  .swatch.split {
    grid-template-columns: 1fr 1fr;
    place-items: stretch;
  }

  .half {
    background: var(--bg);
    display: grid;
    place-items: center;
  }

  .chip {
    width: 55%;
    height: 12px;
    border-radius: 6px;
    background: var(--btn);
  }

  .hint {
    font-size: 13px;
    line-height: 1.45;
    color: var(--muted);
  }

  .colors {
    list-style: none;
    margin: 0;
    padding: 0;
    border: 1px solid var(--line);
    border-radius: 16px;
  }

  .colors li + li {
    border-top: 1px solid var(--line);
  }

  .colors label {
    min-height: 56px;
    padding: 6px 8px 6px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
  }

  input[type='color'] {
    flex-shrink: 0;
    width: 56px;
    height: var(--tap);
    padding: 3px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-sm);
    background: var(--bg);
    cursor: pointer;
  }

  .warning {
    font-size: 14px;
    line-height: 1.45;
    font-weight: 600;
    color: var(--danger);
  }

  .warning:empty {
    display: none;
  }

  .group :global(.radios) {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--line);
    border-radius: 16px;
    overflow: hidden;
  }

  .group :global(.radio) {
    min-height: 52px;
    padding: 12px 16px;
    border: none;
    background: transparent;
    color: var(--ink);
    display: flex;
    align-items: center;
    gap: 14px;
    text-align: left;
  }

  .group :global(.radio + .radio) {
    border-top: 1px solid var(--line);
  }

  .group :global(.radio:focus-visible) {
    outline-offset: -3px;
  }

  .dot {
    flex-shrink: 0;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 2px solid var(--line-strong);
    display: grid;
    place-items: center;
  }

  .dot::after {
    content: '';
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: transparent;
  }

  :global(.radio[data-state='checked']) .dot {
    border-color: var(--ink);
  }

  :global(.radio[data-state='checked']) .dot::after {
    background: var(--ink);
  }

  .radio-text {
    display: flex;
    flex-direction: column;
    font-size: 13px;
    color: var(--muted);
  }

  .radio-text strong {
    font-size: 16px;
    color: var(--ink);
  }

  .privacy {
    padding: 14px 16px;
    border-radius: 16px;
    background: var(--surface);
    display: flex;
    gap: 12px;
    align-items: flex-start;
    font-size: 14px;
    line-height: 1.5;
    color: var(--muted);
  }

  .installed {
    padding: 12px 16px;
    border-radius: 16px;
    border: 1px solid var(--line);
    display: flex;
    gap: 12px;
    align-items: center;
    font-size: 15px;
    font-weight: 600;
  }

  .version {
    margin-top: auto;
    text-align: center;
    font-size: 13px;
    font-weight: 600;
    color: var(--muted);
  }
</style>
