import fs from "node:fs";
import path from "node:path";

const roots = [
  ["src/site/notes", new Set(["notes.json", "notes.11tydata.js"])],
  ["src/site/img/user", new Set()],
  ["src/site/assets", new Set()],
];
const allowedPrefixes = ["AI/CUDA/", "Leetcode&&算法/", "Java后端开发体系/"];

for (const [root, allowedAtRoot] of roots) {
  if (!fs.existsSync(root)) continue;
  const pending = [root];
  while (pending.length) {
    const directory = pending.pop();
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const filename = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        pending.push(filename);
        continue;
      }
      const relative = path.relative(root, filename).split(path.sep).join("/");
      if (allowedAtRoot.has(relative) || relative.endsWith("/.gitkeep") || allowedPrefixes.some((prefix) => relative.startsWith(prefix))) continue;
      if (!allowedPrefixes.some((prefix) => relative.startsWith(prefix))) {
        throw new Error(`Refusing to build: ${filename} is outside /AI/CUDA`);
      }
    }
  }
}

console.log("Public scope verified: AI/CUDA, Leetcode&&算法, Java后端开发体系");
