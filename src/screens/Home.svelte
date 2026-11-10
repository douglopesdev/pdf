<script lang="ts">
  import type { Messages } from '../lib/i18n';

  let { t }: { t: Messages } = $props();

  const formats = ['JPG', 'PNG', 'WEBP', 'GIF', 'BMP', 'AVIF'];
</script>

<main class="screen">
  <header class="bar">
    <div class="brand">
      <span class="logo" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
          <path d="M14 3v5h5" />
          <path d="M9 14l2 2 4-4" />
        </svg>
      </span>
      <span class="name">{t.app.name}</span>
      <span class="badge">{t.app.building}</span>
    </div>
    <button class="icon-btn" type="button" aria-label={t.home.settings} disabled>
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path
          d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"
        />
      </svg>
    </button>
  </header>

  <section class="intro">
    <h1>{t.home.title}</h1>
    <p>{t.home.subtitle}</p>
  </section>

  <section class="drop">
    <span class="drop-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="26" height="26">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <circle cx="9" cy="9" r="2" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
    </span>
    <p>{t.home.dropHint}</p>
    <button class="btn primary" type="button" disabled>
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
      {t.home.gallery}
    </button>
    <button class="btn secondary" type="button" disabled>
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path
          d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"
        />
        <circle cx="12" cy="13.5" r="3.5" />
      </svg>
      {t.home.camera}
    </button>
  </section>

  <section class="formats">
    <span class="label">{t.home.formats}</span>
    <ul>
      {#each formats as f (f)}
        <li>{f}</li>
      {/each}
    </ul>
  </section>

  <section class="tip">
    <span class="tip-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="18" height="18">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="M8.6 13.5l6.8 4" />
        <path d="M15.4 6.5l-6.8 4" />
      </svg>
    </span>
    <div>
      <strong>{t.home.tipTitle}</strong>
      <p>{t.home.tip}</p>
    </div>
  </section>

  <footer class="foot">
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
    {t.home.footer}
  </footer>
</main>

<style>
  .screen {
    flex: 1;
    width: 100%;
    max-width: 520px;
    margin: 0 auto;
    padding: max(20px, env(safe-area-inset-top)) var(--gutter)
      max(24px, env(safe-area-inset-bottom));
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  svg {
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .logo {
    width: 36px;
    height: 36px;
    border-radius: var(--radius-sm);
    background: var(--btn);
    color: var(--btn-ink);
    display: grid;
    place-items: center;
  }

  .logo svg {
    stroke-width: 2;
  }

  .name {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 19px;
  }

  .badge {
    font-size: 12px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 999px;
    border: 1px solid var(--line-strong);
    color: var(--muted);
  }

  .icon-btn {
    width: var(--tap);
    height: var(--tap);
    border-radius: 12px;
    border: 1px solid var(--line);
    background: var(--bg);
    display: grid;
    place-items: center;
    padding: 0;
  }

  .intro h1 {
    margin: 0 0 8px;
    font-size: clamp(26px, 8vw, 32px);
    line-height: 1.12;
    letter-spacing: -0.02em;
  }

  .intro p {
    margin: 0;
    color: var(--muted);
  }

  .drop {
    border: 1.5px dashed var(--line-strong);
    border-radius: var(--radius-lg);
    background: var(--surface);
    padding: 22px 18px 18px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
  }

  .drop > p {
    margin: 0;
    color: var(--muted);
    font-size: 15px;
    text-align: center;
  }

  .drop-icon {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    background: var(--bg);
    border: 1px solid var(--line);
    display: grid;
    place-items: center;
  }

  .btn {
    width: 100%;
    min-height: 52px;
    border-radius: var(--radius);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-weight: 700;
    font-size: 16px;
  }

  .btn:disabled,
  .icon-btn:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .primary {
    min-height: 56px;
    font-size: 17px;
    border: none;
    background: var(--btn);
    color: var(--btn-ink);
  }

  .primary svg {
    stroke-width: 2;
  }

  .secondary {
    border: 1px solid var(--line-strong);
    background: var(--bg);
  }

  .formats {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .label {
    font-size: 13px;
    font-weight: 600;
    color: var(--muted);
  }

  .formats ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .formats li {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.02em;
    padding: 5px 9px;
    border-radius: 8px;
    border: 1px solid var(--line);
  }

  .tip {
    padding: 14px 16px;
    border-radius: 16px;
    border: 1px solid var(--line);
    display: flex;
    gap: 12px;
    align-items: flex-start;
  }

  .tip-icon {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    border-radius: var(--radius-sm);
    background: var(--surface);
    display: grid;
    place-items: center;
  }

  .tip strong {
    font-size: 15px;
  }

  .tip p {
    margin: 2px 0 0;
    font-size: 14px;
    line-height: 1.45;
    color: var(--muted);
  }

  .foot {
    margin-top: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: var(--muted);
    font-size: 13px;
    font-weight: 600;
    text-align: center;
  }

  .foot svg {
    flex-shrink: 0;
    stroke-width: 2;
  }
</style>
