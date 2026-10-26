import fs from "node:fs";
import path from "node:path";

const outputDir = path.resolve("dist");
const prefix = (process.env.SITE_PATH_PREFIX || "").replace(/\/$/, "");

if (!/^\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/.test(prefix)) {
  throw new Error("SITE_PATH_PREFIX must be an absolute path without a trailing slash");
}

function prefixed(url) {
  if (!url.startsWith("/") || url.startsWith("//") || url === prefix || url.startsWith(prefix + "/")) {
    return url;
  }
  return prefix + url;
}

function rewriteHtml(html) {
  return html.replace(/\b(href|src|srcset|action|poster|xlink:href)=(['"])(.*?)\2/gi, (all, attribute, quote, value) => {
    const rewritten = attribute.toLowerCase() === "srcset"
      ? value.replace(/(^|,\s*)(\/[^\s,]+)/g, (_, separator, url) => separator + prefixed(url))
      : prefixed(value);
    return `${attribute}=${quote}${rewritten}${quote}`;
  });
}

function rewriteCss(css) {
  return css.replace(/url\(\s*(['"]?)(\/[^)'"\s]+)\1\s*\)/g, (_, quote, url) => `url(${quote}${prefixed(url)}${quote})`);
}

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(filename);
      continue;
    }
    const extension = path.extname(filename);
    if (extension === ".html" || extension === ".css") {
      const source = fs.readFileSync(filename, "utf8");
      fs.writeFileSync(filename, extension === ".html" ? rewriteHtml(source) : rewriteCss(source));
    }
  }
}

walk(outputDir);

const manifestPath = path.join(outputDir, "manifest.webmanifest");
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  for (const icon of manifest.icons || []) icon.src = prefixed(icon.src);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest));
}

const searchIndexPath = path.join(outputDir, "searchIndex.json");
if (fs.existsSync(searchIndexPath)) {
  const searchIndex = JSON.parse(fs.readFileSync(searchIndexPath, "utf8"));
  for (const item of searchIndex) item.url = prefixed(item.url);
  fs.writeFileSync(searchIndexPath, JSON.stringify(searchIndex));
}

console.log(`Prefixed Pages URLs with ${prefix}/`);
