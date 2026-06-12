<script lang="ts">
  type Props = {
    filteredIconsCount: number;
    totalCount: number;
    onSearchInput: (e: Event) => void;
  };

  let { filteredIconsCount, totalCount, onSearchInput }: Props = $props();
</script>

<header>
  <div class="controls">
    <div class="search-box">
      <input
        type="text"
        placeholder="Search icons…"
        autocomplete="off"
        oninput={onSearchInput}
      />
    </div>
    <span class="stats">{filteredIconsCount} / {totalCount} icons</span>
  </div>
</header>

<style>
  header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    padding: 16px 24px;
  }

  .controls {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    align-items: center;
  }

  .search-box {
    flex: 1;
    min-width: 200px;
    position: relative;
  }

  .search-box input {
    width: 100%;
    padding: 8px 12px 8px 32px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text);
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s;
  }

  .search-box input:focus {
    border-color: var(--accent);
  }

  .search-box::before {
    content: "\26B2";
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-dim);
    font-size: 14px;
    pointer-events: none;
  }

  .stats {
    font-size: 13px;
    color: var(--text-dim);
    white-space: nowrap;
  }

  @media (max-width: 600px) {
    header {
      padding: 12px 16px;
    }
  }
</style>
