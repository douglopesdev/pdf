<script lang="ts">
  import { RadioGroup } from 'bits-ui';
  import Icon, { type IconName } from '../components/Icon.svelte';
  import Segmented from '../components/Segmented.svelte';
  import type { Lang, LangPref, Messages } from '../lib/i18n';
  import { prefs, type ThemePref } from '../lib/state/preferences.svelte';
  import { fill } from '../lib/text';

  let { t, lang, onback }: { t: Messages; lang: Lang; onback: () => void } = $props();

  const themes = $derived<{ value: ThemePref; label: string; icon: IconName }[]>([
    { value: 'auto', label: t.settings.themeAuto, icon: 'phone' },
    { value: 'light', label: t.settings.themeLight, icon: 'sun' },
    { value: 'dark', label: t.settings.themeDark, icon: 'moon' },
  ]);

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

  function setTheme(theme: ThemePref): void {
    prefs.theme = theme;
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
    <span class="field-label">{t.settings.theme}</span>
    <Segmented value={prefs.theme} options={themes} label={t.settings.theme} onchange={setTheme} />
  </section>

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
