<script lang="ts">
  import { Dialog, Switch } from 'bits-ui';
  import {
    DEFAULT_OPTIONS,
    type PageSize,
    type PdfOptions,
    type Quality,
  } from '../lib/core/options';
  import type { Messages } from '../lib/i18n';
  import { cleanFileName } from '../lib/text';
  import Icon from './Icon.svelte';
  import Segmented from './Segmented.svelte';

  let {
    open = $bindable(false),
    t,
    options,
    fileName,
    onapply,
  }: {
    open?: boolean;
    t: Messages;
    options: PdfOptions;
    fileName: string;
    onapply: (options: PdfOptions, fileName: string) => void;
  } = $props();

  // Rascunho, copiado das opções atuais ao abrir: só vale depois de Aplicar.
  let draft = $state<PdfOptions>({ ...DEFAULT_OPTIONS });
  let name = $state('');

  $effect(() => {
    if (open) {
      draft = { ...options };
      name = fileName;
    }
  });

  const sizes = $derived<{ value: PageSize; label: string }[]>([
    { value: 'a4', label: t.options.sizeA4 },
    { value: 'letter', label: t.options.sizeLetter },
    { value: 'original', label: t.options.sizeOriginal },
  ]);
  const qualities = $derived<{ value: Quality; label: string }[]>([
    { value: 'high', label: t.options.qualityHigh },
    { value: 'medium', label: t.options.qualityMedium },
    { value: 'low', label: t.options.qualityLow },
  ]);

  function apply(event: SubmitEvent): void {
    event.preventDefault();
    onapply({ ...draft }, cleanFileName(name));
    open = false;
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Portal>
    <Dialog.Overlay class="sheet-scrim" />
    <Dialog.Content class="sheet" aria-describedby={undefined}>
      <form onsubmit={apply}>
        <span class="grip" aria-hidden="true"></span>
        <header>
          <Dialog.Title class="sheet-title">{t.options.title}</Dialog.Title>
          <Dialog.Close class="icon-btn" aria-label={t.common.close}>
            <Icon name="close" size={18} stroke={2} />
          </Dialog.Close>
        </header>

        <div class="group">
          <span class="field-label">{t.options.size}</span>
          <Segmented
            value={draft.pageSize}
            options={sizes}
            label={t.options.size}
            onchange={(value) => (draft.pageSize = value)}
          />
        </div>

        <div class="group">
          <span class="field-label">{t.options.quality}</span>
          <Segmented
            value={draft.quality}
            options={qualities}
            label={t.options.quality}
            onchange={(value) => (draft.quality = value)}
          />
          <p class="hint">{t.options.qualityHint}</p>
        </div>

        <div class="toggles">
          <label class="toggle">
            <span class="toggle-text">
              <strong>{t.options.margin}</strong>
              <span>{t.options.marginSub}</span>
            </span>
            <Switch.Root class="switch" bind:checked={draft.margin}>
              <Switch.Thumb class="switch-thumb" />
            </Switch.Root>
          </label>
          <label class="toggle">
            <span class="toggle-text">
              <strong>{t.options.auto}</strong>
              <span>{t.options.autoSub}</span>
            </span>
            <Switch.Root class="switch" bind:checked={draft.autoOrient}>
              <Switch.Thumb class="switch-thumb" />
            </Switch.Root>
          </label>
        </div>

        <div class="group">
          <label class="field-label" for="file-name">{t.options.name}</label>
          <div class="name-field">
            <input
              id="file-name"
              type="text"
              bind:value={name}
              maxlength="80"
              autocomplete="off"
              autocapitalize="off"
              spellcheck="false"
              enterkeyhint="done"
            />
            <span aria-hidden="true">.pdf</span>
          </div>
        </div>

        <button class="btn primary" type="submit">{t.options.apply}</button>
      </form>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>

<style>
  :global(.sheet-scrim) {
    position: fixed;
    inset: 0;
    z-index: 40;
    background: var(--scrim);
    animation: fade 0.18s ease-out;
  }

  :global(.sheet) {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 41;
    width: 100%;
    max-width: 520px;
    max-height: 100dvh;
    margin: 0 auto;
    overflow-y: auto;
    overscroll-behavior: contain;
    background: var(--bg);
    color: var(--ink);
    border-top: 1px solid var(--line);
    border-radius: 26px 26px 0 0;
    padding: 10px max(var(--gutter), env(safe-area-inset-right))
      max(26px, env(safe-area-inset-bottom)) max(var(--gutter), env(safe-area-inset-left));
    animation: slide 0.22s ease-out;
  }

  :global(.sheet:focus) {
    outline: none;
  }

  :global(.sheet-title) {
    font-size: 21px;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .grip {
    width: 40px;
    height: 4px;
    border-radius: 2px;
    background: var(--line-strong);
    align-self: center;
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .hint {
    font-size: 13px;
    line-height: 1.45;
    color: var(--muted);
  }

  .toggles {
    border: 1px solid var(--line);
    border-radius: 16px;
  }

  .toggle {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    cursor: pointer;
  }

  .toggle + .toggle {
    border-top: 1px solid var(--line);
  }

  .toggle-text {
    flex: 1;
    display: flex;
    flex-direction: column;
    font-size: 13px;
    color: var(--muted);
  }

  .toggle-text strong {
    font-size: 15px;
    color: var(--ink);
  }

  :global(.switch) {
    flex-shrink: 0;
    width: 52px;
    height: 32px;
    border-radius: 16px;
    border: none;
    padding: 3px;
    background: var(--line-strong);
    display: flex;
    transition: background 0.15s;
  }

  :global(.switch[data-state='checked']) {
    background: var(--btn);
  }

  :global(.switch-thumb) {
    width: 26px;
    height: 26px;
    border-radius: 13px;
    background: var(--bg);
    transition: transform 0.15s;
  }

  :global(.switch[data-state='checked'] .switch-thumb) {
    background: var(--btn-ink);
    transform: translateX(20px);
  }

  .name-field {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 50px;
    padding: 0 14px;
    border-radius: 12px;
    border: 1px solid var(--line-strong);
    font-size: 15px;
    font-weight: 600;
    color: var(--muted);
  }

  .name-field:focus-within {
    outline: 3px solid var(--ink);
    outline-offset: 2px;
  }

  input {
    flex: 1;
    min-width: 0;
    height: 100%;
    border: none;
    outline: none;
    background: transparent;
    color: var(--ink);
    font: inherit;
    font-size: 16px;
    font-weight: 500;
  }

  @keyframes fade {
    from {
      opacity: 0;
    }
  }

  @keyframes slide {
    from {
      transform: translateY(24px);
      opacity: 0;
    }
  }
</style>
