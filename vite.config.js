import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  plugins: [svelte()],
  server: {
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: false,
      ignored: [
        // Ignore all Blender build/source directories
        "source/**",
        "intern/**",
        "extern/**",
        "build_files/**",
        "tests/**",
        "tools/**",
        "release/**",
        "scripts/**",
        "doc/**",
        "locale/**",
        "lib/**",
        "plugins/**",
      ],
    },
  },
});
