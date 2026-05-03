import { defineConfig } from "astro/config";
import fs from "node:fs";
import path from "node:path";

const configPath = path.resolve(process.cwd(), "portfolio-config.json");
function loadPortfolioConfig() {
  if (!fs.existsSync(configPath)) {
    throw new Error(`Missing required config file: ${configPath}`);
  }

  const raw = fs.readFileSync(configPath, "utf-8");

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      throw new Error("portfolio-config.json must contain a JSON object.");
    }
    return parsed;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse portfolio-config.json: ${message}`, {
      cause: error,
    });
  }
}

const portfolioConfig = loadPortfolioConfig();

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
