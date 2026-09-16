import { copyFile, mkdir } from "node:fs/promises";

await mkdir("vendor", { recursive: true });
await mkdir("assets/fonts", { recursive: true });
for (const name of ["three.module.js", "three.core.js"]) {
  await copyFile(`node_modules/three/build/${name}`, `vendor/${name}`);
}
await copyFile(
  "node_modules/three/examples/jsm/controls/OrbitControls.js",
  "vendor/OrbitControls.js",
);
await copyFile("node_modules/three/LICENSE", "vendor/THREE-LICENSE");
for (const subset of ["latin", "cyrillic"]) {
  await copyFile(
    `node_modules/@fontsource-variable/golos-text/files/golos-text-${subset}-wght-normal.woff2`,
    `assets/fonts/golos-${subset}.woff2`,
  );
}
await copyFile(
  "node_modules/@fontsource-variable/oswald/files/oswald-latin-wght-normal.woff2",
  "assets/fonts/oswald-latin.woff2",
);
await copyFile(
  "node_modules/@fontsource-variable/golos-text/LICENSE",
  "assets/fonts/GOLOS-LICENSE",
);
await copyFile(
  "node_modules/@fontsource-variable/oswald/LICENSE",
  "assets/fonts/OSWALD-LICENSE",
);
console.log("Local Three.js and fonts are ready.");
