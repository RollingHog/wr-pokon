// Типы для заполнения rules.js / userParams.js кампаний.
// VS Code подхватывает их так:
//   1) в rules.js добавить ссылку:  /// <reference path="<путь до src>/rules.d.ts"/>
//   2) перед нужной константой добавить JSDoc-тип, например:
//        /** @type {RulesDict} */
//        const DICT_COMMON = { ... }
//   После этого внутри {...} работает автодополнение ключей, а наведение на
//   KW.COST и т.п. показывает описание из src/keywords.js.

/** Цена: ресурс → количество. Значение может быть выражением с ЛВЛ, напр. "ЛВЛ*15" */
interface RulesPrice {
  [resource: string]: number | string;
}

/** Описание одного объекта (юнита/здания) в DICT_COMMON */
interface RulesObjectDef {
  /** произвольные игровые эффекты: "НазваниеЭффекта": число (или выражение с ЛВЛ) */
  [effect: string]: number | string | RulesPrice | undefined;
  /** цена объекта; ключ KW.COST */
  '_cost_'?: RulesPrice;
  /** описание, показывается в подсказке фигуры; ключ KW.DESC */
  '_desc_'?: string;
  /** размер спрайта, px; ключ KW.SPRITE_SIZE */
  '_sprite_size_'?: number;
  /** стартовое HP; ключ KW.INIT_HP */
  '_init_hp_'?: number;
  /** максимум HP; ключ KW.MAX_HP */
  '_max_hp_'?: number;
  /** стартовый уровень; ключ KW.INIT_LVL */
  '_init_lvl_'?: number;
  /** максимальный уровень; ключ KW.MAX_LVL */
  '_max_lvl_'?: number;
  /** множитель добычи детей; ключ KW.OUTPUT_MULT */
  '_output_mult_'?: number | string;
  /** объект появляется отключённым; ключ KW.START_DISABLED */
  '_start_disabled_'?: number;
  /** радиус зрения; ключ KW.VISION */
  'Радиус зрения'?: number;
  /** сдвиг уровня за ход; ключ KW.LVL_DRIFT */
  'Сдвиг уровня'?: number | string;
}

/** Содержимое DICT_USER[player]: эффекты по ключу объекта.
 *  Ключи: имя юнита/здания, '_unit_'/'_building_' (ко всем), '_upkeep_' (содержание),
 *  а также "title:Название" — персональные эффекты объекту с таким title (задаётся через F2). */
interface UserEffectsList extends Array<[string, number | string]> {
}

interface UserUpkeep {
  '_building_'?: UserEffectsList;
  '_unit_'?: UserEffectsList;
}

interface UserPlayerDict {
  [objKey: string]: UserEffectsList | undefined;
  '_upkeep_'?: UserUpkeep;
}

/** Содержимое userParams.js: имя игрока → эффекты его объектов */
interface UserDict {
  [player: string]: UserPlayerDict;
}

/** Содержимое DICT_COMMON: имя объекта → описание.
 *  Тоже поддерживает ключ "title:Название" — эффекты любому объекту с таким title. */
interface RulesDict {
  [name: string]: RulesObjectDef | RulesUpkeep;
  '_building_'?: RulesObjectDef;
  '_unit_'?: RulesObjectDef;
  '_upkeep_'?: RulesUpkeep;
}

/** Содержимое SETTINGS */
interface Settings {
  /** страница в custom/ — пути считаются от корня репозитория */
  IS_CUSTOM?: boolean;
  /** путь к карте относительно HTML-страницы */
  MAP_PATH?: string;
  /** подпапка с картинками юнитов/зданий (по умолчанию images) */
  IMAGE_ROOT?: string;
  MAX_UNIT_HP?: number;
  VISION_RADIUS?: number;
  CAPITAL_SPECIAL_VISION?: boolean;
  /** если задан — применяется пропорция населения */
  POP_PROP?: string | null;
  NO_GRAVES?: boolean;
  MAX_TECH_LVL?: number;
  DEFAULT_LINE_COLOR?: string;
  TITLE_ABOVE?: boolean;
  CANNOT_ACT_AFTER_PLACEMENT?: boolean;
  /** false — отключает автосейв в конце хода */
  AUTOSAVE?: boolean;
  MIN_LVL?: number;
  DEFAULT_FIGURE_BG?: string;
  /** квадратная сетка поверх карты */
  SQUARE_GRID?: {
    cellWidth?: number;
    cellHeight?: number;
    offsetX?: number;
    offsetY?: number;
    showGrid?: boolean;
    label?: boolean;
    showUnitCell?: boolean;
    lineWidth?: number;
    labelSize?: number;
  };
}

/** Группы объектов: OBJ_CATEGORIES и CATEGORY_PRICES */
interface ObjCategoryGroups {
  [group: string]: string[];
}

interface ObjCategories {
  [topKey: string]: ObjCategoryGroups;
  UNITS?: ObjCategoryGroups;
  BUILDINGS?: ObjCategoryGroups;
}

/** Разделы списков эффектов: EFFECT_LISTS */
interface EffectLists {
  [section: string]: string[];
  static?: string[];
  resources?: string[];
  local?: string[];
}

/** Содержимое DEFAULT: служебные списки имён */
interface RulesDefaults {
  buildings: string[];
  units: string[];
  noHealth: string[];
  wreckUnit: string[];
  noGrave: string[];
  noUpkeep: string[];
}

/** Эмодзи-замены картинок: имя объекта → эмодзи */
interface EmojiImages {
  [name: string]: string;
}

/** Элемент уровня техдерева: "Юнит: X", "Здание: X", ":флаг"
 *  или пара [имяОбъекта, [["Эффект", величина], ...]] */
type TechLvlEntry = string | [string, Array<[string, number | string]>];

/** Содержимое TECH_EFFECTS: техника → уровни */
interface TechEffects {
  [techName: string]: {
    /** цена изучения; ключ KW.COST */
    '_cost_'?: RulesPrice;
    /** древо нельзя изучать (могут давать эффекты напрямую); ключ KW.NO_STUDY */
    '_no_study_'?: boolean;
    [lvl: string]: TechLvlEntry[] | RulesPrice | boolean | undefined;
  };
}

/** Меню специальных операций (Alt+F2): название → цена */
interface SpecialOperations {
  [name: string]: RulesPrice;
}
