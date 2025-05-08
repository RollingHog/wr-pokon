
// Базовые коэффициенты преобразования
const baseRates = {
  wood: { food: 1 },
  iron: { stone: 2, wood: 3 },
  crystal: { iron: 3.5 },
  adamant: { iron: 5.5 },
  atk: { iron: 1.3 },
  point: { iron: 0.9 },
  slaves: { food: 0.8 },
};

const ruNames = {
  wood: "Дерево",
  food: "Еда",
  iron: "Железо",
  stone: "Камень",
  crystal: "Кристаллы",
  adamant: "Адамант",
  atk: "Атака",
  point: "Хар-ка",
  slaves: "Рабы",
};

const allUnits = Object.keys(ruNames);

// Полная матрица преобразований
let conversionRates = {};

// Инициализация матрицы преобразований
function initConversionRates() {
  conversionRates = JSON.parse(JSON.stringify(baseRates));

  // Добавляем обратные преобразования
  for (const fromUnit in baseRates) {
    for (const toUnit in baseRates[fromUnit]) {
      if (!conversionRates[toUnit]) conversionRates[toUnit] = {};
      conversionRates[toUnit][fromUnit] = 1 / baseRates[fromUnit][toUnit];
    }
  }

  // Добавляем преобразование единицы в себя (1:1)
  allUnits.forEach(unit => {
    if (!conversionRates[unit]) conversionRates[unit] = {};
    conversionRates[unit][unit] = 1;
  });

  // Дерево и еда взаимозаменяемы 1:1
  conversionRates.wood.food = 1;
  conversionRates.food.wood = 1;
  conversionRates.food.food = 1;
}

// Поиск пути конвертации между двумя ресурсами
function findConversionPath(fromUnit, toUnit, visited = {}) {
  if (fromUnit === toUnit) return [];
  if (conversionRates[fromUnit] && conversionRates[fromUnit][toUnit]) {
    return [{ from: fromUnit, to: toUnit, rate: conversionRates[fromUnit][toUnit] }];
  }

  visited[fromUnit] = true;

  for (const intermediateUnit in conversionRates[fromUnit]) {
    if (!visited[intermediateUnit]) {
      const subPath = findConversionPath(intermediateUnit, toUnit, { ...visited });
      if (subPath !== null) {
        return [
          { from: fromUnit, to: intermediateUnit, rate: conversionRates[fromUnit][intermediateUnit] },
          ...subPath
        ];
      }
    }
  }

  return null;
}

// Конвертация одного ресурса в целевой
function convertResource(value, fromUnit, toUnit) {
  console.log(fromUnit, toUnit);

  if (fromUnit === toUnit) return { value, steps: [] };

  const path = findConversionPath(fromUnit, toUnit);
  if (!path) return null;

  let result = value;
  let steps = [];

  for (const step of path) {
    result *= step.rate;
    steps.push({
      from: step.from,
      to: step.to,
      rate: step.rate,
      intermediateValue: result
    });
  }

  return { value: result, steps };
}

// Расчет общей стоимости
function calculateTotal() {
  const targetUnit = document.getElementById('targetUnit').value;
  const resourceInputs = document.querySelectorAll('.resource-input');

  let total = 0;
  let allSteps = [];
  let hasError = false;

  document.getElementById('totalResult').innerHTML = '';

  resourceInputs.forEach(input => {
    const value = parseFloat(input.querySelector('.resource-value').value);
    const unit = input.querySelector('.resource-unit').value;

    if (isNaN(value)) {
      hasError = true;
      return;
    }

    const conversion = convertResource(value, unit, targetUnit);

    if (!conversion) {
      hasError = true;
      return;
    }

    total += conversion.value;

  });

  if (!hasError) {
    document.getElementById('totalResult').innerHTML =
      `Общая стоимость: <strong><span id="numResult">${total.toFixed(2)}</span> ${getUnitName(targetUnit)}</strong>`;
  }

  updateMultResult()
}

function getUnitName(unit) {
  return ruNames[unit] || unit;
}

function updateMultResult() {
  // Получаем элементы DOM
  const numResultEl = document.getElementById('numResult');
  const multiplierEl = document.getElementById('multiplierEl');
  const multedResultEl = document.getElementById('multedResult');

  try {
    // Получаем числовые значения из полей
    const totalValue = parseFloat(numResultEl.textContent) || 0;
    const multiplierValue = parseFloat(multiplierEl.value) || 0;

    // Вычисляем результат
    const result = totalValue * multiplierValue;

    // Выводим результат с округлением до 2 знаков
    multedResultEl.textContent = result.toFixed(2);
  } catch (error) {
    console.error('Ошибка при вычислении:', error);
    multedResultEl.textContent = '0.00';
  }
}

function init() {

  // Добавление нового поля ресурса
  document.querySelector('.add-resource').addEventListener('click', function () {
    const newInput = document.createElement('div');
    newInput.className = 'resource-input';
    newInput.innerHTML = `
                <input type="number" class="resource-value" min="0" step="0.01" value="1">
                <select class="resource-unit">
                    ${allUnits.map(name => `<option value="${name}">${ruNames[name]}</option>`).join('\n')}
                </select>
                <button class="remove-resource">×</button>
            `;
    document.getElementById('resourceInputs').appendChild(newInput);

    // Добавляем обработчик удаления
    newInput.querySelector('.remove-resource').addEventListener('click', function () {
      newInput.querySelector('.resource-value').value = 0;
      calculateTotal()
    });
    newInput.querySelector('input').addEventListener('input', calculateTotal)
  });

  // Добавляем обработчики удаления для существующих полей
  document.querySelectorAll('.remove-resource').forEach(el => {
    el.addEventListener('click', function () {
      this.parentElement.querySelector('.resource-value').value = 0;
      calculateTotal()
    });
    el.parentElement.querySelector('input').addEventListener('input', calculateTotal)
  });

  document.querySelectorAll('.resource-unit').forEach(el => {
    el.innerHTML = allUnits.map(name => `<option value="${name}">${ruNames[name]}</option>`).join('\n')
    el.addEventListener('change', calculateTotal)
  })

  document.querySelector('.resource-unit [value=food]').setAttribute('selected', '1')

  document.getElementById('targetUnit').innerHTML = allUnits.map(name => `<option value="${name}">${ruNames[name]}</option>`).join('\n')
  document.getElementById('targetUnit').addEventListener('change', calculateTotal)
  document.querySelector('#targetUnit [value=iron]').setAttribute('selected', '1')
}

init()

// Инициализируем матрицу преобразований
initConversionRates();

// Первоначальный расчет
calculateTotal();
