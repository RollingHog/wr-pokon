/* exported 
DICT_COMMON SETTINGS EMOJI_IMAGES
CATEGORY_PRICES OBJ_CATEGORIES 
EFFECT_LISTS DEFAULT 
MAX_UNIT_HP MAP_PATH POP_PROP 
TECH_EFFECTS
*/

/// <reference path="../../src/keywords.js"/>
/* global
KW KW_RULES KW_LOCALS
*/

const CELL_SIZE = 120

const SETTINGS = {
  IS_CUSTOM: true,
  MAP_PATH: 'pokras-spc/map.png',
  IMAGE_ROOT: 'pokras-spc',
  // DEFAULT_FIGURE_BG: 'circle',

  MAX_UNIT_HP: 5,
  VISION_RADIUS: CELL_SIZE * 1.5,
  CAPITAL_SPECIAL_VISION: false,
  // may be left empty, then _pop_ wont be applied
  POP_PROP: null,
  // NO_GRAVES: true, 

  MAX_TECH_LVL: 3,
  DEFAULT_LINE_COLOR: 'white',
  // TITLE_ABOVE: true,
  CANNOT_ACT_AFTER_PLACEMENT: true,
} 


const DEFAULT = {
  /* filled up later */
  buildings: [],
  /* filled up later */
  units: [],
  noHealth: [
    // KW.BUILD_SLOT,
    KW.GRAVE_UNIT,
    KW.WRECK_UNIT,
    KW.INFO_UNIT,
    KW.TIMER_UNIT,
    // '_unknown_bonus',
  ],
  wreckUnit: [
  ],
  noGrave: [
  ],
  noUpkeep: [
  ],
}

const EMOJI_IMAGES = {
  [KW.GRAVE_UNIT]: '💀',
  // [KW.WRECK_UNIT]: '🔩',

  [KW.INFO_UNIT]: "ℹ️",
  // [KW.TIMER_UNIT]: "⏲️",
  
  "Колония": "🏙️",

}

const WEATHER_EFF = {}

/** usually it means prices */
const OBJ_CATEGORIES = {
  UNITS: {
    // _none_: [
    // ],
    // _default_: [
    // ],
  },
  BUILDINGS: {
    _none_: [
      KW.GRAVE_UNIT,
      // KW.WRECK_UNIT,
      KW.INFO_UNIT,
      // KW.TIMER_UNIT,
    ],
    _default_: [
      "Колония",
    ],
    Планеты: [
      "Горячий_мир",
      "Умеренный_мир",
      "Водный_мир",
      "Холодный_мир",
      "Безжизненный_мир",
      "Газовый_гигант",
    ],
  }
}

DEFAULT.noHealth = DEFAULT.noHealth
  .concat(OBJ_CATEGORIES.UNITS.Предметы)
  .concat(OBJ_CATEGORIES.BUILDINGS.Декор)

const CATEGORY_PRICES = {
  UNITS: {
    _default_: [], 
  },
  BUILDINGS: {
    _default_: [],
  }
}

const EFFECT_LISTS = {
  // статичные эффекты, нам важно текущее значение
  static: [
  ],
  // добывается, фактически показывает прибыль ресурса
  resources: [
    "Еда",
    "Металл",
  ],
  local: [
    // KW.ATK,
    // KW.DEF,
    // KW.AP,
    // KW.DIST,
    // KW.REGEN,
    ...KW_LOCALS
  ],
}

const DICT_COMMON = {
  '_upkeep_': {
    '_building_': {
    },
    '_unit_': {
      // Снабжение: -1,
    }
  },

  '_building_': {
  },
  '_unit_': {
  },

  "Колония": {
    [KW.OUTPUT_MULT]: "ЛВЛ/2"
  },

  "Горячий_мир"
    : {
      "Еда": 3
  },
  "Умеренный_мир"
    : {
  },

  // // игроки
  // 'И_Эктор': {
  //   "Вместилище": 3,
  //   [KW.MAX_HP]: 3,
  //   "Искра": 2,
  // },
};

// KW_RULES.setCommon(
//   ["Звёздный_зомби"],
//   { Зомби: 1 }
// )

// KW_RULES.setCommon(
//   [].concat(
//     OBJ_CATEGORIES.UNITS.Персонажи,
//     OBJ_CATEGORIES.UNITS.Враги,
//     // OBJ_CATEGORIES.BUILDINGS.Декор,
//     OBJ_CATEGORIES.BUILDINGS._default_,
//     OBJ_CATEGORIES.BUILDINGS.Устройства,
//   ),
//   { [KW.MAX_HP]: 3 }
// )


const TECH_EFFECTS = {}