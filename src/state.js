import { getObject, discoveryRoute } from "./catalog.js";

export function createState() {
  return {
    mode: "map",
    selected: "sgr-a",
    arrived: null,
    flightTarget: null,
    tourIndex: -1,
    visited: [],
  };
}
export function selectObject(state, id) {
  if (!getObject(id) || state.mode === "flight") return false;
  state.selected = id;
  return true;
}
export function startFlight(state) {
  if (state.mode === "flight") return false;
  state.flightTarget = state.selected;
  state.mode = "flight";
  return true;
}
export function arrive(state) {
  if (state.mode !== "flight" || !getObject(state.flightTarget)) return false;
  state.arrived = state.flightTarget;
  state.selected = state.flightTarget;
  state.flightTarget = null;
  state.mode = "orbit";
  if (!state.visited.includes(state.arrived)) state.visited.push(state.arrived);
  return true;
}
export function returnToMap(state) {
  state.mode = "map";
  state.flightTarget = null;
}
export function nextTourStop(state) {
  if (state.mode === "flight" || state.tourIndex >= discoveryRoute.length - 1)
    return false;
  state.tourIndex++;
  state.selected = discoveryRoute[state.tourIndex];
  return true;
}
export function readVisits(storage) {
  try {
    const saved = JSON.parse(storage.getItem("stellar-visits-v2") || "[]");
    return Array.isArray(saved)
      ? [...new Set(saved.filter((id) => getObject(id)))]
      : [];
  } catch {
    return [];
  }
}
export function saveVisits(storage, visited) {
  try {
    storage.setItem("stellar-visits-v2", JSON.stringify(visited));
    return true;
  } catch {
    return false;
  }
}
