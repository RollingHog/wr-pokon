/* exported 
DICT_COMMON DICT_USER
CATEGORY_PRICES OBJ_CATEGORIES 
EFFECT_LISTS DEFAULT 
MAX_UNIT_HP MAP_PATH POP_PROP
*/

/// <reference path="../src/keywords.js"/>
/* global
KW
*/

const MAP_PATH = './map/bnb/bnb.png'

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
    KW.GRAVE_UNIT,
    KW.WRECK_UNIT,
    'unknown_bonus',
    '_Маркер_недовольства',
  ],
  wreckUnit: [
    'Корабль_1',
    'Корабль_2',
    'Корабль_3',
    'Баллиста',
    'Катапульта',
    'Танк_Леонардо',
  ],
  noGrave: [
  ],
  // noEat: [
  // ],
}

const WEATHER_EFF = {}

const CATEGORY_PRICES = {
  UNITS: {
    _default_: [
      ['Население', 3],
      ['Железо', 1],
    ],
    Скот: [
      ['Еда', 4],
    ],
    Корабль: [
      ['Население', 'ЛВЛ'],
      ['Дерево', 'ЛВЛ*2'],
      ['Железо', 'ЛВЛ'],
    ],
    Осадная_машина: [

    ],
  },
  BUILDINGS: {
    _default_: [
      ['Дерево', 5],
      // ['Железо', 1],
    ],
    Аванпост: [
      ['Дерево', 15],
    ],
    Город: [
      ['Дерево', 60],
      ['Население', 3],
    ],
  }
}

const OBJ_CATEGORIES = {
  UNITS: {
    _none_: ['default_unit',],
    _default_: [

      'Пехота',
      'Стрелки',
      'Щитовик',
      'Разведчики',
      'Инженеры',
      
      // 'Танк_Леонардо',

      // 'Элита',
      // 'Демон',
      // 'Командир',
    ],
    Скот: [
      'Скот',
      'Кони',
      'Зверь',
      'Лютый_зверь',
    ],
    Осадная_машина: [
      'Баллиста',
      'Катапульта',
    ],
    Корабль: [
      'Корабль_1',
      'Корабль_2',
      'Корабль_3',
    ],
  },
  BUILDINGS: {
    _none_: [
      '_build_slot',
      KW.GRAVE_UNIT,
      KW.WRECK_UNIT,
      '_unknown_bonus',
      '_Маркер_недовольства',
      // 'Дорога',
    ],
    _default_: [

      KW.CAPITAL,

      // 'Дороги',
      'Стена',

      'Охотник',
      'Ферма',
      'Железная_шахта',
      'Лесопилка',
      'Сад',

      'Кузница',
      'Порт',
      // 'Казарма',
    ],
    Город: [
      'Город',
    ],
    Аванпост: ['Аванпост'],
  }
}

DEFAULT.units = Object.values(OBJ_CATEGORIES.UNITS).flat()
DEFAULT.buildings = Object.values(OBJ_CATEGORIES.BUILDINGS).flat()

const EFFECT_LISTS = {
  // статичные эффекты, нам важно текущее значение
  static: [
    // 'Лимит населения',
    'unit_count',
    'build_count',
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
    // "Лошади",
  ],
  local: [
    KW.ATK,
    KW.DEF,
    KW.DIST,
    "ХП",
    KW.REGEN,
  ],
}

const UNIT_UPKEEP = 3
const UNDO_POP_USAGE = [POP_PROP, 1]
const UNDO_UNIT_UPKEEP = ["Еда", UNIT_UPKEEP]
const DICT_COMMON = {
  _building_: [
    ['Рабочие', -1],
    [KW.REGEN, 2],
  ],
  _unit_: [
    ["Еда", -UNIT_UPKEEP],

    [KW.ATK, 0],
    [KW.DEF, 0],
  ],
  _pop_: [
    ["Еда", -0.5],
  ],
  [KW.CAPITAL]:
    [
      // компенсация
      [POP_PROP, 1],
      [POP_PROP, '+ЛВЛ'],
      ["Еда", 20],
      ["Дерево", 3],
    ],

  Город:
    [
      [POP_PROP, 1],
      [POP_PROP, '+ЛВЛ'],
    ],

  Аванпост:
    [
      // он больше обычного здания и требует людей для обслуживания
      [POP_PROP, -1],
      [POP_PROP, '+ЛВЛ'],
    ],

  _Маркер_недовольства:
    [
      [POP_PROP, 1],
      ['Недовольство', '+ЛВЛ'],
      [KW.LVL_DRIFT, -1],
    ],

  Железная_шахта:
    [
      ["Железо", 1],
      ["Дерево", -1],
    ],

  Лесопилка:
    [
      UNDO_POP_USAGE,
      ["Дерево", 3],
    ],

  Сад:
    [
      ["Еда", -1],
      ["Дерево", 2],
    ],

  Ферма:
    [
      ["Еда", 4],
    ],

  Охотник:
    [
      ["Еда", 2],
    ],

  //////////////// units

  Пехота: [
    [KW.ATK, 2],
    [KW.DEF, 2],
  ],
  Стрелки: [
    [KW.ATK, 2],
    [KW.DEF, 1],
    [KW.DIST, 1],
  ],
  Щитовик: [
    [KW.ATK, 2],
    [KW.DEF, 3],
  ],
  Разведчики: [
    [KW.ATK, 1],
    [KW.DEF, 0],
    [KW.DIST, 1],
  ],
  Инженеры: [
    [KW.ATK, 1],
    [KW.DEF, 0],
  ],

  Баллиста: [
    [KW.ATK, 3],
    [KW.DEF, 1],
    [KW.DIST, 2],
  ],
  Катапульта: [
    [KW.ATK, 0],
    [KW.DEF, 0],
  ],

  Скот: [
    UNDO_UNIT_UPKEEP,
    ['Еда', 1.6],
    [KW.REGEN, 1],
  ],
  Зверь: [
    [KW.ATK, 2],
    [KW.DEF, 0],
    [KW.REGEN, 1],
  ],

  Корабль_1: [
    [KW.ATK, 2],
    [KW.DEF, 2],
  ],
  Корабль_2: [
    [KW.ATK, 3],
    [KW.DEF, 3],
    [KW.DIST, 1],
  ],
  Корабль_3: [
    [KW.ATK, 4],
    [KW.DEF, 4],
    [KW.DIST, 2],
  ],

};

const DICT_USER = {
  Нью_Лоуландс: {
    [KW.CAPITAL]:
      [
      ],
  },

  Синие: {
    [KW.CAPITAL]:
      [
      ],
  },

};
