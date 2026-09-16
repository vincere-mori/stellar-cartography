const paths = {
  galaxy:
    '<ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-35 12 12)"/><circle cx="12" cy="12" r="2"/><path d="M7 5c-2 4 1 11 5 14m5-14c2 4-1 11-5 14"/>',
  journal:
    '<path d="M6 3h13v18H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM4 17h15M8 7h7m-7 4h5"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4m0 3h.01"/>',
  soundOff: '<path d="M11 4 6 8H3v8h3l5 4V4Zm5 5 6 6m0-6-6 6"/>',
  soundOn:
    '<path d="M11 4 6 8H3v8h3l5 4V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  route:
    '<circle cx="5" cy="18" r="2"/><circle cx="19" cy="5" r="2"/><path d="M5 16V8a3 3 0 0 1 6 0v8a4 4 0 0 0 8 0V7"/>',
  arrow: '<path d="M4 12h15m-5-5 5 5-5 5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  target:
    '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>',
  rotate: '<path d="M20 10a8 8 0 1 0-2 8m2-14v6h-6"/>',
  expand: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m8 0h5v-5"/>',
  external: '<path d="M14 3h7v7m0-7L10 14M10 5H4v15h15v-6"/>',
  location:
    '<circle cx="12" cy="10" r="2"/><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/>',
  launch:
    '<path d="M14 5c3-3 7-3 7-3s0 4-3 7l-7 7-5-5 8-6Zm-7 7H3l4-5h4m1 9v5l5-4v-5M5 16l-2 5 5-2"/><circle cx="16" cy="7" r="1"/>',
  close: '<path d="m5 5 14 14M5 19 19 5"/>',
  star: '<circle cx="12" cy="12" r="4"/><path d="M12 1v4m0 14v4M1 12h4m14 0h4M4 4l3 3m10 10 3 3M4 20l3-3M17 7l3-3"/>',
  planet:
    '<circle cx="12" cy="12" r="5"/><ellipse cx="12" cy="12" rx="11" ry="3" transform="rotate(-32 12 12)"/>',
  nebula:
    '<path d="m5 11-2 5 6 2 4 4 3-5 5-3-4-4-1-7-6 3-5-1Z"/><path d="m8 12 5-3 2 5-5 2Z"/>',
  blackhole:
    '<circle cx="12" cy="12" r="4"/><ellipse cx="12" cy="12" rx="10" ry="7" transform="rotate(-25 12 12)"/><path d="M3 17 21 7"/>',
};
export function icon(name) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.star}</svg>`;
}
export function fillIcons(root = document) {
  root
    .querySelectorAll("[data-icon]")
    .forEach((element) => (element.innerHTML = icon(element.dataset.icon)));
}
