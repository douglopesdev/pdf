<script lang="ts">
  import type { Messages } from '../lib/i18n';
  import type { PageItem } from '../lib/state/session.svelte';
  import { fill } from '../lib/text';
  import Icon from './Icon.svelte';

  let {
    page,
    number,
    t,
    dragging = false,
    target = false,
    offset = null,
    ongrab,
    onstep,
    onrotate,
    onremove,
  }: {
    page: PageItem;
    /** Posição da página, a partir de 1. */
    number: number;
    t: Messages;
    /** Esta é a página sendo arrastada. */
    dragging?: boolean;
    /** A página arrastada cairia aqui. */
    target?: boolean;
    /** Deslocamento em px enquanto arrasta. */
    offset?: { x: number; y: number } | null;
    ongrab: (event: PointerEvent) => void;
    /** Teclado: -1 leva a página para antes, +1 para depois. */
    onstep: (delta: -1 | 1) => void;
    onrotate: () => void;
    onremove: () => void;
  } = $props();

  // HEIC e arquivos estranhos não têm miniatura no Chrome.
  let broken = $state(false);

  const quarter = $derived(page.rotation === 90 || page.rotation === 270);

  function onkeydown(event: KeyboardEvent): void {
    const delta =
      event.key === 'ArrowLeft' || event.key === 'ArrowUp'
        ? -1
        : event.key === 'ArrowRight' || event.key === 'ArrowDown'
          ? 1
          : 0;
    if (delta === 0) return;
    event.preventDefault();
    onstep(delta);
  }
</script>

<li
  class="card"
  class:dragging
  class:target
  style:transform={offset ? `translate(${offset.x}px, ${offset.y}px) scale(1.03)` : undefined}
>
  <button
    class="thumb"
    type="button"
    aria-label={fill(t.arrange.move, { n: number })}
    onpointerdown={ongrab}
    oncontextmenu={(event) => event.preventDefault()}
    {onkeydown}
  >
    <span class="number" aria-hidden="true">{number}</span>
    {#if broken}
      <span class="placeholder">
        <Icon name="image" size={26} stroke={1.8} />
        {t.arrange.noPreview}
      </span>
    {:else}
      <img
        src={page.url}
        alt=""
        draggable="false"
        class:quarter
        style:transform={`rotate(${page.rotation}deg)`}
        onerror={() => (broken = true)}
      />
    {/if}
  </button>
  <div class="actions">
    <button type="button" aria-label={fill(t.arrange.rotate, { n: number })} onclick={onrotate}>
      <Icon name="rotate" size={19} />
    </button>
    <button type="button" aria-label={fill(t.arrange.remove, { n: number })} onclick={onremove}>
      <Icon name="trash" size={19} />
    </button>
  </div>
</li>

<style>
  .card {
    position: relative;
    border-radius: 16px;
    border: 1px solid var(--line);
    background: var(--bg);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    /* Segurar a miniatura não pode selecionar texto nem abrir o menu da imagem. */
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
  }

  .card.dragging {
    z-index: 5;
    border-color: var(--ink);
    box-shadow:
      0 0 0 1px var(--ink),
      var(--shadow);
    transition: none;
  }

  .card.target {
    outline: 2px dashed var(--ink);
    outline-offset: 2px;
  }

  .thumb {
    position: relative;
    height: 176px;
    border: none;
    padding: 0;
    background: var(--surface);
    display: grid;
    place-items: center;
    container-type: size;
    cursor: grab;
    touch-action: pan-y;
  }

  .dragging .thumb {
    cursor: grabbing;
  }

  .thumb:focus-visible {
    outline-offset: -3px;
  }

  .number {
    position: absolute;
    top: 10px;
    left: 10px;
    z-index: 1;
    min-width: 24px;
    height: 24px;
    padding: 0 6px;
    border-radius: 12px;
    background: var(--btn);
    color: var(--btn-ink);
    font-size: 12px;
    font-weight: 800;
    display: grid;
    place-items: center;
  }

  img {
    max-width: 82cqw;
    max-height: 78cqh;
    border-radius: 3px;
    box-shadow: var(--paper-shadow);
    pointer-events: none;
    transition: transform 0.18s ease-out;
  }

  /* Deitada de lado, a largura da imagem passa a ocupar a altura do quadro. */
  img.quarter {
    max-width: 78cqh;
    max-height: 82cqw;
  }

  .placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    color: var(--muted);
    font-size: 13px;
    font-weight: 600;
  }

  .actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    border-top: 1px solid var(--line);
  }

  .actions button {
    height: 46px;
    border: none;
    background: var(--bg);
    color: var(--ink);
    display: grid;
    place-items: center;
    padding: 0;
  }

  .actions button + button {
    border-left: 1px solid var(--line);
  }

  .actions button:focus-visible {
    outline-offset: -3px;
  }

  .actions button:active {
    background: var(--surface);
  }
</style>
