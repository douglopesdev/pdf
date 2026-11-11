<script lang="ts" module>
  // Ícones de traço, desenhados em uma grade de 24 × 24.
  // 'p' = path (d), 'c' = círculo (cx, cy, r), 'r' = retângulo (x, y, w, h, rx).
  type Shape =
    | readonly ['p', string]
    | readonly ['c', number, number, number]
    | readonly ['r', number, number, number, number, number];

  const ICONS = {
    doc: [
      ['p', 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z'],
      ['p', 'M14 3v5h5'],
      ['p', 'M9 14l2 2 4-4'],
    ],
    gear: [
      ['c', 12, 12, 3],
      [
        'p',
        'M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
      ],
    ],
    image: [
      ['r', 3, 3, 18, 18, 3],
      ['c', 9, 9, 2],
      ['p', 'M21 15l-5-5L5 21'],
    ],
    plus: [
      ['p', 'M12 5v14'],
      ['p', 'M5 12h14'],
    ],
    camera: [
      ['p', 'M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z'],
      ['c', 12, 13.5, 3.5],
    ],
    share: [
      ['c', 18, 5, 3],
      ['c', 6, 12, 3],
      ['c', 18, 19, 3],
      ['p', 'M8.6 13.5l6.8 4'],
      ['p', 'M15.4 6.5l-6.8 4'],
    ],
    lock: [
      ['r', 5, 11, 14, 10, 2],
      ['p', 'M8 11V7a4 4 0 0 1 8 0v4'],
    ],
    back: [['p', 'M15 18l-6-6 6-6']],
    forward: [['p', 'M9 18l6-6-6-6']],
    move: [
      ['p', 'M5 9l-3 3 3 3'],
      ['p', 'M9 5l3-3 3 3'],
      ['p', 'M15 19l-3 3-3-3'],
      ['p', 'M19 9l3 3-3 3'],
      ['p', 'M2 12h20'],
      ['p', 'M12 2v20'],
    ],
    rotate: [
      ['p', 'M21 12a9 9 0 1 1-3-6.7'],
      ['p', 'M21 3v6h-6'],
    ],
    trash: [
      ['p', 'M4 7h16'],
      ['p', 'M10 11v6'],
      ['p', 'M14 11v6'],
      ['p', 'M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13'],
      ['p', 'M9 7V4h6v3'],
    ],
    sliders: [
      ['p', 'M4 6h10'],
      ['p', 'M18 6h2'],
      ['c', 16, 6, 2],
      ['p', 'M4 12h2'],
      ['p', 'M10 12h10'],
      ['c', 8, 12, 2],
      ['p', 'M4 18h12'],
      ['c', 18, 18, 2],
    ],
    close: [
      ['p', 'M6 6l12 12'],
      ['p', 'M18 6L6 18'],
    ],
    check: [['p', 'M5 12l5 5 9-10']],
    shield: [
      ['p', 'M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z'],
      ['p', 'M9 12l2 2 4-4'],
    ],
    download: [
      ['p', 'M12 4v11'],
      ['p', 'M7 10l5 5 5-5'],
      ['p', 'M5 20h14'],
    ],
    info: [
      ['c', 12, 12, 9],
      ['p', 'M12 8v5'],
      ['p', 'M12 16h0'],
    ],
    phone: [
      ['r', 6, 2, 12, 20, 2.5],
      ['p', 'M11 18h2'],
    ],
    phoneCheck: [
      ['r', 6, 2, 12, 20, 2.5],
      ['p', 'M9.5 11.5l2 2 3-3.5'],
    ],
    sun: [
      ['c', 12, 12, 4],
      ['p', 'M12 2v2'],
      ['p', 'M12 20v2'],
      ['p', 'M4.9 4.9l1.4 1.4'],
      ['p', 'M17.7 17.7l1.4 1.4'],
      ['p', 'M2 12h2'],
      ['p', 'M20 12h2'],
      ['p', 'M4.9 19.1l1.4-1.4'],
      ['p', 'M17.7 6.3l1.4-1.4'],
    ],
    moon: [['p', 'M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z']],
  } as const satisfies Record<string, readonly Shape[]>;

  export type IconName = keyof typeof ICONS;
</script>

<script lang="ts">
  let {
    name,
    size = 20,
    stroke = 1.9,
  }: { name: IconName; size?: number; stroke?: number } = $props();

  const shapes = $derived<readonly Shape[]>(ICONS[name]);
</script>

<svg
  viewBox="0 0 24 24"
  width={size}
  height={size}
  fill="none"
  stroke="currentColor"
  stroke-width={stroke}
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  {#each shapes as shape, i (i)}
    {#if shape[0] === 'p'}
      <path d={shape[1]} />
    {:else if shape[0] === 'c'}
      <circle cx={shape[1]} cy={shape[2]} r={shape[3]} />
    {:else}
      <rect x={shape[1]} y={shape[2]} width={shape[3]} height={shape[4]} rx={shape[5]} />
    {/if}
  {/each}
</svg>

<style>
  svg {
    flex-shrink: 0;
    display: block;
  }
</style>
