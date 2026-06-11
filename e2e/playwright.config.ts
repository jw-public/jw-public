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
  // Visual snapshots are Linux renderings, generated and enforced in CI only;
  // local (macOS) runs skip the pixel comparisons.
  ignoreSnapshots: !process.env.CI,
  expect: {
    toHaveScreenshot: {
      // absorb sub-pixel antialiasing drift without hiding layout breakage
      maxDiffPixelRatio: 0.002,
      animations: "disabled",
      caret: "hide",
    },
  },
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:4000",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
});
