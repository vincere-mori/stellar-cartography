import { readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const files = [
  "app.js",
  ...(await readdir("src"))
    .filter((file) => file.endsWith(".js"))
    .map((file) => `src/${file}`),
];
for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], {
    stdio: "inherit",
  });
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log(`Syntax checked: ${files.length} modules.`);
