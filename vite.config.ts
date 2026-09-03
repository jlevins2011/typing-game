import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Project site: https://jlevins2011.github.io/typing-game/
  base: process.env.GITHUB_PAGES === "true" ? "/typing-game/" : "/",
  test: {
    environment: "jsdom",
    globals: false,
  },
});
