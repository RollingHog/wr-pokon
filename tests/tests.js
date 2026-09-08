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
