/* exported 
DICT_COMMON DICT_USER GRAVE_UNIT
EFFECT_LISTS DEFAULT
MAX_UNIT_HP MAP_PATH
*/

const MAP_PATH = './map/bnb/bnb.png'
const GRAVE_UNIT = 'grave'
const MAX_UNIT_HP = 10

// may be left empty, then _pop_ wont be applied
const POP_PROP = 'Население'

const DEFAULT = {
  buildings: [
    'build_slot',
    'grave',
    'unknown_bonus',
    'Деревня',
    'Город',
    'Столица',

    // 'Казарма',

    // 'Мосты',
    // 'Дороги',
    'Стена',
    
    'Ферма',
    'Охотник',
    'Железная_шахта',
    'Лесопилка',

    'Кузница',
  ],
  units: [
    'default_unit',
    'Пехота',
    'Стрелки',
    // 'Инженеры',
    // 'Маги',
    // 'Демон',
    'Щитовик',
    'Элита',
    // 'Командир',

    'Корабль_1',
    'Корабль_2',
    // 'Корабль_3',
  ],
  noHealth: [
    'build_slot',
    GRAVE_UNIT,
    'unknown_bonus',
  ],
  noGrave: [
  ],
}

const EFFECT_LISTS = {
  // статичные эффекты, нам важно текущее значение
  static: [
    // 'Лимит населения',
  ],
  // добывается, фактически показывает прибыль ресурса
  resources: [
    "Еда",
    "Железо",
    "Дерево",
    "Рабы",
    // "Лошади",
  ],
  local: ["ХП"],
}

const DICT_COMMON = {
  _building_: [],
  _unit_: [
    ["Еда", -10],
  ], 
  _pop_: [
    ["Еда", -1],
  ],
  Столица:
  [
      [POP_PROP, '+ЛВЛ'],
      ["Еда", 30],
      ["Дерево", 3],
      // ["Лимит населения", 60],
    ],

  Железная_шахта:
    [
      ["Железо", 1],
      [POP_PROP, -1],
    ],

  Лесопилка:
    [
      ["Дерево", 3],
      [POP_PROP, -1],
    ],

  Ферма:
    [
      ["Еда", 7],
      [POP_PROP, -1],
      // ["Лошади", 1],
    ],

  Охотник:
    [
      ["Еда", 2],
      [POP_PROP, -1],
    ],

};

const DICT_USER = {
  Красные: {
    Столица:
      [
      ],
  },

  Синие: {
    Столица:
      [
      ],
  },

};
