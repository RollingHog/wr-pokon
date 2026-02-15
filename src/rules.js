/* exported 
DICT_COMMON 
CATEGORY_PRICES OBJ_CATEGORIES 
EFFECT_LISTS DEFAULT 
MAX_UNIT_HP MAP_PATH POP_PROP 
TECH_EFFECTS
*/

/// <reference path="../src/keywords.js"/>
/* global
KW
*/

const SETTINGS = {
  IS_CUSTOM: false,
  MAP_PATH:  './map/map.png',
  // DEFAULT_FIGURE_BG: 'circle',

  MAX_UNIT_HP: 10,
  // VISION_RADIUS: 100,
  // CAPITAL_SPECIAL_VISION: false,

  // may be left empty, then _pop_ wont be applied
  // POP_PROP: null,
} 


const DEFAULT = {
  buildings: [
   
  ],
  units: [
    'default_unit',
    'Пехота',
    'Стрелки',
    'Инженеры',
    'Маги',
    'Разведчики',
    'Шпион',
    'Элита',

    'Командир',
    'Зверь',
    'Шестеренка',
    'Демон',
    'Раб',
    // 'Дирижабль',
  ],
  noHealth: [
    'build_slot',
    KW.GRAVE_UNIT,
    '_unknown_bonus',
  ],
  noGrave: [
    'Зверь',
    'Шестеренка',
  ]
}

const CATEGORY_PRICES = {
  UNITS: {
    _default_: [
      ['Еда', 2],
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
      'Жители',
      'Солдат',
      'Маг',
    ],
  },
  BUILDINGS: {
    _none_: [
      KW.GRAVE_UNIT,
      KW.WRECK_UNIT,
      '_build_slot',
      '_unknown_bonus',
    ],
    _default_: [
    'Аванпост',
    'Деревня',
    'Город',
    'Столица',

    'Дом',
    'Склад',

    'Казарма',
    'Школа_шпионов',
    'Магическая_академия',

    // 'Мосты',
    // 'Дороги',
    'Стена',

    'Ферма',
    'Охотник',
    'Железная_шахта',
    'Каменоломня',
    'Лесопилка',

    'Госпиталь',
    'Кузница',
    'Уникальное_здание',
    // 'Ферма_водорослей',
    ],
  }
}

const EFFECT_LISTS = {
  // статичные эффекты, нам важно текущее значение
  static: [
    'Лимит населения',
    'Хранилище',
  ],
  // добывается, фактически показывает прибыль ресурса
  resources: [
    "Еда",
    "Железо",
    "Камень",
    "Дерево",
    "Рабы",
    // "Лошади",
  ],
  local: ["ХП"],
}

const DICT_COMMON = {
  _building_: [],
  _unit_: [
    ["Еда", -10]
  ],
  Столица:
    [
      ["Еда", 30],
      ["Дерево", 3],
      ["Лимит населения", 60],
      ["Хранилище", 30],
    ],

  Дом:
    [
      ["Лимит населения", 20],
    ],

  Склад:
    [
      ["Хранилище", 15],
    ],

  Магическая_академия:
    [
      ["Кристаллы", 1],
    ],

  Железная_шахта:
    [
      ["Железо", 1],
    ],

  Каменоломня:
    [
      ["Камень", 2],
    ],

  Лесопилка:
    [
      ["Дерево", 3],
    ],

  Ферма:
    [
      ["Еда", 7],
      // ["Лошади", 1],
    ],

  Охотник:
    [
      ["Еда", 2],
    ],

};

const DICT_USER = {
  Егг: {
    Столица:
      [
        ["Кристаллы", 2],
        ["Еда", 10],
      ],
  },

  Кшиштоф: {
    Столица:
      [
        ["Кристаллы", 2],
        ["Еда", 10],
      ],
  },

};
