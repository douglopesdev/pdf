<script lang="ts">
  import type { Messages } from '../lib/i18n';
  import Icon from './Icon.svelte';

  let { t, onapply, onclose }: { t: Messages; onapply: () => void; onclose: () => void } = $props();
</script>

<div class="region">
  <div class="banner" role="status">
    <span>{t.update.available}</span>
    <button class="apply" type="button" onclick={onapply}>{t.update.apply}</button>
    <button class="close" type="button" aria-label={t.common.close} onclick={onclose}>
      <Icon name="close" size={18} stroke={2} />
    </button>
  </div>
</div>

<style>
  .region {
    position: fixed;
    left: 0;
    right: 0;
    bottom: calc(16px + env(safe-area-inset-bottom));
    z-index: 50;
    display: flex;
    justify-content: center;
    padding: 0 var(--gutter);
    pointer-events: none;
  }

  .banner {
    pointer-events: auto;
    width: 100%;
    max-width: 480px;
    padding: 6px 6px 6px 16px;
    border-radius: var(--radius);
    background: var(--btn);
    color: var(--btn-ink);
    box-shadow: var(--shadow);
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 15px;
    font-weight: 600;
  }

  span {
    flex: 1;
  }

  button {
    min-width: var(--tap);
    min-height: var(--tap);
    border-radius: var(--radius-sm);
    display: grid;
    place-items: center;
  }

  .apply {
    padding: 0 14px;
    border: none;
    background: var(--btn-ink);
    color: var(--btn);
    font-weight: 700;
  }

  .close {
    padding: 0;
    border: none;
    background: transparent;
    color: inherit;
  }

  button:focus-visible {
    outline-color: var(--btn-ink);
  }
</style>
