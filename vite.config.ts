import vinext from "vinext";
import { defineConfig } from "vite";
import { exactFontSize } from "./tools/exact-font-size";

export default defineConfig(async () => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    // Pre-bundling would skip the transform below in development.
    optimizeDeps: { exclude: ["html-to-image"] },
    plugins: [
      exactFontSize(),
      vinext(),
      // A static, on-device tool: the Worker needs no bindings (no D1, R2, KV or image service).
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        config: { main: "./worker/index.ts", compatibility_flags: ["nodejs_compat"] },
      }),
    ],
  };
});
