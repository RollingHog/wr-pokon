/* exported
FACTIONS DICT_USER USER_TECH_LVLS
*/

/// <reference path="../src/keywords.js"/>
/* global
KW
*/

/** colors only in lowercase! */
const FACTIONS = {
  "Нейтралы": "#d3d3d3",
  "Варвары": "#930000",
  "Нью_Лоуландс": "#4cbb17",
  "Синие": "#0000ff"
}

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

const USER_TECH_LVLS = {
  Нью_Лоуландс: {
    ЛЕС: 1,
    СТРОИТЕЛЬСТВО: 1,
    МОРЕ: 1,
    ГОСУДАРСТВО: 0,
  },
  Синие: {
    ЛЕС: 1,
    СТРОИТЕЛЬСТВО: 2,
    МОРЕ: 0,
    ГОСУДАРСТВО: 0,
  },
}
