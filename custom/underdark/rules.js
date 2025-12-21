/* exported 
DICT_COMMON SETTINGS EMOJI_IMAGES
CATEGORY_PRICES OBJ_CATEGORIES 
EFFECT_LISTS DEFAULT 
MAX_UNIT_HP MAP_PATH POP_PROP 
TECH_EFFECTS
*/

/// <reference path="../../src/keywords.js"/>
/* global
KW
*/

const SETTINGS = {
  // DEFAULT_FIGURE_BG: 'circle',
  IS_CUSTOM: true,
  VISION_RADIUS: 100,
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
    // KW.GRAVE_UNIT,
    KW.WRECK_UNIT,
    '_unknown_bonus',
  ],
  wreckUnit: [
  ],
  noGrave: [
  ],
  noUpkeep: [
    "Жители",
  ],
}

const EMOJI_IMAGES = {
  [KW.CAPITAL]: '👑',
  'Мастерская': '⚒️',
  'Ферма': '🌾',
  'Деревня': '🏘️',
  'Крепость': '🏯',
  'Солдат': '⚔️',

  /** монстры */
  "Василиск": "🐉",
}

const WEATHER_EFF = {}

const CATEGORY_PRICES = {
  UNITS: {
    _default_: [
      ['Еда', 2],
      ['Ремесло', 1],
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
    ],
    _default_: [
      'Солдат',
      'Жители',
    ],
  },
  BUILDINGS: {
    _none_: [
      // '_build_slot',
      KW.WRECK_UNIT,
      // '_unknown_bonus',
    ],
    Город: [
      "Столица",
      "Деревня",
      "Ферма",
      "Мастерская",
      "Крепость",
    ],
    _default_: [
      // 'Стена',
    ],

  }
}

const EFFECT_LISTS = {
  // статичные эффекты, нам важно текущее значение
  static: [
    // 'Лимит населения',
    'unit_count',
    'build_count',
    'unit_to_upkeep',
    'build_to_upkeep',

    'Население',
    'Недовольство',
    'Рабочие',
  ],
  // добывается, фактически показывает прибыль ресурса
  resources: [
    "Еда",
    "Ремесло",
    // "Рабы",
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
  [KW.CAPITAL]:
    [
      // [POP_PROP, '+ЛВЛ'],
      ["Еда", 2],
      ["Ремесло", 2],
    ],

  Жители:
    [
      ["Еда", -0.5],
      ['Рабочие', 1],
    ],

  //////////////// units

  Пехота: [
    [KW.ATK, 2],
    // [KW.DEF, 2],
    [KW.AP, 2],
  ],
};

const TECH_EFFECTS = {}