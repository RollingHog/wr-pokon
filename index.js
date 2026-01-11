/* global 
*/

/// <reference path="./data/data.json.js"/>
/* global
CURRENT_TURN DEFAULT_DATA OTHER_SAVE_DATA USER_RESOURCES
*/

/// <reference path="./src/keywords.js"/>
/* global
KW
*/

/// <reference path="./src/rules.js"/>
/* global
DICT_COMMON SETTINGS EMOJI_IMAGES
CATEGORY_PRICES OBJ_CATEGORIES 
EFFECT_LISTS DEFAULT 
MAX_UNIT_HP MAP_PATH POP_PROP 
TECH_EFFECTS 
onEndTurnCb
*/

/// <reference path="./bnb/userParams.js"/>
/* global
DICT_USER USER_TECH_LVLS
*/

/* exported
onOutputClick
*/

// Основные переменные
/** @type {HTMLCanvasElement} */
const canvas = document.getElementById('map-canvas');
const ctx = canvas.getContext('2d');
const fogCanvas = document.getElementById('fog-canvas');
const fogCtx = fogCanvas.getContext('2d');
const canvasContainer = document.getElementById('canvas-container');
const scaleValue = document.getElementById('scale-value');
const scaleSlider = document.getElementById('scale-slider');
const editPanel = document.getElementById('edit-panel');
const customShapesContainer = document.getElementById('custom-shapes-container');
const mapList = document.getElementById('map-list');
const shapeModal = document.getElementById('shape-modal');
const modalShapesContainer = document.getElementById('modal-shapes-container');
const turnDisplay = document.getElementById('turnDisplay');
const info_panel = document.getElementById('info_panel');
const info_panel_body = document.getElementById('info_panel_body');

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

  processRuleFile()

  loadDefaultMap()
  loadDefaultData()
  loadDefaultCustomImages()
  hotkeysLib.init({
    'Delete': () => {
      selection.delete()
    },
    'End': () => {
      selection.damage()
    },
    'Escape': () => {
      selection.drop()
    },
    'Ctrl End': () => {
      selection.damage(prompt('Damage amount? Minus to heal'))
    },
    'Q': () => {
      selection.switchDisable()
    },
    'E': () => {
      selection.switchEndedTurn()
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
      preview.addEventListener('click', function onShapePreview() {
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

function getShapeColor() {
  return document.getElementById('shape-color').value
}

function setShapeColor(color) {
  document.getElementById('shape-color').value = color
  document.getElementById('text-color').value = color
  if(typeof selectedElement !== 'undefined' && selectedElement) {
    selectedElement.color = color
  }
  drawCanvas();

  info_panel.style.display = ''
  drawInfoPanel(color)
}

function drawInfoPanel(color) {
  if(!color) return
  const player = playerByColor(color)
  const effs = userEffectsObj.sumEffects(player)
  // TODO add printing tech effects
  info_panel.querySelector('h3').innerText = player
  info_panel.querySelector('h3').style.color = color
  info_panel_body.innerText = userEffectsObj.groupBySections(effs).toPrettyList(player)
}

function addListeners() {
  // События мыши/касания
  fogCanvas.addEventListener('mousedown', handleMouseDown);
  fogCanvas.addEventListener('mousemove', handleMouseMove);
  fogCanvas.addEventListener('mouseup', handleMouseUp);
  canvas.addEventListener('contextmenu', lineActionsObj.finishLineDrawing);

  fogCanvas.addEventListener('wheel', handleWheel, { passive: false });
  
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
  document.getElementById('count-food-btn').addEventListener('click', calcPopGrowth);
  
  
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
    alert('Конец хода, рассчитайте эффекты игроков (и варваров)')
    turnEndChecked = true
    return
  }
  turnEndChecked = false

  // Можно добавить дополнительную логику при смене хода
  for (let el of elements) {
    el.endedTurn = false
  }

  elements.forEach(obj => {
    const effects = userEffectsObj.getCachedEffects(obj);
    if (!effects) return;

    const regenEffect = effects.find(effect => Array.isArray(effect) && effect[0] === KW.REGEN);
    if (regenEffect) {
      const healAmount = regenEffect[1];
      if (typeof healAmount === 'number') {
        offsetUnitHp(obj, healAmount)
      }
    }

    const lvlDriftEffect = effects.find(effect => Array.isArray(effect) && effect[0] === KW.LVL_DRIFT);
    if (lvlDriftEffect) {
      const amount = +lvlDriftEffect[1];
      if (typeof amount === 'number') {
        offsetObjLvl(obj, amount)
      }
    }
  });

  if(typeof onEndTurnCb === 'function') {
    onEndTurnCb()
  }

  // eslint-disable-next-line no-global-assign
  CURRENT_TURN++;
  drawCanvas()
  drawTurnDisplay();
  drawInfoPanel(getShapeColor())
}

function imageObjByObjName(filename) {
  return customShapes.find(({ name }) => name === filename).imageObj
}

function getUnitPrice(filename) {
  const typeKey = isUnit({ name: filename }) ? 'UNITS' : 'BUILDINGS'
  if (OBJ_CATEGORIES[typeKey]._none_.includes(filename)) return null

  for (let category in OBJ_CATEGORIES[typeKey]) {
    const objCost = DICT_COMMON[filename]?.find( ([k, _]) => k === KW.COST )
    if(objCost) return objCost[1]
    if (OBJ_CATEGORIES[typeKey][category].includes(filename)) {
      const res = CATEGORY_PRICES[typeKey][category]
      if(!res) console.warn(`Неверная категория ${category} `)
      return res
    }
  }
  return CATEGORY_PRICES[typeKey]._default_
}

function getUnitDescription(filename) {
  const effArrToStr = (arr) => arr
    .filter(e => ![KW.COST].includes(e[0]))
    .map(e => e.join(': ')).join('\n')
  let costStr = ''

  if (!DEFAULT.noHealth.includes(filename)) {
    costStr = '\nЦЕНА:\n'
    let categoryPrice = getUnitPrice(filename)

    if (categoryPrice) {
      costStr += effArrToStr(categoryPrice)
    }
  }

  const effStr = typeof DICT_COMMON[filename] !== 'undefined'
    ? '\n\nЭФФЕКТЫ:\n' + effArrToStr(DICT_COMMON[filename])
    : ''

  return filename + costStr + effStr
}

function onCustomImageLoad(filename, src) {
  const shapeId = 'custom-shape-' + Date.now() + Math.random().toString(36).substr(2, 5);

  const emojiName = typeof EMOJI_IMAGES !== 'undefined' ? EMOJI_IMAGES[filename] : null

  if(!emojiName) {
    const imageObj = new Image();
    imageObj.src = src;
  
    customShapes.push({
        id: shapeId,
        name: filename,
        src: src,
        imageObj,
    });
  } else {

  }

  // Создаем превью для пользовательской фигуры
  const preview = document.createElement('div');
  preview.className = 'shape-preview';
  if(!emojiName) {
    preview.style.backgroundImage = `url(${src})`;
  } else {
    preview.innerHTML = emojiName
  }
  preview.dataset.shape = 'custom';
  preview.dataset.shapeId = shapeId;
  preview.dataset.filename = filename;

  
  preview.title = getUnitDescription(filename)
    
  preview.addEventListener('click', function onShapeSelect() {
      activeShapeType = 'custom';
      document.querySelectorAll('.shape-preview').forEach(p => p.classList.remove('active'));
      this.classList.add('active');

      if(typeof selectedElement !== 'undefined' && selectedElement) {
        selectedElement.name = this.dataset.filename
        selectedElement.src = this.style.backgroundImage.replace(/(^url\(|\)$|")/g,'')
        drawCanvas();
      } else {
        // placeShape(true)
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
      if(oth.shapeColor) {
        setTimeout(_=>setShapeColor(oth.shapeColor), 0)
      }
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

  const root = SETTINGS.IS_CUSTOM ? '..' : '.'
  
  for (const objName of DEFAULT.buildings) {
      onCustomImageLoad(objName, `${root}/images/buildings/${objName}.png`)
  }
  
  for (const objName of DEFAULT.units) {
      onCustomImageLoad(objName, `${root}/images/units/${objName}.png`)
  }
}

function processRuleFile() {
  DEFAULT.units = Object.values(OBJ_CATEGORIES.UNITS).flat()
  DEFAULT.buildings = Object.values(OBJ_CATEGORIES.BUILDINGS).flat()

  EFFECT_LISTS.static.push(
    'unit_count',
    'build_count',
    'unit_to_upkeep',
    'build_to_upkeep',
  )
}

function getCurrentMap() {
  if(currentMapIndex >= 0 && maps[currentMapIndex])
    return maps[currentMapIndex]
}

// Функции отрисовки
function resizeCanvas() {
  canvas.width = canvasContainer.clientWidth;
  canvas.height = canvasContainer.clientHeight;
  
  fogCanvas.width = canvasContainer.clientWidth;
  fogCanvas.height = canvasContainer.clientHeight;

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
    draw.element(element)
  });

  draw.fogOfWar();

  drawInfoPanel(selectedElement?.color)

  // lastPaint = Date.now()
}

const fogCheckbox = document.getElementById('ch_fog')
const visionRadius = SETTINGS.VISION_RADIUS || 160

const lvlTextSize = 20

const draw = {

  // lol nope, it LAGS
  cutCircle(context, x, y, radius){
    context.globalCompositeOperation = 'destination-out'
    context.arc(x, y, radius, 0, Math.PI*2, true);
    context.fill();
    context.globalCompositeOperation = ''
  },

  fogOfWar() {
    const playerColor = getShapeColor()
    
    const localCtx = fogCtx
    
    const fogColor = 'rgba(100, 100, 100, 1)'; // тёмно-серый непрозрачный туман
    
    localCtx.clearRect(0,0, canvas.width, canvas.height);
    if(!fogCheckbox.checked) {
      return
    }
    localCtx.save();

    const map = getCurrentMap()
    if(!map) return

    const screenX = 0 * scale + canvasOffsetX;
    const screenY = 0 * scale + canvasOffsetY;
    const screenWidth = map?.image?.width * scale;
    const screenHeight = map?.image?.height * scale;

    // Заливаем весь canvas туманом
    localCtx.fillStyle = fogColor;
    localCtx.fillRect(screenX, screenY, screenWidth, screenHeight);
    
    // localCtx.fillStyle = 'rgba(0, 0, 0, 1)';
    // Меняем режим композиции: следующие рисунки будут "вырезать" (стирать) туман
    // localCtx.globalCompositeOperation = 'destination-out';
    
    // Собираем все юниты своей фракции с visionRadius
    const visibleUnits = elements.filter(el =>
      el.color === playerColor
    );

    //   ctx.translate(shape.x * scale + canvasOffsetX, shape.y * scale + canvasOffsetY);
    // ctx.scale(scale, scale);

    // Для каждого юнита рисуем круг видимости (в локальных координатах)
    visibleUnits.forEach(el => {
      const isCapital = el.name === KW.CAPITAL && SETTINGS.CAPITAL_SPECIAL_VISION
      const radius = isCapital 
        ? CURRENT_TURN * visionRadius * 0.4 * scale
        : visionRadius * scale;
      const x = el.x * scale + canvasOffsetX;
      const y = el.y * scale + canvasOffsetY;

      const delta = 38 / 2 * scale;
      localCtx.clearRect(x - radius + delta, y - radius + delta, radius * 2, radius * 2);
    });

    // Восстанавливаем стандартный режим композиции
    localCtx.restore();
  },

  element(element) {
    if (element.type === 'shape') {
      drawShape(element);
    } else if (element.type === 'text') {
      drawText(element);
    }
  },

  /**
 * @param {CanvasRenderingContext2D | null} ctx 
 * @param {typeof elements[0]} el 
 * @param {*} x 
 * @param {*} y 
 */
  customObj(ctx, el, x, y) {
    // обозначаем принадлежность
    ctx.fillStyle = el.color;
    let bgFigure = ''
    if (isBuilding(el)) {
      bgFigure = 'circle'
    } else {
      // unit
      bgFigure = 'triangle'
    }

    if(SETTINGS.DEFAULT_FIGURE_BG) {
      bgFigure = SETTINGS.DEFAULT_FIGURE_BG
    }

    ctx.globalAlpha = 0.7;
    switch (bgFigure) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(
          x + el.width / 2, y + el.height / 2,
          el.width / 2, 0, Math.PI * 2
        );
        ctx.fill();
        break;
      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(x + el.width / 2, y);
        ctx.lineTo(x + el.width, y + el.height);
        ctx.lineTo(x, y + el.height);
        ctx.closePath();
        ctx.fill();
        break;
      default:
        alert('wtf')
        break;
    }
    ctx.globalAlpha = 1;

    let img 
    if(typeof EMOJI_IMAGES !== 'undefined' && EMOJI_IMAGES[el.name]) {
      const emojiFontSize = (el.width * 0.7).toString(10)
      ctx.font = `bold ${emojiFontSize}px "Noto Color Emoji"`;
      ctx.textAlign = 'center';
      ctx.fillText(
       EMOJI_IMAGES[el.name],
        x + el.width / 2,
        y + emojiFontSize
      );
    } else {
      img = imageObjByObjName(el.name)
      ctx.drawImage(img, x, y, el.width, el.height);
    }
    ///
    if ((el.curr_hp !== MAX_UNIT_HP) && !isNoHealth(el)) {
      draw.healthBar(ctx, x, y + el.height, el.width, el.curr_hp || MAX_UNIT_HP, MAX_UNIT_HP)
    }
    if (el.disabled) {
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2

      ctx.beginPath();
      ctx.arc(x + el.width / 2, y + el.height / 2, el.width / 2, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + el.width, y + el.height);
      ctx.closePath();
      ctx.stroke();
    } else if (el.endedTurn) {
      ctx.strokeStyle = 'green';
      ctx.lineWidth = 5

      ctx.beginPath();
      ctx.arc(x + el.width / 2, y + el.height / 2, el.width / 2, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x + 5, y + el.height / 2);
      ctx.lineTo(x + el.width / 2, y + el.height - 5);
      ctx.lineTo(x + el.width, y);
      // ctx.closePath();
      ctx.stroke();
    }
    if (typeof el.lvl === 'number' && +el.lvl !== 1) {
      ctx.font = `${lvlTextSize}px Arial`;

      ctx.strokeStyle = 'white';
      ctx.fillStyle = 'black';
      ctx.strokeText(el.lvl, x, y + 5, lvlTextSize);
      ctx.fillText(el.lvl, x, y + 5, lvlTextSize);
    }
  },

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
  healthBar(ctx, x, y, width, hpCurrent, hpMax, height = 5, offsetY = 5) {
    // Рассчитываем процент здоровья
    const healthPercent = hpCurrent / hpMax;

    // Координаты левого края полоски (центрирование)
    const barX = x;
    const barY = y + offsetY;

    // Цвета
    const backgroundColor = '#333333';
    const healthColor = 
      healthPercent > 1 ? 'mediumspringgreen' :  // overheal
      healthPercent > 0.6 ? '#4CAF50' :  // Зеленый
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
  },
}

/** 
* @param {typeof elements[0]} shape 
*/
function drawShape(shape) {
  ctx.save();
  ctx.translate(shape.x * scale + canvasOffsetX, shape.y * scale + canvasOffsetY);
  ctx.scale(scale, scale);
  
  if (shape.shape === 'custom') {
    draw.customObj(ctx, shape, 0, 0)

      
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
    selection.drop()
  }
}

const selection = {
  drop() {
      selectedElement = null;
      editPanel.style.display = 'none';
  },
  damage(amount = 1) {
    if (selectedElement) {
      if (isNoHealth(selectedElement)) return
      if (typeof selectedElement.curr_hp === 'undefined') selectedElement.curr_hp = MAX_UNIT_HP
      offsetUnitHp(selectedElement, -amount)
    }
  },
  switchEndedTurn() {
    if (!selectedElement) return
    if (isNoHealth(selectedElement.name)) return
    if (typeof selectedElement.endedTurn === 'undefined') selectedElement.disabled = false
    selectedElement.endedTurn = !selectedElement.endedTurn
    drawCanvas();
  },
  switchDisable() {
    if (!selectedElement) return
    if (typeof selectedElement.disabled === 'undefined') selectedElement.disabled = false
    selectedElement.disabled = !selectedElement.disabled
    drawCanvas();
  },
  delete() {
    if (selectedElement) {
      elements = elements.filter(el => el !== selectedElement);
      selectedElement = null;
      editPanel.style.display = 'none';
      drawCanvas();
    }
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

function calcPopGrowth() {
  const foodCount = prompt(`Введите текущее кол-во Еды:`)
  if (foodCount) {
    alert(`Скопируйте: новое значение Еды ${(foodCount - foodCount / 3).toFixed(1)} ед., прирост ${(foodCount / 3 / 2).toFixed(1)} ед. ${POP_PROP}`)
  }
}

function cloneShape() {
  if(!selectedElement) return
  
  document.querySelector(`.shape-preview[data-filename="${selectedElement.name}"]`).click()
  placeShape()
}

function placeShape(spawnNearMenu = false) {
  if (currentMapIndex === -1) {
      // console.warn('Сначала загрузите карту');
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
              if(!ratio) {
                // TODO there is some strange bug here
                console.warn('ratio bad!!!', customShape, img);
              }
              width = size;
              height = +((size / ratio).toFixed(2));
              // FIXME ratio checker
          }
      }
  }
  
  const isMenu = typeof spawnNearMenu === 'boolean' && spawnNearMenu
  const x = isMenu
    ? (-canvasOffsetX + canvas.width * 0.05 - width*scale/2) / scale
    : (-canvasOffsetX + canvas.width/2 - width*scale/2) / scale

  const y = isMenu
    ? (-canvasOffsetY + canvas.height/5 - height*scale/2) / scale
    : (-canvasOffsetY + canvas.height/2 - height*scale/2) / scale

  const shape = {
      type: 'shape',
      name: activePreview.dataset.filename,
      shape: activeShapeType,
      color: color,
      x,
      y,
      width: width,
      height: height,
      src: src,
      curr_hp: MAX_UNIT_HP,
      disabled: false,
      endedTurn: false,
  };
  
  elements.push(shape);
  draw.element(shape)
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
  draw.element(text);
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
  getCommonEffects(objName) {

  },
  /**
   * @param {elements[0]} obj 
   */
  getCachedEffects(obj) {
    const username = playerByColor(obj.color)

    // // TODO cache doesn't save lvl data
    // const cacheKey = `${objName}-${username}`;
    // if (this.effCache[cacheKey]) {
    //   return Object.entries(this.effCache[cacheKey]);
    // }

    // const obj = {name: objName}
    const typeKey = isBuilding(obj) ? '_building_' : '_unit_'
    let list = [].concat([
        DICT_COMMON?.[typeKey],
        DICT_USER[username]?.[typeKey],
        DICT_COMMON?.[obj.name],
        DICT_USER[username]?.[obj.name],
      ]
    )
    
    if (
      !DEFAULT.noUpkeep.includes(obj.name)
      && !isNoHealth(obj)
    ) {
      list = list.concat([
        DICT_USER[username]?._upkeep_?.[typeKey],
        DICT_COMMON?._upkeep_?.[typeKey],
      ])
    }
    // TODO
    // console.log(obj.name, JSON.stringify(list))
    if (!list) return []
    const res = list.flat().map((el) => {
      if (!el) return el
      const [k, v] = el
      if (!k) return el
      if(k.startsWith('_')) return null
      if (typeof v === 'number' || !isNaN(+v)) return [k, v]
      if (v === '+ЛВЛ' || v === 'ЛВЛ') return [k, +obj.lvl || 1]
      if (v === '+ЛВЛ*2' || v === 'ЛВЛ*2') return [k, 2 * +obj.lvl || 1]
      if (v === '-ЛВЛ') return [k, -obj.lvl || -1]
      if (v === '-ЛВЛ*2') return [k, 2 * -obj.lvl || -1]
      console.warn('bad DICT rule for', obj.name, [k, v])
    }).filter(e=>e)

    const effectsDict = {}
    for(let [k,v] of res) {
        if(!k) continue
        if(effectsDict[k]) {
          effectsDict[k] += +v
        } else {
          effectsDict[k] = +v
        }
    }

    // this.effCache[cacheKey] = effectsDict
    return Object.entries(effectsDict)
  },
  groupBySections(obj) {
    /**@type {Record<keyof EFFECT_LISTS | '_unique_', [string, number][]>} */
    const result = {};

    // Инициализируем все секции пустыми массивами
    for (const section of Object.keys(EFFECT_LISTS)) {
      result[section] = [];
    }

    result._unique_ = []

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
          result[section].push([key, (+value).toFixed(1).replace('.0','')]);
          matched = true;
          break;
        }
      }
      if(!matched) {
        console.warn('not matched:', key)
        result._unique_.push([key, value])
      }
      // Если не подошёл ни к одной — можно игнорировать или добавить в "другие"
    }

    return {
      result,
      toObj() { return result },
      toPrettyList(playerName = null) {
        delete result.local
        const uRes = typeof USER_RESOURCES !== 'undefined' ? (USER_RESOURCES[playerName] || {}) : {}
        return Object.entries(result)
          .map(([section, eff]) => {
            if(section === 'resources') {
              const effList = eff.map((arr) => `${arr[0]}: ${uRes[arr[0]] || '?'} ( ${arr[1] > 0 ? '+' : ''}${arr[1]} )`)
              return `==${section}==\n ${effList.join('\n')}\n`
            }
            return `==${section}==\n ${eff.map((arr) => arr.join(': ')).join('\n')}\n`
          }).join('')
      }
    };
  },

  sumEffects(username) {
    const userColor = colorFromUsername(username)

    const techEffects = TechUtils.processSpecialTechEffects(username)

    let userEffects = []
    const userObjs = elements.filter(obj => obj.color === userColor && !isNoHealth(obj))
    const userBuildings = userObjs.filter(obj => isBuilding(obj))
    const userUnits = userObjs.filter(obj => isUnit(obj))
    userEffects = [].concat(
      userObjs.map(obj => {
        if (obj.disabled) return []
        return userEffectsObj.getCachedEffects(obj)
      }),
      [techEffects],
    )
      .flat()
      .filter(e => e)
    const effectsDict = {
      unit_count: userUnits.length,
      unit_to_upkeep: userUnits.filter(
        obj => !DEFAULT.noUpkeep.includes(obj.name)
      ).length,
      build_count: userBuildings.length,
      build_to_upkeep: userBuildings.filter(
        obj => !DEFAULT.noUpkeep.includes(obj.name)
      ).length,
    }
    //       
    for (let [k, v] of userEffects) {
      if (!k) continue
      if (EFFECT_LISTS.local.includes(k)) continue
      if (effectsDict[k]) {
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
    return effectsDict
  },
  effectsForSelectedUser() {
    const username = document.querySelector(`[data-color="${getShapeColor()}"]`).textContent
    const effectsDict = userEffectsObj.sumEffects(username)
    let warns = ``
    if(effectsDict[POP_PROP] < 0) {
      warns += `МАЛО НАСЕЛЕНИЯ`
    }
    console.log(effectsDict)
    alert(`Игрок ${username}:\n`
      + (userEffectsObj.groupBySections(effectsDict).toPrettyList())
      + '\n' + warns
    // + JSON.stringify(, 0, 2)
      )
  }
}

function colorFromUsername(username) {
  return Array.from(document.querySelectorAll('.player-btn')).find(el => el.textContent === username).dataset.color
}

function playerByColor(colorStr) {
  return Array.from(document.querySelectorAll('.player-btn')).find(el => el.dataset.color === colorStr).textContent
}

function listPlayers() {
  return Array.from(document.querySelectorAll('.player-btn')).map(el => el.textContent)
}

let isAttack = false
function enableAttackMode() {
  if(!selectedElement) return
  isAttack = true
  editPanel.style.display = 'none';
}

/**
 * @param {typeof elements[0]} obj 
 * @param {number} amount 
 */
function offsetObjLvl(obj, amount) {
  const curr = obj.lvl
  let res = curr + amount
  if (res <= 0) {
    obj = killObj(obj)
  } else {
    obj.lvl = res
  }
  drawCanvas(obj)
}

/**
 * @param {typeof elements[0]} obj 
 * @param {number} amount 
 */
function offsetUnitHp(obj, amount) {
  const curr = obj.curr_hp
  let res = curr + amount
  if (amount > 0 && res > MAX_UNIT_HP) {
    res = MAX_UNIT_HP
  }
  if (res / MAX_UNIT_HP < 0.3) {
    obj.disabled = true
  } else if (res / MAX_UNIT_HP >= 0.3 && curr / MAX_UNIT_HP < 0.3) {
    obj.disabled = false
  }
  obj.curr_hp = res

  if (obj.curr_hp <= 0) {
    obj = killObj(obj)
  }
  drawCanvas(obj);
}

/**
 * @param {typeof elements[0]} obj 
 */
function killObj(obj) {
  obj.disabled = false

  if (DEFAULT.noGrave.includes(obj.name) || isNoHealth(obj.name)) {
    selection.delete()
    return
  }

  if (isUnit(obj)) {
    if (DEFAULT.wreckUnit.includes(obj.name)) {
      obj.name = KW.WRECK_UNIT
    } else {
      obj.name = KW.GRAVE_UNIT
    }
  } else if (isBuilding(obj)) {
    obj.name = KW.WRECK_UNIT
  }

  return obj
}

/**
 * @param {typeof elements[0]} obj 
 */
function getBattleParams(obj) {
  const list = userEffectsObj.getCachedEffects(obj)
    .filter(e=>e) || []
  // ([]).
  return {
    atk: list.filter(([k,_])=> k === KW.ATK)[0]?.[1] || 0,
    def: list.filter(([k,_])=> k === KW.DEF)[0]?.[1] || 0,
    dist: list.filter(([k,_])=> k === KW.DIST)[0]?.[1] || 0,
  }
}

/**
 * @param {typeof elements[0]} atkObj 
 * @param {typeof elements[0]} defObj 
 */
function attackObj(atkObj, defObj) {
  const atk = getBattleParams(atkObj)
  const def = getBattleParams(defObj)
  const res = `${playerByColor(atkObj.color)} ${atkObj.name} атакует ${playerByColor(defObj.color)} ${defObj.name}:
Атака ${atkObj.name} ##1d${atk.atk}## + ##1d3## 
Защита ${defObj.name} ##1d${def.def}##` +
    (def.atk > 0 ?
`\n${defObj.name} контратакует ${atkObj.name}:
Атака ${defObj.name} ##1d${def.atk}## + ##1d3## 
Защита ${atkObj.name} ##1d${atk.def}##
` : '')
  console.log(res)
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

const NPCPlayers = ['Варвары','Нейтралы']

const TechUtils = {
  parseTechTree(text) {
    const result = {};
    const sections = text.trim().split(/\+\+([A-ZА-Я]+)\+\+/).filter(Boolean);

    // Разбиваем на пары: [название, содержимое]
    for (let i = 0; i < sections.length; i += 2) {
      const name = sections[i].trim();
      const content = sections[i + 1] || '';
      const tree = { 1: [], 2: [], 3: [] };
      let currentLevel = null;

      const lines = content.split('\n').map(line => line.trim()).filter(line => line);

      for (const line of lines) {
        // Проверяем, не цена ли это
        if (line.startsWith('Цена:')) continue;

        // Определяем уровень
        const levelMatch = line.match(/Уровень\s+(\d)/);
        if (levelMatch) {
          currentLevel = parseInt(levelMatch[1], 10);
          continue;
        }

        // Если нет явного уровня, пытаемся определить по формату
        if (!currentLevel && line.startsWith('Уровень')) {
          continue; // Пропускаем строки вроде "Уровень 2 ()" без номера
        }

        // Эффекты начинаются с ":"
        if (line.startsWith(':')) {
          if (currentLevel) {
            tree[currentLevel].push(line.trim());
          }
          continue;
        }

        // Здание / Юнит / Прочее
        if (line.startsWith('Здание:') || line.startsWith('Юнит:') || line.startsWith('НУЖНА ЕЩЕ ТЕХА?')) {
          if (currentLevel) {
            tree[currentLevel].push(line.trim());
          }
          continue;
        }

        // Если строка просто текст — возможно, это эффект без ":"
        if (currentLevel && line) {
          tree[currentLevel].push(line);
        }


        // Иногда уровень без двоеточия: "Уровень 2 ()"
        const bareLevel = line.match(/Уровень\s+(\d)/);
        if (bareLevel) {
          currentLevel = parseInt(bareLevel[1], 10);
          continue;
        }
      }

      result[name] = tree;
    }

    return JSON.stringify(result, 0, 2);
  },

  /**
   * Получить все эффекты технологии до указанного уровня включительно
   * @param {string} techName - Название технологии (например, "ЛЕС")
   * @param {number} level - Уровень (1, 2 или 3)
   * @returns {Array} Массив всех эффектов от уровня 1 до указанного
   */
  getTechEffectsUpToLevel(techName, level) {
    const tech = TECH_EFFECTS[techName];
    if (!tech) {
      console.warn(`Технология "${techName}" не найдена`);
      return [];
    }

    if(level === 0) {
      return []
    }

    if (![1, 2, 3].includes(level)) {
      console.warn(`Уровень должен быть 1, 2 или 3, получено: ${level}`);
      return [];
    }

    const effects = [];
    for (let lvl = 1; lvl <= level; lvl++) {
      if (Array.isArray(tech[lvl])) {
        effects.push(...tech[lvl]);
      }
    }

    return effects;
  },

  /**
   * 
   * @param {*} username 
   * @returns {[string, null][]} - effects arr-dict
   */
  processSpecialTechEffects(username) {
    if(NPCPlayers.includes(username)) return []
    const techLvlsObj = USER_TECH_LVLS[username]
    if(!techLvlsObj) {
      console.warn('processSpecialTechEffects() wtf:', techLvlsObj)
      return
    }

    let acc = []
    for(let [k,v] of Object.entries(techLvlsObj)) {
      acc = acc.concat(TechUtils.getTechEffectsUpToLevel(k, v))
    }
    const res = acc
      .filter(line => 
        !(line.startsWith('Здание:') || line.startsWith('Юнит:') || line.startsWith('НУЖНА ЕЩЕ ТЕХА?'))
      )
      .map( str => [str, null])
    // console.log(res)
    return res
  }
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
             draw.customObj(tempCtx, element, element.x, element.y)
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
    scale, canvasOffsetX, canvasOffsetY, shapeColor: getShapeColor()
  }
  saveFile(`data.json.js`, `CURRENT_TURN=${CURRENT_TURN};
OTHER_SAVE_DATA=${JSON.stringify(otherData, 0, 2)};
USER_RESOURCES=${JSON.stringify(typeof USER_RESOURCES !== 'undefined' ? USER_RESOURCES : {}, 0, 2)};
DEFAULT_DATA=` 
    + JSON.stringify(elements.filter(e => e.y), 0, 2)
  )
}

function loadGame(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  // TODO pretty sure this doesn't work
  const reader = new FileReader();
  reader.onload = function(event) {
      const data = event.target.result.replace('DEFAULT_DATA=', '')
      elements = JSON.parse(data)
      drawCanvas()
  }
  reader.readAsText(file);
}

// eslint-disable-next-line no-global-assign
if(typeof CURRENT_TURN === 'undefined') CURRENT_TURN = 1
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
