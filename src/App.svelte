<script lang="ts">
  import manifest from "../icon-manifest.json" with { type: "json" };
  import Header from "./components/Header.svelte";
  import CategoryBar from "./components/CategoryBar.svelte";
  import IconGrid from "./components/IconGrid.svelte";
  import SvgJsonToggle from "./components/SvgJsonToggle.svelte";

  type Icon = {
    name: string;
    category: string;
    enum_name?: string;
  };

  type Manifest = {
    icons: Icon[];
    categories: string[];
    totalCount: number;
  };

  const typedManifest = manifest as Manifest;

  let activeCategory = $state<string | null>(null);
  let searchQuery = $state("");

  const allCategories = typedManifest.categories;

  let filteredIcons = $derived.by((): Icon[] => {
    let icons = typedManifest.icons;

    if (activeCategory) {
      icons = icons.filter((i) => i.category === activeCategory);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      icons = icons.filter(
        (i) =>
          i.name.includes(q) ||
          (i.enum_name && i.enum_name.toLowerCase().includes(q)),
      );
    }

    return icons;
  });

  // Debounced search
  let debounceTimer: ReturnType<typeof setTimeout>;
  function handleSearchInput(e: Event) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      searchQuery = (e.target as HTMLInputElement).value.trim();
    }, 150);
  }
</script>

<Header
  filteredIconsCount={filteredIcons.length}
  totalCount={typedManifest.totalCount}
  onSearchInput={handleSearchInput}
/>
<div class="filters">
  <CategoryBar
    categories={allCategories}
    {activeCategory}
    onCategorySelect={(cat: string | null) => {
      activeCategory = cat;
    }}
  />
  <SvgJsonToggle />
</div>

<IconGrid icons={filteredIcons} />

<style>
  :global(*, *::before, *::after) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :root {
    --bg: #1d1d1d;
    --surface: #2d2d2d;
    --surface-hover: #3d3d3d;
    --border: #3d3d3d;
    --text: #e0e0e0;
    --text-dim: #888;
    --accent: #ef9a3e;
    --accent-dim: #d8882d;
  }

  :global(body) {
    font-family:
      -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: var(--border);
    color: var(--text);
    min-height: 100vh;
  }
  .filters {
    display: flex;
  }
</style>
