import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const distDir = path.join(rootDir, "dist");
const publicAssetsDir = path.join(rootDir, "public", "assets");
const distAssetsDir = path.join(distDir, "assets");

const distHtmlPath = path.join(distDir, "index.html");
if (!fs.existsSync(distHtmlPath)) {
  throw new Error("dist/index.html not found. Run npm run build first.");
}

let html = fs.readFileSync(distHtmlPath, "utf8");

// Inline built stylesheet links
html = html.replace(
  /<link\s+rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi,
  (match, href) => {
    const relPath = href.replace(/^\.?\//, "");
    const filePath = path.join(distDir, relPath);
    if (!fs.existsSync(filePath)) return match;
    const css = fs.readFileSync(filePath, "utf8").replace(/<\/style>/gi, "<\\/style>");
    return `<style>\n${css}\n</style>`;
  }
);

// Inline built module scripts using callback replacement to avoid $-token expansion
const inlineScripts = [];
html = html.replace(
  /<script\b[^>]*type=["']module["'][^>]*src=["']([^"']+)["'][^>]*><\/script>/gi,
  (match, src) => {
    const relPath = src.replace(/^\.?\//, "");
    const filePath = path.join(distDir, relPath);
    if (!fs.existsSync(filePath)) return match;
    const js = fs.readFileSync(filePath, "utf8").replace(/<\/script>/gi, "<\\/script>");
    inlineScripts.push(`<script type="module">\n${js}\n</script>`);
    return "";
  }
);

// Strip crossorigin or modulepreload tags pointing to local bundle assets
html = html.replace(/<link\s+rel=["']modulepreload["'][^>]*>/gi, "");

if (inlineScripts.length > 0) {
  html = html.replace(/<\/body>/i, () => `${inlineScripts.join("\n")}\n</body>`);
}

fs.mkdirSync(publicAssetsDir, { recursive: true });
const outTargets = [
  path.join(publicAssetsDir, "arena_hero_11_8.html"),
  path.join(publicAssetsDir, "arena_hero_11_8.txt"),
  path.join(publicAssetsDir, "arena_hero_5_0.html"),
  path.join(publicAssetsDir, "arena_hero_5_0.txt"),
  path.join(publicAssetsDir, "arena_hero_4_0.html"),
  path.join(publicAssetsDir, "arena_hero_4_0.txt")
];

for (const outPath of outTargets) {
  fs.writeFileSync(outPath, html, "utf8");
}

if (fs.existsSync(distAssetsDir)) {
  for (const name of ["arena_hero_11_8.html", "arena_hero_11_8.txt", "arena_hero_5_0.html", "arena_hero_5_0.txt", "arena_hero_4_0.html", "arena_hero_4_0.txt"]) {
    fs.writeFileSync(path.join(distAssetsDir, name), html, "utf8");
  }
}

console.log(`Built standalone Arena Hero 11.8 HTML (${(Buffer.byteLength(html, "utf8") / 1024).toFixed(1)} KB)`);
