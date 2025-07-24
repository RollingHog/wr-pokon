/* global 
*/

/// <reference path="./data/data.json.js"/>
/* global
CURRENT_TURN DEFAULT_DATA OTHER_SAVE_DATA
*/

/// <reference path="./src/keywords.js"/>
/* global
KW
*/

/// <reference path="./src/rules.js"/>
/* global
DICT_COMMON DICT_USER GRAVE_UNIT WRECK_UNIT
CATEGORY_PRICES OBJ_CATEGORIES 
EFFECT_LISTS DEFAULT 
MAX_UNIT_HP MAP_PATH POP_PROP
*/

/* exported
onOutputClick
*/

// Основные переменные
/** @type {HTMLCanvasElement} */
const canvas = document.getElementById('map-canvas');
const ctx = canvas.getContext('2d');
const canvasContainer = document.getElementById('canvas-container');
const scaleValue = document.getElementById('scale-value');
const scaleSlider = document.getElementById('scale-slider');
const editPanel = document.getElementById('edit-panel');
const customShapesContainer = document.getElementById('custom-shapes-container');
const mapList = document.getElementById('map-list');
const shapeModal = document.getElementById('shape-modal');
const modalShapesContainer = document.getElementById('modal-shapes-container');
const turnDisplay = document.getElementById('turnDisplay');

let scale = 1;
let isDragging = false;
let isDraggingElement = false;
let dragStartX, dragStartY;
let canvasOffsetX = 0, canvasOffsetY = 0;
let tempOffsetX = 0, tempOffsetY = 0;
/** 
* @type {{
*     type: 'shape',
*     shape: activeShapeType,
*     color: color,
*     name?: string,
*     x: number,
*     y: number,
*     width: width,
*     height: height,
*     src: src
*     curr_hp?: number,
*     lvl?: number,
*     disabled?: boolean,
*     endedTurn?: boolean,
* }[]} 
*/
let elements = [];
/** 
* @type {typeof elements[0]} 
*/
let selectedElement = null;
/** 
 * @type {{
* id: mapId,
* name: string,
* src: event.target.result,
* image: Image,
* }[]} 
*/
let maps = [];
let currentMapIndex = -1;
let customShapes = [];
let activeShapeType = 'rect';
let touchIdentifier = null;
let isGlobalLocked = false;
const lineModeObj = {
  active: false,
  points: [],
}

// Инициализация
function init() {

  loadDefaultMap()
  loadDefaultData()
  loadDefaultCustomImages()
  hotkeysLib.init({
    'Delete': () => {
      deleteSelected()
    },
    'End': () => {
      damageSelected()
    },
    'Ctrl End': () => {
      damageSelected(prompt('Damage amount? Minus to heal'))
    },
    'Q': () => {
      switchDisableSelected()
    },
    'E': () => {
      switchEndedTurnSelected()
    },
    'Space': () => {
      onEndTurn()
    }
  })

  resizeCanvas();
  drawCanvas();
  
  addListeners();

  drawTurnDisplay();
  
  // Предпросмотр фигур
  const shapePreviews = document.querySelectorAll('.shape-preview');
  shapePreviews.forEach(preview => {
      preview.addEventListener('click', function() {
          activeShapeType = this.dataset.shape;
          // document.getElementById('shape-size').value = 50;
          // Добавляем класс active к выбранной фигуре
          shapePreviews.forEach(p => p.classList.remove('active'));
          this.classList.add('active');
      });
  });
  
  // Загрузка пользовательских фигур
  document.getElementById('custom-shape').addEventListener('change', function(e) {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      
      Array.from(files).forEach(file => {
          const reader = new FileReader();
          reader.onload = function(event) {
              const img = new Image();
              img.onload = _ => onCustomImageLoad(file, event.target.result);
              img.src = event.target.result;
          };
          reader.readAsDataURL(file);
      });
  });
  
  // Кнопки модального окна
  document.getElementById('modal-close-btn')?.addEventListener('click', () => {
      shapeModal.style.display = 'none';
  });
  
  // Адаптивное отображение панелей
  if (window.innerWidth < 768) {
      document.getElementById('shape-panel').style.display = 'none';
      document.getElementById('text-panel').style.display = 'none';
      
      // Для мобильных заменяем стандартные превью на модальное окно
      const standardShapes = [
          { type: 'rect', color: 'red', name: 'Квадрат' },
          { type: 'circle', color: 'green', name: 'Круг' },
          { type: 'triangle', color: 'blue', name: 'Треугольник' },
          { type: 'line', color: 'black', name: 'Линия' }
      ];
      
      standardShapes.forEach(shape => {
          const preview = document.createElement('div');
          preview.className = 'shape-preview';
          preview.dataset.shape = shape.type;
          preview.title = shape.name;
          
          if (shape.type === 'rect') {
              preview.style.backgroundColor = shape.color;
          } else if (shape.type === 'circle') {
              preview.style.backgroundColor = shape.color;
              preview.style.borderRadius = '50%';
          } else if (shape.type === 'triangle') {
              preview.style.width = '0';
              preview.style.height = '0';
              preview.style.borderLeft = '20px solid transparent';
              preview.style.borderRight = '20px solid transparent';
              preview.style.borderBottom = `40px solid ${shape.color}`;
          } else if (shape.type === 'line') {
              preview.style.backgroundColor = shape.color;
              preview.style.width = '40px';
              preview.style.height = '2px';
              preview.style.marginTop = '19px';
          }
          
          preview.addEventListener('click', function() {
              activeShapeType = shape.type;
              document.getElementById('shape-size').value = 38;
              shapeModal.style.display = 'none';
          });
          
          modalShapesContainer.appendChild(preview);
      });
  }
  
  window.addEventListener('resize', resizeCanvas);
  
  // Активируем первую фигуру по умолчанию
  document.querySelector('.shape-preview')?.click();

  // document.getElementById('add-shape-btn').click()

  const playerBtns = Array.from(document.querySelectorAll('.player-btn'))
  playerBtns.forEach(el => {
    const color = el.dataset.color
    el.style.backgroundColor = color
    el.onclick = _ => setShapeColor(color)
  })
  playerBtns[0].click()
}

function setShapeColor(color) {
  document.getElementById('shape-color').value=color
  document.getElementById('text-color').value=color
  if(typeof selectedElement !== 'undefined' && selectedElement) {
    selectedElement.color = color
    drawCanvas();
  }
}

function addListeners() {
  // События мыши/касания
  canvas.addEventListener('mousedown', handleMouseDown);
  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('mouseup', handleMouseUp);
  canvas.addEventListener('contextmenu', lineActionsObj.finishLineDrawing);

  canvas.addEventListener('wheel', handleWheel, { passive: false });
  
  // События касания для мобильных устройств
  canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
  canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
  canvas.addEventListener('touchend', handleTouchEnd);
  
  // Кнопки тулбара
  document.getElementById('load-map-btn').addEventListener('click', () => {
      document.getElementById('map-file').click();
  });
  
  document.getElementById('map-file').addEventListener('change', loadMaps);
  document.getElementById('save-map-btn')?.addEventListener('click', saveMap);
  document.getElementById('save-objects-btn')?.addEventListener('click', saveGame);
  document.getElementById('load-objects-file').addEventListener('change', loadGame);
  document.getElementById('help-btn').addEventListener('click', showHelp);
  document.getElementById('user-effects-btn').addEventListener('click', userEffectsObj.effectsForSelectedUser);
  
  
  // document.getElementById('add-shape-btn').addEventListener('click', showShapePanel);
  // document.getElementById('add-text-btn').addEventListener('click', showTextPanel);
  
  document.getElementById('place-shape-btn').addEventListener('click', placeShape);
  document.getElementById('clone-shape-btn').addEventListener('click', cloneShape);
  document.getElementById('place-text-btn').addEventListener('click', placeText);
  document.getElementById('place-line-btn').addEventListener('click', lineActionsObj.placeLineClick);
  
  // document.getElementById('delete-btn').addEventListener('click', deleteSelected);
  
  // Форма редактирования
  document.getElementById('edit-atk-btn').addEventListener('click', enableAttackMode);
  // document.getElementById('edit-close-btn').addEventListener('click', closeEditPanel);
  // document.getElementById('edit-color').addEventListener('input', updateElementColor);
  document.getElementById('obj-lvl').addEventListener('input', updateElementLvl);

  // Масштабирование
  scaleSlider.addEventListener('input', updateScale);

  const lockBtn = document.getElementById('lockBtn');
  lockBtn.addEventListener('click', function() {
      isGlobalLocked = !isGlobalLocked;
      
      if (isGlobalLocked) {
        lockBtn.classList.remove('unlocked');
        lockBtn.title = "Разблокировать";
      } else {
          lockBtn.classList.add('unlocked');
          lockBtn.title = "Заблокировать";
      }
  });

  
  // Обработчик клика по индикатору хода
  turnDisplay.addEventListener('click', onEndTurn);
}

let turnEndChecked = false

function onEndTurn() {

  if(!turnEndChecked) {
    alert('Конец хода, рассчитайте эффекты игроков')
    turnEndChecked = true
    return
  }
  turnEndChecked = false

  // Можно добавить дополнительную логику при смене хода
  for (let el of elements) {
    el.endedTurn = false
  }

  elements.forEach(obj => {
    const effects = DICT_COMMON[obj.name];
    if (!effects) return;

    const regenEffect = effects.find(effect => Array.isArray(effect) && effect[0] === KW.REGEN);

    if (regenEffect) {
      const healAmount = regenEffect[1];
      if (typeof healAmount === 'number') {
        offsetUnitHp(obj, healAmount)
      }
    }
  });

  drawCanvas()

  CURRENT_TURN++;
  drawTurnDisplay();
}

function imageObjByObjName(filename) {
  return customShapes.find(({ name }) => name === filename).imageObj
}

function onCustomImageLoad(filename, src) {
  const imageObj = new Image();
  imageObj.src = src;

  const shapeId = 'custom-shape-' + Date.now() + Math.random().toString(36).substr(2, 5);
  customShapes.push({
      id: shapeId,
      name: filename,
      src: src,
      imageObj,
  });

  // Создаем превью для пользовательской фигуры
  const preview = document.createElement('div');
  preview.className = 'shape-preview';
  preview.style.backgroundImage = `url(${src})`;
  preview.dataset.shape = 'custom';
  preview.dataset.shapeId = shapeId;
  preview.dataset.filename = filename;

  const effArrToStr = (arr) => arr.map(e => e.join(': ')).join('\n')
  let costStr = ''
  
  if(!DEFAULT.noHealth.includes(filename)) {
    costStr = '\nЦЕНА:\n'
    let categoryPrice = null
    if(isUnit({name: filename})&& !OBJ_CATEGORIES.UNITS._none_.includes(filename)) {
      for(let category in OBJ_CATEGORIES.UNITS) {
        if(OBJ_CATEGORIES.UNITS[category].includes(filename)) {
          categoryPrice = CATEGORY_PRICES.UNITS[category]
        }
      }
      if(!categoryPrice) {
        categoryPrice = CATEGORY_PRICES.UNITS._default_
      }
      costStr += effArrToStr(categoryPrice)
    }
  } 

  const effStr = typeof DICT_COMMON[filename] !== 'undefined'
    ? '\nЭФФЕКТЫ:\n' + effArrToStr(DICT_COMMON[filename])
    : ''

  preview.title = filename + costStr + effStr
    
  preview.addEventListener('click', function () {
      activeShapeType = 'custom';
      document.querySelectorAll('.shape-preview').forEach(p => p.classList.remove('active'));
      this.classList.add('active');

      if(typeof selectedElement !== 'undefined' && selectedElement) {
        selectedElement.name = this.dataset.filename
        selectedElement.src = this.style.backgroundImage.replace(/(^url\(|\)$|")/g,'')
        drawCanvas();
      }
  });

  customShapesContainer.appendChild(preview);

  // Также добавляем в модальное окно для мобильных
  const modalPreview = preview.cloneNode(true);
  modalPreview.addEventListener('click', function () {
      activeShapeType = 'custom';
      document.querySelectorAll('.shape-preview').forEach(p => p.classList.remove('active'));
      preview.classList.add('active');
      shapeModal.style.display = 'none';
  });
  modalShapesContainer.appendChild(modalPreview);
}

function loadDefaultData() {
  if(typeof DEFAULT_DATA !== 'undefined') {
      elements = DEFAULT_DATA
  }
  if(typeof OTHER_SAVE_DATA !== 'undefined') {
      const oth = OTHER_SAVE_DATA
      scale = oth.scale 
      // canvasOffsetX = oth.canvasOffsetX 
      // canvasOffsetY = oth.canvasOffsetY 
  }
}
function loadDefaultMap() {
  var defaultMapImg = new Image();
  defaultMapImg.onload = function () {
      currentMapIndex = 0
      maps.push({
          name: 'default',
          image: defaultMapImg
      })
      drawCanvas()
      renderMapList()
  }
  defaultMapImg.src = MAP_PATH;
}

function loadDefaultCustomImages() {
  
  for (const objName of DEFAULT.buildings) {
      onCustomImageLoad(objName, `images/buildings/${objName}.png`)
  }
  
  for (const objName of DEFAULT.units) {
      onCustomImageLoad(objName, `images/units/${objName}.png`)
  }
}

// Функции отрисовки
function resizeCanvas() {
  canvas.width = canvasContainer.clientWidth;
  canvas.height = canvasContainer.clientHeight;
  drawCanvas();
}

// let lastPaint = Date.now()
function drawCanvas() {
  // TODO?
  // if(Date.now() - lastPaint < 50) return

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Рисуем фон (шахматный узор)
  const gridSize = 20;
  for (let x = 0; x < canvas.width; x += gridSize) {
      for (let y = 0; y < canvas.height; y += gridSize) {
          const isEven = ((x + y) / gridSize) % 2 === 0;
          ctx.fillStyle = isEven ? '#eee' : '#ddd';
          ctx.fillRect(x, y, gridSize, gridSize);
      }
  }
  
  // Рисуем фоновое изображение (карту)
  if (currentMapIndex >= 0 && maps[currentMapIndex]) {
      const map = maps[currentMapIndex];
      ctx.save();
      ctx.translate(canvasOffsetX, canvasOffsetY);
      ctx.scale(scale, scale);
      ctx.drawImage(map.image, 0, 0, map.image.width, map.image.height);
      ctx.restore();
  }
  
  // Рисуем все элементы
  elements.forEach(element => {
    drawElement(element)
  });

  // lastPaint = Date.now()
}

function drawElement(element) {
  if (element.type === 'shape') {
      drawShape(element);
  } else if (element.type === 'text') {
      drawText(element);
  }
}

const lvlTextSize = 20

/**
 * @param {CanvasRenderingContext2D | null} ctx 
 * @param {typeof elements[0]} el 
 * @param {*} x 
 * @param {*} y 
 */
function drawCustomObj(ctx, el, x, y) {
  // обозначаем принадлежность
  ctx.fillStyle = el.color;
  if (isBuilding(el)) {
    ctx.beginPath();
    ctx.arc(
      x + el.width / 2, y + el.height / 2,
      el.width / 2, 0, Math.PI * 2
    );
    ctx.fill();
  } else {
    // unit
    ctx.beginPath();
    ctx.moveTo(x + el.width / 2, y);
    ctx.lineTo(x + el.width, y + el.height);
    ctx.lineTo(x, y + el.height);
    ctx.closePath();
    ctx.fill();
  }

  const img = imageObjByObjName(el.name)
  ctx.drawImage(img, x, y, el.width, el.height);
  ///
  if((el.curr_hp < MAX_UNIT_HP) && !isNoHealth(el)) {
    drawHealthBar(ctx, x, y + el.height, el.width, el.curr_hp || MAX_UNIT_HP, MAX_UNIT_HP)
  }
  if(el.disabled) {
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2 
    
    ctx.beginPath();
    ctx.arc(x + el.width/2, y + el.height/2, el.width/2, 0, Math.PI * 2);
    ctx.stroke();
            
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + el.width, y + el.height);
    ctx.closePath();
    ctx.stroke();
  } else if(el.endedTurn) {
    ctx.strokeStyle = 'green';
    ctx.lineWidth = 5

    ctx.beginPath();
    ctx.arc(x + el.width/2, y + el.height/2, el.width/2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + 5, y + el.height/2);
    ctx.lineTo(x + el.width/2, y + el.height - 5);
    ctx.lineTo(x + el.width, y);
    // ctx.closePath();
    ctx.stroke();
  }
  if(el.lvl && +el.lvl > 1) {
    ctx.font = `${lvlTextSize}px Arial`;

    ctx.strokeStyle = 'white';
    ctx.fillStyle = 'black';
    ctx.strokeText(el.lvl, x, y+5, lvlTextSize);
    ctx.fillText(el.lvl, x, y+5, lvlTextSize);
  }
}

/** 
* @param {typeof elements[0]} shape 
*/
function drawShape(shape) {
  ctx.save();
  ctx.translate(shape.x * scale + canvasOffsetX, shape.y * scale + canvasOffsetY);
  ctx.scale(scale, scale);
  
  if (shape.shape === 'custom') {
    drawCustomObj(ctx, shape, 0, 0)

      
      // TODO timed building
      // if(isBuilding(shape) && !isNoHealth(shape)) {
      //   const dlt = 5
      //   ctx.strokeStyle = 'white';
      //   ctx.lineWidth = 2 
      //   ctx.beginPath();
      //   ctx.arc(shape.width/2, shape.height/2, shape.width/2-dlt, 0, Math.PI * 2);
      //   ctx.stroke();
      //   ctx.beginPath();
      //   // ctx.moveTo(dlt, dlt-1);
      //   // ctx.lineTo(shape.width-dlt, dlt-1);
      //   ctx.moveTo(shape.width/2, dlt-1);
      //   ctx.lineTo(shape.width/2, shape.height/2);
      //   ctx.lineTo(shape.width/2 + dlt * 2, shape.height - dlt * 2);
      //   // ctx.closePath();
      //   ctx.stroke();
      // }
  } else {
      ctx.fillStyle = shape.color;
      
      switch (shape.shape) {
          case 'rect':
              ctx.fillRect(0, 0, shape.width, shape.height);
              break;
          case 'circle':
              ctx.beginPath();
              ctx.arc(shape.width/2, shape.height/2, shape.width/2, 0, Math.PI * 2);
              ctx.fill();
              break;
          case 'triangle':
              ctx.beginPath();
              ctx.moveTo(shape.width/2, 0);
              ctx.lineTo(shape.width, shape.height);
              ctx.lineTo(0, shape.height);
              ctx.closePath();
              ctx.fill();
              break;
          case 'line':
              ctx.strokeStyle = shape.color;
              ctx.lineWidth = shape.height;
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.lineTo(shape.width, 0);
              ctx.stroke();
              break;
      }
  }
  
  ctx.restore();
}

/**
 * Рисует полоску здоровья под юнитом
 * @param {CanvasRenderingContext2D} ctx - Контекст canvas
 * @param {number} x - X-координата центра юнита
 * @param {number} y - Y-координата низа юнита
 * @param {number} width - Ширина полоски
 * @param {number} hpCurrent - Текущее здоровье
 * @param {number} hpMax - Максимальное здоровье
 * @param {number} [height=5] - Высота полоски (по умолчанию 5px)
 * @param {number} [offsetY=5] - Отступ от юнита (по умолчанию 5px)
 */
function drawHealthBar(ctx, x, y, width, hpCurrent, hpMax, height = 5, offsetY = 5) {
  // Рассчитываем процент здоровья
  const healthPercent = hpCurrent / hpMax;
  
  // Координаты левого края полоски (центрирование)
  const barX = x;
  const barY = y + offsetY;
  
  // Цвета
  const backgroundColor = '#333333';
  const healthColor = healthPercent > 0.6 ? '#4CAF50' :  // Зеленый
                     healthPercent > 0.3 ? '#FFC107' :  // Желтый
                     '#F44336';                         // Красный
  
  // Рисуем фон полоски
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(barX, barY, width, height);
  
  // Рисуем текущее здоровье
  ctx.fillStyle = healthColor;
  ctx.fillRect(barX, barY, width * healthPercent, height);
  
  // Обводка для красоты
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, width, height);

  // Текст с текущим здоровьем
  // ctx.fillStyle = '#FFFFFF';
  // ctx.font = 'bold 10px Arial';
  // ctx.textAlign = 'center';
  // ctx.fillText(
  //     `${hpCurrent}/${hpMax}`,
  //     x + width / 2,
  //     barY + height + 12  // Под полоской
  // );
}

function drawText(text) {
  ctx.save();
  ctx.translate(text.x * scale + canvasOffsetX, text.y * scale + canvasOffsetY);
  ctx.scale(scale, scale);
  
  ctx.font = `${text.size}px Arial`;
  ctx.fillStyle = text.color;
  ctx.fillText(text.content, 0, text.size);
  
  // Обновляем размеры текста
  const metrics = ctx.measureText(text.content);
  text.width = metrics.width;
  text.height = text.size;
  
  ctx.restore();
}

// Обработчики событий мыши/касания
function handleMouseDown(e) {
  const isRightClick = e.button !== 0
  e.preventDefault();
  if(!lineModeObj.active) {
    startDrag(e.clientX, e.clientY, isRightClick);
  } else {
    if (e.button === 0) {
      lineModeObj.active = true;
      
      // Получаем координаты точки
      const rect = canvas.getBoundingClientRect();
      const x = +(e.clientX - rect.left).toFixed(2);
      const y = +(e.clientY - rect.top).toFixed(2);
      
      // Добавляем точку
      lineModeObj.points.push({x, y});
      
      // Перерисовываем холст
      lineActionsObj.drawLineCanvas();
      
      e.preventDefault();
  }
  }
}

function handleTouchStart(e) {
  if (e.touches.length === 1) {
      e.preventDefault();
      const touch = e.touches[0];
      touchIdentifier = touch.identifier;
      startDrag(touch.clientX, touch.clientY);
  } else if (e.touches.length === 2) {
      // Обработка масштабирования двумя пальцами
      e.preventDefault();
      touchIdentifier = null;
  }
}

function startDrag(clientX, clientY, isRightClick = false) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = clientX - rect.left;
  const mouseY = clientY - rect.top;
  
  if(!isRightClick) {
    // Проверяем, не кликнули ли мы на элемент
    for (let i = elements.length - 1; i >= 0; i--) {
      const element = elements[i];
      const x = element.x * scale + canvasOffsetX;
      const y = element.y * scale + canvasOffsetY;
      const width = element.width * scale;
      const height = element.height * scale;
      
      if (mouseX >= x && mouseX <= x + width && mouseY >= y && mouseY <= y + height) {
          if(isAttack) {
            isAttack = false
            attackObj(selectedElement, element)
            return 
          }

          selectedElement = element;
          isDraggingElement = true;
          
          // Показываем панель редактирования
          editPanel.style.display = 'block';
          editPanel.style.left = `${mouseX + 10}px`;
          editPanel.style.top = `${mouseY + 10}px`;
          // document.getElementById('edit-color').value = element.color || '#000000';
          document.getElementById('obj-lvl').value = element.lvl || 1;
          document.getElementById('obj-lvl').select()
          document.getElementById('edit-obj-name').value = element.name || '';
          
          // Начинаем перетаскивание
          isDragging = true;
          dragStartX = mouseX;
          dragStartY = mouseY;
          tempOffsetX = element.x;
          tempOffsetY = element.y;
          
          drawCanvas();
          return;
      }
    }
    isAttack = false
  }
  
  
  // Если не кликнули на элемент, начинаем перемещение холста
  isDragging = true;
  isDraggingElement = false;
  dragStartX = clientX;
  dragStartY = clientY;
  tempOffsetX = canvasOffsetX;
  tempOffsetY = canvasOffsetY;
  
  // Скрываем панель редактирования, если ничего не выбрано
  if (selectedElement) {
      selectedElement = null;
      editPanel.style.display = 'none';
  }
}

function handleMouseMove(e) {
  if (!isDragging) return;
  e.preventDefault();
  updateDrag(e.clientX, e.clientY);
}

function handleTouchMove(e) {
  if (!isDragging || !touchIdentifier) return;
  e.preventDefault();
  
  // Находим нужное касание
  for (let i = 0; i < e.touches.length; i++) {
      if (e.touches[i].identifier === touchIdentifier) {
          updateDrag(e.touches[i].clientX, e.touches[i].clientY);
          break;
      }
  }
}

function updateDrag(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = clientX - rect.left;
  const mouseY = clientY - rect.top;
  
  if (isDraggingElement && selectedElement) {
      // Перемещаем выбранный элемент
      selectedElement.x = +(tempOffsetX + (mouseX - dragStartX) / scale).toFixed(2);
      selectedElement.y = +(tempOffsetY + (mouseY - dragStartY) / scale).toFixed(2);
      
      // Обновляем позицию панели редактирования
      editPanel.style.left = `${mouseX + 10}px`;
      editPanel.style.top = `${mouseY + 10}px`;
  } else {
      // Перемещаем холст
      canvasOffsetX = tempOffsetX + (clientX - dragStartX);
      canvasOffsetY = tempOffsetY + (clientY - dragStartY);
  }
  
  drawCanvas();
}

function handleMouseUp() {
  endDrag();
}

function handleTouchEnd() {
  endDrag();
  touchIdentifier = null;
}

function endDrag() {
  isDragging = false;
  isDraggingElement = false;
}

function handleWheel(e) {
  e.preventDefault();
  
  const delta = e.deltaY > 0 ? 0.9 : 1.1;
  const newScale = Math.min(Math.max(scale * delta, 0.25), 2);
  
  if (newScale !== scale) {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Корректируем смещение для масштабирования относительно курсора
      canvasOffsetX = mouseX - (mouseX - canvasOffsetX) * (newScale / scale);
      canvasOffsetY = mouseY - (mouseY - canvasOffsetY) * (newScale / scale);
      
      scale = newScale;
      scaleValue.textContent = `${Math.round(scale * 100)}%`;
      scaleSlider.value = scale * 100;
      
      drawCanvas();
  }
}

// Функции тулбара
// eslint-disable-next-line no-unused-vars
function showShapePanel() {
  if (window.innerWidth < 768) {
      shapeModal.style.display = 'flex';
  } else {
      document.getElementById('shape-panel').style.display = 'block';
      document.getElementById('text-panel').style.display = 'none';
  }
}

// eslint-disable-next-line no-unused-vars
function showTextPanel() {
  document.getElementById('text-panel').style.display = 'block';
  document.getElementById('shape-panel').style.display = 'none';
}

function cloneShape() {
  if(!selectedElement) return
  
  document.querySelector(`.shape-preview[data-filename="${selectedElement.name}"]`).click()
  placeShape()
}

function placeShape() {
  if (currentMapIndex === -1) {
      alert('Сначала загрузите карту');
      return;
  }
  
  const color = document.getElementById('shape-color').value;
  const size = parseInt(document.getElementById('shape-size').value);
  
  let width = size;
  let height = size;
  let src = null;

  let activePreview = {}
  
  if (activeShapeType === 'line') {
      height = 2;
      width = size * 2;
  } else if (activeShapeType === 'custom') {
      activePreview = document.querySelector('.shape-preview.active[data-shape="custom"]');
      if (activePreview) {
          const shapeId = activePreview.dataset.shapeId;
          const customShape = customShapes.find(s => s.id === shapeId);
          if (customShape) {
              src = customShape.src;
              // Сохраняем пропорции изображения
              const img = new Image();
              img.src = src;
              const ratio = img.width / img.height;
              width = size;
              height = +((size / ratio).toFixed(2));
          }
      }
  }
  
  const shape = {
      type: 'shape',
      name: activePreview.dataset.filename,
      shape: activeShapeType,
      color: color,
      x: (-canvasOffsetX + canvas.width/2 - width*scale/2) / scale,
      y: (-canvasOffsetY + canvas.height/2 - height*scale/2) / scale,
      width: width,
      height: height,
      src: src,
      curr_hp: MAX_UNIT_HP,
      disabled: false,
      endedTurn: false,
  };
  
  elements.push(shape);
  drawElement(shape)
}

function placeText() {
  let content = document.getElementById('text-input').value;
  if (!content) {
      content = prompt('Введите текст');
      if(!content) return;
  }
  
  if (currentMapIndex === -1) {
      alert('Сначала загрузите карту');
      return;
  }
  
  const color = document.getElementById('text-color').value;
  const size = parseInt(document.getElementById('text-size').value);
  
  ctx.font = `${size}px Arial`;
  const metrics = ctx.measureText(content);
  
  const text = {
      type: 'text',
      content: content,
      color: color,
      size: size,
      x: (-canvasOffsetX + canvas.width/2 - metrics.width/2) / scale,
      y: (-canvasOffsetY + canvas.height/2) / scale,
      width: metrics.width,
      height: size
  };
  
  elements.push(text);
  document.getElementById('text-input').value = '';
  drawElement(text);
}

const lineActionsObj = {
  updateLineButton() {
    document.getElementById('place-line-led').textContent = lineModeObj.active 
      ? 'ВКЛ'
      : 'ВЫКЛ'
  },

  placeLineClick() {
    lineModeObj.active = !lineModeObj.active
    lineModeObj.points = []
    lineActionsObj.updateLineButton()

    if(!lineModeObj.active) return
  
    // Настройки линии
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
  },
  
  drawLineCanvas() {
    // Рисуем все точки
    lineModeObj.points.forEach((point, index) => {
      // Точка
      ctx.beginPath();
      ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ff0000';
      ctx.fill();
  
      // Номер точки
      ctx.fillStyle = '#000000';
      ctx.font = '14px Arial';
      ctx.fillText(index, point.x + 8, point.y + 5);
  
      // Линии между точками
      if (index > 0) {
        ctx.beginPath();
        ctx.moveTo(lineModeObj.points[index - 1].x, lineModeObj.points[index - 1].y);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
      }
    });
  },
  
  finishLineDrawing(e) {
    // ПКМ - закончить рисование
    if (e.button === 2 && lineModeObj.active) {
        lineModeObj.active = false;
        lineActionsObj.updateLineButton()
        // Очищаем массив точек для следующего рисунка
        lineModeObj.points = [];
        e.preventDefault();
    }
  }
}

// TODO + sort + icons?
const userEffectsObj = {
  effCache: {},
  getCachedEffects(objName, username) {
    const cacheKey = `${objName}-${username}`;
    if (this.effCache[cacheKey]) {
      return this.effCache[cacheKey];
    }

    const obj = {name: objName}
    const list = [].concat([
      DICT_USER[username]?.[isBuilding(obj) ? '_building_' : '_unit_'],
      DICT_USER[username]?.[obj.name],
      DICT_COMMON?.[isBuilding(obj) ? '_building_' : '_unit_'],
      DICT_COMMON?.[obj.name]
    ])
    if (!list) return list
    const res = list.flat().map((el) => {
      if (!el) return el
      const [k, v] = el
      if (!k) return el
      if (typeof v === 'number' || !isNaN(+v)) return [k, v]
      if (v === '+ЛВЛ' || v === 'ЛВЛ') return [k, +obj.lvl || 1]
      if (v === '+ЛВЛ*2' || v === 'ЛВЛ*2') return [k, 2 * +obj.lvl || 1]
      if (v === '-ЛВЛ') return [k, -obj.lvl || -1]
      if (v === '-ЛВЛ*2') return [k, 2 * -obj.lvl || -1]
      console.warn('bad DICT rule for', obj.name, [k, v])
    })
    this.effCache[cacheKey] = res
    return res
  },
  groupBySections(obj) {
    const result = {};

    // Инициализируем все секции пустыми массивами
    for (const section of Object.keys(EFFECT_LISTS)) {
      result[section] = [];
    }

    // Преобразуем списки свойств в Set для быстрого поиска
    const lookup = {};
    for (const [section, keys] of Object.entries(EFFECT_LISTS)) {
      lookup[section] = new Set(keys);
    }

    // Перебираем свойства входного объекта
    for (const [key, value] of Object.entries(obj)) {
      // Проверяем, входит ли ключ в каждую из секций
      let matched = false;
      for (const section of Object.keys(lookup)) {
        if (lookup[section].has(key)) {
          result[section].push([key, value]);
          matched = true;
          break;
        }
      }
      if(!matched) {
        console.warn('not matched:', key)
      }
      // Если не подошёл ни к одной — можно игнорировать или добавить в "другие"
    }

    return {
      result,
      toObj() { return result },
      toPrettyList() {
        return Object.entries(result)
          .map(([section, eff]) =>
            (`==${section}==\n ${eff.map((arr) => arr.join(': ')).join('\n')}\n`)
          ).join('')
      }
    };
  },

  sumEffects(username) {
    const userColor = colorFromUsername(username)
    let userEffects = []
      const userObjs = elements.filter(obj => obj.color === userColor && !isNoHealth(obj))
      const userBuildings = userObjs.filter(obj => isBuilding(obj))
      const userUnits = userObjs.filter(obj => isUnit(obj))
      userEffects = [].concat(
        userObjs.map(obj => {
          if(obj.disabled) return []
          return userEffectsObj.getCachedEffects(obj.name, username)
        }),
      )
        .flat()
        .filter(e => e)
      const effectsDict = {
        unit_count: userUnits.length,
        build_count: userBuildings.length,
      }
      //       
      for(let [k,v] of userEffects) {
        if(!k) continue
        if(EFFECT_LISTS.local.includes(k)) continue
        if(effectsDict[k]) {
          effectsDict[k] += +v
        } else {
          effectsDict[k] = +v
        }
      }
      if (POP_PROP) {
        const popEff = [].concat(
          DICT_USER[username]?._pop_,
          DICT_COMMON?._pop_
        ).filter(e => e)
        for (let [k, v] of popEff) {
          if (!k) continue
          if (EFFECT_LISTS.local.includes(k)) continue
          if (effectsDict[k]) {
            effectsDict[k] += +v * (effectsDict[POP_PROP] || 0)
          } else {
            effectsDict[k] = +v * (effectsDict[POP_PROP] || 0)
          }
        }
      }
      console.log(effectsDict)
      alert(`Игрок ${username}:\n` 
        + (this.groupBySections(effectsDict).toPrettyList())
        // + JSON.stringify(, 0, 2)
      )
  },
  effectsForSelectedUser() {
    const username = document.querySelector(`[data-color="${document.getElementById('shape-color').value}"]`).textContent
    userEffectsObj.sumEffects(username)
  }
}

function colorFromUsername(username) {
  return Array.from(document.querySelectorAll('.player-btn')).find(el => el.textContent === username).dataset.color
}

function playerByColor(colorStr) {
  return Array.from(document.querySelectorAll('.player-btn')).find(el => el.dataset.color === colorStr).textContent
}

function deleteSelected() {
  if (selectedElement) {
      elements = elements.filter(el => el !== selectedElement);
      selectedElement = null;
      editPanel.style.display = 'none';
      drawCanvas();
  }
}

let isAttack = false
function enableAttackMode() {
  if(!selectedElement) return
  isAttack = true
}

/**
 * @param {typeof elements[0]} obj 
 * @param {*} amount 
 */
function offsetUnitHp(obj, amount) {
  const curr = obj.curr_hp
  let res = curr + amount
  if (res > MAX_UNIT_HP) {
    res = MAX_UNIT_HP
  }
  if (res / MAX_UNIT_HP < 0.3) {
    obj.disabled = true
  } else if (res / MAX_UNIT_HP >= 0.3 && curr / MAX_UNIT_HP < 0.3) {
    obj.disabled = false
  }
  obj.curr_hp = res

  if (obj.curr_hp <= 0) {
    obj.disabled = false
    if (isBuilding(obj)) {
      obj.name = WRECK_UNIT
      drawCanvas(obj);
      return
    }
    if (isUnit(obj)) {
      if (DEFAULT.noGrave.includes(obj.name)) {
        deleteSelected()
        return
      }
      if (DEFAULT.wreckUnit.includes(obj.name)) {
        obj.name = WRECK_UNIT
      } else {
        obj.name = GRAVE_UNIT
      }
    }
  }
  drawCanvas(obj);

  console.log(`${obj.name} изменился на ${amount} HP. Текущее HP: ${obj.curr_hp}`);

}

/**
 * @param {typeof elements[0]} obj 
 */
function getBattleParams(obj) {
  const list = userEffectsObj.getCachedEffects(obj.name, playerByColor(obj.color)) || []
  // ([]).
  return {
    atk: list.filter(([k,v])=> k === 'Атака')[0][1] || 0,
    def: list.filter(([k,v])=> k === 'Защита')[0][1] || 0
  }
}

/**
 * @param {typeof elements[0]} atkr 
 * @param {typeof elements[0]} dfdr 
 */
function attackObj(atkr, dfdr) {
  console.log(
    getBattleParams(atkr),
    getBattleParams(dfdr),
  )
}

function switchDisableSelected() {
  if(!selectedElement) return
  if(typeof selectedElement.disabled === 'undefined') selectedElement.disabled = false
  selectedElement.disabled = !selectedElement.disabled
  drawCanvas();
}
function switchEndedTurnSelected() {
  if(!selectedElement) return
  if(isNoHealth(selectedElement.name)) return
  if(typeof selectedElement.endedTurn === 'undefined') selectedElement.disabled = false
  selectedElement.endedTurn = !selectedElement.endedTurn
  drawCanvas();
}

function damageSelected(amount = 1) {
  if (selectedElement) {
      if(isNoHealth(selectedElement)) return
      if(typeof selectedElement.curr_hp === 'undefined') selectedElement.curr_hp = MAX_UNIT_HP
      offsetUnitHp(selectedElement, -amount)
  }
}

// eslint-disable-next-line no-unused-vars
function closeEditPanel() {
  editPanel.style.display = 'none';
  selectedElement = null;
}

function updateElementLvl() {
  if (selectedElement) {
      selectedElement.lvl = +document.getElementById('obj-lvl').value || 1;
      drawCanvas()
  }
}

function updateScale() {
  scale = parseInt(scaleSlider.value) / 100;
  scaleValue.textContent = `${scaleSlider.value}%`;
  drawCanvas();
}

// Работа с картами
function loadMaps(e) {
  const files = e.target.files;
  if (!files || files.length === 0) return;
  
  Array.from(files).forEach(file => {
      if (!file.type.match('image.*')) return;
      
      const reader = new FileReader();
      reader.onload = function(event) {
          const img = new Image();
          img.onload = function() {
              const mapId = 'map-' + Date.now() + Math.random().toString(36).substr(2, 5);
              maps.push({
                  id: mapId,
                  name: file.name,
                  src: event.target.result,
                  image: img
              });
              
              renderMapList();
              
              // Если это первая загруженная карта, автоматически выбираем ее
              if (maps.length === 1) {
                  loadMap(0);
              }
          };
          img.src = event.target.result;
      };
      reader.readAsDataURL(file);
  });
}

function renderMapList() {
  mapList.innerHTML = '';
  
  if (maps.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.textContent = 'Нет загруженных карт';
      emptyMsg.style.color = '#bdc3c7';
      emptyMsg.style.padding = '5px';
      mapList.appendChild(emptyMsg);
      return;
  }
  
  maps.forEach((map, index) => {
      const mapItem = document.createElement('div');
      mapItem.className = `map-item ${index === currentMapIndex ? 'active' : ''}`;
      mapItem.textContent = map.name.length > 15 ? map.name.substring(0, 15) + '...' : map.name;
      mapItem.title = map.name;
      
      mapItem.addEventListener('click', () => loadMap(index));
      mapList.appendChild(mapItem);
  });
}

function loadMap(index) {
  if (index < 0 || index >= maps.length) return;
  
  const map = maps[index];
  currentMapIndex = index;
  
  // Центрируем карту
  canvasOffsetX = (canvas.width - map.image.width * scale) / 2;
  canvasOffsetY = (canvas.height - map.image.height * scale) / 2;
  
  renderMapList();
  drawCanvas();
}

function saveMap() {
  if (currentMapIndex === -1) {
      alert('Сначала загрузите карту');
      return;
  }
  
  // Создаем временный canvas для сохранения
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  const map = maps[currentMapIndex];
  
  // Определяем границы всех элементов
  let minX = 0, minY = 0;
  let maxX = map.image.width;
  let maxY = map.image.height;
  
  elements.forEach(element => {
      minX = Math.min(minX, element.x);
      minY = Math.min(minY, element.y);
      maxX = Math.max(maxX, element.x + (element.width || 0));
      maxY = Math.max(maxY, element.y + (element.height || 0));
  });
  
  // Устанавливаем размер временного canvas
  const padding = 20;
  tempCanvas.width = (maxX - minX + padding * 2);
  tempCanvas.height = (maxY - minY + padding * 2);
  
  // Отрисовываем фон
  tempCtx.fillStyle = '#ffffff';
  tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
  
  // Отрисовываем фоновое изображение (карту)
  tempCtx.drawImage(
      map.image, 
      padding - minX, 
      padding - minY, 
      map.image.width, 
      map.image.height
  );
  
  // Отрисовываем все элементы
  elements.forEach(element => {
      tempCtx.save();
      tempCtx.translate(padding - minX, padding - minY);
      
      if (element.type === 'shape') {
          if (element.shape === 'custom') {
             drawCustomObj(tempCtx, element, element.x, element.y)
          } else {
              tempCtx.fillStyle = element.color;
              
              switch (element.shape) {
                  case 'line':
                      tempCtx.strokeStyle = element.color;
                      tempCtx.lineWidth = element.height;
                      tempCtx.beginPath();
                      tempCtx.moveTo(element.x, element.y);
                      tempCtx.lineTo(element.x + element.width, element.y);
                      tempCtx.stroke();
                      break;
              }
          }
      } else if (element.type === 'text') {
          tempCtx.font = `${element.size}px Arial`;
          tempCtx.fillStyle = element.color;
          tempCtx.fillText(element.content, element.x, element.y + element.size);
      }
      
      tempCtx.restore();
  });
  
  // Создаем ссылку для скачивания
  const link = document.createElement('a');
  link.download = 'map-editor-export.png';
  link.href = tempCanvas.toDataURL('image/png');
  link.click();
}

function saveGame() {
  const otherData = {
    scale, canvasOffsetX, canvasOffsetY,
  }
  saveFile(`data.json.js`, `CURRENT_TURN=${CURRENT_TURN};
OTHER_SAVE_DATA=${JSON.stringify(otherData, 0, 2)};
DEFAULT_DATA=` 
    + JSON.stringify(elements, 0, 2)
  )
}

function loadGame(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  // TODO pretty sure this doesnt work
  const reader = new FileReader();
  reader.onload = function(event) {
      const data = event.target.result.replace('DEFAULT_DATA=', '')
      elements = JSON.parse(data)
      drawCanvas()
  }
  reader.readAsText(file);
}

// Функция для обновления отображения хода
function drawTurnDisplay() {
    turnDisplay.textContent = `Текущий ход: ${CURRENT_TURN}`;
}

function showHelp() {
  // TODO
  alert(`ПОМОЩЬ. 
  Ну, когда-нибудь.
* Как правило хоткеи - с Alt
* Переключение цвета при выбранной фигуре меняет её цвет
* После перемещения юнитов сделайте "Экспортировать объекты" и запостите файл в тред, я обновлю
* ПКМ - перетаскивание карты без риска выделения юнитов

Горячие клавиши:
Выбранный юнит:
* Alt + Delete - удалить
* End - повредить
* Ctrl+End - повредить на величину
* Q - отключить/включить
* E - пометить закончившим ход

    `)
}

// Вспомогательные функции
// eslint-disable-next-line no-unused-vars
function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

/** 
* @param {typeof elements[0]} shape 
*/
function isBuilding(shape) {
  return DEFAULT.buildings.includes(shape.name)
}

/** 
* @param {typeof elements[0]} shape 
*/
function isUnit(shape) {
  return DEFAULT.units.includes(shape.name)
}

function isNoHealth(shape) {
  return DEFAULT.noHealth.includes(shape.name)
}

function saveFile(filename, data) {
  var file = new Blob([data], { type: 'text' })
  var a = document.createElement("a"),
  url = URL.createObjectURL(file)
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  setTimeout(function () {
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
  }, 0)
}

const hotkeysLib = {
hotkeyElsList: {},

init(hotkeysList_, kModeHotkeys_) {
  this.enableHotkeysProcessing(hotkeysList_, kModeHotkeys_)
  this.processHotkeyAttribute()
},

processHotkeyAttribute() {
  for(let i of document.querySelectorAll('button[hotkey],input[hotkey]')) {
    const hk = i.getAttribute('hotkey')
    i.title += '\nHotkey: Alt+' + hk
    this.hotkeyElsList[`Alt ${hk}`] = i
  }
},

enableHotkeysProcessing(hotkeysList_, kModeHotkeys_) {
  let kMode = false 
  const hotkeysList = Object.assign({'Alt K': _ => kMode = true}, hotkeysList_)
  const kModeHotkeys =  Object.assign({}, kModeHotkeys_)

  const ignoreKeys = ['Alt', 'Tab']

  const that = this

  document.body.addEventListener('keydown', function(evt) {
    if(!evt.code) return
    if(ignoreKeys.includes(evt.key)) return 
    const keyComb = 
      (evt.ctrlKey ? 'Ctrl ' : '')
      + (evt.altKey ? 'Alt ' : '')
      + evt.code.replace(/(Key|Digit)/,'')
    if(hotkeysList[keyComb]) {
      hotkeysList[keyComb]()
      evt.stopPropagation()
      return false
    }
    if(that.hotkeyElsList[keyComb]) {
      that.hotkeyElsList[keyComb].click()
      evt.stopPropagation()
      return false
    }
    if(kMode && kModeHotkeys[keyComb]) {
      kModeHotkeys[keyComb]()
      kMode = false
      evt.stopPropagation()
      return false
    }
    if(evt.altKey) console.log(keyComb)
  })
},
}

function onOutputClick(tgtElName) {
  const t = prompt('Value')
  if(!t) return
  document.getElementById(tgtElName).value = t
}

// Запуск приложения
init();
