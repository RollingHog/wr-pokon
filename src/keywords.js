/* exported 
KW KW_LOCALS
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
})

const KW_LOCALS = [
  KW.VISION,
  KW.INIT_HP,
]