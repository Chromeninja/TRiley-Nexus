import { defineConfig } from "astro/config";
import fs from "node:fs";
import path from "node:path";

const configPath = path.resolve(process.cwd(), "portfolio-config.json");
const portfolioConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

const repoName = portfolioConfig?.site?.repository?.name ?? "";
const basePath = repoName.endsWith(".github.io")
  ? "/"
  : repoName
    ? `/${repoName}`
    : "/";

export default defineConfig({
  site: portfolioConfig?.site?.canonicalUrl ?? "https://example.github.io",
  base: basePath,
  output: "static",
});
