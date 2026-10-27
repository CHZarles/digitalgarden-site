import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const vault = process.env.OBSIDIAN_VAULT || path.resolve("../Obsidian Vault");
const sources = [
  { vaultPath: "AI/CUDA", sitePath: "AI/CUDA" },
  { vaultPath: "Leetcode&&算法", sitePath: "Leetcode&&算法" },
  { vaultPath: "Java后端开发体系", sitePath: "Java后端开发体系" },
];
const imageExtensions = new Set([".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".avif"]);
const assetExtensions = new Set([".pdf"]);

function collect(directory) {
  const files = [];
  const pending = [directory];
  while (pending.length) {
    const current = pending.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isSymbolicLink()) throw new Error(`Refusing symlink: ${fullPath}`);
      if (entry.isDirectory()) pending.push(fullPath);
      else if (entry.isFile() && entry.name !== ".DS_Store") files.push(fullPath);
    }
  }
  return files;
}

function publicPath(sitePath, relative, kind) {
  const encoded = relative.split(path.sep).join("/");
  if (kind === "image") return `/img/user/${sitePath}/${encoded}`;
  if (kind === "asset") return `/assets/${sitePath}/${encoded}`;
  return `/${sitePath}/${encoded.replace(/\.md$/i, "/")}`;
}

function resolveLocalFile(sourceRoot, noteFile, rawTarget) {
  const decoded = decodeURI(rawTarget.replace(/\\/g, "/"));
  const candidates = [
    path.resolve(path.dirname(noteFile), decoded),
    path.resolve(sourceRoot, decoded),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
}

function rewriteEmbeds(content, sourceRoot, noteFile, sitePath, filesByName) {
  return content.replace(/!\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]/g, (match, rawTarget, alias) => {
    const target = rawTarget.trim();
    const imageFile = resolveLocalFile(sourceRoot, noteFile, target) || filesByName.get(path.basename(target));
    if (!imageFile || !imageExtensions.has(path.extname(imageFile).toLowerCase())) return match;
    const relative = path.relative(sourceRoot, imageFile);
    return `![${alias || path.basename(imageFile)}](${publicPath(sitePath, relative, "image")})`;
  });
}

function rewriteMarkdownImages(content, sourceRoot, noteFile, sitePath) {
  return content.replace(/(!\[[^\]]*\]\()([^\s)]+)(\))/g, (match, before, rawTarget, after) => {
    if (/^(?:https?:|data:|\/)/i.test(rawTarget)) return match;
    const imageFile = resolveLocalFile(sourceRoot, noteFile, rawTarget);
    if (!imageFile || !imageExtensions.has(path.extname(imageFile).toLowerCase())) return match;
    return `${before}${publicPath(sitePath, path.relative(sourceRoot, imageFile), "image")}${after}`;
  });
}

function syncSource(sourceSpec) {
  const sourceRoot = path.join(vault, sourceSpec.vaultPath);
  if (!fs.statSync(sourceRoot, { throwIfNoEntry: false })?.isDirectory()) {
    throw new Error(`Public folder not found: ${sourceRoot}`);
  }
  const files = collect(sourceRoot);
  const filesByName = new Map(files.map((file) => [path.basename(file), file]));
  const notesTarget = path.resolve("src/site/notes", sourceSpec.sitePath);
  const imagesTarget = path.resolve("src/site/img/user", sourceSpec.sitePath);
  const assetsTarget = path.resolve("src/site/assets", sourceSpec.sitePath);
  fs.rmSync(notesTarget, { recursive: true, force: true });
  fs.rmSync(imagesTarget, { recursive: true, force: true });
  fs.rmSync(assetsTarget, { recursive: true, force: true });
  fs.mkdirSync(notesTarget, { recursive: true });
  fs.writeFileSync(path.join(notesTarget, ".gitkeep"), "");
  let noteCount = 0;
  let imageCount = 0;
  let assetCount = 0;

  for (const file of files) {
    const relative = path.relative(sourceRoot, file);
    const extension = path.extname(file).toLowerCase();
    if (extension === ".md") {
      const original = fs.readFileSync(file, "utf8");
      if (!original.trim()) continue;
      const parsed = matter(original);
      parsed.data["dg-publish"] = true;
      parsed.data.permalink = publicPath(sourceSpec.sitePath, relative, "note");
      let content = rewriteEmbeds(parsed.content, sourceRoot, file, sourceSpec.sitePath, filesByName);
      content = rewriteMarkdownImages(content, sourceRoot, file, sourceSpec.sitePath);
      const destination = path.join(notesTarget, relative);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.writeFileSync(destination, matter.stringify(content, parsed.data));
      noteCount++;
    } else if (imageExtensions.has(extension)) {
      const destination = path.join(imagesTarget, relative);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.copyFileSync(file, destination);
      imageCount++;
    } else if (assetExtensions.has(extension)) {
      const destination = path.join(assetsTarget, relative);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.copyFileSync(file, destination);
      assetCount++;
    }
  }
  return { path: sourceSpec.vaultPath, noteCount, imageCount, assetCount };
}

const results = sources.map(syncSource);
for (const result of results) {
  console.log(`Synced /${result.path}: ${result.noteCount} note(s), ${result.imageCount} image(s), ${result.assetCount} asset(s)`);
}
