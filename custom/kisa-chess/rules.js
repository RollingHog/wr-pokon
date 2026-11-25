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

/// <reference path="../../src/rules.d.ts"/>

/// <reference path="../../index.js"/>
/* global
USER_RESOURCES
USER_TECH_LVLS
*/

/** Размер клетки в пикселях карты. Подгони под свою map.png. */
const CELL_SIZE = 72

/** @type {Settings} */
const SETTINGS = {
  IS_CUSTOM: true,
  MAP_PATH: 'kisa-chess/map.png',
  // Картинки берутся из custom/kisa-chess/images/{units,buildings}/<имя>.png.
  // Путь IMAGE_ROOT считается относительно custom/kisa-chess.html.
  IMAGE_ROOT: 'kisa-chess',

  MAX_UNIT_HP: 1,
  VISION_RADIUS: CELL_SIZE * 12,
  CAPITAL_SPECIAL_VISION: false,
  POP_PROP: null,
  NO_GRAVES: true,

  MAX_TECH_LVL: 1,
  DEFAULT_LINE_COLOR: 'white',
  TITLE_ABOVE: true,
  CANNOT_ACT_AFTER_PLACEMENT: true,

  DEFAULT_FOG_OF_WAR: false,
  AUTOSAVE: false,

  // Квадратная сетка поверх карты — нужна для шахматных ходов.
  // offsetX/offsetY подгони под рамку своей карты.
  SQUARE_GRID: {
    cellWidth: CELL_SIZE,
    cellHeight: CELL_SIZE,
    offsetX: 0,
    offsetY: 0,
    cols: 24,
    rows: 24,
    lineWidth: 1,
    label: false,
    showGrid: false,
    showUnitCell: false,
  },
}

/** @type {RulesDefaults} */
const DEFAULT = {
  /* filled up later */
  buildings: [],
  /* filled up later */
  units: [],
  noHealth: [
    KW.GRAVE_UNIT,
    KW.WRECK_UNIT,
  ],
  wreckUnit: [],
  noGrave: [],
  noUpkeep: [
    KW.GRAVE_UNIT,
  ],
}

/**
 * @type {EmojiImages}
 */
const EMOJI_IMAGES = {}

/**
 * Базовый набор фигур и соответствующие им наборы ходов движка.
 * @type {Array<[string, string]>}
 */
const CHESS_PIECES = [
  ['Король', KW.MOVE_SETS.Король],
  ['Ферзь', KW.MOVE_SETS.Ферзь],
  ['Ладья', KW.MOVE_SETS.Ладья],
  ['Слон', KW.MOVE_SETS.Слон],
  ['Конь', KW.MOVE_SETS.Конь],
  ['Пешка', KW.MOVE_SETS.Пешка],
]

const SIDES = [
  { suffix: 'Б', category: 'Белые' },
  { suffix: 'Ч', category: 'Черные' },
]

/** @type {RulesDict} */
const DICT_COMMON = {
  '_upkeep_': {
    '_building_': {},
    '_unit_': {},
  },
  '_building_': {},
  '_unit_': {},
  [KW.WRECK_UNIT]: {},
}

for (const side of SIDES) {
  for (const [base, moveSet] of CHESS_PIECES) {
    DICT_COMMON[`${base}_${side.suffix}`] = {
      [KW.MOVE_SET]: moveSet,
      [KW.VISION]: CELL_SIZE * 12,
    }
  }
}

/** @type {ObjCategories} */
const OBJ_CATEGORIES = {
  UNITS: {
    'Белые': CHESS_PIECES.map(([base]) => `${base}_Б`),
    'Черные': CHESS_PIECES.map(([base]) => `${base}_Ч`),
  },
  BUILDINGS: {
    _default_: [],
  },
}

const CATEGORY_PRICES = {
  UNITS: {
    'Белые': [],
    'Черные': [],
    _default_: [],
  },
  BUILDINGS: {
    _default_: [],
  },
}

const EFFECT_LISTS = {
  static: [],
  resources: [],
  local: [...KW_LOCALS],
}

const TECH_EFFECTS = {}

const onEndTurnCb = () => {
}
