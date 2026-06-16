import { defineConfig } from "vite";

// base must match the GitHub Pages repo path: https://mphinance.github.io/traderdaddy-bridge/
export default defineConfig({
  base: "/traderdaddy-bridge/",
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
