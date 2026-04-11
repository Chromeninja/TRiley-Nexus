import { defineConfig } from "astro/config";

// Base path is set to "/" for custom domain or root deployment.
// If deploying to a GitHub Pages project page (username.github.io/repo-name),
// set the `base` option to "/repo-name" and update all internal links accordingly.
export default defineConfig({
  site: "https://chromeninja.github.io",
  // base: "/TRiley-Nexus", // Uncomment if deploying to a project page (not custom domain)
  output: "static",
});
