<script lang="ts">
  import { onMount } from 'svelte';
  import Toast from './components/Toast.svelte';
  import UpdateBanner from './components/UpdateBanner.svelte';
  import { MAX_IMAGES } from './lib/core/options';
  import { messages, resolveLang } from './lib/i18n';
  import { takeSharedFiles } from './lib/platform/share-target';
  import { prefs } from './lib/state/preferences.svelte';
  import { session, type ToastKind } from './lib/state/session.svelte';
  import { appUpdate } from './lib/state/update.svelte';
  import { fill } from './lib/text';
  import Arrange from './screens/Arrange.svelte';
  import Done from './screens/Done.svelte';
  import Generating from './screens/Generating.svelte';
  import Home from './screens/Home.svelte';
  import Settings from './screens/Settings.svelte';

  const lang = $derived(resolveLang(prefs.lang, navigator.languages));
  const t = $derived(messages(lang));

  $effect(() => {
    document.documentElement.lang = lang;
  });

  $effect(() => {
    const root = document.documentElement;
    if (prefs.theme === 'auto') delete root.dataset.theme;
    else root.dataset.theme = prefs.theme;
  });

  onMount(() => {
    appUpdate.start();
    // Aberto pelo Compartilhar da galeria: as imagens já vêm escolhidas.
    void takeSharedFiles().then((files) => {
      if (files.length > 0) session.addFiles(files);
    });
  });

  const toastText = $derived.by(() => {
    const kind: ToastKind | null = session.toast;
    if (!kind) return null;
    return {
      limit: fill(t.toast.limit, { n: MAX_IMAGES }),
      'no-images': t.toast.noImages,
      heic: t.toast.heic,
      failed: t.toast.failed,
      'share-failed': t.toast.shareFailed,
    }[kind];
  });

  // Cada troca de tela começa do topo.
  $effect(() => {
    void session.screen;
    window.scrollTo(0, 0);
  });

  // ── Botão Voltar do Android ──────────────────────────────────────────────
  // Fora do início, o app mantém uma entrada no histórico. Assim o Voltar do
  // telefone volta uma tela em vez de fechar o app e perder as páginas.
  let pushed = false;
  let ignorePop = false;

  $effect(() => {
    const away = session.screen !== 'home';
    if (away && !pushed) {
      history.pushState({ pdf: true }, '');
      pushed = true;
    } else if (!away && pushed) {
      // Voltou ao início por um botão do app: desfaz a entrada.
      pushed = false;
      ignorePop = true;
      history.back();
    }
  });

  function onpopstate(): void {
    if (ignorePop) {
      ignorePop = false;
      return;
    }
    pushed = false;
    session.back();
  }

  // Sair com páginas escolhidas ou PDF pronto pede confirmação ao navegador.
  function onbeforeunload(event: BeforeUnloadEvent): void {
    if (session.pages.length > 0) event.preventDefault();
  }
</script>

<svelte:window {onpopstate} {onbeforeunload} />

{#if session.screen === 'arrange'}
  <Arrange {t} />
{:else if session.screen === 'generating'}
  <Generating
    {t}
    page={session.progress.page}
    total={session.progress.total}
    oncancel={() => session.cancel()}
  />
{:else if session.screen === 'done' && session.result}
  <Done
    {t}
    {lang}
    result={session.result}
    onclose={() => session.reset()}
    onretrylow={() => session.retryLow()}
    onsharefailed={() => (session.toast = 'share-failed')}
  />
{:else if session.screen === 'settings'}
  <Settings {t} {lang} onback={() => session.back()} />
{:else}
  <Home
    {t}
    onfiles={(files) => session.addFiles(files)}
    onsettings={() => (session.screen = 'settings')}
  />
{/if}

<!-- Só no início: atualizar recarrega a página e perderia as páginas escolhidas. -->
{#if appUpdate.available && session.screen === 'home'}
  <UpdateBanner {t} onapply={() => appUpdate.apply()} onclose={() => appUpdate.dismiss()} />
{/if}

<Toast message={toastText} onclose={() => (session.toast = null)} />
