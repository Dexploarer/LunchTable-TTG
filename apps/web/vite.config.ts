import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import path from "path";

export default defineConfig(({ mode }) => {
  const repoRoot = path.resolve(__dirname, "../..");
  const rootEnv = loadEnv(mode, repoRoot, "");
  const webEnv = loadEnv(mode, __dirname, "");
  const mergedEnv = { ...rootEnv, ...webEnv };

  // Convex CLI writes `CONVEX_URL` into the repo root `.env.local`, but Vite only
  // exposes variables with `VITE_` prefix to `import.meta.env`.
  // Map `CONVEX_URL` -> `VITE_CONVEX_URL` to make `bun run dev` work out-of-box.
  if (!process.env.VITE_CONVEX_URL) {
    const convexUrl = (mergedEnv.CONVEX_URL ?? process.env.CONVEX_URL ?? "").trim();
    if (convexUrl) {
      process.env.VITE_CONVEX_URL = convexUrl;
    }
  }

  // Allow colocating `VITE_*` env vars at repo root (monorepo-friendly).
  for (const [key, value] of Object.entries(mergedEnv)) {
    if (!key.startsWith("VITE_")) continue;
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }

  return {
    build: {
      sourcemap: true,
      chunkSizeWarningLimit: 3000,
      rollupOptions: {
        onwarn(warning, warn) {
          const message = typeof warning === "string" ? warning : warning.message;

          if (
            message.includes("contains an annotation that Rollup cannot interpret due to the position of the comment")
          ) {
            return;
          }

          warn(warning);
        },
        output: {
          manualChunks: {
            "vendor-react": ["react", "react-dom", "react-router"],
            "vendor-sentry": ["@sentry/react"],
            "vendor-motion": ["framer-motion"],
            "vendor-privy": ["@privy-io/react-auth"],
          },
        },
      },
    },
    plugins: [
      react(),
      tailwindcss(),
      sentryVitePlugin({
        org: "lunchtable",
        project: "lunchtable",
        authToken: process.env.SENTRY_AUTH_TOKEN,
        silent: true, // Suppress verbose logs
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@convex-generated-api": path.resolve(__dirname, "../../convex/_generated/api.js"),
      },
    },
    server: {
      port: 3334,
    },
  };
});
