import test from "node:test";
import assert from "node:assert/strict";
import { startIntro } from "../src/intro.js";

function setup(t, reduced = false) {
  let now = 0;
  const timers = new Map();
  let timerId = 0;
  const dialog = {
    open: false,
    handlers: {},
    showModal() {
      this.open = true;
    },
    close() {
      this.open = false;
    },
    addEventListener(name, handler) {
      this.handlers[name] = handler;
    },
  };
  let skip;
  const nodes = {
    "#intro": dialog,
    "#intro-status": { textContent: "" },
    "#intro-progress": { style: {} },
    "#intro-skip": {
      addEventListener(name, handler) {
        skip = handler;
      },
    },
  };
  const originalDocument = globalThis.document;
  const originalMedia = globalThis.matchMedia;
  globalThis.document = {
    querySelector: (selector) => nodes[selector],
    querySelectorAll: () =>
      Array.from({ length: 4 }, () => ({ classList: { add() {} } })),
    body: { classList: { add() {} } },
  };
  globalThis.matchMedia = () => ({ matches: reduced });
  t.after(() => {
    globalThis.document = originalDocument;
    globalThis.matchMedia = originalMedia;
  });
  t.mock.method(performance, "now", () => now);
  t.mock.method(globalThis, "setTimeout", (callback, delay) => {
    timers.set(++timerId, { callback, at: now + delay });
    return timerId;
  });
  t.mock.method(globalThis, "clearTimeout", (id) => timers.delete(id));
  const intro = startIntro(8);
  return {
    intro,
    dialog,
    skip: () => skip(),
    advance(ms) {
      now += ms;
      for (const [id, timer] of [...timers])
        if (timer.at <= now && timers.has(id)) {
          timers.delete(id);
          timer.callback();
        }
    },
  };
}

test("intro closes automatically only after both loading and the short sequence finish", (t) => {
  const view = setup(t);
  view.advance(3000);
  assert.equal(view.dialog.open, true);
  view.intro.ready();
  assert.equal(view.dialog.open, false);
});

test("skip removes the delay but waits for renderer readiness", (t) => {
  const view = setup(t);
  view.skip();
  assert.equal(view.dialog.open, true);
  view.intro.ready();
  assert.equal(view.dialog.open, false);
});

test("reduced motion does not impose an intro delay", (t) => {
  const view = setup(t, true);
  view.intro.ready();
  assert.equal(view.dialog.open, false);
});

test("renderer failure dismisses the intro so the error remains accessible", (t) => {
  const view = setup(t);
  view.intro.fail();
  view.advance(3000);
  assert.equal(view.dialog.open, false);
});
