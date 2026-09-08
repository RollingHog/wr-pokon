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

## Тестирование

Есть регрессионный набор: `Tests.html` + `tests/tests.js` (13 тестов основных
операций движка, без внешних зависимостей). Запуск — открыть `Tests.html`.
План и статус: [TESTS.md](TESTS.md). После выделения каждого модуля —
прогон Tests.html.

## Очередь модулей

1. **Players** — ✅ сделано (2026-09-05): объединены `Player`,
   `colorFromUsername` → `colorByName`, `playerByColor` → `byColor`,
   `listPlayers` → `list`, `NPCPlayers` → `NPC`, два кэша поиска по DOM
   (комментарий про то, что кэши не инвалидируются, — над модулем).
2. **Viewport** — ✅ сделано (2026-09-08): `scale`, `canvasOffsetX/Y` →
   `Viewport.offsetX/Y`, `tempOffsetX/Y`, `handleWheel`, `updateScale`,
   `resizeCanvas`. Нюансы:
   - `MAX_SCALE`/`MIN_SCALE` были перепутаны местами (MAX_SCALE = 0.25 —
     это нижняя граница); переименованы в `Viewport.MIN_SCALE = 0.25` /
     `Viewport.MAX_SCALE = 3`, поведение не менялось.
   - В `saveGame` ключи сейва оставлены `canvasOffsetX`/`canvasOffsetY`
     (формат data.json.js не менялся), маппинг на `Viewport.offsetX/Y`.
   - Методы внутри модуля обращаются к `Viewport.*` явно, без `this`
     (передаются в `addEventListener`).
   - Обновлены `tests/tests.js` (resetGame, canvasPoint, тест зума).
   - Tests.html: 13/13 зелёные.
3. **Pointer** — ✅ сделано (2026-09-08): `isDragging`, `isDraggingElement`,
   `dragStartTime`, `dragStartX/Y`, `mousePos`, `touchIdentifier` и функции
   `startDrag`/`updateDrag`/`endDrag` + `handleMouse*`/`handleTouch*` →
   объект `Pointer` (методы без `this`, как в Viewport). Нюансы:
   - объект `selection` (drop/damage/dropLevel/...) лежал в файле между
     обработчиками и был бы задет переносом — восстановлен из git как
     отдельная глобальная константа сразу после `Pointer`.
   - `tests/tests.js`: `mousePos` → `Pointer.mousePos`.
   - Tests.html: 13/13 зелёные.
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
