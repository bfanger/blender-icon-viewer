<script lang="ts">
  import { fade } from "svelte/transition";

  type Icon = {
    name: string;
    category: string;
    enum_name?: string;
  };

  type Props = { icon: Icon };

  let { icon }: Props = $props();
  let hover = $state(false);
  let copied = $state(false);
  let timeout: ReturnType<typeof setTimeout>;

  async function handleClick() {
    const res = await fetch(`/svgo/${icon.name}.svg`);
    if (!res.ok) {
      throw new Error("HTTP " + res.status);
    }
    const text = await res.text();
    await navigator.clipboard.writeText(text);
    copied = true;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      copied = false;
    }, 200);
  }
</script>

<button
  class="icon-cell"
  data-name={icon.name}
  onclick={handleClick}
  onmouseenter={() => {
    hover = true;
  }}
  onmouseleave={() => {
    hover = false;
  }}
>
  <div class="image">
    <img
      class="svg"
      src="/svgo/{icon.name}.svg"
      loading="lazy"
      alt={icon.name}
    />
    {#if icon.name.includes(".")}
      <img
        class="original"
        src="/icons/{icon.name}.png"
        loading="lazy"
        alt={icon.name}
      />
    {:else}
      <img
        class="original"
        src="/icons/{icon.name}.svg"
        loading="lazy"
        alt={icon.name}
      />
    {/if}
  </div>
  <div class="name">{icon.name}</div>
  {#if icon.enum_name}
    <div class="enum-name">{icon.enum_name}</div>
  {/if}
  {#if copied}
    <div class="copied-toast" out:fade>Saved to clipboard</div>
  {/if}
</button>

<style>
  .icon-cell {
    appearance: none;
    border: none;
    background: var(--bg);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 16px 8px 10px;
    transition: background 0.15s;
    position: relative;
  }

  .icon-cell:hover {
    background: var(--surface-hover);
  }

  .icon-cell .image {
    width: 48px;
    height: 48px;
    position: relative;
  }

  .svg {
    width: 48px;
    height: 48px;
  }
  .icon-cell:hover .svg:has(+ .original) {
    opacity: 0;
  }

  .original {
    position: absolute;
    inset: 0;
    width: 48px;
    height: 48px;
    opacity: 0;
  }
  .icon-cell:hover .original {
    opacity: 1;
  }

  .icon-cell .name {
    font-size: 10px;
    color: var(--text-dim);
    margin-top: 6px;
    text-align: center;
    word-break: break-word;
    line-height: 1.3;
    max-height: 2.6em;
    overflow: hidden;
  }

  .icon-cell .enum-name {
    font-size: 9px;
    color: var(--accent-dim);
    margin-top: 2px;
    font-family: monospace;
  }

  .icon-cell .copied-toast {
    position: absolute;
    inset: 0;
    font-size: 13px;
    background: var(--bg);
    color: var(--accent-dim);
    pointer-events: none;
    padding-top: 40px;
    text-align: center;
  }
</style>
