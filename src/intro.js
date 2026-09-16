export function startIntro(count) {
  const dialog = document.querySelector("#intro");
  const status = document.querySelector("#intro-status");
  const progress = document.querySelector("#intro-progress");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let ready = false,
    skipped = reduced,
    finished = false;
  const timers = [];
  const started = performance.now();
  dialog.showModal();
  function finish(force = false) {
    if (
      finished ||
      (!force && (!ready || (!skipped && performance.now() - started < 2600)))
    )
      return;
    finished = true;
    timers.forEach(clearTimeout);
    dialog.close();
    document.body.classList.add("entered");
  }
  function skip() {
    skipped = true;
    status.textContent = ready ? "Карта готова" : "Запуск 3D-карты...";
    finish();
  }
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    skip();
  });
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      skip();
    }
    event.stopPropagation();
  });
  document.querySelector("#intro-skip").addEventListener("click", skip);
  [
    "Система навигации / запуск",
    `Каталог / ${count} объектов Млечного Пути`,
    "Звёздная карта / построение",
    "Курс на исследование / готов",
  ].forEach((line, i) => {
    timers.push(
      setTimeout(() => {
        status.textContent = line;
        progress.style.transform = `scaleX(${(i + 1) / 4})`;
        document.querySelectorAll(".intro-log")[i].classList.add("visible");
      }, i * 620),
    );
  });
  timers.push(setTimeout(() => finish(), 2700));
  return {
    ready() {
      ready = true;
      finish();
    },
    fail() {
      finish(true);
    },
  };
}
