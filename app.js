// Состояние приложения
const state = {
  faction: 'red',
  isPathMode: false,
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  dragStart: null,
  units: [],
  buildings: [],
  activePath: null,
  activeUnitForPath: null
}

// Элементы DOM
const mapContainer = document.getElementById('map-container')
const mapImage = document.getElementById('map-image')
const factionSelect = document.getElementById('faction')
const pathModeBtn = document.getElementById('path-mode')
const saveBtn = document.getElementById('save')
const loadInput = document.getElementById('load')
const unitImageInput = document.getElementById('unit-image')

// Загрузка карты
mapImage.addEventListener('click', (e) => {
  if (state.isPathMode) return
  
  const rect = mapImage.getBoundingClientRect()
  const x = (e.clientX - rect.left - state.offsetX) / state.scale
  const y = (e.clientY - rect.top - state.offsetY) / state.scale

  // Создание юнита
  const unit = document.createElement('img')
  unit.className = `unit faction-${state.faction}`
  unit.src = 'default-unit.png' // Замени на свой URL
  unit.style.left = `${x}px`
  unit.style.top = `${y}px`
  unit.dataset.faction = state.faction

  // Добавление в DOM и состояние
  mapContainer.appendChild(unit)
  state.units.push({
      element: unit,
      x,
      y,
      faction: state.faction,
      paths: []
  })

  // Перетаскивание юнита
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
      alert('Кликните на юнита, чтобы начать рисовать маршрут. Кликните ещё раз для завершения.')
  }
})

// Обработка маршрутов
mapContainer.addEventListener('click', (e) => {
  if (!state.isPathMode) return

  const clickedUnit = e.target.closest('.unit')
  if (clickedUnit) {
      if (!state.activeUnitForPath) {
          // Начало маршрута
          state.activeUnitForPath = clickedUnit
          state.activePath = {
              points: [{ x: parseFloat(clickedUnit.style.left), y: parseFloat(clickedUnit.style.top) }],
              element: document.createElementNS('http://www.w3.org/2000/svg', 'svg')
          }
          mapContainer.appendChild(state.activePath.element)
      } else {
          // Добавление точки
          const rect = mapImage.getBoundingClientRect()
          const x = (e.clientX - rect.left - state.offsetX) / state.scale
          const y = (e.clientY - rect.top - state.offsetY) / state.scale
          state.activePath.points.push({ x, y })

          // Отрисовка линии
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
          const d = state.activePath.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
          path.setAttribute('d', d)
          path.classList.add('path')
          state.activePath.element.innerHTML = ''
          state.activePath.element.appendChild(path)

          // Сохранение в юнит
          const unitData = state.units.find(u => u.element === state.activeUnitForPath)
          if (unitData) unitData.paths = state.activePath.points
      }
  }
})

// Сохранение в JSON
saveBtn.addEventListener('click', () => {
  const data = {
      units: state.units.map(u => ({
          x: u.x,
          y: u.y,
          faction: u.faction,
          paths: u.paths
      })),
      buildings: state.buildings.map(b => ({
          x: b.x,
          y: b.y,
          faction: b.faction
      }))
  }
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
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
      // Очистка текущих юнитов
      state.units.forEach(u => u.element.remove())
      state.units = []
      // Загрузка новых
      data.units.forEach(unitData => {
          const unit = document.createElement('img')
          unit.className = `unit faction-${unitData.faction}`
          unit.src = 'default-unit.png'
          unit.style.left = `${unitData.x}px`
          unit.style.top = `${unitData.y}px`
          mapContainer.appendChild(unit)
          state.units.push({
              element: unit,
              ...unitData
          })
          unit.addEventListener('mousedown', startDrag)
      })
  };
  reader.readAsText(file)
})

// Масштабирование и перемещение карты
mapContainer.addEventListener('wheel', (e) => {
  e.preventDefault()
  state.scale += e.deltaY * -0.01
  state.scale = Math.min(Math.max(0.5, state.scale), 3)
  mapImage.style.transform = `scale(${state.scale}) translate(${state.offsetX}px, ${state.offsetY}px)`
})

mapContainer.addEventListener('mousedown', (e) => {
  if (e.target === mapImage) {
      state.dragStart = { x: e.clientX, y: e.clientY }
  }
})

document.addEventListener('mousemove', (e) => {
  if (state.dragStart) {
      state.offsetX += e.clientX - state.dragStart.x
      state.offsetY += e.clientY - state.dragStart.y
      state.dragStart = { x: e.clientX, y: e.clientY }
      mapImage.style.transform = `scale(${state.scale}) translate(${state.offsetX}px, ${state.offsetY}px)`
  }
})

document.addEventListener('mouseup', () => {
  state.dragStart = null
})

// Перетаскивание юнитов
function startDrag(e) {
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

// Загрузка изображения для карты
const mapImageInput = document.createElement('input')
mapImageInput.type = 'file'
mapImageInput.accept = 'image/*'
mapImageInput.addEventListener('change', (e) => {
  const file = e.target.files[0]
  if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
          mapImage.src = event.target.result
      };
      reader.readAsDataURL(file)
  }
})
document.body.appendChild(mapImageInput)
mapImageInput.click()