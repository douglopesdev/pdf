<script lang="ts" generics="T extends string">
  import { ToggleGroup } from 'bits-ui';
  import Icon, { type IconName } from './Icon.svelte';

  let {
    value,
    options,
    label,
    onchange,
  }: {
    value: T;
    options: readonly { value: T; label: string; icon?: IconName }[];
    /** Nome acessível do grupo. */
    label: string;
    onchange: (value: T) => void;
  } = $props();
</script>

<!-- O ToggleGroup deixa desmarcar tudo; aqui sempre fica uma opção escolhida. -->
<ToggleGroup.Root
  type="single"
  class="segmented"
  aria-label={label}
  bind:value={
    () => value,
    (next) => {
      if (next) onchange(next as T);
    }
  }
>
  {#each options as option (option.value)}
    <ToggleGroup.Item value={option.value} class={option.icon ? 'seg tall' : 'seg'}>
      {#if option.icon}<Icon name={option.icon} />{/if}
      {option.label}
    </ToggleGroup.Item>
  {/each}
</ToggleGroup.Root>

<style>
  :global(.segmented) {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: minmax(0, 1fr);
    gap: 4px;
    padding: 4px;
    border-radius: var(--radius);
    background: var(--surface);
  }

  :global(.seg) {
    min-height: var(--tap);
    border-radius: var(--radius-sm);
    border: none;
    background: transparent;
    color: var(--ink);
    font-size: 15px;
    font-weight: 700;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 0 4px;
  }

  :global(.seg.tall) {
    min-height: 64px;
    font-size: 14px;
  }

  :global(.seg[data-state='on']) {
    background: var(--btn);
    color: var(--btn-ink);
  }

  :global(.seg:focus-visible) {
    outline-offset: 0;
  }
</style>
