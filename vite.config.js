import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        home: resolve(__dirname, "index.html"),
        written: resolve(__dirname, "written.html"),
        ssb: resolve(__dirname, "ssb.html"),
        physical: resolve(__dirname, "physical.html"),
        calendar: resolve(__dirname, "calendar.html"),
        practice: resolve(__dirname, "practice.html"),
        resources: resolve(__dirname, "resources.html")
      }
    }
  }
});
