# Stellar Cartography

[Explore the galaxy](https://vincere-mori.github.io/stellar-cartography/) | [Русский](README.md)

A browser-based space atlas with a navigation-console feel. Pick a destination on the Milky Way map, travel to it, then explore its 3D model.

Eight destinations: the Sun, Saturn, Proxima Centauri, the Pleiades, the Orion, Eagle and Crab nebulae, and Sagittarius A\*. Stars have procedural surfaces and coronas; Saturn has rings and a Cassini Division; nebulae use volumetric particle clouds. The black hole shader approximates light bending around an accretion disk.

A five-stop discovery route introduces the atlas. Search by Russian name, English alias or Messier number, orbit and zoom, hide the interface, and revisit discoveries through the local journal. Sound is optional and off by default. The interface is in Russian.

## Scientific scope

This is an artistic visualization of real objects. Map positions, model scales, colors, motion and travel times are illustrative. The models are not observational reconstructions or precision physics simulations.

Each object links to a NASA source. Distances are approximate, with the reference point stated explicitly. Saturn uses its average distance from the Sun; deep-sky objects use distance from Earth. These figures are not travel distances between destinations. The linked NASA catalog gives 1,500 light-years for Orion and 445 for the Pleiades.

## Controls

| Action                 | Input                               |
| ---------------------- | ----------------------------------- |
| Select destination     | Map marker or catalog row           |
| Orbit                  | Drag with a mouse or one finger     |
| Zoom                   | Scroll, pinch or + / - buttons      |
| Travel / skip          | Button or Enter outside text inputs |
| Return / cancel flight | Esc or map button                   |
| Hide interface         | H or the viewport button            |
| Search                 | /                                   |

Small screens use a bottom catalog and a separate object information dialog. Reduced-motion preferences skip the flight animation and stop ambient movement. Automatic camera rotation is opt-in. Rendering pauses in hidden tabs.

## Run locally

Use a modern WebGL 2 browser and an HTTP server:

```bash
git clone https://github.com/vincere-mori/stellar-cartography.git
cd stellar-cartography
python -m http.server 7821 --bind 127.0.0.1
```

Open [localhost:7821](http://localhost:7821). Opening through `file://` will not load ES modules.

Three.js and fonts are bundled locally. Viewing needs no npm installation, CDN access or build step. GitHub Pages serves the root of `main`.

## Development

Node.js 22 or newer is used for tests and refreshing vendored assets:

```bash
npm ci
npm test
npm run check
npm run vendor
```

Commit `package-lock.json`, `vendor/` and `assets/fonts/` together when changing dependencies. CI checks navigation tests, JavaScript syntax and vendored asset consistency.

- `app.js`: interface, keyboard controls, journal and sound
- `src/catalog.js`: destination data and sources
- `src/state.js`: navigation and travel state
- `src/scene.js`: cameras, rendering and transitions
- `src/models.js`: geometry, particles and shaders
- `test/`: navigation, search, persistence and asset checks

The earlier Python desktop prototype remains available through `pip install -r requirements.txt` and `python main.py`. It uses the original `shaders/` and does not implement the new web interface.

Third-party licenses are included in `vendor/` and `assets/fonts/`.
