# План рефакторинга index.js

*Ведётся в рамках разговоров с ZCode. Обновляется по мере продвижения.*

## Цель и ограничения

Выделить в `index.js` функциональные модули, чтобы уменьшить количество
элементов в глобальном namespace. Ограничения:

- **Файл не разносим** — всё остаётся в одном `index.js`.
- **IIFE не используем** — владелец считает, что глобалы без разнесения по
  файлам проблем не создают; вместо этого группируем в объекты-модули
  (паттерн уже существующий: `Unit`, `draw`, `Pins`, `userEffectsObj` и т.п.).
- **По одному модулю за шаг** — владелец ревьюит изменения между шагами
  (коммитим после ревью, не пачкой).

## Внешний контракт (что должно остаться доступным глобально)

- Inline `onclick` в 8 HTML-страницах: `setShapeColor`, `drawCanvas`,
  `onOutputClick`.
- Сгенерированные внутри index.js HTML-строки: `Players.offsetCurrentFromHTML`,
  `TechUtils.selectTechToStudy`.
- `rules.js` кампаний только *определяют* `onEndTurnCb` / `onPlayerEffectChangeCb`;
  внутрь index.js никто не лезет (упоминания `NPCPlayers`/`listPlayers`/
  `userEffectsObj` в их `/* global */`-заголовках — только для линтера).

## Очередь модулей

1. **Players** — ✅ сделано (2026-09-05): объединены `Player`,
   `colorFromUsername` → `colorByName`, `playerByColor` → `byColor`,
   `listPlayers` → `list`, `NPCPlayers` → `NPC`, два кэша поиска по DOM
   (комментарий про то, что кэши не инвалидируются, — над модулем).
2. **Viewport** — следующий: `scale`, `canvasOffsetX/Y`, `tempOffsetX/Y`,
   `MAX_SCALE/MIN_SCALE`, `handleWheel`, `updateScale`, `resizeCanvas`.
3. **Pointer** (drag) — `isDragging`, `isDraggingElement`, `dragStart*`,
   `touchIdentifier`, `mousePos`, `handleMouse*`, `handleTouch*`,
   `startDrag`, `updateDrag`, `endDrag`.
4. **Board** — `elements`, `selectedElement`, `currentId`,
   `assignIdsToElements`, `isBuilding`/`isUnit`/`isNoHealth`, `killObj`,
   `offsetUnitHp`, `offsetObjLvl`.
5. **Palette** — `customShapes`, `activeShapeType`, `imageCache`,
   `getCachedImage`, `onCustomImageLoad`, `loadDefaultCustomImages`,
   `imageObjByObjName`.
6. **MapsManager** — `maps`, `currentMapIndex`, `loadMaps`, `loadMap`,
   `renderMapList`, `loadDefaultMap`, `getCurrentMap`.
7. **Combat** — `isAttack`, `isPin`, `enableAttackMode`, `enablePinMode`,
   `getBattleParams`, `attackObj`.
8. **SaveLoad** — `saveGame`, `loadGame`, `saveFile`.
9. **LineTool** — слить `lineActionsObj` и `lineModeObj`.

Идея на потом (не согласована): единый объект `state` вместо россыпи
мутируемых `let` верхнего уровня; доступ строго через `state.elements`
и т.п., без деструктуризации.

## Попутные находки (баги/мусор, править после модулей)

- index.js ~1893: одиночный оператор `debug` — ReferenceError при плохом
  ratio картинки.
- `offsetUnitHp`/`offsetObjLvl`: `obj = killObj(obj)` — присваивание
  параметру теряется, работает только побочный эффект killObj.
- Мёртвый код: `loadGame` (ранний return + TODO), `closeEditPanel`,
  `calcPopGrowth`, `getRandomColor`, пустой `userEffectsObj.getCommonEffects`,
  закомментированные `arrow` и «timed building», закомментированный кэш `effCache`.
- `Unit` обрабатывает и здания — кандидат на переименование (ObjModel).
- Глобальный `warn` конфликтует по смыслу с console.warn — переименовать
  при переносе (например, `flashError`).
- В `rules.js` кампаний (rl-sbor, stach, underdark) остались устаревшие
  `/* global */`-упоминания `NPCPlayers listPlayers` — почистить отдельно.
