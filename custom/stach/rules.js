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

const CELL_SIZE = 90

const SETTINGS = {
  IS_CUSTOM: true,
  MAP_PATH: 'stach/map.png',
  // DEFAULT_FIGURE_BG: 'circle',

  MAX_UNIT_HP: 1,
  VISION_RADIUS: CELL_SIZE * 1.6,
  CAPITAL_SPECIAL_VISION: false,
  // may be left empty, then _pop_ wont be applied
  POP_PROP: null,

  MAX_TECH_LVL: 3,
  DEFAULT_LINE_COLOR: 'white',
} 

const DEFAULT = {
  /* filled up later */
  buildings: [],
  /* filled up later */
  units: [],
  noHealth: [
    KW.GRAVE_UNIT,
    KW.WRECK_UNIT,
    // '_unknown_bonus',
  ],
  wreckUnit: [
  ],
  noGrave: [
    // 'Колония',
    // 'Мир-кузница',

    // 'Король',
    // 'Ферзь',
    // 'Ладья',
    // 'Слон',
    // 'Конь',
    // 'Пешка',
  ],
  noUpkeep: [
    KW.GRAVE_UNIT,
  ],
}

// https://en.wikipedia.org/wiki/List_of_emojis
// https://emojipedia.org/fantasy-magic
const EMOJI_IMAGES = {
  // здания людей
  // [KW.CAPITAL]: '🌟',
  // 🏙️ 🌃🏛️❔
  // Аванпост?
  'Колония': '🏘️',
  'Мир-кузница': '🏭',

  'Магараджа': '🌞',
  'Король': '👑',
  'Ферзь': '⚜️',
  'Ладья': '🗿',
  'Слон': '🐘',
  'Конь': '🐴',
  'Пешка': '♟️',
  // 🏛️
  // 🛰️📡
}

/** usually it means prices */
const OBJ_CATEGORIES = {
  UNITS: {
    // _none_: [
    // ],
    _default_: [
      'Пешка',
      'Конь',
      'Слон',
    ],
    элитное: [
      'Ладья',
      'Ферзь',
      'Король',
    ],
  },
  BUILDINGS: {
    // _none_: [
    //   // KW.GRAVE_UNIT,
    //   // KW.WRECK_UNIT,
    //   // '_unknown_bonus',
    // ],
    _default_: [
      "Колония",
      "Мир-кузница",
    ],
  }
}

const CATEGORY_PRICES = {
  UNITS: {
    _default_: [
      // ['Обычное_производство', -1]
    ], 
    элитное: [
      // ['Элитное_производство', -1]
    ], 
  },
  BUILDINGS: {
    _default_: [
    ],
  }
}

const EFFECT_LISTS = {
  // статичные эффекты, нам важно текущее значение
  static: [
    'Очки_командования',
  ],
  // добывается, фактически показывает прибыль ресурса
  resources: [
    "Минералы",
  ],
  local: [
    KW.VISION,
    "Обычное_производство",
    "Элитное_производство",
    "Строитель",
  ],
}

const UNIT_UPKEEP = 1
const UNDO_POP_USAGE = ['Рабочие', 1]
const DICT_COMMON = {

  '_upkeep_': {
    '_building_': {
    },
    '_unit_': {
      // Очки_командования: -1,
    }
  },

  '_building_': {
  },
  '_unit_': {
  },

  [KW.WRECK_UNIT]: {
  },

  // здания

  "Колония": {
    [KW.COST]: {
      Минералы: 5,
    },
    Минералы: 2,
    // Очки_командования: 1,

    Обычное_производство: 2,
  }, 

  "Мир-кузница": {
    [KW.COST]: {
      Минералы: 15,
    },
    Минералы: 6,
    // Очки_командования: 3,

    Обычное_производство: 2,
    Элитное_производство: 1,
  }, 
  
  // фигуры

  "Король": {
    [KW.COST]: {
      Минералы: 12,
    },
    // Очки_командования: 2,
  },

  "Ферзь": {
    [KW.COST]: {
      Минералы: 9,
    },
    [KW.VISION]: CELL_SIZE * 2.7,
  },

  "Ладья": {
    [KW.COST]: {
      Минералы: 5,
    },
    [KW.VISION]: CELL_SIZE * 2.5,
  },
  
  "Слон": {
    [KW.COST]: {
      Минералы: 3,
    },
    [KW.VISION]: CELL_SIZE * 2,
  },

  "Конь": {
    [KW.COST]: {
      Минералы: 3,
    },
  },

  "Пешка": {
    [KW.COST]: {
      Минералы: 1,
    },
    [KW.VISION]: CELL_SIZE,
    Строитель: 1,
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

const TECH_EFFECTS = {
  // нулевой уровень
  "МОЩЬ": {
    [KW.COST]: {

    },
    "1": [
      "Юнит: Слон",
    ],
    "2": [
      "Юнит: Ладья",
      "Здание: Мир-кузница",
    ],
    "3": [
      "Юнит: Ферзь",
    ],
  },
  "ХИТРОСТЬ": {
    "1": [
      "Юнит: Конь",
    ],
    "2": [
      "Юнит: Дозорный",
      "Здание: Мир-кузница",
    ],
    "3": [
      "Юнит: Король",
    ],
  },
}