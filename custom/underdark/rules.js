/* exported 
DICT_COMMON SETTINGS EMOJI_IMAGES
CATEGORY_PRICES OBJ_CATEGORIES 
EFFECT_LISTS DEFAULT 
MAX_UNIT_HP MAP_PATH POP_PROP 
TECH_EFFECTS
onEndTurnCb
*/

/// <reference path="../../src/keywords.js"/>
/* global
KW
*/

/// <reference path="../../index.js"/>
/* global
USER_RESOURCES
NPCPlayers listPlayers
userEffectsObj
*/

const SETTINGS = {
  IS_CUSTOM: true,
  MAP_PATH: 'underdark/lair.png',
  // DEFAULT_FIGURE_BG: 'circle',

  MAX_UNIT_HP: 2,
  VISION_RADIUS: 100,
  CAPITAL_SPECIAL_VISION: false,
  // may be left empty, then _pop_ wont be applied
  POP_PROP: null,
} 

const DEFAULT = {
  /* filled up later */
  buildings: [],
  /* filled up later */
  units: [],
  noHealth: [
    KW.BUILD_SLOT,
    KW.GRAVE_UNIT,
    KW.WRECK_UNIT,
    '_unknown_bonus',
  ],
  wreckUnit: [
  ],
  noGrave: [
    "Поле магии"
  ],
  noUpkeep: [
  ],
}

// https://en.wikipedia.org/wiki/List_of_emojis
// https://emojipedia.org/fantasy-magic
const EMOJI_IMAGES = {
  // здания людей
  [KW.CAPITAL]: '👑',
  'Деревня': '🏘️',

  'Ферма': '🌾',
  // 🔧 
  'Мастерская': '⚒️',
  'Завод': '🏭',

  'Крепость': '🏯',

  // юниты людей
  'Солдат': '🗡️',
  'Маг': '🧙‍♂️',

  // монстры
  "Василиск": "🐉",

  // феи
  "Фея": "🧚",
  "Клевер": "🍀",
  "Волк": "🐺",

  // нежить
  "Нежить": "💀",
  "Призрак": "👻",

  "Голем": "🗿",

  "Паук": "🕷️",
  Паутина: "🕸️",
  "Муравей": "🐜",
  // москит 🦟

  // Шогготы
  "Шоггот": "🦠",
  "Пингвин": "🐧",
  "Творитель": "🍁",
  "Хранитель": "🌵",

  "Дерево": "🌳",
  
  "Ядро силы": "🔮",
  "Поле магии": "✨",

  // орбы

  // "Орб ":"🔴",
  "Орб Жизнь": "🟢",
  "Орб Смерть": "⚫",
  "Орб Пси": "🟣",

  // "🟠": "🟠",
  // "🟨": "🟡",
  // "🔵": "🔵",
  // "🟤": "🟤",
  // "⚪": "⚪",

  // Додо 🦤
  // ⚒
  //👹😈
  //⚙️☣️
}

const WEATHER_EFF = {}

const CATEGORY_PRICES = {
  UNITS: {
    _default_: [
      ['Еда', 2],
      ['Ремесло', 1],
    ], 
    Монстр: [
      ['Еда', 4],
    ], 
    Неживое: [
    ],
  },
  BUILDINGS: {
    _default_: [
      ['Дерево', 5],
    ],
  }
}

/** usually it means prices */
const OBJ_CATEGORIES = {
  UNITS: {
    _none_: [
      "Орб Жизнь",
      "Орб Смерть",
      "Орб Пси",
    ],
    _default_: [
      'Жители',
      'Солдат',
      'Маг',
    ],
    Феи: [
      "Фея",
    ],
    Неживое: [
      "Нежить",
      "Призрак",
      "Голем",
    ],
    Шогготы: [
      "Шоггот",
      "Пингвин",
    ],
    Монстр: [
      "Василиск",
      "Паук",
      "Муравей",
    ],

  },
  BUILDINGS: {
    _none_: [
      KW.GRAVE_UNIT,
      KW.WRECK_UNIT,
      // '_unknown_bonus',
      "Паутина",
    ],
    _default_: [
      "Столица",
      "Деревня",

      "Ферма",
      "Мастерская",
      "Завод",
      "Крепость",

      "Ядро силы",
      "Поле магии",
      "Дерево",
    ],
    Феи: [
      "Клевер",
    ],
    Шогготы: [
      "Творитель",
      "Хранитель",
    ],
  }
}

const CORE = {
  LIFE: "🟩",
  DEATH: "⬛",
  PSY: "🟪",
}

const EFFECT_LISTS = {
  // статичные эффекты, нам важно текущее значение
  static: [
    'Население',
    'Недовольство',
    'Рабочие',
  ],
  // добывается, фактически показывает прибыль ресурса
  resources: [
    "Еда",
    "Ремесло",

    CORE.LIFE,
    CORE.DEATH,
    CORE.PSY,

    // "🟥",
    // "🟨",
    // "🟦",
    // "🟫",

    // "Рабы",
    // "Трупы",
  ],
  local: [
    KW.ATK,
    // KW.DEF,
    KW.AP,
    // KW.DIST,
    "ХП",
    KW.REGEN,
  ],
}

const LOOT = {
  HUMAN: {
    [CORE.PSY]: 1,
  },
  FAIRY: {
    [CORE.PSY]: 1,
    [CORE.LIFE]: 1,
  },
}

const UNIT_UPKEEP = 1
const UNDO_POP_USAGE = ['Рабочие', 1]
const DICT_COMMON = {

  '_upkeep_': {
    '_building_': {
      'Рабочие': -1,
    },
    '_unit_': {
      'Еда': -UNIT_UPKEEP,
    }
  },

  '_building_': {
    [KW.REGEN]: 2
  },
  '_unit_': {
    [KW.ATK]: 0
  },

  [KW.WRECK_UNIT]: {
    [KW.LOOT]: {
      'Ремесло': 2
    }
  },

  [KW.CAPITAL]: {
    'Еда': 2,
    'Ремесло': 2,
    [KW.MAX_HP]: 4
  },

  Ферма: {
    'Еда': 3,
  },
  
  //////////////// units
  Жители: {
    [KW.COST]: {
      'Еда': 1
    },
    [KW.LOOT]: {
      ...LOOT.HUMAN,
    },
    // it means it has half of default upkeep
    'Еда': -0.5+UNIT_UPKEEP,
    'Рабочие': 1
  },

  Пехота: {
    [KW.ATK]: 2,
    [KW.AP]: 2,
    [KW.LOOT]: {
      ...LOOT.HUMAN,
    },
  },

  //////////////// monsters

  Василиск: {
    [KW.MAX_HP]: 4

  },

  //////////////// fairies

  Фея: {
    [KW.LOOT]: {
      ...LOOT.FAIRY,
    },
    [KW.ATK]: 3,
    [KW.AP]: 3
  },

  //////////////// Шогготы

  Творитель: {
    [KW.LOOT]: {
      [CORE.LIFE]: 1,
      // [CORE.WATER]: 1,
    },
    Еда: 2,
    Рабочие: 1,
  },

  Шоггот: {
    [KW.LOOT]: {
      [CORE.PSY]: 1,
      // [CORE.WATER]: 1,
    },
    [KW.MAX_HP]: 3,
    [KW.ATK]: 3,
    [KW.AP]: 2,
  },

  Пингвин: {
    [KW.LOOT]: {
      // [CORE.PSY]: 1,
      // [CORE.WATER]: 1,
    },
    Еда: +2,
    [KW.ATK]: 1,
    [KW.AP]: 1,
  },
}

const onEndTurnCb = () => {
  for(let player of listPlayers()) {
    if(NPCPlayers.includes(player)) continue
    const sum = userEffectsObj.sumEffects(player)
    for(let [effName, v] of Object.entries(sum)) {
      if(EFFECT_LISTS.resources.includes(effName)) {
        if(typeof USER_RESOURCES[player][effName] !== 'number') {
          USER_RESOURCES[player][effName] = 0
        }
        if(USER_RESOURCES[player][effName] + +v < 0) {
          USER_RESOURCES[player][effName] = 0
          continue
        }
        USER_RESOURCES[player][effName] += +v
      }

    }
  }
}

const TECH_EFFECTS = {}