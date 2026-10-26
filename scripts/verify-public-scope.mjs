import fs from "node:fs";
import path from "node:path";

const roots = [
  ["src/site/notes", new Set(["notes.json", "notes.11tydata.js"])],
  ["src/site/img/user", new Set()],
];
const allowedPrefix = "AI/CUDA/";

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
      if (relative === "AI/CUDA/.gitkeep" || allowedAtRoot.has(relative)) continue;
      if (!relative.startsWith(allowedPrefix)) {
        throw new Error(`Refusing to build: ${filename} is outside /AI/CUDA`);
      }
    }
  }
}

console.log("Public scope verified: /AI/CUDA only");
