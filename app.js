import {
  objects,
  getObject,
  filterObjects,
  discoveryRoute,
} from "./src/catalog.js";
import {
  createState,
  selectObject,
  startFlight,
  arrive,
  returnToMap,
  nextTourStop,
  readVisits,
  saveVisits,
} from "./src/state.js";
import { icon, fillIcons } from "./src/icons.js";
import { startIntro } from "./src/intro.js";

const $ = (selector) => document.querySelector(selector);
const state = createState();
let storage;
try {
  storage = localStorage;
} catch {
  storage = null;
}
state.visited = readVisits(storage);
let scene,
  filter = "all",
  toastTimer,
  cinematic = false,
  audioContext,
  soundEnabled = false;
fillIcons();
const intro = startIntro(objects.length);

function toast(message) {
  $("#toast").textContent = message;
  $("#toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("#toast").classList.remove("show"), 3300);
}

function tone(frequency = 350, duration = 0.12) {
  if (!soundEnabled || !audioContext || document.hidden) return;
  const oscillator = audioContext.createOscillator(),
    volume = audioContext.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(
    frequency * 0.6,
    audioContext.currentTime + duration,
  );
  volume.gain.setValueAtTime(0.025, audioContext.currentTime);
  volume.gain.exponentialRampToValueAtTime(
    0.0001,
    audioContext.currentTime + duration,
  );
  oscillator.connect(volume);
  volume.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
  oscillator.onended = () => {
    oscillator.disconnect();
    volume.disconnect();
  };
}

function rowHTML(object, journal = false) {
  const visited = state.visited.includes(object.id);
  return `<button class="object-row${state.selected === object.id && !journal ? " active" : ""}${visited ? " visited" : ""}" data-object="${object.id}" style="--object-color:${object.color}" aria-label="${object.name}, ${object.type}" ${!journal ? `aria-pressed="${state.selected === object.id}"` : ""} ${state.mode === "flight" ? "disabled" : ""}>
    <span class="row-symbol">${icon(object.category)}</span><span class="row-text"><strong>${object.name}</strong><small>${object.distance} / ${object.alias.split(" / ")[0]}</small></span><span class="row-state" aria-label="${visited ? "Посещён" : "Не посещён"}">${visited ? "+" : String(objects.indexOf(object) + 1).padStart(2, "0")}</span></button>`;
}

function renderCatalog() {
  const visible = filterObjects($("#search").value, filter);
  $("#object-list").innerHTML = visible
    .map((object) => rowHTML(object))
    .join("");
  $("#empty-search").hidden = visible.length > 0;
  $("#result-count").textContent = String(visible.length).padStart(2, "0");
}

function updateDetails() {
  const object = getObject(state.selected);
  $("#detail-number").textContent = String(
    objects.indexOf(object) + 1,
  ).padStart(2, "0");
  $("#detail-art").dataset.model = object.model;
  $("#art-code").textContent =
    `SC-${String(objects.indexOf(object) + 1).padStart(3, "0")} / ${object.alias.split(" / ")[0].toUpperCase()}`;
  $("#detail-type").textContent = object.type;
  $("#detail-name").textContent = object.name;
  $("#detail-alias").textContent = object.alias;
  $("#detail-description").textContent = object.description;
  $("#detail-facts").innerHTML = [
    [object.distanceLabel, object.distance],
    ...object.facts,
  ]
    .map(
      ([name, value]) =>
        `<div class="fact"><dt>${name}</dt><dd>${value}</dd></div>`,
    )
    .join("");
  $("#detail-highlight").textContent = object.highlight;
  $("#source-link").href = object.source;
  const visited = state.visited.includes(object.id);
  $("#visit-status").innerHTML =
    `<i></i> ${visited ? "В журнале экспедиции" : "Ожидает исследования"}`;
  $("#visit-status").classList.toggle("is-visited", visited);
  $("#destination-name").textContent = object.name;
  $("#destination-distance").textContent =
    `${object.distance} / ${object.distanceLabel}`;
  document.title = `${state.mode === "map" ? "Млечный Путь" : object.name} | Stellar Cartography`;
}

function syncUI() {
  const object = getObject(state.selected),
    inOrbit = state.mode === "orbit",
    inFlight = state.mode === "flight";
  document.body.dataset.mode = state.mode;
  $("#flight").hidden = !inFlight;
  $("#orbit-note").hidden = !inOrbit;
  $("#return-map").hidden = state.mode === "map";
  $("#view-kicker").textContent = inOrbit
    ? object.sector.toUpperCase()
    : "ДОМАШНЯЯ ГАЛАКТИКА";
  $("#view-title").textContent = inOrbit ? object.name : "Млечный Путь";
  $("#view-subtitle").textContent = inOrbit
    ? `${object.alias} / художественная модель`
    : "Наша маленькая часть бесконечности";
  $("#view-tag").textContent = inOrbit
    ? "РЕЖИМ НАБЛЮДЕНИЯ"
    : "ГАЛАКТИЧЕСКИЙ ОБЗОР";
  $("#map-nav").classList.toggle("active", !inOrbit);
  $("#position-label").textContent = state.arrived
    ? "ПОСЛЕДНЯЯ ОСТАНОВКА"
    : "ТОЧКА ОТСЧЁТА";
  $("#position-name").textContent = state.arrived
    ? getObject(state.arrived).name
    : "Солнечная система";
  const tourContinues =
    state.tourIndex >= 0 && state.tourIndex < discoveryRoute.length - 1;
  $("#launch-label").textContent = inFlight
    ? "В полёте"
    : inOrbit
      ? tourContinues
        ? "Следующая цель"
        : "Вернуться к карте"
      : "Начать перелёт";
  $("#launch").disabled = inFlight || !scene;
  $("#tour").disabled = inFlight || !scene;
  $("#search").disabled = inFlight;
  $("#filters")
    .querySelectorAll("button")
    .forEach((button) => (button.disabled = inFlight));
  $(".flight-deck").classList.toggle("busy", inFlight);
  $("#journal-count").textContent = String(state.visited.length).padStart(
    2,
    "0",
  );
  $("#controls-hint").innerHTML =
    state.tourIndex >= 0
      ? `МАРШРУТ ОТКРЫТИЯ <b>/</b> ${state.tourIndex + 1} ИЗ ${discoveryRoute.length}`
      : "ПЕРЕТАЩИТЬ - ВРАЩЕНИЕ <b>/</b> КОЛЕСО - МАСШТАБ";
  $("#labels")
    .querySelectorAll(".map-node")
    .forEach((button) => {
      button.classList.toggle(
        "active",
        button.dataset.object === state.selected,
      );
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.object === state.selected),
      );
      button.disabled = inFlight;
    });
  renderCatalog();
  updateDetails();
  const transitionKey = `${state.selected}/${state.mode}`;
  if (document.body.dataset.transition !== transitionKey) {
    document.body.dataset.transition = transitionKey;
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
      for (const selector of [
        "#detail-art",
        "#detail-name",
        "#detail-description",
        "#view-title",
      ]) {
        const element = $(selector);
        element.getAnimations().forEach((animation) => animation.cancel());
        element.animate(
          [
            { opacity: 0, transform: "translateY(6px)" },
            { opacity: 1, transform: "translateY(0)" },
          ],
          { duration: 240, easing: "cubic-bezier(.16,1,.3,1)" },
        );
      }
    }
  }
}

function select(id, keepTour = false) {
  if (!selectObject(state, id)) return;
  if (!keepTour) state.tourIndex = -1;
  if (state.mode === "orbit") {
    returnToMap(state);
    scene?.showMap();
  }
  scene?.select(id, state.arrived || "sun");
  history.replaceState(null, "", `#${id}`);
  tone(420);
  syncUI();
}

function goMap() {
  if (cinematic) toggleCinema();
  returnToMap(state);
  state.tourIndex = -1;
  scene?.showMap();
  scene?.select(state.selected, state.arrived || "sun");
  syncUI();
}

function launch() {
  if (!scene) return;
  if (state.mode === "flight") {
    scene.finishFlight();
    return;
  }
  if (state.mode === "orbit") {
    if (state.tourIndex >= 0 && nextTourStop(state)) {
      scene.select(state.selected, state.arrived || "sun");
    } else {
      goMap();
      return;
    }
  }
  if (!startFlight(state)) return;
  $("#flight-name").textContent = getObject(state.selected).name;
  $("#flight-progress").style.transform = "scaleX(0)";
  $("#flight-phase").textContent = "Прокладываем курс";
  $("#flight-percent").textContent = "0%";
  scene.startFlight(getObject(state.selected));
  tone(100, 1.1);
  syncUI();
  $("#skip-flight").focus({ preventScroll: true });
}

function toggleCinema() {
  cinematic = !cinematic;
  document.body.classList.toggle("cinematic", cinematic);
  $("#exit-cinema").hidden = !cinematic;
  if (cinematic) $("#exit-cinema").focus({ preventScroll: true });
  else $("#cinema").focus({ preventScroll: true });
}

$("#labels").innerHTML = objects
  .map(
    (object) =>
      `<button class="map-node" data-object="${object.id}" style="--object-color:${object.color}" aria-label="На карте: ${object.name}" aria-pressed="false"><span class="node-dot"></span><span class="node-copy">${object.name}<small>${object.distance}</small></span></button>`,
  )
  .join("");
const labelElements = new Map(
  [...$("#labels").children].map((element) => [
    element.dataset.object,
    element,
  ]),
);

function renderLabels(labels, width, height) {
  const occupied = [];
  const sorted = [...labels].sort(
    (a, b) => Number(b.id === state.selected) - Number(a.id === state.selected),
  );
  const dimensions = new Map(
    sorted.map((label) => {
      const element = labelElements.get(label.id);
      return [
        label.id,
        { width: element.offsetWidth, height: element.offsetHeight },
      ];
    }),
  );
  for (const label of sorted) {
    const element = labelElements.get(label.id);
    element.hidden = !label.visible;
    if (!label.visible) continue;
    const { width: labelWidth, height: labelHeight } = dimensions.get(label.id);
    const x = Math.max(4, Math.min(width - labelWidth - 53, label.x - 12));
    let y = Math.max(
      width < 650 ? 145 : 122,
      Math.min(height - 69, label.y - 12),
    );
    for (let attempt = 0; attempt < 8; attempt++) {
      const overlap = occupied.find(
        (box) =>
          x < box.x + box.width + 3 &&
          x + labelWidth + 3 > box.x &&
          y < box.y + box.height + 2 &&
          y + labelHeight + 2 > box.y,
      );
      if (!overlap) break;
      y = overlap.y + overlap.height + 3;
      if (y > height - 48) y = Math.max(119, label.y - 45 - attempt * 34);
    }
    element.style.transform = `translate(${Math.round(x)}px,${Math.round(y)}px)`;
    occupied.push({ x, y, width: labelWidth, height: labelHeight });
  }
}

function renderError(message) {
  intro.fail();
  $("#loading").hidden = true;
  $("#render-error").hidden = false;
  $("#render-error-text").textContent = message;
  $("#launch").disabled = true;
  $("#tour").disabled = true;
}

async function init() {
  try {
    const { SpaceScene } = await import("./src/scene.js");
    scene = new SpaceScene($("#scene"), {
      onLabels: renderLabels,
      onFPS: (fps) => ($("#fps").textContent = `${fps} FPS`),
      onFlightProgress: (p) => {
        $("#flight-progress").style.transform = `scaleX(${p})`;
        $("#flight-percent").textContent = `${Math.round(p * 100)}%`;
        $("#flight-phase").textContent =
          p < 0.25
            ? "Прокладываем курс"
            : p < 0.78
              ? "Межзвёздный переход"
              : "Подлёт к объекту";
      },
      onArrive: () => {
        if (!arrive(state)) return;
        const saved = saveVisits(storage, state.visited);
        history.replaceState(null, "", `#${state.arrived}`);
        syncUI();
        tone(640, 0.5);
        if (!document.querySelector("dialog[open]"))
          $("#launch").focus({ preventScroll: true });
        if (!saved) toast("Остановка добавлена в журнал на время этой сессии");
        else if (state.tourIndex === discoveryRoute.length - 1)
          toast("Маршрут завершён. Галактика открыта для исследования.");
        else toast(`${getObject(state.arrived).name} / прибытие подтверждено`);
      },
      onError: renderError,
    });
    const id = location.hash.slice(1);
    if (getObject(id)) selectObject(state, id);
    scene.select(state.selected, state.arrived || "sun");
    $("#loading").hidden = true;
    intro.ready();
    syncUI();
  } catch (error) {
    console.error("Space renderer:", error);
    renderError(
      "Не удалось запустить 3D. Проверьте, включено ли аппаратное ускорение и поддерживает ли браузер WebGL 2.",
    );
  }
}

$("#object-list").addEventListener("click", (event) => {
  const button = event.target.closest("[data-object]");
  if (button) select(button.dataset.object);
});
$("#labels").addEventListener("click", (event) => {
  const button = event.target.closest("[data-object]");
  if (button) select(button.dataset.object);
});
$("#search").addEventListener("input", renderCatalog);
$("#filters").addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;
  filter = button.dataset.filter;
  $("#filters")
    .querySelectorAll("button")
    .forEach((item) => {
      item.classList.toggle("active", item === button);
      item.setAttribute("aria-pressed", String(item === button));
    });
  renderCatalog();
});
$("#launch").addEventListener("click", launch);
$("#skip-flight").addEventListener("click", () => scene?.finishFlight());
$("#return-map").addEventListener("click", goMap);
$("#map-nav").addEventListener("click", goMap);
$(".brand").addEventListener("click", (event) => {
  event.preventDefault();
  goMap();
});
$("#tour").addEventListener("click", () => {
  state.tourIndex = -1;
  nextTourStop(state);
  select(state.selected, true);
  launch();
});
$("#zoom-in").addEventListener("click", () => scene?.zoom(0.8));
$("#zoom-out").addEventListener("click", () => scene?.zoom(1.25));
$("#reset-view").addEventListener("click", () => scene?.resetView());
$("#rotate").addEventListener("click", () => {
  const value = $("#rotate").getAttribute("aria-pressed") !== "true";
  $("#rotate").setAttribute("aria-pressed", String(value));
  scene?.setAutoRotate(value);
});
$("#cinema").addEventListener("click", toggleCinema);
$("#exit-cinema").addEventListener("click", toggleCinema);
$("#quality").addEventListener("change", (event) =>
  scene?.setQuality(event.target.value),
);
$("#retry").addEventListener("click", () => location.reload());
$("#help-button").addEventListener("click", () =>
  $("#help-dialog").showModal(),
);
$("#object-info").addEventListener("click", () => {
  const object = getObject(state.selected);
  $("#object-dialog-content").innerHTML =
    `<h2 id="object-dialog-title">${object.name}</h2><span class="object-type">${object.type}</span><p class="description">${object.description}</p><dl class="facts">${[[object.distanceLabel, object.distance], ...object.facts].map(([label, value]) => `<div class="fact"><dt>${label}</dt><dd>${value}</dd></div>`).join("")}</dl><div class="field-note"><span class="eyebrow">СТОИТ УВИДЕТЬ</span><p>${object.highlight}</p></div><a class="source-link" href="${object.source}" target="_blank" rel="noopener noreferrer">Об объекте на NASA ${icon("external")}</a><p class="science-note">3D-модель художественная. Расстояния ориентировочные.</p>`;
  $("#object-dialog").showModal();
});
$("#journal-nav").addEventListener("click", () => {
  $("#journal-summary").textContent = state.visited.length
    ? `Исследовано ${state.visited.length} из ${objects.length} объектов. Выберите остановку, чтобы снова проложить к ней курс.`
    : "Здесь появятся ваши открытия. Начните первый перелёт или выберите маршрут знакомства.";
  $("#journal-list").innerHTML = [...state.visited]
    .reverse()
    .map((id) => rowHTML(getObject(id), true))
    .join("");
  $("#journal-dialog").showModal();
});
$("#journal-list").addEventListener("click", (event) => {
  const button = event.target.closest("[data-object]");
  if (!button) return;
  $("#journal-dialog").close();
  select(button.dataset.object);
});
document
  .querySelectorAll("[data-close-dialog]")
  .forEach((button) =>
    button.addEventListener("click", () => button.closest("dialog").close()),
  );
document.querySelectorAll("dialog").forEach((dialog) =>
  dialog.addEventListener("click", (event) => {
    const rect = dialog.getBoundingClientRect();
    if (
      event.target === dialog &&
      (event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom)
    )
      dialog.close();
  }),
);
$("#sound").addEventListener("click", async () => {
  try {
    audioContext ??= new AudioContext();
    await audioContext.resume();
    soundEnabled = !soundEnabled;
    $("#sound").setAttribute("aria-pressed", String(soundEnabled));
    $("#sound").setAttribute(
      "aria-label",
      soundEnabled ? "Выключить звук" : "Включить звук",
    );
    $("#sound").innerHTML = icon(soundEnabled ? "soundOn" : "soundOff");
    tone(520);
  } catch {
    toast("Звук недоступен в этом браузере");
  }
});
document.addEventListener("visibilitychange", () => {
  if (audioContext) {
    if (document.hidden) audioContext.suspend().catch(() => {});
    else if (soundEnabled) audioContext.resume().catch(() => {});
  }
});
document.addEventListener("keydown", (event) => {
  if (document.querySelector("dialog[open]")) return;
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)) {
    if (event.key === "Escape") event.target.blur();
    return;
  }
  if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
  if (event.key === "Escape") {
    event.preventDefault();
    cinematic ? toggleCinema() : goMap();
  } else if (
    event.key.toLowerCase() === "h" ||
    event.key.toLowerCase() === "р"
  ) {
    event.preventDefault();
    toggleCinema();
  } else if (event.key === "/") {
    event.preventDefault();
    if (cinematic) toggleCinema();
    $("#search").focus();
  } else if (event.key === "Enter" && !event.target.closest("button,a")) {
    event.preventDefault();
    launch();
  }
});
window.addEventListener("hashchange", () => {
  const id = location.hash.slice(1);
  if (getObject(id)) select(id);
});
syncUI();
init();
