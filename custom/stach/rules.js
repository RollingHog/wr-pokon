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
KW KW_LOCALS
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
  NO_GRAVES: true, 

  MAX_TECH_LVL: 3,
  DEFAULT_LINE_COLOR: 'white',
  CANNOT_ACT_AFTER_PLACEMENT: true,
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
  'Кузница': '🏭',
  
  // ⛰️🔰🌐🌜
  'Боевая_станция': '🛡️',
  // жрет снабжение
  'Жилая_станция': '🌐',
  'Синтезатор': '⚗️',
  'Телепорт': '💫',
  
  // за ход можно создать "Снабжение" барьеров
  'Барьер': '🔶',
  'Лотос': '🏵️',

  'Магараджа': '☸️',
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
    элитные: [
      'Ладья',
      'Ферзь',
      'Король',
      'Магараджа',
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
      "Кузница",
    ],
    пристройки: [
      "Жилая_станция",
      "Боевая_станция",
      "Синтезатор",
      "Телепорт",

      "Барьер",
      "Лотос",
    ],
  }
}

const CATEGORY_PRICES = {
  UNITS: {
    _default_: [
      // ['Обычное_производство', -1]
    ], 
    элитные: [
      // ['Элитное_производство', -1]
    ], 
  },
  BUILDINGS: {
    _default_: [
    ],
    пристройки: [
    ],
  }
}

const EFFECT_LISTS = {
  // статичные эффекты, нам важно текущее значение
  static: [
    'Снабжение',
  ],
  // добывается, фактически показывает прибыль ресурса
  resources: [
    "Минералы",
  ],
  local: [
    ...KW_LOCALS,
    "Производство",
    "Элитное_производство",
    "Строитель",
    "Рентген",
  ],
}

const UNIT_UPKEEP = 1
const UNDO_POP_USAGE = ['Рабочие', 1]
const DICT_COMMON = {

  '_upkeep_': {
    '_building_': {
    },
    '_unit_': {
      Снабжение: -1,
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
    Снабжение: 3,

    Производство: 1,
  }, 

  "Кузница": {
    [KW.COST]: {
      Минералы: 14,
    },
    Минералы: 6,
    Снабжение: 2,

    Производство: 1,
    Элитное_производство: 1,
  }, 

  // пристройки

  "Боевая_станция": {
    [KW.COST]: {
      Минералы: 3,
    },
    [KW.INIT_HP]: 2,
    Снабжение: -0.5,
    [KW.VISION]: CELL_SIZE * 2,
  }, 

  "Жилая_станция": {
    [KW.COST]: {
      Минералы: 4,
    },
    // [KW.VISION]: CELL_SIZE * 1.6,
    Снабжение: 2,
  }, 

  "Синтезатор": {
    [KW.COST]: {
      Минералы: 6,
    },
    Снабжение: -0.5,
    Минералы: 2,
  },

  "Телепорт": {
    [KW.COST]: {
      Минералы: 7,
    },
    Снабжение: -0.5,
  }, 

  "Барьер": {
    [KW.COST]: {
      Минералы: 0,
    },
    [KW.VISION]: CELL_SIZE,
    [KW.INIT_HP]: 2,
    Снабжение: -0.5,
  },

  "Лотос": {
    [KW.COST]: {
      Минералы: 6,
    },
    Минералы: 2,
    Снабжение: 1,
  }, 
  
  // фигуры
  // элитные

  "Король": {
    [KW.COST]: {
      Минералы: 5,
    },
    Снабжение: 2,
  },

  "Магараджа": {
    [KW.COST]: {
      Минералы: 12,
    },
    [KW.VISION]: CELL_SIZE * 2.7,
    [KW.INIT_HP]: SETTINGS.MAX_UNIT_HP + 2,
  },

  "Ферзь": {
    [KW.COST]: {
      Минералы: 9,
    },
    [KW.VISION]: CELL_SIZE * 2.7,
    [KW.INIT_HP]: SETTINGS.MAX_UNIT_HP + 2,
  },

  "Ладья": {
    [KW.COST]: {
      Минералы: 5,
    },
    [KW.VISION]: CELL_SIZE * 2.5,
    [KW.INIT_HP]: SETTINGS.MAX_UNIT_HP + 1,
    Строитель: 1,
  },

  // обычные
  
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
    const sum = userEffectsObj.sumPlayerEffects(player)
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
    "0": [
      "Юнит: Пешка",
      "Здание: Колония",
    ],
    "1": [
      "Юнит: Слон",
    ],
    "2": [
      "Юнит: Ладья",
      "Здание: Кузница",
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
      "Юнит: Король",
      "Здание: Кузница","Здание: Кузница",
    ],
    "3": [
      // "Юнит: Дозорный",
    ],
  },
  АЛМАЗНЫЕ_ГОРОДА: {
    1: [
      "Здание: Боевая_станция",
      "Здание: Жилая_станция",
    ],
    2: [
      "Здание: Барьер",
    ],
    3: [
      "Юнит: Магараджа",
      "Здание: Лотос",
    ],
  }
}