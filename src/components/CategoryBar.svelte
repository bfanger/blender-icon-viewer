<script lang="ts">
  type Props = {
    categories: string[];
    activeCategory: string | null;
    onCategorySelect: (cat: string | null) => void;
  };

  let { categories, activeCategory, onCategorySelect }: Props = $props();
</script>

<div class="category-bar">
  <button
    class="category-btn{activeCategory === null ? ' active' : ''}"
    onclick={() => onCategorySelect(null)}>All</button
  >
  {#each categories as cat}
    <button
      class="category-btn{activeCategory === cat ? ' active' : ''}"
      onclick={() => onCategorySelect(cat)}>{cat}</button
    >
  {/each}
</div>

<style>
  .category-bar {
    padding: 10px 24px;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    overflow-x: auto;
  }

  .category-btn {
    padding: 4px 12px;
    border-radius: 16px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--text-dim);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }

  .category-btn:hover {
    background: var(--bg);
    color: var(--text);
  }

  .category-btn.active {
    background: var(--accent);
    color: #fff;
    border-color: var(--accent);
  }

  @media (max-width: 600px) {
    .category-bar {
      padding: 8px 16px;
    }
  }
</style>
