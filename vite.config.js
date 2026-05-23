import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const enableSentrySourceMaps = Boolean(
    env.SENTRY_AUTH_TOKEN &&
    env.SENTRY_ORG &&
    env.SENTRY_PROJECT
  );

  return {
    plugins: [
      react(),
      enableSentrySourceMaps
        ? sentryVitePlugin({
            org: env.SENTRY_ORG,
            project: env.SENTRY_PROJECT,
            authToken: env.SENTRY_AUTH_TOKEN,
            telemetry: false,
          })
        : null,
    ].filter(Boolean),
    build: {
      sourcemap: enableSentrySourceMaps ? "hidden" : false,
    },
    server: {
      port: 5173,
      strictPort: true,
      hmr: env.VITE_ENABLE_HMR === "true" ? { port: 5173 } : false,
    },
  };
});
