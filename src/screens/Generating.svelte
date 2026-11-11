<script lang="ts">
  import Icon from '../components/Icon.svelte';
  import type { Messages } from '../lib/i18n';
  import { fill } from '../lib/text';

  let {
    t,
    page,
    total,
    oncancel,
  }: { t: Messages; page: number; total: number; oncancel: () => void } = $props();

  const RADIUS = 76;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  /** Com muitas páginas, os quadradinhos não cabem na tela. */
  const MAX_STEPS = 5;

  const percent = $derived(total > 0 ? Math.round((page / total) * 100) : 0);
  /** A página em que o worker está trabalhando agora. */
  const current = $derived(Math.min(page + 1, total));
  const steps = $derived(total <= MAX_STEPS ? Array.from({ length: total }, (_, i) => i + 1) : []);
</script>

<main class="screen generating">
  <div class="center">
    <div class="ring">
      <svg
        viewBox="0 0 176 176"
        role="img"
        aria-label={fill(t.generating.progress, { n: percent })}
      >
        <circle class="track" cx="88" cy="88" r={RADIUS} />
        <circle
          class="bar"
          cx="88"
          cy="88"
          r={RADIUS}
          stroke-dasharray={CIRCUMFERENCE}
          stroke-dashoffset={CIRCUMFERENCE * (1 - percent / 100)}
          transform="rotate(-90 88 88)"
        />
      </svg>
      <span class="percent" aria-hidden="true">{percent}%</span>
    </div>

    <div class="text">
      <h1>{t.generating.title}</h1>
      <p>{fill(t.generating.step, { page: current, total })}</p>
    </div>

    {#if steps.length > 1}
      <ol class="steps" aria-hidden="true">
        {#each steps as n (n)}
          <li class:done={n <= page} class:current={n === current && n > page}>
            {#if n <= page}<Icon name="check" size={22} stroke={2.4} />{:else}{n}{/if}
          </li>
        {/each}
      </ol>
    {/if}
  </div>

  <p class="privacy">
    <Icon name="shield" size={22} stroke={1.8} />
    {t.generating.privacy}
  </p>
  <button class="btn" type="button" onclick={oncancel}>{t.common.cancel}</button>
</main>

<style>
  .generating {
    gap: 12px;
  }

  .center {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 28px;
    padding: 24px 0;
  }

  .ring {
    position: relative;
    width: 176px;
    height: 176px;
  }

  circle {
    fill: none;
    stroke-width: 10;
  }

  .track {
    stroke: var(--line);
  }

  .bar {
    stroke: var(--ink);
    stroke-linecap: round;
    transition: stroke-dashoffset 0.25s ease-out;
  }

  .percent {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    font-family: var(--font-display);
    font-size: 40px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
  }

  .text {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    text-align: center;
  }

  .text h1 {
    font-size: 24px;
  }

  .text p {
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }

  .steps {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    gap: 12px;
  }

  .steps li {
    width: 54px;
    height: 72px;
    border-radius: 8px;
    border: 1px dashed var(--line-strong);
    color: var(--muted);
    font-size: 15px;
    font-weight: 800;
    display: grid;
    place-items: center;
  }

  .steps li.current {
    border: 2px solid var(--ink);
    color: var(--ink);
  }

  .steps li.done {
    border: 1px solid var(--btn);
    background: var(--btn);
    color: var(--btn-ink);
  }

  .privacy {
    padding: 14px 16px;
    border-radius: 16px;
    background: var(--surface);
    display: flex;
    gap: 12px;
    align-items: center;
    font-size: 14px;
    line-height: 1.45;
    color: var(--muted);
  }
</style>
