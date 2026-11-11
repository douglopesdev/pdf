<script lang="ts">
  let { message, onclose }: { message: string | null; onclose: () => void } = $props();

  const DURATION_MS = 5000;

  $effect(() => {
    if (!message) return;
    const timer = setTimeout(onclose, DURATION_MS);
    return () => clearTimeout(timer);
  });
</script>

<!-- A região existe sempre, para o leitor de tela anunciar quando o texto chega. -->
<div class="region" role="status" aria-live="polite">
  {#if message}
    <button class="toast" type="button" onclick={onclose}>{message}</button>
  {/if}
</div>

<style>
  .region {
    position: fixed;
    left: 0;
    right: 0;
    bottom: calc(16px + env(safe-area-inset-bottom));
    z-index: 60;
    display: flex;
    justify-content: center;
    padding: 0 var(--gutter);
    pointer-events: none;
  }

  .toast {
    pointer-events: auto;
    max-width: 480px;
    min-height: var(--tap);
    padding: 12px 16px;
    border: none;
    border-radius: var(--radius);
    background: var(--btn);
    color: var(--btn-ink);
    font-size: 15px;
    font-weight: 600;
    line-height: 1.4;
    text-align: left;
    box-shadow: var(--shadow);
    animation: rise 0.2s ease-out;
  }

  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
  }
</style>
