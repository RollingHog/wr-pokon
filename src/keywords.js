/* exported 
KW KW_LOCALS KW_RULES
*/

const KW = /** @type {const} */ ({
  GRAVE_UNIT: '_могила',
  WRECK_UNIT: '_обломки',
  BUILD_SLOT: '_build_slot',
  INFO_UNIT: '_info_',
  TIMER_UNIT: '_timer_',
  
  CAPITAL: 'Столица',

  COST: '_cost_',
  LOOT: '_loot_',
  /** optional object description */
  DESC: '_desc_',
  SPRITE_SIZE: '_sprite_size_',

  INIT_HP: '_init_hp_',
  MAX_HP: '_max_hp_',
  
  ATK: "Атака",
  DEF: 'Защита',
  /** action points */
  AP: 'АР',
  DIST: 'Дистанция',
  REGEN: 'Регенерация',
  
  INIT_LVL: '_init_lvl_',
  /** not implemented yet */
  MAX_LVL: '_max_lvl_',
  LVL_DRIFT: 'Сдвиг уровня',
  VISION: 'Радиус зрения',
  NO_VISION: -1,
  /** if object should spawn with disabled: true */
  START_DISABLED: "_start_disabled_",

  /** if set, clones resource income from children and multiplies it on given amount 
   * all ЛВЛ-options in children not supported yet
  */
  OUTPUT_MULT: "_output_mult_",
})

const KW_LOCALS = [
  KW.VISION,
  KW.INIT_HP,
  KW.MAX_HP,
  KW.INIT_LVL,
  KW.LVL_DRIFT,
  KW.REGEN,

  KW.DESC,
  KW.SPRITE_SIZE,
  KW.OUTPUT_MULT,
  KW.START_DISABLED,
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