<script lang="ts">
  import FileButton from '../components/FileButton.svelte';
  import Icon from '../components/Icon.svelte';
  import OptionsSheet from '../components/OptionsSheet.svelte';
  import PageCard from '../components/PageCard.svelte';
  import type { PdfOptions } from '../lib/core/options';
  import type { Messages } from '../lib/i18n';
  import { prefs } from '../lib/state/preferences.svelte';
  import { session } from '../lib/state/session.svelte';
  import { plural } from '../lib/text';

  let { t }: { t: Messages } = $props();

  let sheetOpen = $state(false);

  const summary = $derived(
    [
      { a4: t.options.sizeA4, letter: t.options.sizeLetter, original: t.options.sizeOriginal }[
        prefs.pdf.pageSize
      ],
      { high: t.options.qualityHigh, medium: t.options.qualityMedium, low: t.options.qualityLow }[
        prefs.pdf.quality
      ],
      prefs.pdf.margin ? t.arrange.withMargin : t.arrange.noMargin,
    ].join(' · '),
  );

  function applyOptions(options: PdfOptions, fileName: string): void {
    prefs.pdf = options;
    prefs.save();
    session.fileName = fileName;
  }

  // ── Arrastar para reordenar ──────────────────────────────────────────────
  // No toque, é preciso segurar um instante: assim rolar a lista continua
  // funcionando. Com o mouse, basta arrastar. A ordem só muda ao soltar.

  /** Tempo segurando até o toque virar arrasto. */
  const HOLD_MS = 280;
  /** Movimento tolerado antes de decidir (px). */
  const SLOP = 8;
  /** Faixas, em cima e embaixo, que rolam a tela durante o arrasto (px). */
  const EDGE_TOP = 72;
  const EDGE_BOTTOM = 190;
  const SCROLL_STEP = 10;

  interface Box {
    left: number;
    top: number;
    right: number;
    bottom: number;
  }

  interface Grab {
    pointerId: number;
    mouse: boolean;
    element: HTMLElement;
    id: number;
    index: number;
    startX: number;
    startY: number;
    x: number;
    y: number;
    startScroll: number;
    timer: ReturnType<typeof setTimeout> | undefined;
    frame: number;
    /** Posição de cada cartão na página, medida ao começar o arrasto. */
    boxes: Box[];
  }

  let grid = $state<HTMLUListElement>();
  let drag = $state<{ id: number; from: number; to: number; x: number; y: number } | null>(null);
  let grab: Grab | null = null;

  function onGrab(event: PointerEvent, id: number, index: number): void {
    if (event.button !== 0 || grab) return;
    const mouse = event.pointerType === 'mouse';
    grab = {
      pointerId: event.pointerId,
      mouse,
      element: event.currentTarget as HTMLElement,
      id,
      index,
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      startScroll: window.scrollY,
      timer: mouse ? undefined : setTimeout(activate, HOLD_MS),
      frame: 0,
      boxes: [],
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', release);
  }

  function activate(): void {
    if (!grab || !grid) return;
    grab.boxes = Array.from(grid.children, (card) => {
      const rect = card.getBoundingClientRect();
      return {
        left: rect.left + window.scrollX,
        top: rect.top + window.scrollY,
        right: rect.right + window.scrollX,
        bottom: rect.bottom + window.scrollY,
      };
    });
    drag = { id: grab.id, from: grab.index, to: grab.index, x: 0, y: 0 };
    try {
      grab.element.setPointerCapture(grab.pointerId);
    } catch {
      // O ponteiro já foi solto: o pointerup encerra o arrasto.
    }
    if (!grab.mouse) navigator.vibrate?.(12);
    grab.frame = requestAnimationFrame(autoScroll);
  }

  function track(): void {
    if (!grab || !drag) return;
    const pageX = grab.x + window.scrollX;
    const pageY = grab.y + window.scrollY;
    const over = grab.boxes.findIndex(
      (box) => pageX >= box.left && pageX <= box.right && pageY >= box.top && pageY <= box.bottom,
    );
    drag = {
      ...drag,
      to: over >= 0 ? over : drag.to,
      x: grab.x - grab.startX,
      y: grab.y - grab.startY + (window.scrollY - grab.startScroll),
    };
  }

  function autoScroll(): void {
    if (!grab || !drag) return;
    const step =
      grab.y < EDGE_TOP
        ? -SCROLL_STEP
        : grab.y > window.innerHeight - EDGE_BOTTOM
          ? SCROLL_STEP
          : 0;
    if (step !== 0) {
      window.scrollBy(0, step);
      track();
    }
    grab.frame = requestAnimationFrame(autoScroll);
  }

  function onMove(event: PointerEvent): void {
    if (!grab || event.pointerId !== grab.pointerId) return;
    grab.x = event.clientX;
    grab.y = event.clientY;
    if (drag) {
      track();
    } else if (Math.hypot(grab.x - grab.startX, grab.y - grab.startY) > SLOP) {
      // Mouse: começou a arrastar. Toque: o dedo andou antes do tempo, é rolagem.
      if (grab.mouse) activate();
      else release();
    }
  }

  function onUp(event: PointerEvent): void {
    if (!grab || event.pointerId !== grab.pointerId) return;
    if (drag && drag.to !== drag.from) session.move(drag.from, drag.to);
    release();
  }

  function release(): void {
    if (grab) {
      clearTimeout(grab.timer);
      cancelAnimationFrame(grab.frame);
    }
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', release);
    grab = null;
    drag = null;
  }

  $effect(() => {
    const element = grid;
    if (!element) return;
    // Enquanto arrasta, o dedo move o cartão e não a tela.
    const block = (event: TouchEvent): void => {
      if (grab?.boxes.length && event.cancelable) event.preventDefault();
    };
    element.addEventListener('touchmove', block, { passive: false });
    return () => {
      element.removeEventListener('touchmove', block);
      release();
    };
  });
</script>

<main class="screen arrange">
  <header class="topbar">
    <button
      class="icon-btn"
      type="button"
      aria-label={t.common.back}
      onclick={() => session.back()}
    >
      <Icon name="back" stroke={2} />
    </button>
    <div class="title">
      <h1>{t.arrange.title}</h1>
      <span>{plural(session.pages.length, t.arrange.countOne, t.arrange.countMany)}</span>
    </div>
    <FileButton class="btn add" onfiles={(files) => session.addFiles(files)}>
      <Icon name="plus" size={18} stroke={2} />
      {t.arrange.add}
    </FileButton>
  </header>

  <p class="hint">
    <Icon name="move" size={16} stroke={2} />
    {t.arrange.hint}
  </p>

  <ul class="grid" bind:this={grid}>
    {#each session.pages as page, index (page.id)}
      <PageCard
        {page}
        {t}
        number={index + 1}
        dragging={drag?.id === page.id}
        target={drag !== null && drag.to === index && drag.from !== index}
        offset={drag?.id === page.id ? drag : null}
        ongrab={(event) => onGrab(event, page.id, index)}
        onstep={(delta) => session.move(index, index + delta)}
        onrotate={() => session.rotate(page.id)}
        onremove={() => session.remove(page.id)}
      />
    {/each}
  </ul>

  <footer class="actions">
    <button class="summary" type="button" onclick={() => (sheetOpen = true)}>
      <Icon name="sliders" size={18} />
      <span>{summary}</span>
      <Icon name="forward" size={18} stroke={2} />
    </button>
    <button class="btn primary" type="button" onclick={() => session.generate()}>
      <Icon name="doc" stroke={2} />
      {t.arrange.generate}
    </button>
  </footer>
</main>

<OptionsSheet
  bind:open={sheetOpen}
  {t}
  options={prefs.pdf}
  fileName={session.fileName}
  onapply={applyOptions}
/>

<style>
  .arrange {
    padding-bottom: 0;
    gap: 12px;
  }

  .topbar {
    gap: 8px;
  }

  .title {
    flex: 1;
    min-width: 0;
    padding-left: 4px;
    display: flex;
    flex-direction: column;
    font-size: 13px;
    font-weight: 600;
    color: var(--muted);
  }

  .title h1 {
    color: var(--ink);
  }

  .arrange :global(.btn.add) {
    width: auto;
    min-height: var(--tap);
    border-radius: 12px;
    padding: 0 14px;
    gap: 6px;
    font-size: 15px;
  }

  .hint {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--muted);
    font-size: 14px;
  }

  .grid {
    list-style: none;
    margin: 0 0 8px;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  .actions {
    position: sticky;
    bottom: 0;
    z-index: 10;
    margin: auto calc(var(--gutter) * -1) 0;
    padding: 14px var(--gutter) max(24px, env(safe-area-inset-bottom));
    border-top: 1px solid var(--line);
    background: var(--bg);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .summary {
    min-height: 48px;
    border-radius: 12px;
    border: 1px solid var(--line);
    background: var(--surface);
    padding: 0 14px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 15px;
    font-weight: 600;
    text-align: left;
  }

  .summary span {
    flex: 1;
  }
</style>
