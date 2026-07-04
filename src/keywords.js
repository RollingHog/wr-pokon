/* exported 
KW KW_LOCALS KW_RULES
*/

const KW = /** @type {const} */ ({
  GRAVE_UNIT: '_могила',
  WRECK_UNIT: '_обломки',
  BUILD_SLOT: '_build_slot',
  
  CAPITAL: 'Столица',

  COST: '_cost_',
  LOOT: '_loot_',

  INIT_HP: '_init_hp_',
  MAX_HP: '_max_hp_',

  ATK: "Атака",
  DEF: 'Защита',
  /** action points */
  AP: 'АР',
  DIST: 'Дистанция',
  REGEN: 'Регенерация',

  LVL_DRIFT: 'Сдвиг уровня',
  VISION: 'Радиус зрения',
  NO_VISION: -1,
})

const KW_LOCALS = [
  KW.VISION,
  KW.INIT_HP,
]

const KW_RULES = {
  /** if key from dictToSet already exists - does not set it */
  setCommon: function (names, dictToSet) {
    for (const name of names) {
      if (!(name in DICT_COMMON)) {
        DICT_COMMON[name] = {};
      }

      for (const key of Object.keys(dictToSet)) {
        if (typeof DICT_COMMON[name][key] !== 'undefined') continue
        DICT_COMMON[name][key] = dictToSet[key];
      }
    }
  }
}