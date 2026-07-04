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

const CELL_SIZE = 90

const SETTINGS = {
  IS_CUSTOM: true,
  MAP_PATH: 'stars/map.png',
  // DEFAULT_FIGURE_BG: 'circle',

  MAX_UNIT_HP: 3,
  VISION_RADIUS: CELL_SIZE * 1.5,
  CAPITAL_SPECIAL_VISION: false,
  // may be left empty, then _pop_ wont be applied
  POP_PROP: null,
  // NO_GRAVES: true, 

  MAX_TECH_LVL: 3,
  // DEFAULT_LINE_COLOR: 'white',
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
  [KW.WRECK_UNIT]: '🔩',

  // персонажи
  "Пси-клинок": "⚔️",
  "Созерцатель": "👁️",
  "Кровотворец": "🙌",
  "Хранитель": "🎓",

  // враги
  "Тень_Усопшего":"👤",
  "Огонёк-искуситель":"😈",
  "Костяной_паук":"🕷️",

  "Звёздный_зомби":"🧟",
  "Удав_Пустоты":"🐍",
  "Демон-диверсант":"👹",

  // "Лёгкие_Станции":"🕳️",
  // "Король_Склепа":"💀👑",
  "Око_Аннигиляции":"👁️",
  
  // предметы
  "Обзор":"👁️‍🗨️",


  // здания
  "Центр_управления":"🧠",

  "Центр_связи":"📡",
  "Карта_корабля":"🗺️",

  "Движетель":"☀️",
  "Цепи_движетеля":"⛓️",

  "Алтарь_Покоя":"🕯️",
  "Обсерватория_Пустоты":"🌌", //🪐
  "Жилая_секция":"🏡",
  "Кровать":"🛏️",
  "Целительная":"⚕️", //🩺
  
  "Кровоточащий_Колодец":"♥️",
  "Кровь_колодца": "🩸",

  "Чертог_Скрижалей":"📚",
  "Скрижаль":"📜",
  "Пульсар_Душ":"🔮",
  "Провод1":"🔵",
  "Провод2":"🟣",
  "Оранжерея":"🌿",

  "Портальный_чертог":"⏩",
  "Звёздная_Арка":"💫",
  
  "Разрыв":"🕳️",
}

const WEATHER_EFF = {}


/** usually it means prices */
const OBJ_CATEGORIES = {
  UNITS: {
    // _none_: [
    // ],
    // _default_: [
    // ],
    Персонажи: [
      "Пси-клинок",
      "Созерцатель",
      "Кровотворец",
      "Хранитель",
    ],
    Предметы: [
      "Скрижаль",
      "Обзор",
    ],
    Враги: [
      "Тень_Усопшего",
      "Огонёк-искуситель",
      "Костяной_паук",

      "Звёздный_зомби",
      "Удав_Пустоты",
      "Демон-диверсант",

      "Око_Аннигиляции",
    ],
  },
  BUILDINGS: {
    _none_: [
      KW.GRAVE_UNIT,
    ],
    _default_: [
      "Центр_управления",
      "Центр_связи",
      
      "Движетель",
      
      "Алтарь_Покоя",
      "Обсерватория_Пустоты",
      "Жилая_секция",
      "Целительная",
      
      "Кровоточащий_Колодец",
      
      "Чертог_Скрижалей",
      "Пульсар_Душ",
      "Оранжерея",
      "Портальный_чертог",
      
    ],
    Декорации: [
      "Карта_корабля",
      "Цепи_движетеля",
      "Провод1",
      "Провод2",
      "Кровать",
      "Кровь_колодца",
      "Звёздная_Арка",

      "Разрыв",
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
    Декорации: [],
  }
}

const EFFECT_LISTS = {
  // статичные эффекты, нам важно текущее значение
  static: [
  ],
  // добывается, фактически показывает прибыль ресурса
  resources: [
    // "Еда",
    // "Железо",
    // "Дерево",
    // "Рабы",
  ],
  local: [
    KW.ATK,
    KW.DEF,
    KW.AP,
    KW.DIST,
    "ХП",
    KW.REGEN,
    KW.VISION,
  ],
}

const PLAYER_VISION = CELL_SIZE * 2.1
const DICT_COMMON = {
   '_upkeep_': {
    '_building_': {
    },
    '_unit_': {
      // Снабжение: -1,
    }
  },

  '_building_': {
    [KW.VISION]: CELL_SIZE * 2.7
  },
  '_unit_': {
  },

  "Пси-клинок": {
    [KW.VISION]: PLAYER_VISION
  },
  "Созерцатель": {
    [KW.VISION]: PLAYER_VISION
  },
  "Кровотворец": {
    [KW.VISION]: PLAYER_VISION
  },
  "Хранитель": {
    [KW.VISION]: PLAYER_VISION
  },

  [KW.WRECK_UNIT]: {
  },

  // здания

  "Колония": {
  }, 
};

const TECH_EFFECTS = {}