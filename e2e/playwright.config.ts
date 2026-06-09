import { defineConfig } from "@playwright/test";

// The Meteor app shares one database across tests; specs create uniquely named
// entities instead of resetting state, so they must not run in parallel.
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:4000",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
});
