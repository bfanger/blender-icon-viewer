<script lang="ts">
  import copyMode from "../services/copyMode.svelte";
</script>

<div class="toggle">
  <div class="label">Copy mode</div>
  <div class="switch">
    <button
      class="switch-option"
      class:active={copyMode.value === "svg"}
      onclick={() => {
        copyMode.value = "svg";
      }}
    >
      SVG
    </button>
    <button
      class="switch-option"
      class:active={copyMode.value === "json"}
      onclick={() => {
        copyMode.value = "json";
      }}
    >
      JSON
    </button>
  </div>
</div>

<style>
  .toggle {
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: var(--surface);
    gap: 4px;
  }
  .label {
    font-size: 12px;
    color: var(--text-dim);
    white-space: nowrap;
  }
  .switch {
    display: flex;
    align-items: center;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 3px;
    gap: 2px;
  }
  .switch-option {
    appearance: none;
    border: none;
    color: var(--accent);
    background: var(--surface);
    font-weight: 600;
    border-radius: 10px;
    padding: 1px 4px;
    font-size: 11px;

    &:hover {
      color: #fff;
    }
    &.active {
      background: var(--accent);
      color: var(--surface);
    }
  }
</style>
