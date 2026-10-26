import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const vault = process.env.OBSIDIAN_VAULT || path.resolve("../Obsidian Vault");
const source = path.join(vault, "AI", "CUDA");
const notesTarget = path.resolve("src/site/notes/AI/CUDA");
const imagesTarget = path.resolve("src/site/img/user/AI/CUDA");
const imageExtensions = new Set([".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".avif"]);

if (!fs.statSync(source, { throwIfNoEntry: false })?.isDirectory()) {
  throw new Error(`CUDA folder not found: ${source}`);
}

const files = [];
function collect(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Refusing symlink: ${fullPath}`);
    if (entry.isDirectory()) collect(fullPath);
    else if (entry.isFile()) files.push(fullPath);
  }
}
collect(source);

fs.rmSync(notesTarget, { recursive: true, force: true });
fs.rmSync(imagesTarget, { recursive: true, force: true });
fs.mkdirSync(notesTarget, { recursive: true });
fs.writeFileSync(path.join(notesTarget, ".gitkeep"), "");

let noteCount = 0;
let imageCount = 0;
for (const file of files) {
  const relative = path.relative(source, file);
  const extension = path.extname(file).toLowerCase();
  if (extension === ".md") {
    const original = fs.readFileSync(file, "utf8");
    if (!original.trim()) continue;
    const parsed = matter(original);
    parsed.data["dg-publish"] = true;
    parsed.data.permalink = "/AI/CUDA/" + relative.slice(0, -3).split(path.sep).join("/") + "/";
    const content = parsed.content.replace(/(!\[[^\]]*\]\()([^)]*)(\))/g, (match, before, rawTarget, after) => {
      const target = rawTarget.trim();
      if (!target || /^(?:https?:|data:|\/)/i.test(target)) return match;
      const imagePath = path.resolve(path.dirname(file), decodeURI(target));
      const imageRelative = path.relative(source, imagePath);
      if (imageRelative.startsWith("..") || path.isAbsolute(imageRelative)) {
        throw new Error(`Image outside /AI/CUDA: ${target} in ${file}`);
      }
      if (!fs.existsSync(imagePath)) throw new Error(`Missing image: ${imagePath}`);
      const url = "/img/user/AI/CUDA/" + imageRelative.split(path.sep).join("/");
      return `${before}${url}${after}`;
    });
    const destination = path.join(notesTarget, relative);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, matter.stringify(content, parsed.data));
    noteCount++;
  } else if (imageExtensions.has(extension)) {
    const destination = path.join(imagesTarget, relative);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(file, destination);
    imageCount++;
  }
}

console.log(`Synced /AI/CUDA: ${noteCount} note(s), ${imageCount} image(s)`);
