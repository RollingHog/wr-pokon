# AGENTS.md

**Никогда ничего не пушить в git** — пуш делает только пользователь вручную.

## Что это

Статический vanilla-JS проект для GitHub Pages (RollingHog/wr-pokon): редактор/менеджер
карты партии для настольной стратегии. Нет `package.json`, сборки, CI и CLI-тестов;
скрипты подключаются обычными `<script>`, состояние живёт в памяти страницы.

Подробные заметки, которые стоит прочитать перед крупными правками:
`agents/OVERVIEW.md` (устройство), `agents/REFACTORING.md` (модули и конвенции),
`agents/TESTS.md` (тесты и их ограничения).

## Запуск и проверки

- Приложение: основная рабочая страница — `custom/pokras-spc.html` (на 2026-10-25);
  свежие доработки движка и `rules.js` в первую очередь применяются в
  `custom/pokras-spc/`. `ChillyMorning.html` — базовый вариант, не эталон.
  Активная кампания может смениться: уточнять у пользователя, не зашивать путь.
  Для экспорта PNG и проверок canvas нужен статический сервер:
  `python -m http.server` из корня.
- Тесты: открыть `Tests.html` (копия `ChillyMorning.html` + `tests/tests.js`).
  Сейчас 22 теста, ожидается «Пройдено: 22, упало: 0». Проверено через локальный
  сервер; `npm test`/`npm run ...` не существует — не выдумывать команды.
  Тесты гоняют движок на базовых данных ChillyMorning, а не на активной кампании,
  поэтому после правок движка дополнительно проверяйте `custom/pokras-spc.html`.
- `.eslintrc.json` — конфиг для редактора; eslint в репозитории не установлен.
- Тесты обращаются к глобалам движка и подменяют `saveFile`/`confirm`/`prompt`.
  При переименовании глобалов обновляйте `tests/tests.js`.

## Как всё связано

- Порядок script-тегов важен: `src/keywords.js` → `rules.js` кампании →
  `userParams.js` → `data.json.js` → `index.js` (в `Tests.html` ещё `tests/tests.js`).
  Это классические глобалы, без ESM и IIFE. Не оборачивать `index.js` в IIFE и не
  переводить на модули: inline-`onclick` и тесты обращаются к глобалам
  (`setShapeColor`, `drawCanvas`, `onOutputClick`, `Players.*`, `TechUtils.*`).
- Движок один на все кампании — `index.js`; в конце он вызывает `init()` и
  рассчитывает на полный набор DOM-id. Кампания = HTML-страница + папка с
  `rules.js`, `userParams.js`, `data.json.js`. `custom/BnB.html` грузит `../bnb/*`,
  остальные — `../custom/<name>/*`. Новую кампанию добавлять как HTML + папку +
  ссылку в `index.html`.
- Фракции задаются объектом `FACTIONS` в `userParams.js` кампании (для базовых
  страниц — `data/userParams.js`): ключ = имя, значение = цвет в нижнем регистре.
  Порядок ключей = порядок игроков. `generateFactionButtons()` создаёт кнопки
  `.player-btn` в `<span id="player-btns-list">`, `Players` читает и кеширует их
  из DOM при старте. В HTML статических кнопок быть не должно. Меняя фракцию,
  правьте `FACTIONS` и данные сейва (`OWNER_MAP`/`color` объектов).
- `SETTINGS.MAP_PATH` и пути `images/{units,buildings}/<name>.png` резолвятся
  относительно HTML-страницы, а не `rules.js`. Для custom-страниц
  `IS_CUSTOM: true` даёт корень `..`; `pokras-spc` переопределяет `IMAGE_ROOT`.
  Имена файлов и `name` объектов — кириллицей и должны совпадать.

## Данные и сохранения

- `data/data.json.js` и `custom/*/data.json.js` — сейв-состояние в виде
  JS-присваиваний (не JSON): `CURRENT_TURN`, `OTHER_SAVE_DATA`, `USER_RESOURCES`,
  `USER_TECH_LVLS`, `OWNER_MAP`, `DEFAULT_DATA`. Не переименовывать ключи:
  `canvasOffsetX/Y` — замороженный формат сейва (в рантайме это `Viewport.offsetX/Y`).
- Сохранение = скачивание `data.json.js`; автосейв срабатывает в конце хода
  (`SETTINGS.AUTOSAVE !== false`; в `pokras-spc` отключён). `copy*.bat` в папках
  кампаний переносят свежий файл из `%UserProfile%\Downloads` в папку кампании.
  Импорт сейва в UI сломан (`loadGame` сразу выходит с alert): рабочий путь —
  заменить `data.json.js` и перезагрузить страницу.
- HTML-страницы почти дублируются (ChillyMorning, 6 custom-страниц, `Tests.html`).
  Правки общей разметки/кнопок нужно вносить во все копии, как минимум в активную
  кампанию (`custom/pokras-spc.html`) и `Tests.html`.
  `Tests.html` = `ChillyMorning.html` + тесты.

## Границы и мелочи

- `vor-saga/`, `utils/SquareGrid.html`, `src/calc.html`,
  `src/countRaceEffects.html` — отдельные инструменты, не части движка.
- `map/*.hxm` — исходники Hexographer (высота гекса 96 px); `xlam/` и md-файлы
  кампаний — контент. Не трогать без задачи.
- UI, документация и игровые тексты — по-русски. Кириллица в файлах — UTF-8:
  правки делать через edit/write, а не перезаписью через PowerShell
  (может сменить кодировку).
- Рефакторинг: всё остаётся в одном `index.js`, выделяются объекты-модули
  (`Players`, `Viewport`, `Pointer` уже выделены), по одному модулю за шаг с
  прогоном `Tests.html`; файл не разносить, IIFE не делать
  (см. `agents/REFACTORING.md`). Известен мёртвый код (`loadGame`,
  `closeEditPanel` и др.); в `src/rules.js` нет `DEFAULT.wreckUnit`, тесты
  временно добавляют его сами.
