const messier =
  "https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/";

export const objects = [
  {
    id: "sun",
    name: "Солнце",
    alias: "Sol / G2V",
    type: "Звезда",
    category: "star",
    color: "#edbb76",
    distance: "1 а.е.",
    distanceLabel: "От Земли",
    sector: "Солнечная система",
    position: [19, 0.3, 14],
    description:
      "Наша звезда. Почти вся энергия, которая делает Землю живой, начинается здесь, в недрах раскалённой плазмы.",
    highlight:
      "Гранулы на поверхности и светящуюся корону. Потоки плазмы постоянно меняют рисунок звезды.",
    facts: [
      ["Диаметр", "1,4 млн км"],
      ["Возраст", "4,6 млрд лет"],
      ["Свет до Земли", "8 минут"],
    ],
    source: "https://science.nasa.gov/sun/facts/",
    model: "sun",
    radius: 10,
  },
  {
    id: "saturn",
    name: "Сатурн",
    alias: "Saturn / Sol VI",
    type: "Газовый гигант",
    category: "planet",
    color: "#d8c5a2",
    distance: "9,5 а.е.",
    distanceLabel: "От Солнца, в среднем",
    sector: "Солнечная система",
    position: [27, 0.6, 9],
    description:
      "Мир из водорода и гелия, окружённый тысячами колец. Они состоят из частиц льда и камня, от пылинок до огромных глыб.",
    highlight:
      "Тонкую плоскость колец и тёмную щель Кассини. Поверните планету, чтобы увидеть кольца с ребра.",
    facts: [
      ["Диаметр", "116 460 км"],
      ["Год", "29,4 земного года"],
      ["Сутки", "10,7 часа"],
    ],
    source: "https://science.nasa.gov/saturn/facts/",
    model: "saturn",
    radius: 12,
  },
  {
    id: "proxima",
    name: "Проксима Центавра",
    alias: "Proxima Centauri / Alpha Cen C",
    type: "Красный карлик",
    category: "star",
    color: "#e58662",
    distance: "4,2 св. года",
    distanceLabel: "От Земли",
    sector: "Окрестности Солнца",
    position: [10, 1.2, 23],
    description:
      "Ближайшая к Солнцу звезда. Небольшой красный карлик, рядом с которым обнаружена планета Проксима b.",
    highlight:
      "Красноватую поверхность и яркие области активности. Даже маленькие звёзды способны на мощные вспышки.",
    facts: [
      ["Тип", "Красный карлик"],
      ["Созвездие", "Центавр"],
      ["Соседняя планета", "Проксима b"],
    ],
    source:
      "https://www.jpl.nasa.gov/news/closest-star-system-found-in-a-century/",
    model: "proxima",
    radius: 10,
  },
  {
    id: "pleiades",
    name: "Плеяды",
    alias: "M45 / Семь Сестёр",
    type: "Звёздное скопление",
    category: "star",
    color: "#8fb9ef",
    distance: "445 св. лет",
    distanceLabel: "От Земли",
    sector: "Созвездие Тельца",
    position: [23, -0.4, -12],
    description:
      "Россыпь молодых звёзд в голубой дымке. В скоплении больше тысячи звёзд, но самые яркие знакомы нам как Семь Сестёр.",
    highlight:
      "Голубые пылевые вуали вокруг ярких звёзд. Это отражённый свет, рассеянный межзвёздной пылью.",
    facts: [
      ["Каталог", "Мессье 45"],
      ["Созвездие", "Телец"],
      ["Наблюдение", "Невооружённым глазом"],
    ],
    source: `${messier}messier-45/`,
    model: "pleiades",
    radius: 18,
  },
  {
    id: "orion",
    name: "Туманность Ориона",
    alias: "M42 / NGC 1976",
    type: "Эмиссионная туманность",
    category: "nebula",
    color: "#c291b9",
    distance: "1 500 св. лет",
    distanceLabel: "От Земли",
    sector: "Созвездие Ориона",
    position: [-13, 1.4, 21],
    description:
      "Звёздная колыбель под поясом Ориона. В огромном облаке газа и пыли прямо сейчас рождаются новые звёзды и планетные системы.",
    highlight:
      "Светлую полость вокруг звёзд Трапеции и тёмные складки пыли на фоне розового свечения газа.",
    facts: [
      ["Каталог", "Мессье 42"],
      ["Созвездие", "Орион"],
      ["Наблюдение", "Невооружённым глазом"],
    ],
    source: `${messier}messier-42/`,
    model: "orion",
    radius: 22,
  },
  {
    id: "crab",
    name: "Крабовидная туманность",
    alias: "M1 / NGC 1952",
    type: "Остаток сверхновой",
    category: "nebula",
    color: "#80bebe",
    distance: "6 500 св. лет",
    distanceLabel: "От Земли",
    sector: "Созвездие Тельца",
    position: [-25, 0.8, 2],
    description:
      "Эхо звёздного взрыва, замеченного на Земле в 1054 году. Среди разлетающихся волокон вещества остался стремительно вращающийся пульсар.",
    highlight:
      "Нити выброшенного вещества и голубое свечение в центре. Пульсар питает энергией окружающее облако.",
    facts: [
      ["Каталог", "Мессье 1"],
      ["Взрыв замечен", "1054 год"],
      ["Пульсар", "Около 30 оборотов/с"],
    ],
    source: `${messier}messier-1/`,
    model: "crab",
    radius: 22,
  },
  {
    id: "eagle",
    name: "Туманность Орёл",
    alias: "M16 / Столпы Творения",
    type: "Эмиссионная туманность",
    category: "nebula",
    color: "#a4baa0",
    distance: "7 000 св. лет",
    distanceLabel: "От Земли",
    sector: "Созвездие Змеи",
    position: [-8, 1.2, -23],
    description:
      "Гигантские башни холодной пыли внутри светящегося облака. Звёздный свет постепенно разрушает эти столпы, а внутри них формируются новые звёзды.",
    highlight:
      "Три пылевых столпа и подсвеченные края облаков. Знакомая по снимкам Hubble форма здесь раскрывается в объёме.",
    facts: [
      ["Каталог", "Мессье 16"],
      ["Созвездие", "Змея"],
      ["Структура", "Газ и холодная пыль"],
    ],
    source: `${messier}messier-16/`,
    model: "eagle",
    radius: 22,
  },
  {
    id: "sgr-a",
    name: "Стрелец A*",
    alias: "Sagittarius A* / Sgr A*",
    type: "Сверхмассивная чёрная дыра",
    category: "blackhole",
    color: "#e9b47d",
    distance: "26 000 св. лет",
    distanceLabel: "От Земли",
    sector: "Галактический центр",
    position: [0, 0.5, 0],
    description:
      "Тёмное сердце Млечного Пути. Чёрная дыра массой около четырёх миллионов Солнц, вокруг которой движутся звёзды галактического центра.",
    highlight:
      "Изогнутый свет аккреционного диска вокруг тёмной тени. Гравитация меняет видимую траекторию света.",
    facts: [
      ["Масса", "Около 4 млн Солнц"],
      ["Расположение", "Центр галактики"],
      ["Первый снимок EHT", "2022 год"],
    ],
    source:
      "https://www.jpl.nasa.gov/edu/resources/teachable-moment/telescopes-get-extraordinary-view-of-milky-ways-black-hole/",
    model: "blackhole",
    radius: 16,
  },
];

export const discoveryRoute = ["sun", "saturn", "orion", "crab", "sgr-a"];
export const getObject = (id) => objects.find((object) => object.id === id);
export function filterObjects(query, category = "all") {
  const text = query.trim().toLocaleLowerCase("ru");
  return objects.filter(
    (object) =>
      (category === "all" || object.category === category) &&
      `${object.name} ${object.alias} ${object.type} ${object.sector}`
        .toLocaleLowerCase("ru")
        .includes(text),
  );
}
