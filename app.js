// Состояние приложения
const state = {
  faction: 'red',
  isPathMode: false,
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  dragStart: null,
  units: [],
  activePath: null,
  activeUnitForPath: null,
  customUnitImage: null
}

// Элементы DOM
const mapContainer = document.getElementById('map-container')
const mapImage = document.getElementById('map-image')
const factionSelect = document.getElementById('faction')
const pathModeBtn = document.getElementById('path-mode')
const saveBtn = document.getElementById('save')
const loadInput = document.getElementById('load')
const unitImageInput = document.getElementById('unit-image')
const mapUploadInput = document.getElementById('map-upload')

// Загрузка карты
mapUploadInput.addEventListener('change', (e) => {
  const file = e.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (event) => {
      mapImage.src = event.target.result
    }
    reader.readAsDataURL(file)
  }
})

// Создание юнита при клике на карту
mapContainer.addEventListener('click', (e) => {
  if (e.target !== mapImage || state.isPathMode) return

  const rect = mapImage.getBoundingClientRect()
  const x = (e.clientX - rect.left - state.offsetX) / state.scale
  const y = (e.clientY - rect.top - state.offsetY) / state.scale

  const unit = document.createElement('div')
  unit.className = `unit faction-${state.faction}`
  unit.style.left = `${x}px`
  unit.style.top = `${y}px`
  unit.dataset.faction = state.faction

  // Используем кастомное изображение или стандартное
  if (state.customUnitImage) {
    unit.style.backgroundImage = `url(${state.customUnitImage})`
  } else {
    unit.style.backgroundImage = 'url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48Y2lyY2xlIGN4PSIyNTYiIGN5PSIyNTYiIHI9IjI1NiIgZmlsbD0iY3VycmVudENvbG9yIi8+PC9zdmc+")'
  }

  mapContainer.appendChild(unit)
  state.units.push({
    element: unit,
    x,
    y,
    faction: state.faction,
    paths: []
  })

  unit.addEventListener('mousedown', startDrag)
})

// Переключение фракции
factionSelect.addEventListener('change', () => {
  state.faction = factionSelect.value
})

// Режим маршрутов
pathModeBtn.addEventListener('click', () => {
  state.isPathMode = !state.isPathMode
  pathModeBtn.textContent = `Режим маршрутов (${state.isPathMode ? 'Вкл' : 'Выкл'})`
  if (state.isPathMode) {
    alert('Кликните на юнита, чтобы начать рисовать маршрут. Кликните на карту для добавления точек. Повторный клик на юнита — завершение.')
  } else if (state.activePath) {
    // Сброс активного маршрута
    state.activePath.element.remove()
    state.activePath = null
    state.activeUnitForPath = null
  }
})

// Обработка маршрутов
mapContainer.addEventListener('click', (e) => {
  if (!state.isPathMode) return

  const clickedUnit = e.target.closest('.unit')
  const isMapClick = e.target === mapImage

  if (clickedUnit && !state.activeUnitForPath) {
    // Начало маршрута
    state.activeUnitForPath = clickedUnit
    state.activePath = {
      points: [{ x: parseFloat(clickedUnit.style.left), y: parseFloat(clickedUnit.style.top) }],
      element: document.createElementNS('http://www.w3.org/2000/svg', 'svg'),
      pathElement: document.createElementNS('http://www.w3.org/2000/svg', 'path')
    }
    state.activePath.element.style.position = 'absolute'
    state.activePath.element.style.left = '0'
    state.activePath.element.style.top = '0'
    state.activePath.element.style.width = '100%'
    state.activePath.element.style.height = '100%'
    state.activePath.pathElement.classList.add('path', `path-${clickedUnit.dataset.faction}`)
    state.activePath.element.appendChild(state.activePath.pathElement)
    mapContainer.appendChild(state.activePath.element)
  } else if (isMapClick && state.activeUnitForPath) {
    // Добавление точки
    const rect = mapImage.getBoundingClientRect()
    const x = (e.clientX - rect.left - state.offsetX) / state.scale
    const y = (e.clientY - rect.top - state.offsetY) / state.scale
    state.activePath.points.push({ x, y })

    // Отрисовка линии
    const d = state.activePath.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    state.activePath.pathElement.setAttribute('d', d)
  } else if (clickedUnit && state.activeUnitForPath === clickedUnit) {
    // Завершение маршрута
    const unitData = state.units.find(u => u.element === clickedUnit)
    if (unitData) {
      unitData.paths = state.activePath.points
    }
    state.activePath = null
    state.activeUnitForPath = null
  }
})

// Сохранение в JSON
saveBtn.addEventListener('click', () => {
  const data = {
    units: state.units.map(u => ({
      x: u.x,
      y: u.y,
      faction: u.faction,
      paths: u.paths,
      image: u.element.style.backgroundImage
    })),
    mapImage: mapImage.src
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'map-data.json'
  a.click()
})

// Загрузка из JSON
loadInput.addEventListener('change', (e) => {
  const file = e.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (event) => {
    const data = JSON.parse(event.target.result)

    // Очистка текущих юнитов и путей
    state.units.forEach(u => u.element.remove())
    state.units = []
    document.querySelectorAll('svg').forEach(svg => svg.remove())

    // Загрузка карты
    if (data.mapImage) {
      mapImage.src = data.mapImage
    }

    // Загрузка юнитов
    data.units.forEach(unitData => {
      const unit = document.createElement('div')
      unit.className = `unit faction-${unitData.faction}`
      unit.style.left = `${unitData.x}px`
      unit.style.top = `${unitData.y}px`
      unit.style.backgroundImage = unitData.image || 'none'
      unit.dataset.faction = unitData.faction
      mapContainer.appendChild(unit)

      state.units.push({
        element: unit,
        x: unitData.x,
        y: unitData.y,
        faction: unitData.faction,
        paths: unitData.paths || []
      })

      // Восстановление маршрутов
      if (unitData.paths && unitData.paths.length > 1) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        svg.style.position = 'absolute'
        svg.style.left = '0'
        svg.style.top = '0'
        svg.style.width = '100%'
        svg.style.height = '100%'
        path.classList.add('path', `path-${unitData.faction}`)
        const d = unitData.paths.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
        path.setAttribute('d', d)
        svg.appendChild(path)
        mapContainer.appendChild(svg)
      }

      unit.addEventListener('mousedown', startDrag)
    })
  }
  reader.readAsText(file)
})

// Загрузка изображения для юнита
unitImageInput.addEventListener('change', (e) => {
  const file = e.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (event) => {
      state.customUnitImage = event.target.result
    }
    reader.readAsDataURL(file)
  }
})

// Масштабирование карты
mapContainer.addEventListener('wheel', (e) => {
  e.preventDefault()
  state.scale += e.deltaY * -0.01
  state.scale = Math.min(Math.max(0.1, state.scale), 3)
  updateMapTransform()
})

// Перемещение карты
mapContainer.addEventListener('mousedown', (e) => {
  if (e.target === mapImage && !state.isPathMode) {
    state.dragStart = { x: e.clientX, y: e.clientY }
  }
})

document.addEventListener('mousemove', (e) => {
  if (state.dragStart) {
    state.offsetX += e.clientX - state.dragStart.x
    state.offsetY += e.clientY - state.dragStart.y
    state.dragStart = { x: e.clientX, y: e.clientY }
    updateMapTransform()
  }
})

document.addEventListener('mouseup', () => {
  state.dragStart = null
})

function updateMapTransform() {
  mapImage.style.transform = `scale(${state.scale}) translate(${state.offsetX}px, ${state.offsetY}px)`
}

// Перетаскивание юнитов
function startDrag(e) {
  if (state.isPathMode) return

  e.preventDefault()
  const unit = e.target
  const startX = e.clientX
  const startY = e.clientY
  const startLeft = parseFloat(unit.style.left)
  const startTop = parseFloat(unit.style.top)

  function onMouseMove(e) {
    const dx = (e.clientX - startX) / state.scale
    const dy = (e.clientY - startY) / state.scale
    unit.style.left = `${startLeft + dx}px`
    unit.style.top = `${startTop + dy}px`
  }

  function onMouseUp() {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
    // Обновляем позицию в state
    const unitData = state.units.find(u => u.element === unit)
    if (unitData) {
      unitData.x = parseFloat(unit.style.left)
      unitData.y = parseFloat(unit.style.top)
    }
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

// Загружаем тестовую карту (можно удалить)
mapImage.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAwIiBoZWlnaHQ9IjEwMDAiPjxyZWN0IHdpZHRoPSIxMDAwIiBoZWlnaHQ9IjEwMDAiIGZpbGw9IiMzMzMiLz48cmVjdCB4PSIzMDAiIHk9IjMwMCIgd2lkdGg9IjQwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9IiM1NTUiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+'
