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
KW
*/

/// <reference path="../../index.js"/>
/* global
USER_RESOURCES
NPCPlayers listPlayers
userEffectsObj
*/

const SETTINGS = {
  IS_CUSTOM: true,
  MAP_PATH: 'stach/map.png',
  // DEFAULT_FIGURE_BG: 'circle',

  MAX_UNIT_HP: 1,
  VISION_RADIUS: 100,
  CAPITAL_SPECIAL_VISION: false,
  // may be left empty, then _pop_ wont be applied
  POP_PROP: null,
} 

const DEFAULT = {
  /* filled up later */
  buildings: [],
  /* filled up later */
  units: [],
  noHealth: [
    KW.GRAVE_UNIT,
    KW.WRECK_UNIT,
    // '_unknown_bonus',
  ],
  wreckUnit: [
  ],
  noGrave: [
  ],
  noUpkeep: [
    KW.GRAVE_UNIT,
  ],
}

// https://en.wikipedia.org/wiki/List_of_emojis
// https://emojipedia.org/fantasy-magic
const EMOJI_IMAGES = {
  // здания людей
  [KW.CAPITAL]: '👑',
  'Город': '🏘️',
  'Кузница': '🏭',

  'Король': '♔',
  'Ферзь': '♕',
  'Ладья': '♖',
  'Слон': '♗',
  'Конь': '♘',
  'Пешка': '♙',
  // 🛰️📡
}

const CATEGORY_PRICES = {
  UNITS: {
    _default_: [], 
  },
  BUILDINGS: {
    _default_: [
    ],
  }
}

/** usually it means prices */
const OBJ_CATEGORIES = {
  UNITS: {
    _none_: [
    ],
    _default_: [
      'Король',
      'Ферзь',
      'Ладья',
      'Слон',
      'Конь',
      'Пешка',
    ],
  },
  BUILDINGS: {
    _none_: [
      KW.GRAVE_UNIT,
      KW.WRECK_UNIT,
      // '_unknown_bonus',
    ],
    _default_: [
      "Город",
      "Кузница",
    ],
  }
}

const EFFECT_LISTS = {
  // статичные эффекты, нам важно текущее значение
  static: [
    // 'Население',
    // 'Недовольство',
    // 'Рабочие',
  ],
  // добывается, фактически показывает прибыль ресурса
  resources: [
    "Пешки",
  ],
  local: [
    // KW.ATK,
    // KW.DEF,
    // KW.AP,
    // KW.DIST,
    // "ХП",
    // KW.REGEN,
  ],
}

const UNIT_UPKEEP = 1
const UNDO_POP_USAGE = ['Рабочие', 1]
const DICT_COMMON = {

  '_upkeep_': {
    '_building_': {
      // 'Рабочие': -1,
    },
    '_unit_': {
      // 'Еда': -UNIT_UPKEEP,
    }
  },

  '_building_': {
  },
  '_unit_': {
  },

  [KW.WRECK_UNIT]: {
  },

}

const onEndTurnCb = () => {
  for(let player of listPlayers()) {
    if(NPCPlayers.includes(player)) continue
    const sum = userEffectsObj.sumEffects(player)
    for(let [effName, v] of Object.entries(sum)) {
      if(EFFECT_LISTS.resources.includes(effName)) {
        if(typeof USER_RESOURCES[player][effName] !== 'number') {
          USER_RESOURCES[player][effName] = 0
        }
        if(USER_RESOURCES[player][effName] + +v < 0) {
          USER_RESOURCES[player][effName] = 0
          continue
        }
        USER_RESOURCES[player][effName] += +v
      }

    }
  }
}

const TECH_EFFECTS = {}