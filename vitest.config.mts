import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      // Matches tsconfig.json's "@/*" -> "./*" path mapping.
      "@": path.resolve(import.meta.dirname, "."),
      // "server-only" just throws when imported outside a Next.js build
      // (see node_modules/server-only) — it's a dev-time guard against
      // importing server code from a client bundle, not something a
      // unit test needs enforced, so it's stubbed to a no-op here.
      "server-only": path.resolve(import.meta.dirname, "test/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**"],
  },
});
