import { defineConfig, devices } from "@playwright/test";

const existingServer = process.env.CREA_FIREBASE_E2E_URL;
if (existingServer && !["localhost", "127.0.0.1", "[::1]"].includes(new URL(existingServer).hostname)) {
  throw new Error("Las pruebas académicas de Firebase requieren una aplicación local conectada a los emuladores.");
}
const baseURL = existingServer || "http://127.0.0.1:3101";

export default defineConfig({
  testDir: "./tests/firebase-browser",
  outputDir: "test-results/firebase-browser",
  workers: 1,
  timeout: 120000,
  expect: { timeout: 20000 },
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    channel: process.env.CREA_BROWSER_CHANNEL || undefined,
    trace: "retain-on-failure",
  },
  webServer: existingServer ? undefined : {
    command: "pnpm exec next dev --hostname 127.0.0.1 --port 3101",
    env: {
      NEXT_PUBLIC_CREA_DEMO: "false",
      NEXT_PUBLIC_CREA_EMULATORS: "true",
      NEXT_PUBLIC_CREA_FIRESTORE_PORT: process.env.FIRESTORE_EMULATOR_HOST?.split(":").at(-1) ?? "8080",
      NEXT_PUBLIC_FIREBASE_API_KEY: "emulator-only-crea",
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "demo-crea.firebaseapp.com",
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-crea",
      NEXT_PUBLIC_FIREBASE_APP_ID: "1:123:web:emulator-test",
    },
    url: baseURL,
    timeout: 90000,
  },
});
