<script lang="ts">
  import FileButton from '../components/FileButton.svelte';
  import Icon from '../components/Icon.svelte';
  import type { Messages } from '../lib/i18n';

  let {
    t,
    onfiles,
    onsettings,
  }: { t: Messages; onfiles: (files: File[]) => void; onsettings: () => void } = $props();

  const formats = ['JPG', 'PNG', 'WEBP', 'GIF', 'BMP', 'AVIF'];
</script>

<main class="screen">
  <header class="topbar bar">
    <div class="brand">
      <span class="logo"><Icon name="doc" stroke={2} /></span>
      <span class="name">{t.app.name}</span>
    </div>
    <button class="icon-btn" type="button" aria-label={t.home.settings} onclick={onsettings}>
      <Icon name="gear" stroke={1.8} />
    </button>
  </header>

  <section class="intro">
    <h1>{t.home.title}</h1>
    <p>{t.home.subtitle}</p>
  </section>

  <section class="drop">
    <span class="drop-icon"><Icon name="image" size={26} stroke={1.8} /></span>
    <p>{t.home.dropHint}</p>
    <FileButton class="btn primary" {onfiles}>
      <Icon name="plus" stroke={2} />
      {t.home.gallery}
    </FileButton>
    <FileButton camera {onfiles}>
      <Icon name="camera" stroke={1.8} />
      {t.home.camera}
    </FileButton>
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
    <span class="tip-icon"><Icon name="share" size={18} stroke={1.8} /></span>
    <div>
      <strong>{t.home.tipTitle}</strong>
      <p>{t.home.tip}</p>
    </div>
  </section>

  <footer class="foot">
    <Icon name="lock" size={15} stroke={2} />
    {t.home.footer}
  </footer>
</main>

<style>
  .bar {
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

  .name {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 19px;
    letter-spacing: -0.01em;
  }

  .intro h1 {
    margin-bottom: 8px;
    font-size: clamp(26px, 8vw, 30px);
    line-height: 1.12;
    letter-spacing: -0.02em;
  }

  .intro p {
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
    margin-top: 2px;
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
</style>
