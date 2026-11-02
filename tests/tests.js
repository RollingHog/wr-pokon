/* Тесты движка index.js — запускаются через Tests.html (копия ChillyMorning.html).
   Без внешних зависимостей: используются глобальные функции движка напрямую
   (это возможно, потому что index.js не обёрнут в IIFE) и синтетические
   DOM-события для эмуляции мыши. */
(() => {
  // ---------- мини-раннер ----------
  const tests = []
  const test = (name, fn) => tests.push({ name, fn })

  const panel = document.createElement('div')
  panel.style.cssText = [
    'position:fixed', 'top:8px', 'right:8px', 'z-index:9999',
    'background:#fff', 'border:2px solid #333', 'border-radius:6px',
    'padding:8px 12px', 'font:12px/1.5 monospace',
    'max-height:85vh', 'overflow:auto', 'min-width:520px',
  ].join(';')
  panel.innerHTML = '<b>Тесты движка</b> <button id="test-reload">↻ перезапустить</button>'
    + '<div id="test-summary"></div><div id="test-results"></div>'
  document.body.appendChild(panel)

  const resultsEl = panel.querySelector('#test-results')
  const summaryEl = panel.querySelector('#test-summary')
  panel.querySelector('#test-reload').onclick = () => location.reload()

  const assert = (cond, msg) => { if (!cond) throw new Error(msg || 'assert failed') }
  const assertEq = (actual, expected, msg) => {
    if (actual !== expected) {
      throw new Error(`${msg ? msg + ': ' : ''}ожидалось ${JSON.stringify(expected)}, получено ${JSON.stringify(actual)}`)
    }
  }
  const assertNear = (actual, expected, msg, eps = 0.05) => {
    if (Math.abs(actual - expected) > eps) {
      throw new Error(`${msg ? msg + ': ' : ''}ожидалось ~${expected}, получено ${actual}`)
    }
  }

  function until(cond, timeoutMs, msg) {
    return new Promise((resolve, reject) => {
      const started = Date.now()
      const iv = setInterval(() => {
        let ok = false
        try { ok = cond() } catch (e) { /* ещё не готово */ }
        if (ok) { clearInterval(iv); resolve() }
        else if (Date.now() - started > timeoutMs) { clearInterval(iv); reject(new Error(msg || 'timeout')) }
      }, 50)
    })
  }

  // ---------- подмена браузерных диалогов и скачивания файлов ----------
  let confirmCalls = 0
  let savedFiles = []
  window.confirm = () => { confirmCalls++; return true }
  window.alert = () => {}
  window.prompt = () => '1'
  saveFile = (filename, data) => savedFiles.push({ filename, data })

  // В базовых правилах (src/rules.js) отсутствуют ключи DEFAULT, без которых
  // движок падает: noUpkeep — при любом подсчёте эффектов игрока,
  // wreckUnit — при смерти юнита. На кастомных кампаниях они заданы.
  // Пока их не добавят в rules.js, тестовая страница дозаполняет сама.
  DEFAULT.noUpkeep = DEFAULT.noUpkeep || []
  DEFAULT.wreckUnit = DEFAULT.wreckUnit || []

  // ---------- управление состоянием ----------
  function replaceContents(obj, replacement) {
    for (const k of Object.keys(obj)) delete obj[k]
    Object.assign(obj, replacement)
  }

  /** чистое состояние: пустая карта (или копия DEFAULT_DATA), нулевые ресурсы */
  function resetGame(customElements) {
    elements = (customElements || DEFAULT_DATA).map(e => Object.assign({}, e))
    assignIdsToElements()
    CURRENT_TURN = 1
    replaceContents(USER_RESOURCES, Object.fromEntries(Players.list().map(p => [p, {}])))
    replaceContents(USER_TECH_LVLS, Object.fromEntries(Players.list().map(p => [p, {}])))
    Pins.ownerMap.clear()
    Pins.ownedObjs.length = 0
    TechUtils.techEffectCache = {}
    TechUtils.unitTechEffectCache = {}
    selectedElement = null
    editPanel.style.display = 'none'
    isAttack = false
    isPin = false
    Viewport.scale = 1
    Viewport.offsetX = 0
    Viewport.offsetY = 0
    Pointer.mousePos = { x: 300, y: 300 }
    payCheckbox.checked = false
  }

  /** размещает объект так же, как это делает интерфейс */
  function placeTestObject(name, color, clientX = 300, clientY = 300) {
    setShapeColor(color)
    const preview = document.querySelector(`.shape-preview[data-filename="${name}"]`)
    assert(preview, `нет превью для "${name}"`)
    preview.click()
    Pointer.mousePos = { x: clientX, y: clientY }
    const before = elements.length
    placeShape()
    assertEq(elements.length, before + 1, `объект "${name}" не размещён`)
    return elements[elements.length - 1]
  }

  /** экранные координаты центра объекта (как их считает движок) */
  function canvasPoint(el) {
    const rect = canvas.getBoundingClientRect()
    return {
      x: rect.left + el.x * Viewport.scale + Viewport.offsetX + el.width * Viewport.scale / 2,
      y: rect.top + el.y * Viewport.scale + Viewport.offsetY + el.height * Viewport.scale / 2,
    }
  }

  function clickElement(el) {
    const p = canvasPoint(el)
    fogCanvas.dispatchEvent(new MouseEvent('mousedown', { clientX: p.x, clientY: p.y, button: 0, bubbles: true, cancelable: true }))
    fogCanvas.dispatchEvent(new MouseEvent('mouseup', { clientX: p.x, clientY: p.y, button: 0, bubbles: true }))
  }

  function drag(fromX, fromY, dx, dy) {
    fogCanvas.dispatchEvent(new MouseEvent('mousedown', { clientX: fromX, clientY: fromY, button: 0, bubbles: true, cancelable: true }))
    fogCanvas.dispatchEvent(new MouseEvent('mousemove', { clientX: fromX + dx, clientY: fromY + dy, bubbles: true, cancelable: true }))
    fogCanvas.dispatchEvent(new MouseEvent('mouseup', { clientX: fromX + dx, clientY: fromY + dy, button: 0, bubbles: true }))
  }

  // ---------- тесты ----------
  test('список игроков: порядок, поиск по цвету и имени', () => {
    assertEq(JSON.stringify(Players.list()),
      JSON.stringify(['Нейтралы', 'Варвары', 'Синие', 'Красные']),
      'порядок кнопок игроков')
    assertEq(Players.byColor('#930000'), 'Варвары')
    assertEq(Players.colorByName('Варвары'), '#930000')
    assert(Players.NPC.includes('Варвары') && Players.NPC.includes('Нейтралы'),
      'NPC-игроки неверные')
  })

  test('выбор игрока: цвет, current, панель эффектов', () => {
    setShapeColor('#0000ff')
    assertEq(getShapeColor(), '#0000ff')
    assertEq(Players.current(), 'Синие')
    assertEq(info_panel.querySelector('h3').innerText, 'Синие', 'заголовок панели')
    assert(info_panel.style.display !== 'none', 'панель эффектов не показана')
  })

  test('размещение юнита мышью', () => {
    resetGame([])
    const sol = placeTestObject('Жители', '#ff0000', 300, 300)
    assertEq(sol.name, 'Жители')
    assertEq(sol.type, 'shape')
    assertEq(sol.color, '#ff0000')
    assertEq(sol.curr_hp, 10, 'начальное ХП')
    assertEq(sol.endedTurn, true, 'после размещения юнит не может действовать')
    assert(typeof sol.id === 'number', 'id не назначен')
    assertNear(sol.width, 38, 'размер из shape-size')
  })

  test('оплата: без ресурсов блокируется, с ресурсами списывает цену', () => {
    resetGame([])
    payCheckbox.checked = true
    USER_RESOURCES['Красные']['Дерево'] = 3

    setShapeColor('#ff0000')
    document.querySelector('.shape-preview[data-filename="Ферма"]').click()
    const before = elements.length
    placeShape()
    assertEq(elements.length, before, 'объект не должен был размещаться без ресурсов')

    USER_RESOURCES['Красные']['Дерево'] = 10
    placeShape()
    assertEq(elements.length, before + 1, 'объект должен был разместиться')
    assertEq(USER_RESOURCES['Красные']['Дерево'], 5, 'цена фермы (Дерево 5) не списана')
    payCheckbox.checked = false
  })

  test('выделение кликом и урон здания до смерти → _обломки', () => {
    resetGame([])
    const farm = placeTestObject('Ферма', '#0000ff')
    clickElement(farm)
    assertEq(selectedElement, farm, 'клик не выделил объект')
    assertEq(editPanel.style.display, 'block', 'панель редактирования не показана')
    selection.damage(10)
    assertEq(farm.name, KW.WRECK_UNIT, 'здание не превратилось в обломки')
    assert(elements.includes(farm), 'обломки должны остаться на карте')
    assertEq(farm.curr_hp, 0)
  })

  test('урон юнита до смерти → _могила', () => {
    resetGame([])
    const sol = placeTestObject('Жители', '#0000ff')
    clickElement(sol)
    selection.damage(10)
    assertEq(sol.name, KW.GRAVE_UNIT, 'юнит не превратился в могилу')
    assert(elements.includes(sol), 'могила должна остаться на карте')
  })

  test('перетаскивание юнита мышью', () => {
    resetGame([])
    const sol = placeTestObject('Жители', '#0000ff', 300, 300)
    const x0 = sol.x
    const y0 = sol.y
    const p = canvasPoint(sol)
    drag(p.x, p.y, 40, 25)
    assertNear(sol.x - x0, 40, 'юнит не сдвинулся по X')
    assertNear(sol.y - y0, 25, 'юнит не сдвинулся по Y')
    assertEq(selectedElement, sol, 'после drag объект должен остаться выделенным')
  })

  test('перетаскивание пустого места двигает карту', () => {
    resetGame([])
    const ox0 = Viewport.offsetX
    const oy0 = Viewport.offsetY
    const rect = canvas.getBoundingClientRect()
    drag(rect.left + 400, rect.top + 300, -70, 30)
    assertNear(Viewport.offsetX - ox0, -70, 'смещение карты по X')
    assertNear(Viewport.offsetY - oy0, 30, 'смещение карты по Y')
  })

  test('зум колесом: границы масштаба и подпись', () => {
    resetGame([])
    fogCanvas.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, bubbles: true, cancelable: true }))
    assertNear(Viewport.scale, 1.1, 'масштаб не увеличился', 0.001)
    assertEq(scaleValue.textContent, '110%', 'подпись масштаба')
    Viewport.scale = 2.9
    fogCanvas.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, bubbles: true, cancelable: true }))
    assertEq(Viewport.scale, 3, 'масштаб не ограничился сверху')
  })

  test('конец хода: подтверждение, номер хода, доход, autosave', () => {
    resetGame([])
    elements.push(
      { id: 9001, type: 'shape', shape: 'custom', name: 'Ферма', color: '#0000ff', x: 100, y: 100, width: 40, height: 30, curr_hp: 10, endedTurn: true },
      { id: 9002, type: 'shape', shape: 'custom', name: 'Жители', color: '#ff0000', x: 200, y: 100, width: 38, height: 38, curr_hp: 10, endedTurn: false },
    )
    confirmCalls = 0
    savedFiles = []
    onEndTurn()
    assertEq(confirmCalls, 1, 'не спросили подтверждение из-за непоходившего юнита')
    assertEq(CURRENT_TURN, 2, 'номер хода не увеличился')
    assertEq(USER_RESOURCES['Синие']['Еда'], 7, 'доход фермы не начислен')
    assertEq(USER_RESOURCES['Красные']['Еда'], 0, 'отрицательный доход должен обнуляться')
    assertEq(elements.find(e => e.id === 9001).endedTurn, false, 'флаг endedTurn не сброшен у фермы')
    assertEq(elements.find(e => e.id === 9002).endedTurn, false, 'флаг endedTurn не сброшен у юнита')
    assertEq(savedFiles.length, 1, 'autosave не сработал')
  })

  test('saveGame: файл парсится и соответствует состоянию', () => {
    resetGame([])
    placeTestObject('Жители', '#0000ff')
    savedFiles = []
    saveGame()
    assertEq(savedFiles.length, 1, 'файл не сохранён')
    const { filename, data } = savedFiles[0]
    assertEq(filename, 'data.json.js')
    assertEq(+data.match(/^CURRENT_TURN=(\d+)/m)[1], 1, 'CURRENT_TURN в файле')
    const dd = JSON.parse(data.slice(data.indexOf('DEFAULT_DATA=') + 'DEFAULT_DATA='.length))
    assertEq(dd.length, elements.length, 'число объектов в файле')
    assertEq(dd[0].name, 'Жители', 'первый объект в файле')
    assert(data.includes('OWNER_MAP='), 'нет OWNER_MAP')
    assert(data.includes('USER_RESOURCES='), 'нет USER_RESOURCES')
  })

  test('Pins: закладка объекта за владельцем и снятие', () => {
    resetGame([])
    const city = placeTestObject('Город', '#0000ff', 300, 300)
    const sol = placeTestObject('Жители', '#0000ff', 500, 500)
    selectedElement = sol
    enablePinMode()
    clickElement(city)
    assert(Pins.isOwner(city), 'город не стал владельцем')
    assert(Pins.isOwnedObj(sol), 'солдат не стал закладкой')
    assertEq(JSON.stringify(Pins.toJSON()), JSON.stringify({ [city.id]: [sol.id] }))
    Pins.removePreviousOwnership(sol)
    assert(!Pins.isOwner(city), 'владелец не снялся')
    assert(!Pins.isOwnedObj(sol), 'закладка не снялась')
  })

  test('sumPlayerEffects: доход фермы и счётчики юнитов', () => {
    resetGame([])
    elements.push(
      { id: 9101, type: 'shape', shape: 'custom', name: 'Ферма', color: '#0000ff', x: 100, y: 100, width: 40, height: 30, curr_hp: 10, endedTurn: true },
      { id: 9102, type: 'shape', shape: 'custom', name: 'Жители', color: '#0000ff', x: 200, y: 100, width: 38, height: 38, curr_hp: 10, endedTurn: true },
    )
    const sum = userEffectsObj.sumPlayerEffects('Синие')
    assertEq(sum['Еда'], -3, 'ферма +7 и содержание юнита -10')
    assertEq(sum.build_count, 1)
    assertEq(sum.build_to_upkeep, 1)
    assertEq(sum.unit_count, 1)
    assertEq(sum.unit_to_upkeep, 1)
    assertEq(sum['Железо'], 0, 'ресурсы без дохода должны присутствовать')
  })

  // ---------- квадратная сетка (SETTINGS.SQUARE_GRID) ----------
  // Тестовая кампания не включает SQUARE_GRID, поэтому каждый тест
  // временно подставляет свой конфиг и восстанавливает прежнее состояние.
  function withSquareGrid(conf, fn) {
    const saved = SETTINGS.SQUARE_GRID
    try {
      if (conf) SETTINGS.SQUARE_GRID = conf
      else delete SETTINGS.SQUARE_GRID
      fn()
    } finally {
      if (saved) SETTINGS.SQUARE_GRID = saved
      else delete SETTINGS.SQUARE_GRID
    }
  }

  test('SquareGrid: выключен по умолчанию — cellName возвращает null', () => {
    withSquareGrid(null, () => {
      assertEq(SETTINGS.SQUARE_GRID, undefined, 'в базовой кампании SQUARE_GRID не задан')
      assertEq(SquareGrid.cellName(0, 0), null)
      assertEq(SquareGrid.cellName(500, 300), null)
      assertEq(SquareGrid.unitSuffix({ x: 10, y: 10, width: 40, height: 40 }), '')
    })
  })

  test('SquareGrid: cellName считает квадраты по size', () => {
    withSquareGrid({ size: 100 }, () => {
      assertEq(SquareGrid.cellName(50, 50), 'A1')       // 0..99 → A1
      assertEq(SquareGrid.cellName(0, 0), 'A1')         // граница слева
      assertEq(SquareGrid.cellName(100, 0), 'B1')       // граница справа — уже следующая клетка
      assertEq(SquareGrid.cellName(150, 250), 'B3')
      assertEq(SquareGrid.cellName(999, 50), 'J1')
    })
  })

  test('SquareGrid: cellName учитывает offsetX/offsetY', () => {
    withSquareGrid({ size: 100, offsetX: 50, offsetY: 30 }, () => {
      // левее/выше A1 клеток нет — отсчёт начинается с единицы
      assertEq(SquareGrid.cellName(0, 0), null)
      assertEq(SquareGrid.cellName(49, 100), null)
      assertEq(SquareGrid.cellName(100, 29), null)
      assertEq(SquareGrid.cellName(50, 30), 'A1')
      assertEq(SquareGrid.cellName(149, 129), 'A1')   // всё ещё внутри первой клетки
      assertEq(SquareGrid.cellName(150, 130), 'B2')   // границы — уже следующая клетка
      assertEq(SquareGrid.cellName(150, 129), 'B1')
    })
  })

  test('SquareGrid: CELL_WIDTH/CELL_HEIGHT задают прямоугольные клетки', () => {
    withSquareGrid({ CELL_WIDTH: 120, CELL_HEIGHT: 90 }, () => {
      assertEq(SquareGrid.cellName(119, 89), 'A1')
      assertEq(SquareGrid.cellName(120, 90), 'B2')
      assertEq(SquareGrid.cellName(250, 100), 'C2')
    })
    // если задана только ширина, клетка остаётся квадратной
    withSquareGrid({ CELL_WIDTH: 120 }, () => {
      assertEq(SquareGrid.cellName(120, 120), 'B2')
    })
  })

  test('SquareGrid: colLabel — колонки как в таблицах (A, Z, AA)', () => {
    assertEq(SquareGrid.colLabel(0), 'A')
    assertEq(SquareGrid.colLabel(25), 'Z')
    assertEq(SquareGrid.colLabel(26), 'AA')
    assertEq(SquareGrid.colLabel(27), 'AB')
  })

  test('SquareGrid: unitSuffix даёт квадрат юнита по его центру', () => {
    withSquareGrid({ size: 100 }, () => {
      const el = { x: 90, y: 90, width: 40, height: 40 } // центр 110;110 → B2
      assertEq(SquareGrid.unitSuffix(el), ' [B2]')
      assertEq(SquareGrid.unitSuffix(null), '')
    })
    withSquareGrid({ size: 100, showUnitCell: false }, () => {
      assertEq(SquareGrid.unitSuffix({ x: 90, y: 90, width: 40, height: 40 }), '')
    })
  })

  test('SquareGrid: drawCanvas не падает с сеткой и подписями', () => {
    withSquareGrid({ size: 96, label: true }, () => {
      resetGame([])
      const el = placeTestObject('Жители', '#0000ff', 300, 300)
      // подпись юнита содержит квадрат, вычисленный из его реальных координат
      const expected = SquareGrid.cellName(
        el.x + el.width / 2, el.y + el.height / 2)
      assert(expected, 'имя квадрата вычислилось')
      drawCanvas()
      assertEq(SquareGrid.cellName(
        el.x + el.width / 2, el.y + el.height / 2), expected)
    })
  })

  test('SquareGrid: толщина линий и шрифт масштабируются вместе с картой', () => {
    withSquareGrid({ size: 100, lineWidth: 2, labelSize: 10 }, () => {
      const fake = {
        lineWidth: 0, font: '', strokeStyle: '', fillStyle: '',
        textAlign: '', textBaseline: '', texts: [],
        save() {}, restore() {}, beginPath() {}, rect() {}, clip() {},
        moveTo() {}, lineTo() {}, stroke() {}, strokeRect() {},
        fillText(text, x, y) { this.texts.push({ text, x, y }) },
      }
      const savedScale = Viewport.scale
      try {
        for (const scale of [0.5, 2]) {
          Viewport.scale = scale
          fake.lineWidth = 0
          fake.font = ''
          fake.texts = []
          SquareGrid.draw(fake, 1000, 1000)
          // размеры заданы в координатах карты — зум их не меняет
          assertEq(fake.lineWidth, 2, `толщина при масштабе ${scale}`)
          assertEq(fake.font, '10px Arial', `шрифт при масштабе ${scale}`)
          // подпись по центру нижнего края клетки A1 (size 100, lineWidth 2)
          assertEq(fake.textAlign, 'center', `выравнивание при масштабе ${scale}`)
          assertEq(fake.textBaseline, 'bottom', `базовая линия при масштабе ${scale}`)
          const a1 = fake.texts.find(t => t.text === 'A1')
          assertEq(a1 && a1.x, 50, `центр по X при масштабе ${scale}`)
          assertEq(a1 && a1.y, 97, `низ по Y при масштабе ${scale}`)
        }
      } finally {
        Viewport.scale = savedScale
      }
    })
  })

  test('SquareGrid: showGrid=false скрывает отрисовку, но клетки работают', () => {
    withSquareGrid({ size: 100, showGrid: false, label: true }, () => {
      // ctx не должен использоваться вообще
      SquareGrid.draw(null, 1000, 1000)
      assert(SquareGrid.isEnabled(), 'сетка существует')
      assertEq(SquareGrid.cellName(50, 50), 'A1')
      assertEq(SquareGrid.cellName(150, 50), 'B1')
      assertEq(SquareGrid.unitSuffix({ x: 90, y: 90, width: 40, height: 40 }), ' [B2]')
    })
  })

  test('Delta: сопоставление по id — стрелки и кресты', () => {
    const prev = [
      { type: 'shape', shape: 'custom', name: 'Фрегат', color: 'red', id: 1, x: 100, y: 100, width: 40, height: 40 },
      { type: 'shape', shape: 'custom', name: 'Строитель', color: 'red', id: 2, x: 200, y: 200, width: 40, height: 40 },
      { type: 'shape', shape: 'custom', name: 'Крейсер', color: 'blue', id: 3, x: 300, y: 300, width: 40, height: 40 },
      { type: 'shape', shape: 'custom', name: KW.GRAVE_UNIT, color: 'red', id: 4, x: 400, y: 400, width: 40, height: 40 },
      { type: 'text', content: 'заметка', color: 'black', x: 0, y: 0, size: 20 },
    ]
    const cur = [
      { type: 'shape', shape: 'custom', name: 'Фрегат', color: 'red', id: 1, x: 140, y: 100, width: 40, height: 40 },
      { type: 'shape', shape: 'custom', name: 'Строитель', color: 'red', id: 2, x: 200, y: 200, width: 40, height: 40 },
      { type: 'shape', shape: 'custom', name: 'Колонизатор', color: 'blue', id: 9, x: 500, y: 500, width: 40, height: 40 },
    ]
    const delta = Delta.movesAndDeaths(prev, cur)
    assertEq(delta.moves.length, 1, 'одно перемещение')
    assertEq(delta.moves[0].from.id, 1, 'переместился Фрегат')
    assertEq(delta.moves[0].to.x, 140, 'новая позиция Фрегата')
    assertEq(delta.deaths.length, 1, 'один крест')
    assertEq(delta.deaths[0].id, 3, 'крест на месте Крейсера')
    assertEq(delta.added.length, 1, 'один новый объект')
    assertEq(delta.added[0].id, 9, 'обведён Колонизатор')
  })

  test('Delta: запасное сопоставление имя+цвет к ближайшему', () => {
    const prev = [
      { type: 'shape', shape: 'custom', name: 'Фрегат', color: 'red', x: 0, y: 0, width: 40, height: 40 },
    ]
    const cur = [
      { type: 'shape', shape: 'custom', name: 'Фрегат', color: 'blue', x: 10, y: 10, width: 40, height: 40 },
      { type: 'shape', shape: 'custom', name: 'Фрегат', color: 'red', x: 80, y: 60, width: 40, height: 40 },
    ]
    const delta = Delta.movesAndDeaths(prev, cur)
    assertEq(delta.moves.length, 1, 'стрелка есть')
    assertEq(delta.moves[0].to.x, 80, 'выбран ближайший того же цвета')
    assertEq(delta.deaths.length, 0, 'уничтоженных нет')
  })

  test('Delta: parseSaveText не трогает глобалы страницы', () => {
    const savedTurn = CURRENT_TURN
    const prev = Delta.parseSaveText('CURRENT_TURN=7;DEFAULT_DATA=[{"type":"shape","shape":"custom",'
      + '"name":"Фрегат","color":"red","id":1,"x":1,"y":2,"width":40,"height":40}]')
    assertEq(prev.turn, 7, 'ход из файла')
    assertEq(prev.elements.length, 1, 'элементы из файла')
    assertEq(prev.elements[0].name, 'Фрегат', 'имя элемента')
    assertEq(CURRENT_TURN, savedTurn, 'глобальный CURRENT_TURN не изменился')
  })

  test('userEffectsObj: персональные эффекты по title через KW.TITLE_EFFECTS', () => {
    const savedDict = DICT_COMMON[KW.TITLE_EFFECTS]
    const savedCommonA = DICT_COMMON_A
    DICT_COMMON[KW.TITLE_EFFECTS] = { 'Флагман': { 'Сила Б': 1 } }
    DICT_COMMON_A = userEffectsObj.convertFromPlainObject(DICT_COMMON)
    try {
      const titled = { name: 'Пехота', color: '#0000ff', title: 'Флагман', x: 0, y: 0 }
      const groups = userEffectsObj.getRawEffectsList(titled).flat()
      assert(groups.some(e => e[0] === 'Сила Б'), 'эффекты по title из TITLE_EFFECTS применены')
      assert(groups.some(e => e[0] === 'Еда'), 'обычные эффекты Пехоты на месте')

      const untitled = { name: 'Пехота', color: '#0000ff', x: 0, y: 0 }
      const plain = userEffectsObj.getRawEffectsList(untitled).flat()
      assert(!plain.some(e => e[0] === 'Сила Б'), 'без title эффекта нет')

      const other = { name: 'Пехота', color: '#0000ff', title: 'Рядовой', x: 0, y: 0 }
      const otherList = userEffectsObj.getRawEffectsList(other).flat()
      assert(!otherList.some(e => e[0] === 'Сила Б'), 'другой title эффекта не получает')
    } finally {
      if (typeof savedDict === 'undefined') {
        delete DICT_COMMON[KW.TITLE_EFFECTS]
      } else {
        DICT_COMMON[KW.TITLE_EFFECTS] = savedDict
      }
      DICT_COMMON_A = savedCommonA
    }
  })

  test('init: кнопки панели объекта и панели фигур создаются из JS', () => {
    assert(!!document.getElementById('edit-atk-btn'), 'кнопка Атк есть')
    assert(!!document.getElementById('edit-pin-btn'), 'кнопка P есть')
    assert(!!document.getElementById('obj-lvl'), 'поле уровня есть')
    assert(!!document.getElementById('sel-info-btn'), 'кнопка info есть')

    const span = document.getElementById('shape-controls')
    assert(!!span, 'span контролов фигур есть')
    assert(span.contains(document.getElementById('place-shape-btn')), 'place-shape-btn внутри span')
    assert(span.contains(document.getElementById('clone-shape-btn')), 'clone-shape-btn внутри span')
    assert(span.contains(document.getElementById('user-effects-btn')), 'user-effects-btn внутри span')
    assert(span.contains(document.getElementById('ch_switch_edits')), 'галочка Ed внутри span')
    assert(span.contains(document.getElementById('ch_pay')), 'галочка Pay внутри span')
    assert(span.contains(document.getElementById('ch_fog')), 'галочка Т.В. внутри span')
    // checked-атрибут отражает дефолт из разметки: свойство .checked тесты сбрасывают через resetGame
    assert(document.getElementById('ch_pay').hasAttribute('checked'), 'Pay включён по умолчанию')
    assert(fogCheckbox && fogCheckbox.checked, 'fogCheckbox перевыполнен после инъекции')
  })

  test('applyFogOfWarDefault: SETTINGS.DEFAULT_FOG_OF_WAR задаёт галочку Т.В.', () => {
    const saved = SETTINGS.DEFAULT_FOG_OF_WAR
    try {
      SETTINGS.DEFAULT_FOG_OF_WAR = false
      applyFogOfWarDefault()
      assert(!document.getElementById('ch_fog').checked, 'флаг false — туман выключен')

      delete SETTINGS.DEFAULT_FOG_OF_WAR
      applyFogOfWarDefault()
      assert(document.getElementById('ch_fog').checked, 'флаг не задан — туман включён (прежнее поведение)')

      SETTINGS.DEFAULT_FOG_OF_WAR = true
      applyFogOfWarDefault()
      assert(document.getElementById('ch_fog').checked, 'флаг true — туман включён')
    } finally {
      if (typeof saved === 'undefined') {
        delete SETTINGS.DEFAULT_FOG_OF_WAR
      } else {
        SETTINGS.DEFAULT_FOG_OF_WAR = saved
      }
      applyFogOfWarDefault()
    }
  })

  test('userEffectsObj.getNamedEffects: по имени, по title, от игрока', () => {
    const savedCommonA = DICT_COMMON_A
    const savedKreiser = DICT_COMMON['Крейсер']
    const savedTitle = DICT_COMMON[KW.TITLE_EFFECTS]
    const savedUser = DICT_USER['Синие']

    DICT_COMMON['Крейсер'] = { Уран: -1, [KW.COST]: { Металл: 50 } }
    DICT_COMMON[KW.TITLE_EFFECTS] = { 'Флагман': { 'Сила Б': 1 } }
    DICT_USER['Синие'] = { 'Крейсер': [['ОО', 3]] }
    DICT_COMMON_A = userEffectsObj.convertFromPlainObject(DICT_COMMON)

    try {
      const effs = userEffectsObj.getNamedEffects(
        { name: 'Крейсер', color: '#0000ff', title: 'Флагман', x: 0, y: 0 })
      assert(effs.some(e => e[0] === 'Уран' && e[2] === 'DICT_COMMON'), 'эффект по имени')
      assert(effs.some(e => e[0] === 'Сила Б' && e[2] === 'TITLE «Флагман»'), 'эффект по title')
      assert(effs.some(e => e[0] === 'ОО' && e[2] === 'DICT_USER'), 'эффект игрока')
      assert(!effs.some(e => e[0] === KW.COST), 'цена не попадает в именные эффекты')

      const noTitle = userEffectsObj.getNamedEffects(
        { name: 'Крейсер', color: '#0000ff', x: 0, y: 0 })
      assert(!noTitle.some(e => e[2].startsWith('по title')), 'без title группы по title нет')
    } finally {
      if (typeof savedKreiser === 'undefined') {
        delete DICT_COMMON['Крейсер']
      } else {
        DICT_COMMON['Крейсер'] = savedKreiser
      }
      if (typeof savedTitle === 'undefined') {
        delete DICT_COMMON[KW.TITLE_EFFECTS]
      } else {
        DICT_COMMON[KW.TITLE_EFFECTS] = savedTitle
      }
      DICT_USER['Синие'] = savedUser
      DICT_COMMON_A = savedCommonA
    }
  })

  test('setTitle: смена title пересчитывает панель эффектов игрока', () => {
    resetGame([])
    const savedCommonA = DICT_COMMON_A
    const savedTitle = DICT_COMMON[KW.TITLE_EFFECTS]
    DICT_COMMON[KW.TITLE_EFFECTS] = { 'Флагман': { 'Сила Б': 1 } }
    DICT_COMMON_A = userEffectsObj.convertFromPlainObject(DICT_COMMON)

    try {
      const farm = placeTestObject('Ферма', '#0000ff')
      selectedElement = farm

      selection.setTitle('')
      UI.drawInfoPanel()
      assert(!info_panel_body.innerHTML.includes('Сила Б'), 'до назначения title эффекта нет')

      selection.setTitle('Флагман')
      assert(info_panel_body.innerHTML.includes('Сила Б'), 'после смены title панель пересчитана')

      selection.setTitle('Рядовой')
      assert(!info_panel_body.innerHTML.includes('Сила Б'), 'смена на title без эффектов убирает эффект')

      selection.setTitle('Флагман')
      assert(info_panel_body.innerHTML.includes('Сила Б'), 'эффект вернулся при возврате title')
    } finally {
      selectedElement = null
      if (typeof savedTitle === 'undefined') {
        delete DICT_COMMON[KW.TITLE_EFFECTS]
      } else {
        DICT_COMMON[KW.TITLE_EFFECTS] = savedTitle
      }
      DICT_COMMON_A = savedCommonA
    }
  })

  test('SquareGrid: биомы заливаются цветом из biomeColors', () => {
    // подставляем биомы временно: реальное состояние SquareGrid.biomes вернём в конце
    const savedBiomes = SquareGrid.biomes
    SquareGrid.biomes = {}
    const fake = {
      lineWidth: 0, font: '', strokeStyle: '', fillStyle: '',
      textAlign: '', textBaseline: '',
      save() {}, restore() {}, beginPath() {},
      rect() {}, clip() {}, moveTo() {}, lineTo() {}, stroke() {}, strokeRect() {},
      fills: [],
      fillRect(x, y, w, h) {
        this.fills.push({ fillStyle: this.fillStyle, x, y, w, h })
      },
      fillText(text, x, y) {},
    }
    try {
      // B2 → явный биом 'ЛЕ'; A1 → только defaultBiome (справочный, НЕ заливается)
      withSquareGrid({ size: 100, defaultBiome: 'ГО', biomeColors: {
        'ЛЕ': 'rgba(1,2,3,0.5)',
        'ГО': 'rgba(9,9,9,0.4)',
      } }, () => {
        SquareGrid.setBiome(1, 1, ' ЛЕ ') // B2, с пробелами — код нормализуется
        SquareGrid.draw(fake, 500, 500)

        assertEq(fake.fills.length, 1, 'заливается только клетка с явным биомом')
        const b2 = fake.fills.find(f => f.x === 100 && f.y === 100)
        assert(b2, 'клетка B2 залита по своему прямоугольнику')
        assertEq(b2 && b2.fillStyle, 'rgba(1,2,3,0.5)', 'цвет B2 — из biomeColors')
        assert(!fake.fills.some(f => f.x === 0 && f.y === 0),
          'клетка только с defaultBiome не заливается (defaultBiome — справочный)')
        assert(!fake.fills.some(f => f.x === 200), 'клетка без биома не заливается')
      })

      // код биома, которого нет в biomeColors, — заливки нет
      withSquareGrid({ size: 100, biomeColors: { 'ЛЕ': 'rgba(1,2,3,0.5)' } }, () => {
        SquareGrid.biomes = {}
        SquareGrid.setBiome(1, 1, 'ZZ')
        fake.fills.length = 0
        SquareGrid.draw(fake, 500, 500)
        assertEq(fake.fills.length, 0, 'неизвестный код не заливается')
      })

      // без biomeColors заливки нет вообще, даже с заданными биомами
      withSquareGrid({ size: 100 }, () => {
        SquareGrid.biomes = {}
        SquareGrid.setBiome(1, 1, 'ЛЕ')
        assertEq(SquareGrid.conf().biomeColors, null)
        fake.fills.length = 0
        SquareGrid.draw(fake, 500, 500)
        assertEq(fake.fills.length, 0, 'без таблицы цветов клеток заливки нет')
      })
    } finally {
      SquareGrid.biomes = savedBiomes
    }
  })

  // ---------- редактор биомов (вариант A) ----------
  /** экранные координаты центра клетки (при Viewport 1/0/0 после resetGame) */
  function biomeCellClient(col, row) {
    const rect = canvas.getBoundingClientRect()
    const conf = SquareGrid.conf()
    return {
      x: rect.left + (conf.offsetX + (col + 0.5) * conf.stepX) * Viewport.scale + Viewport.offsetX,
      y: rect.top + (conf.offsetY + (row + 0.5) * conf.stepY) * Viewport.scale + Viewport.offsetY,
    }
  }

  test('biomeActions: клик задаёт/перезаписывает биом, «СТЕРЕТЬ» — удаляет, ПКМ двигает карту', () => {
    const savedBiomes = SquareGrid.biomes
    const savedMode = { ...biomeModeObj }
    const savedDragging = Pointer.isDragging
    const viewport = { scale: Viewport.scale, offsetX: Viewport.offsetX, offsetY: Viewport.offsetY }
    const sel = document.getElementById('biome-code')
    const code = sel ? sel.value : ''
    // клик ЛКМ/ПКМ по fogCanvas: движок в режиме биома красит ЛКМ, ПКМ панит карту
    const clickBiome = (p, button = 0) => {
      fogCanvas.dispatchEvent(new MouseEvent('mousedown', { clientX: p.x, clientY: p.y, button, bubbles: true, cancelable: true }))
      fogCanvas.dispatchEvent(new MouseEvent('mouseup', { clientX: p.x, clientY: p.y, button, bubbles: true }))
    }
    try {
      withSquareGrid({ size: 100, defaultBiome: 'ГО', biomeColors: { 'ЛЕ': 'rgba(1,2,3,0.5)' } }, () => {
        SquareGrid.biomes = {}
        biomeModeObj.active = true
        biomeActionsObj.refreshOptions()
        // select содержит коды biomeColors + defaultBiome + СТЕРЕТЬ
        const values = [...sel.options].map(o => o.value)
        assert(values.includes('ЛЕ'), 'коды biomeColors в списке')
        assert(values.includes('ГО'), 'defaultBiome в списке')
        assert(values.includes(biomeActionsObj.ERASE_VALUE), 'СТЕРЕТЬ в списке')

        sel.value = 'ЛЕ'
        const b1 = biomeCellClient(1, 0) // клетка B1
        clickBiome(b1)
        assertEq(SquareGrid.biomes['B1'], 'ЛЕ', 'клик в клетку задаёт её биом')

        sel.value = 'ГО'
        clickBiome(b1)
        assertEq(SquareGrid.biomes['B1'], 'ГО', 'повторный клик (после mouseup) перезаписывает код')

        sel.value = biomeActionsObj.ERASE_VALUE
        clickBiome(b1)
        assert(!('B1' in SquareGrid.biomes), '«СТЕРЕТЬ» + клик удаляет биом клетки')

        // ПКМ теперь не стирает, а двигает карту, биомы не трогает
        sel.value = 'ЛЕ'
        SquareGrid.biomes = {}
        clickBiome(biomeCellClient(2, 0)) // обычный клик ЛКМ по C1: paint + mouseup сбрасывает lastKey
        assertEq(SquareGrid.biomes['C1'], 'ЛЕ', 'клик подготовил клетку C1')
        Viewport.offsetY = 0
        const beforeX = Viewport.offsetX
        const panStart = biomeCellClient(2, 0)
        fogCanvas.dispatchEvent(new MouseEvent('mousedown', { clientX: panStart.x, clientY: panStart.y, button: 2, bubbles: true, cancelable: true }))
        fogCanvas.dispatchEvent(new MouseEvent('mousemove', { clientX: panStart.x + 40, clientY: panStart.y - 18, button: 2, bubbles: true, cancelable: true }))
        fogCanvas.dispatchEvent(new MouseEvent('mouseup', { clientX: panStart.x + 40, clientY: panStart.y - 18, button: 2, bubbles: true }))
        assertEq(Viewport.offsetX, beforeX + 40, 'ПКМ сдвинула карту по X')
        assertEq(SquareGrid.biomes['C1'], 'ЛЕ', 'ПКМ-драг не стирает биом клетки')
        assertEq(Object.keys(SquareGrid.biomes).length, 1, 'во время ПКМ-драга новых биомов не появляется')
      })
    } finally {
      SquareGrid.biomes = savedBiomes
      Object.assign(biomeModeObj, savedMode)
      Viewport.scale = viewport.scale
      Viewport.offsetX = viewport.offsetX
      Viewport.offsetY = viewport.offsetY
      Pointer.isDragging = savedDragging
      if (sel) sel.value = code
    }
  })

  test('biomeActions: протягивание не меняет уже расписанную клетку, переносится на соседние', () => {
    const savedBiomes = SquareGrid.biomes
    const savedMode = { ...biomeModeObj }
    const input = document.getElementById('biome-code')
    const savedCode = input ? input.value : ''
    try {
      withSquareGrid({ size: 100 }, () => {
        SquareGrid.biomes = {}
        biomeModeObj.active = true
        if (input) input.value = 'ЛЕ'

        const b1 = biomeCellClient(1, 0)
        biomeActionsObj.paint(b1.x, b1.y, false)
        assertEq(SquareGrid.biomes['B1'], 'ЛЕ')

        // drag-передвижение по той же клетке не должно затирать её новым кодом
        if (input) input.value = 'ГО'
        biomeActionsObj.paint(b1.x, b1.y, false)
        assertEq(SquareGrid.biomes['B1'], 'ЛЕ', 'drag по расписанной клетке не перезаписывает')

        // соседняя клетка — новый ключ, применяется уже другой активный код
        const c1 = biomeCellClient(2, 0)
        biomeActionsObj.paint(c1.x, c1.y, false)
        assertEq(SquareGrid.biomes['C1'], 'ГО', 'новая клетка берёт актуальный код')

        // конец драга сбрасывает lastKey: повторный.paint снова пишет
        Pointer.endDrag()
        biomeActionsObj.paint(b1.x, b1.y, false)
        assertEq(SquareGrid.biomes['B1'], 'ГО', 'после endDrag клетку можно перезаписать')
      })
    } finally {
      SquareGrid.biomes = savedBiomes
      Object.assign(biomeModeObj, savedMode)
      if (input) input.value = savedCode
    }
  })

  test('biomeActions: hover-подсветка рисует рамку нужной клетки и метку с кодом', () => {
    const savedBiomes = SquareGrid.biomes
    const savedMode = { ...biomeModeObj }
    const savedMouse = Pointer.mousePos
    const input = document.getElementById('biome-code')
    const savedCode = input ? input.value : ''
    const fake = {
      lineWidth: 0, font: '', strokeStyle: '',
      textAlign: '', textBaseline: '', rects: [], labels: [],
      fillStyle_inner: '',
      save() {}, restore() {}, strokeRect(x, y, w, h) {
        this.rects.push({ x, y, w, h })
      },
      get fillStyle() { return this.fillStyle_inner },
      set fillStyle(v) { this.fillStyle_inner = v },
      fillText(text, x, y) { this.labels.push({ text: String(text), x, y }) },
    }
    try {
      withSquareGrid({ size: 100 }, () => {
        SquareGrid.biomes = {}
        biomeModeObj.active = true
        if (input) input.value = 'ЛЕ'
        Pointer.mousePos = biomeCellClient(0, 0) // клетка A1

        biomeActionsObj.drawHover(fake)
        assertEq(fake.rects.length, 1, 'рамка ровно одна')
        assertEq(fake.rects[0].x, 0)
        assertEq(fake.rects[0].y, 0)
        assertEq(fake.rects[0].w, 100)
        assertEq(fake.rects[0].h, 100)
        assert(fake.labels.some(l => l.text.includes('A1') && l.text.includes('ЛЕ')),
          'метка показывает клетку и будущий код')

        // выключенный режим — ничего не рисуем
        biomeModeObj.active = false
        fake.rects.length = 0
        biomeActionsObj.drawHover(fake)
        assertEq(fake.rects.length, 0)
      })
    } finally {
      SquareGrid.biomes = savedBiomes
      Object.assign(biomeModeObj, savedMode)
      Pointer.mousePos = savedMouse
      if (input) input.value = savedCode
    }
  })

  test('biomeActions: при выключенной сетке внутри клетки нет, рисования нет', () => {
    const savedBiomes = SquareGrid.biomes
    const savedMode = { ...biomeModeObj }
    try {
      withSquareGrid(null, () => {
        SquareGrid.biomes = {}
        biomeModeObj.active = true
        assertEq(biomeActionsObj.cellFromClient(150, 150), null, 'вне сетки клетки нет')
        biomeActionsObj.paint(150, 150, false)
        assertEq(Object.keys(SquareGrid.biomes).length, 0, 'рисование ничего не записало')
      })
    } finally {
      SquareGrid.biomes = savedBiomes
      Object.assign(biomeModeObj, savedMode)
    }
  })

  // ---------- запуск ----------
  async function runAll() {
    try {
      await until(() => typeof getCurrentMap === 'function' && getCurrentMap(), 10000,
        'карта не загрузилась за 10с')
    } catch (e) {
      summaryEl.textContent = '✗ ' + e.message
      summaryEl.style.color = '#c00'
      return
    }
    let pass = 0
    let fail = 0
    for (const t of tests) {
      const row = document.createElement('div')
      try {
        const out = t.fn()
        if (out && typeof out.then === 'function') await out
        row.textContent = `✓ ${t.name}`
        row.style.color = '#0a0'
        pass++
      } catch (e) {
        row.textContent = `✗ ${t.name} — ${e.message}`
        row.style.color = '#c00'
        fail++
        console.error(t.name, e)
      }
      resultsEl.appendChild(row)
    }
    summaryEl.textContent = `Пройдено: ${pass}, упало: ${fail}`
    summaryEl.style.color = fail ? '#c00' : '#0a0'
  }

  if (document.readyState === 'loading') {
    window.addEventListener('load', runAll)
  } else {
    runAll()
  }
})()
