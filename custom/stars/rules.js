/* exported 
DICT_COMMON 
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
  
} 

const MAP_PATH = './map/stars/map.png'

const MAX_UNIT_HP = 10

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
  ],
}

const WEATHER_EFF = {}

const CATEGORY_PRICES = {
  UNITS: {
    _default_: [
      ['Население', 3],
      ['Железо', 1],
    ],
    Корабль: [
      ['Население', 'ЛВЛ'],
      ['Дерево', 'ЛВЛ*2'],
      ['Железо', 'ЛВЛ'],
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
      'Царь_птица',
      'Щитовик',
    ],
  },
  BUILDINGS: {
    _none_: [
      // '_build_slot',
      KW.WRECK_UNIT,
      // '_unknown_bonus',
    ],
    Город: [
      "Кузница"
    ],
    _default_: [
      'Стена',
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
    "Железо",
    "Дерево",
    "Рабы",
  ],
  local: [
    KW.ATK,
    KW.DEF,
    KW.AP,
    KW.DIST,
    "ХП",
    KW.REGEN,
  ],
}

const UNIT_UPKEEP = 3
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
    [KW.DEF, 0],
  ],
  _pop_: [
    ["Еда", -0.5],
  ],
  [KW.CAPITAL]:
    [
      [POP_PROP, '+ЛВЛ'],
      ["Еда", 25],
      ["Дерево", 3],
    ],

  Стена:
    [
    ],

  //////////////// units

  Пехота: [
    [KW.ATK, 2],
    [KW.DEF, 2],
    [KW.AP, 2],
  ],
};

const TECH_EFFECTS = {}