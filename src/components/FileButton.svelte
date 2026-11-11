<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    class: className = 'btn',
    camera = false,
    onfiles,
    children,
  }: {
    class?: string;
    /** Abre a câmera traseira em vez da galeria. */
    camera?: boolean;
    onfiles: (files: File[]) => void;
    children: Snippet;
  } = $props();

  function onchange(event: Event & { currentTarget: HTMLInputElement }): void {
    const input = event.currentTarget;
    const files = Array.from(input.files ?? []);
    // Limpa para o mesmo arquivo poder ser escolhido de novo.
    input.value = '';
    if (files.length > 0) onfiles(files);
  }
</script>

<!-- Um <label> com o <input type="file"> dentro: abre o seletor sem JavaScript. -->
<label class={className}>
  <input
    class="visually-hidden"
    type="file"
    accept="image/*"
    multiple={!camera}
    capture={camera ? 'environment' : undefined}
    {onchange}
  />
  {@render children()}
</label>

<style>
  label {
    cursor: pointer;
    position: relative;
  }

  label:focus-within {
    outline: 3px solid var(--ink);
    outline-offset: 2px;
  }
</style>
