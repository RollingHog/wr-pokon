// Цвета и их идентификаторы
const COLORS = {
  ДВИГ: '#ff6b6b',
  ТОПЛ: '#ffcccc',
  КОМП: '#6b6bFF',
  ЭКИП: '#FFA500',
  ПЛАЗ: '#006400',
  ГРАВ: '#00FFFF',
  ЗАЩ: '#CC99FF',
  АТОМ: '#CCFF33',
  ЗЕРК: '#CCFF33',
  erase: '#ffffff' // цвет "очистка" (белый)
};

// Состояние счётчиков
const counters = {};
let currentColor = null; // текущий выбранный цвет (ключ)
let table = document.getElementById('colorTable');
let countersDiv = document.getElementById('counters');
let paletteDiv = document.getElementById('palette');

// Инициализация палитры
function initPalette() {
  paletteDiv.innerHTML = '';
  for (let colorId in COLORS) {
    let colorBox = document.createElement('div');
    colorBox.className = 'palette-color ' + colorId;
    colorBox.dataset.colorId = colorId;

    // Добавляем подсказку для "очистки"
    if (colorId === 'erase') {
      colorBox.title = 'Очистка';
    }

    colorBox.addEventListener('click', function () {
      // Снимаем активный класс со всех
      document.querySelectorAll('.palette-color').forEach(el => {
        el.classList.remove('active');
      });
      // Добавляем активный класс текущему
      this.classList.add('active');
      // Устанавливаем текущий цвет
      currentColor = colorId;
    });

    paletteDiv.appendChild(colorBox);
  }
}

// Инициализация таблицы 9x9
function initTable() {
  table.innerHTML = '';
  for (let i = 0; i < 11; i++) {
    let row = table.insertRow();
    for (let j = 0; j < 11; j++) {
      let cell = row.insertCell();
      cell.addEventListener('click', handleCellClick);
    }
  }
}

// Инициализация счётчиков
function initCounters() {
  countersDiv.innerHTML = '';

  // Создаём общую таблицу
  let table = document.createElement('table');
  table.style.margin = '0 auto';
  table.style.borderCollapse = 'collapse';
  table.style.textAlign = 'center';

  let row1 = table.insertRow(); // строка с названиями цветов
  let row2 = table.insertRow(); // строка с количеством клеток
  let row3 = table.insertRow(); // строка с данными из родительского окна

  for (let colorId in COLORS) {
    if (colorId === 'erase') continue; // "очистка" не учитывается в счётчике
    counters[colorId] = 0;

    // Ячейка с названием цвета
    let nameCell = row1.insertCell();
    nameCell.textContent = colorId;
    nameCell.className = colorId;
    nameCell.style.padding = '5px';

    // Ячейка с количеством клеток
    let countCell = row2.insertCell();
    countCell.id = `counter-${colorId}`;
    countCell.textContent = counters[colorId];
    countCell.style.padding = '5px';

    // Ячейка для данных из родительского окна (пустая или с заглушкой)
    let dataCell = row3.insertCell();
    dataCell.id = `data-${colorId}`;
    dataCell.textContent = '—'; // заглушка до загрузки данных
    dataCell.style.padding = '5px';
    dataCell.style.fontStyle = 'italic';
  }

  countersDiv.appendChild(table);

  // Заполняем третью строку данными из родительского окна
  if (window.opener && !window.opener.closed) {
    try {
      let openerDoc = window.opener.document;

      let dataMap = {
        ДВИГ: 'engine_cells',
        ТОПЛ: 'fuel_cells',
        КОМП: 'systems_cells',
        ЭКИП: 'crew_cells',
        ПЛАЗ: 'plasma_guns',
        ГРАВ: 'gravity_guns',
        ЗАЩ: 'ion_shield_generators',
        АТОМ: 'r_missile_launchers',
        ЗЕРК: 'plasma_mirrors',
        // erase не участвует
      };

      for (let colorId in dataMap) {
        if (COLORS[colorId]) {
          let elementId = dataMap[colorId];
          let value = parseInt(openerDoc.getElementById(elementId).value) || 0;
          if (elementId === 'r_missile_launchers') value += parseInt(openerDoc.getElementById('r_torpedo_launchers').value) || 0
          let dataCell = document.getElementById(`data-${colorId}`);
          if (dataCell) {
            dataCell.textContent = value;
            dataCell.style.fontStyle = 'normal';
          }
        }
      }
    } catch (e) {
      console.warn("Не удалось получить данные из родительского окна:", e);
    }
  }
}

// Объект для отображения типов клеток в односимвольные коды
const CELL_TYPE_TO_CODE = {
  'ДВИГ': 'E', // Engine
  'ТОПЛ': 'F', // Fuel
  'КОМП': 'S', // Systems
  'ЭКИП': 'C', // Crew
  'ПЛАЗ': 'P', // Plasma gun
  'ГРАВ': 'G', // Gravity gun
  'ЗАЩ': 'I',  // Ion shield
  'АТОМ': 'R', // R-charge launcher (ракеты/торпеды)
  'ЗЕРК': 'M', // Mirror
  'none': '.', // Пустая клетка
};

const CODE_TO_CELL_TYPE = {
  'E': 'ДВИГ',
  'F': 'ТОПЛ',
  'S': 'КОМП',
  'C': 'ЭКИП',
  'P': 'ПЛАЗ',
  'G': 'ГРАВ',
  'I': 'ЗАЩ',
  'R': 'АТОМ',
  'M': 'ЗЕРК',
  '.': 'none',
};

// Сериализует таблицу в строку (по строкам таблицы → строки в сериализации)
function serializeGrid() {
  const table = document.querySelector('#ship_grid'); // предполагаем ID таблицы
  if (!table) return '';

  const rows = table.querySelectorAll('tr');
  const lines = [];

  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length === 0) return; // пропускаем заголовки

    let line = '';
    cells.forEach(cell => {
      const className = cell.className;
      let type = 'none';

      if (className && Object.keys(COLORS).includes(className)) {
        type = className;
      }
      line += CELL_TYPE_TO_CODE[type] || '.';
    });
    lines.push(line);
  });

  return lines.join('\n');
}

// Десериализует строку в таблицу
function deserializeGrid(serialized) {
  const table = document.querySelector('#ship_grid');
  if (!table) return;

  const lines = serialized.split('\n').filter(line => line.trim() !== '');
  const rows = table.querySelectorAll('tr');

  let rowIndex = 0;
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length === 0) return; // пропускаем заголовки

    if (rowIndex >= lines.length) return;

    const line = lines[rowIndex];
    for (let i = 0; i < cells.length && i < line.length; i++) {
      const code = line[i];
      const type = CODE_TO_CELL_TYPE[code] || 'none';

      if (type === 'none') {
        cells[i].className = '';
      } else if (COLORS.hasOwnProperty(type)) {
        cells[i].className = type;
      }
    }

    // Очистка остатка строки, если она короче
    for (let i = line.length; i < cells.length; i++) {
      cells[i].className = '';
    }

    rowIndex++;
  });

  // Обновить счётчики после загрузки
  updateCountersFromGrid();
}

function updateCountersFromGrid() {
  // Сброс всех счётчиков
  Object.keys(COLORS).forEach(key => {
    if (key !== 'erase') counters[key] = 0;
  });
  counters['none'] = 0;

  const cells = document.querySelectorAll('#ship_grid td');
  cells.forEach(cell => {
    const className = cell.className;
    if (className && Object.keys(COLORS).includes(className)) {
      counters[className] = (counters[className] || 0) + 1;
    } else {
      counters['none'] = (counters['none'] || 0) + 1;
    }
  });

  updateCountersDisplay(); // предполагается, что эта функция существует
}

async function copyGridToClipboard() {
  const serialized = serializeGrid();
  try {
    await navigator.clipboard.writeText(serialized);
    alert('Сетка скопирована в буфер обмена!');
  } catch (err) {
    console.error('Не удалось скопировать: ', err);
    alert('Ошибка при копировании в буфер обмена.');
  }
}

async function pasteGridFromClipboard() {
  try {
    const text = await navigator.clipboard.readText();
    if (!text.trim()) {
      alert('Буфер обмена пуст.');
      return;
    }
    deserializeGrid(text);
    alert('Сетка загружена из буфера обмена!');
  } catch (err) {
    console.error('Не удалось вставить: ', err);
    alert('Ошибка при чтении из буфера обмена.');
  }
}

// Обработчик клика по ячейке
function handleCellClick(e) {
  if (currentColor === null) return; // если цвет не выбран, выходим

  let cell = e.target;
  let previousBg = cell.className;

  // Находим предыдущий цвет ячейки
  let prevColorId = previousBg;


  // Если цвет не из палитры, считаем его как 'none'
  if (prevColorId !== 'none' && !COLORS.hasOwnProperty(prevColorId)) {
    prevColorId = 'none';
  }

  // Если выбран цвет "очистка", очищаем ячейку
  if (currentColor === 'erase') {
    cell.className = '';
    if (prevColorId !== 'none' && prevColorId !== 'erase') {
      counters[prevColorId]--;
    }
  } else {
    // Обновляем цвет ячейки
    cell.className = [currentColor];

    // Обновляем счётчики
    if (prevColorId !== 'none' && prevColorId !== 'erase') {
      counters[prevColorId]--;
    }
    if (currentColor !== 'erase') {
      counters[currentColor]++;
    }
  }

  updateCountersDisplay();
}

// Обновление отображения счётчиков
function updateCountersDisplay() {
  for (let colorId in COLORS) {
    if (colorId === 'erase') continue;
    let counterElement = document.getElementById(`counter-${colorId}`);
    if (counterElement) {
      counterElement.textContent = counters[colorId];
    }    
    let dataElement = document.getElementById(`data-${colorId}`);
    if (dataElement) {
      if(+dataElement.textContent === counters[colorId]) {
        dataElement.style.background = 'green';
      } else if(+dataElement.textContent < counters[colorId]) {
        dataElement.style.background = 'red';
      } else {
        dataElement.style.background = '';
      }
    }

  }
}

// Сброс таблицы и счётчиков
document.getElementById('resetBtn').addEventListener('click', function () {
  let cells = document.querySelectorAll('#colorTable td');
  cells.forEach(cell => {
    cell.className = '';
  });

  for (let colorId in counters) {
    counters[colorId] = 0;
  }
  updateCountersDisplay();

  // Сбрасываем выбранный цвет
  currentColor = null;
  document.querySelectorAll('.palette-color').forEach(el => {
    el.classList.remove('active');
  });
});

// Запуск при загрузке
initPalette();
initTable();
initCounters();
