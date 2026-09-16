import test from "node:test";
import assert from "node:assert/strict";
import {
  objects,
  filterObjects,
  discoveryRoute,
  getObject,
} from "../src/catalog.js";
import {
  createState,
  selectObject,
  startFlight,
  arrive,
  returnToMap,
  nextTourStop,
  readVisits,
  saveVisits,
} from "../src/state.js";

test("a cancelled flight never records a visit, including a late arrival callback", () => {
  const state = createState();
  selectObject(state, "saturn");
  startFlight(state);
  returnToMap(state);
  assert.equal(arrive(state), false);
  assert.deepEqual(state.visited, []);
  assert.equal(state.mode, "map");
  selectObject(state, "orion");
  startFlight(state);
  arrive(state);
  assert.equal(state.arrived, "orion");
  assert.deepEqual(state.visited, ["orion"]);
});

test("selection and repeated launch cannot change the destination mid-flight", () => {
  const state = createState();
  selectObject(state, "saturn");
  startFlight(state);
  assert.equal(selectObject(state, "sun"), false);
  assert.equal(startFlight(state), false);
  assert.equal(nextTourStop(state), false);
  arrive(state);
  assert.equal(state.arrived, "saturn");
  assert.equal(state.flightTarget, null);
});

test("revisiting an object and repeated completion do not duplicate the journal", () => {
  const state = createState();
  for (let i = 0; i < 3; i++) {
    startFlight(state);
    arrive(state);
    arrive(state);
    returnToMap(state);
  }
  assert.deepEqual(state.visited, ["sgr-a"]);
});

test("the complete discovery route reaches five distinct destinations and ends", () => {
  const state = createState();
  while (nextTourStop(state)) {
    startFlight(state);
    arrive(state);
  }
  assert.deepEqual(state.visited, discoveryRoute);
  assert.equal(state.mode, "orbit");
  assert.equal(state.arrived, "sgr-a");
  assert.equal(nextTourStop(state), false);
});

test("invalid URLs cannot select an unknown object", () => {
  const state = createState();
  assert.equal(selectObject(state, "<script>"), false);
  assert.equal(state.selected, "sgr-a");
});

test("search combines type filters with Russian names, Latin aliases and catalog numbers", () => {
  assert.deepEqual(
    filterObjects("  M42 ").map((x) => x.id),
    ["orion"],
  );
  assert.deepEqual(
    filterObjects("центавра", "star").map((x) => x.id),
    ["proxima"],
  );
  assert.equal(filterObjects("Saturn", "nebula").length, 0);
  assert.equal(filterObjects("missing").length, 0);
  assert.equal(filterObjects("").length, 8);
});

test("journal survives a round-trip and rejects stale, repeated and corrupt data", () => {
  let saved = null;
  const storage = {
    getItem: () => saved,
    setItem: (_, value) => {
      saved = value;
    },
  };
  assert.equal(saveVisits(storage, ["sun", "saturn"]), true);
  assert.deepEqual(readVisits(storage), ["sun", "saturn"]);
  saved = '["sun","deleted-object","sun",null,12]';
  assert.deepEqual(readVisits(storage), ["sun"]);
  for (const bad of ["{", "{}", "null", "true", "42"]) {
    saved = bad;
    assert.deepEqual(readVisits(storage), []);
  }
});

test("blocked storage still allows the app to run", () => {
  const storage = {
    getItem() {
      throw new Error("blocked");
    },
    setItem() {
      throw new Error("quota");
    },
  };
  assert.deepEqual(readVisits(storage), []);
  assert.equal(saveVisits(storage, ["sun"]), false);
  assert.deepEqual(readVisits(null), []);
});

test("every destination has a unique identity, a local model and a primary source", () => {
  assert.equal(new Set(objects.map((x) => x.id)).size, objects.length);
  for (const object of objects) {
    assert.ok(
      [
        "sun",
        "saturn",
        "proxima",
        "pleiades",
        "orion",
        "crab",
        "eagle",
        "blackhole",
      ].includes(object.model),
    );
    assert.ok(new URL(object.source).hostname.endsWith("nasa.gov"));
    assert.ok(
      object.position.length === 3 && object.position.every(Number.isFinite),
    );
    assert.ok(object.radius > 0);
  }
  for (const id of discoveryRoute) assert.ok(getObject(id));
});
