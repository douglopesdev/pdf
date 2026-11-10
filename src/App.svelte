<script lang="ts">
  import { messages, resolveLang } from './lib/i18n';
  import { prefs } from './lib/state/preferences.svelte';
  import Home from './screens/Home.svelte';

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
</script>

<Home {t} />
