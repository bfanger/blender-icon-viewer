<script lang="ts">
  import IconCell from "./IconCell.svelte";

  type Icon = {
    name: string;
    category: string;
    enum_name?: string;
  };

  type Props = { icons: Icon[] };

  let { icons }: Props = $props();
</script>

<div class="grid">
  {#each icons as icon}
    <IconCell {icon} />
  {/each}
  {#if icons.length === 0}
    <div class="empty-state">
      <h2>No icons found</h2>
      <p>Try a different search or category</p>
    </div>
  {/if}
</div>

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 1px;
    background: var(--border);
    padding: 1px;
  }

  .empty-state {
    text-align: center;
    padding: 60px 20px;
    color: var(--text-dim);
  }

  .empty-state h2 {
    font-size: 18px;
    margin-bottom: 8px;
  }

  @media (max-width: 600px) {
    .grid {
      grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
    }
  }
</style>
