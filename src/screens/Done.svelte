<script lang="ts">
  import Icon from '../components/Icon.svelte';
  import type { Lang, Messages } from '../lib/i18n';
  import { canShareFile, pdfFile, shareFile } from '../lib/platform/share';
  import type { PdfResult } from '../lib/state/session.svelte';
  import { formatSize, plural, SIZE_LIMIT_BYTES } from '../lib/text';

  let {
    t,
    lang,
    result,
    onclose,
    onretrylow,
    onsharefailed,
  }: {
    t: Messages;
    lang: Lang;
    result: PdfResult;
    /** Fechar e "Converter outras imagens": descarta tudo e volta ao início. */
    onclose: () => void;
    onretrylow: () => void;
    onsharefailed: () => void;
  } = $props();

  const file = $derived(pdfFile(result.blob, result.name));
  const shareable = $derived(canShareFile(file));
  const fits = $derived(result.size <= SIZE_LIMIT_BYTES);
  const meta = $derived(
    `${plural(result.pages, t.arrange.countOne, t.arrange.countMany)} · ${formatSize(result.size, lang)}`,
  );

  async function share(): Promise<void> {
    if (!(await shareFile(file))) onsharefailed();
  }
</script>

<main class="screen">
  <header class="topbar bar">
    <button class="icon-btn" type="button" aria-label={t.common.close} onclick={onclose}>
      <Icon name="close" size={18} stroke={2} />
    </button>
  </header>

  <section class="hero">
    <span class="badge"><Icon name="check" size={36} stroke={2.4} /></span>
    <h1>{t.done.title}</h1>
    <p>{t.done.subtitle}</p>
  </section>

  <section class="file">
    <div class="file-row">
      <span class="file-icon" aria-hidden="true"><span>PDF</span></span>
      <div class="file-text">
        <strong>{result.name}</strong>
        <span>{meta}</span>
      </div>
    </div>
    {#if fits}
      <p class="fits">
        <Icon name="check" size={16} stroke={2.4} />
        {t.done.fits}
      </p>
    {:else}
      <p class="note">{t.done.tooBig}</p>
      {#if result.quality !== 'low'}
        <button class="btn small" type="button" onclick={onretrylow}>{t.done.retryLow}</button>
      {/if}
    {/if}
    {#if result.skipped > 0}
      <p class="note">
        {plural(result.skipped, t.done.skippedOne, t.done.skippedMany)}
        {#if result.heic > 0}{t.done.skippedHeic}{/if}
      </p>
    {/if}
  </section>

  <section class="choices">
    {#if shareable}
      <button class="btn primary choice" type="button" onclick={share}>
        <Icon name="share" size={22} stroke={2} />
        <span>
          <strong>{t.done.share}</strong>
          <small>{t.done.shareSub}</small>
        </span>
      </button>
    {/if}
    <a class="btn choice" class:primary={!shareable} href={result.url} download={result.name}>
      <Icon name="download" size={22} stroke={2} />
      <span>
        <strong>{t.done.save}</strong>
        <small>{t.done.saveSub}</small>
      </span>
    </a>
    <button class="again" type="button" onclick={onclose}>{t.done.again}</button>
  </section>

  <p class="keep">
    <Icon name="info" size={18} stroke={2} />
    {t.done.note}
  </p>
</main>

<style>
  .bar {
    justify-content: flex-end;
  }

  .hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    text-align: center;
  }

  .badge {
    width: 76px;
    height: 76px;
    border-radius: 50%;
    background: var(--btn);
    color: var(--btn-ink);
    display: grid;
    place-items: center;
    margin-bottom: 6px;
  }

  .hero h1 {
    font-size: 28px;
    letter-spacing: -0.02em;
  }

  .hero p {
    color: var(--muted);
  }

  .file {
    padding: 16px;
    border-radius: 18px;
    border: 1px solid var(--line);
    background: var(--surface);
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .file-row {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .file-icon {
    flex-shrink: 0;
    width: 48px;
    height: 58px;
    border-radius: 8px;
    background: var(--bg);
    border: 1px solid var(--line-strong);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding-bottom: 8px;
  }

  .file-icon span {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.04em;
    padding: 2px 5px;
    border-radius: 4px;
    background: var(--btn);
    color: var(--btn-ink);
  }

  .file-text {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 14px;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }

  .file-text strong {
    font-size: 16px;
    color: var(--ink);
    overflow-wrap: anywhere;
  }

  .fits {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    background: var(--ok-bg);
    color: var(--ok);
    font-size: 14px;
    font-weight: 700;
  }

  .note {
    font-size: 14px;
    line-height: 1.45;
    color: var(--muted);
  }

  .btn.small {
    min-height: var(--tap);
    font-size: 15px;
  }

  .choices {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .choice {
    min-height: 64px;
    border-radius: 16px;
    padding: 10px 18px;
    justify-content: flex-start;
    gap: 14px;
    text-align: left;
  }

  .choice span {
    display: flex;
    flex-direction: column;
  }

  .choice strong {
    font-size: 17px;
  }

  .choice small {
    font-size: 13px;
    font-weight: 500;
    color: var(--muted);
  }

  .choice.primary small {
    color: inherit;
    opacity: 0.75;
  }

  .again {
    min-height: 48px;
    border: none;
    background: transparent;
    font-size: 15px;
    font-weight: 700;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .keep {
    margin-top: auto;
    padding: 12px 14px;
    border-radius: var(--radius);
    border: 1px dashed var(--line-strong);
    display: flex;
    gap: 10px;
    align-items: flex-start;
    color: var(--muted);
    font-size: 13px;
    line-height: 1.45;
  }
</style>
