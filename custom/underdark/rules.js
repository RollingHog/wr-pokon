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

const SETTINGS = {
  // DEFAULT_FIGURE_BG: 'circle',
  IS_CUSTOM: true,
  VISION_RADIUS: 100,
  CAPITAL_SPECIAL_VISION: false,
} 

const MAP_PATH = 'underdark/lair.png'

const MAX_UNIT_HP = 1

// may be left empty, then _pop_ wont be applied
const POP_PROP = 'Население'

const DEFAULT = {
  /* filled up later */
  buildings: [],
  /* filled up later */
  units: [],
  noHealth: [
    'build_slot',
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
    "Жители",
  ],
}

// https://en.wikipedia.org/wiki/List_of_emojis
// https://emojipedia.org/fantasy-magic
const EMOJI_IMAGES = {
  // здания
  [KW.CAPITAL]: '👑',
  'Деревня': '🏘️',

  'Ферма': '🌾',
  // 🔧 
  'Мастерская': '⚒️',
  'Завод': '🏭',

  'Крепость': '🏯',
  'Солдат': '🗡️',
  'Маг': '🧙‍♂️',

  /** монстры */
  "Василиск": "🐉",

  "Фея": "🧚",
  "Клевер": "🍀",
  "Волк": "🐺",

  "Нежить": "💀",
  "Призрак": "👻",

  "Голем": "🗿",

  "Паук": "🕷️",
  Паутина: "🕸️",
  "Муравей": "🐜",

  "Шоггот": "🦠",
  "Пингвин": "🐧",

  "Дерево": "🌳",
  
  "Ядро силы": "🔮",
  "Поле магии": "✨",

"🔴":"🔴",
"🟠":"🟠",
"🟨":"🟨",
"🟢":"🟢",
"🔵":"🔵",
"🟣":"🟣",
"🟤":"🟤",
"⚪":"⚪",
"⚫":"⚫",

  // москит 🦟
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

const OBJ_CATEGORIES = {
  UNITS: {
    _none_: [
      "🔴",
"🟠",
"🟨",
"🟢",
"🔵",
"🟣",
"🟤",
"⚪",
"⚫",
    ],
    _default_: [
      'Жители',
      'Солдат',
      'Маг',
    ],
    Неживое: [
      "Нежить",
      "Призрак",
      "Голем",
    ],
    Монстр: [
      "Василиск",
      "Фея",
      "Паук",
      "Муравей",
      
      "Шоггот",
      "Пингвин",
    ],
  },
  BUILDINGS: {
    _none_: [
      KW.GRAVE_UNIT,
      KW.WRECK_UNIT,
      // '_unknown_bonus',
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
      "Паутина",
      "Клевер",
      "Дерево",
    ],
  }
}

const EFFECT_LISTS = {
  // статичные эффекты, нам важно текущее значение
  static: [
    // 'Лимит населения',

    'Население',
    'Недовольство',
    'Рабочие',
  ],
  // добывается, фактически показывает прибыль ресурса
  resources: [
    "Еда",
    "Ремесло",

"🟥",
"🟨",
"🟩 ",
"🟦",
"🟪",
"⚫",
"🟫",

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
  PSY: ["🟪", 1],
}

const UNIT_UPKEEP = 1
const UNDO_POP_USAGE = ['Рабочие', 1]
const DICT_COMMON = {
  _upkeep_: {
    _building_: [
      ['Рабочие', -1],
    ],
    _unit_: [
      ["Еда", -UNIT_UPKEEP],
    ],
  },
  _building_: [
    [KW.REGEN, 2],
  ],
  _unit_: [
    [KW.ATK, 0],
  ],
  _pop_: [
    ["Еда", -0.5],
  ],
  [KW.WRECK_UNIT]: [
    [KW.LOOT, [
      ["Ремесло", 2],
    ]]
  ],
  [KW.CAPITAL]:
    [
      ["Еда", 2],
      ["Ремесло", 2],
      [KW.MAX_HP, 4]
    ],

  Василиск:
    [
      [KW.MAX_HP, 4],
    ],

  

  Жители:
    [
      [KW.COST, [
        ["Еда", 1],
      ]],
      [KW.LOOT, [
        LOOT.PSY
      ]],
      ["Еда", -0.5],
      ['Рабочие', 1],
    ],

  //////////////// units
  
  Пехота: [
    [KW.ATK, 2],
    [KW.AP, 2],
  ],

  //////////////// monsters
  //////////////// fairies

  Фея:
    [
      // [KW.COST, [
      //   ["Еда", 1],
      // ]],
      [KW.LOOT, [
        LOOT.PSY
      ]],
      [KW.ATK, 3],
      // [KW.DEF, 1],
      [KW.AP, 3],
    ],
};

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