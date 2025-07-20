/* exported 
DICT_COMMON DICT_USER GRAVE_UNIT WRECK_UNIT
EFFECT_LISTS DEFAULT
MAX_UNIT_HP MAP_PATH
*/

const MAP_PATH = './map/bnb/bnb.png'
const GRAVE_UNIT = '_могила'
const WRECK_UNIT = '_обломки'
const MAX_UNIT_HP = 10

// may be left empty, then _pop_ wont be applied
const POP_PROP = 'Население'

const DEFAULT = {
  buildings: [
    '_build_slot',
    GRAVE_UNIT,
    WRECK_UNIT,
    '_unknown_bonus',
    'Аванпост',
    'Город',
    'Столица',

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
  units: [
    'default_unit',
    'Пехота',
    'Стрелки',
    'Щитовик',
    'Разведчики',
    'Инженеры',

    'Баллиста',
    'Катапульта',

    'Зверь',
    'Скот',
    // 'Элита',
    // 'Демон',
    // 'Командир',

    'Корабль_1',
    'Корабль_2',
    // 'Корабль_3',
  ],
  noHealth: [
    'build_slot',
    GRAVE_UNIT,
    WRECK_UNIT,
    'unknown_bonus',
  ],
  wreckUnit: [
    'Корабль_1',
    'Корабль_2',
    'Корабль_3',
    'Баллиста',
    'Катапульта',
  ],
  noGrave: [
  ],
  // noEat: [
  // ],
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

const UNIT_UPKEEP = 3

const DICT_COMMON = {
  _building_: [
    [POP_PROP, -1],
  ],
  _unit_: [
    ["Еда", -UNIT_UPKEEP],
  ],
  _pop_: [
    ["Еда", -0.5],
  ],
  Столица:
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
      // он больше обычного здания, все же
      [POP_PROP, -1],
      [POP_PROP, '+ЛВЛ'],
    ],

  Железная_шахта:
    [
      ["Железо", 2],
    ],

  Лесопилка:
    [
      ["Дерево", 3],
    ],

  Сад:
    [
      ["Еда", 2],
      ["Дерево", 2],
    ],

  Ферма:
    [
      ["Еда", 7],
    ],

  Охотник:
    [
      ["Еда", 2],
    ],

  Скот:
    [
      // чтобы компенсировать затраты еды на содержание скота как юнита
      ["Еда", UNIT_UPKEEP + 1],
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
