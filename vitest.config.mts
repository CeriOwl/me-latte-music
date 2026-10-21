import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // `server-only` throws outside Next's server bundle; tests are server code.
      "server-only": fileURLToPath(new URL("./src/lib/__tests__/empty.ts", import.meta.url)),
    },
  },
  test: { environment: "node", fileParallelism: false },
});
