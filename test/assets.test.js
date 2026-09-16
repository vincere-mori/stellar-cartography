import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));

test("the static entry point and CSS only reference existing local assets", async () => {
  const html = await readFile(resolve(root, "index.html"), "utf8");
  const css = await readFile(resolve(root, "style.css"), "utf8");
  const paths = [
    ...html.matchAll(/(?:src|href)="(\.\/[^"#]+)"/g),
    ...css.matchAll(/url\(['"](\.\/[^'"]+)['"]\)/g),
  ].map((match) => match[1]);
  assert.ok(paths.length > 5);
  for (const path of paths) await access(resolve(root, path));
  assert.doesNotMatch(html, /(?:src|href)="https?:\/\//);
  await access(resolve(root, ".nojekyll"));
});

test("browser module imports resolve without a bundler or CDN", async () => {
  const pending = ["app.js"],
    seen = new Set();
  while (pending.length) {
    const path = resolve(root, pending.pop());
    if (seen.has(path)) continue;
    seen.add(path);
    const code = (await readFile(path, "utf8")).replace(
      /\/\*[\s\S]*?\*\//g,
      "",
    );
    const imports = [
      ...code.matchAll(/(?:from\s*|import\s*\()\s*['"]([^'"]+)['"]/g),
    ];
    for (const [, specifier] of imports) {
      if (specifier === "three") pending.push("vendor/three.module.js");
      else {
        assert.ok(
          specifier.startsWith("."),
          `Unmapped dependency: ${specifier}`,
        );
        pending.push(resolve(dirname(path), specifier));
      }
    }
  }
  assert.ok(seen.has(resolve(root, "vendor/three.core.js")));
  assert.ok(seen.has(resolve(root, "src/models.js")));
});
