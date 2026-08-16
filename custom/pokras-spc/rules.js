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
    "Кремний",
    "Уран",


    "Наука",
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
    [KW.OUTPUT_MULT]: "ЛВЛ/2",
    "Еда": "ЛВЛ/2",
    "Наука": "ЛВЛ/2",
  },

  /*
  A – горячий мир
  B – умеренный мир
  С – водный мир
  D – холодный мир
  E – безжизненный мир, голая скала
  F – газовый гигант.

  1. Металлы (М)
  2. Кремний (К)
  3. Редкоземельные элементы (РЭ)
  4. ВСе но понемногу

  больш 6 мал 3 болуниверс все 3 малуниверс больш +3
  базовые ресурсы (М, К) всегда есть за счет больш
  сумма 9

  A 2d4: (1 + 4) = 5
  B 2d4: (4 + 2) = 6
  C 2d4: (3 + 1) = 4
  D 2d4: (3 + 4) = 7
  E 2d4: (4 + 4) = 8
  F 2d4: (2 + 3) = 5

  */

  "Горячий_мир": {
    "Металл": 8,
    "Кремний": 1,
  },
  "Умеренный_мир": {
    "Кремний": 5,
    "Металл": 2,
    "Уран": 1,
  },
  "Водный_мир": {
    "Металл": 3,
    "Уран": 2,
    "Кремний": 1,
  },
  "Холодный_мир": {
    "Уран": 3,
    "Металл": 1,
    "Кремний": 1,
  },
  "Безжизненный_мир": {
    "Металл": 4,
    "Кремний": 4,
    "Уран": 1,
  },
  "Газовый_гигант": {
    "Кремний": 5,
    "Уран": 2,
    "Металл": 1,
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


const TECH_EFFECTS = {
  Величие: {
    0: [
      // Планеты
      "Здание: Горячий_мир",
      "Здание: Умеренный_мир",
      "Здание: Водный_мир",
      "Здание: Холодный_мир",
      "Здание: Безжизненный_мир",
      "Здание: Газовый_гигант",
    ],
    1: [
      [
        "Газовый_гигант", 
        [
          ["Еда", 1]
        ]
      ],
      "Юнит: Собака"
    ]
  }
}