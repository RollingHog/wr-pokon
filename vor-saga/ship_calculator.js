/* 
exported
calculateShipStats
*/ 

// Пример структуры объекта Requirements
const requirements = {
    B: { // Линкор
        min_engine_percentage: 20,
        min_fuel_percentage: 20,
        min_systems_percentage: 12,
        min_crew_percentage: 10
    },
    C: { // Крейсер
        min_engine_percentage: 20,
        min_fuel_percentage: 20,
        min_systems_percentage: 14,
        min_crew_percentage: 12
    },
    D: { // Дестроер
        min_engine_percentage: 20,
        min_fuel_percentage: 20,
        min_systems_percentage: 10,
        min_crew_percentage: 14
    },
    E: { // Эксплорер
        min_engine_percentage: 20,
        min_fuel_percentage: 20,
        min_systems_percentage: 10,
        min_crew_percentage: 14
    }
};

const TONNS_PER_CLASS = {
    'B': 250,
    'C': 150,
    'D': 100,
    'E': 100,
};

// Пример структуры объекта TechModifiers
const techModifiers = {
    gravity: 0, // соответствует tech_gravity
    plasma: 0,  // соответствует tech_plasma
    nuclear: 0, // соответствует tech_nuclear (для боекомплекта)
    survivability: 0, // соответствует tech_survivability
    sensors: 0, // соответствует tech_sensors
    tactics: 0  // соответствует tech_tactics
};

// Функция для валидации данных корабля
function validateShipConfiguration(shipData) {
    // 1. Проверка, что все необходимые поля заполнены
    if (!shipData.class_type || shipData.mass <= 0) {
        console.warn("Ошибка: Необходимо указать класс корабля и положительную массу.");
        return false;
    }

    // 2. Определение требований на основе класса
    const req = requirements[shipData.class_type];
    if (!req) {
        console.warn("Ошибка: Неизвестный класс корабля.");
        return false;
    }

    // 3. Вычисление общего количества клеток
    let totalCells;
    if (shipData.class_type === 'B') {
        totalCells = Math.ceil(shipData.mass / 250);
    } else if (shipData.class_type === 'C') {
        totalCells = Math.ceil(shipData.mass / 150);
    } else { // D или E
        totalCells = Math.ceil(shipData.mass / 100);
    }

    // 4. Проверка минимального процента двигателей
    const minEngineCells = Math.ceil((req.min_engine_percentage / 100) * totalCells);
    if (shipData.engine_cells < minEngineCells) {
        console.warn(`Ошибка: Недостаточно клеток под двигатели. Минимум требуется: ${minEngineCells} (на основе ${req.min_engine_percentage}% от ${totalCells} клеток). Введено: ${shipData.engine_cells}.`);
        return false;
    }

    // 5. Проверка минимального процента топлива
    const minFuelCells = Math.ceil((req.min_fuel_percentage / 100) * totalCells);
    if (shipData.fuel_cells < minFuelCells) {
        console.warn(`Ошибка: Недостаточно клеток под топливо. Минимум требуется: ${minFuelCells} (на основе ${req.min_fuel_percentage}% от ${totalCells} клеток). Введено: ${shipData.fuel_cells}.`);
        return false;
    }

    // 6. Проверка минимального процента борт. систем
    const minSystemsCells = Math.ceil((req.min_systems_percentage / 100) * totalCells);
    if (shipData.systems_cells < minSystemsCells) {
        console.warn(`Ошибка: Недостаточно клеток под бортовые системы. Минимум требуется: ${minSystemsCells} (на основе ${req.min_systems_percentage}% от ${totalCells} клеток). Введено: ${shipData.systems_cells}.`);
        return false;
    }

    // 7. Проверка минимального процента экипажа
    const minCrewCells = Math.ceil((req.min_crew_percentage / 100) * totalCells);
    if (shipData.crew_cells < minCrewCells) {
        console.warn(`Ошибка: Недостаточно клеток под экипаж. Минимум требуется: ${minCrewCells} (на основе ${req.min_crew_percentage}% от ${totalCells} клеток). Введено: ${shipData.crew_cells}.`);
        return false;
    }

    // 8. Проверка плазменных зеркал (только на линкорах B)
    if (shipData.class_type !== 'B' && shipData.plasma_mirrors > 0) {
        console.warn(`Ошибка: Плазменные зеркала (${shipData.plasma_mirrors} шт.) могут быть установлены только на линкорах (B).`);
        return false;
    }

    // 9. Проверка размера модуля плазменного зеркала (если установлен)
    if (shipData.plasma_mirrors > 0) {
        const mirrorCellsRequired = Math.max(Math.ceil((22 / 100) * totalCells), 8);
        // Предположим, что 1 модуль плазменного зеркала занимает 1 клетку (или фиксированное количество).
        // Правила не уточняют, сколько *один* модуль занимает, но говорят про *общий* размер.
        // Интерпретируем это как требование, что *все* модули зеркал вместе занимают >= 22% или >= 8 клеток.
        let totalMirrorCells = shipData.plasma_mirrors; // Предполагаем 1 модуль = 1 клетка
        if (totalMirrorCells < mirrorCellsRequired) {
            console.warn(`Ошибка: Модуль(и) плазменного зеркала должен(ны) занимать минимум ${mirrorCellsRequired} клеток (22% от ${totalCells} или 8 клеток, смотря что больше). Введено: ${totalMirrorCells} клеток.`);
            return false;
        }
    }

    // 10. Проверка штрафа за гравиган на D/E
    if ((shipData.class_type === 'D' || shipData.class_type === 'E') && shipData.gravity_guns > 0) {
        // Это не ошибка, а предупреждение/флаг. Проверка корректности ввода.
        // Флаг shipData.has_gravity_penalty должен быть установлен пользователем вручную или программно.
        // Предположим, что если гравиган есть, штраф должен быть отмечен.
        // Проверка на отсутствие флага, если гравиган есть, может быть частью логики расчета, а не валидации формы.
        // Для валидации формы - это просто проверка, что введено число гравиганов.
    }

    // Если все проверки пройдены
    return true;
}

function calculateTotalCells(shipClass, mass) {
    if (shipClass === 'B') {
        return Math.ceil(mass / 250);
    } else if (shipClass === 'C') {
        return Math.ceil(mass / 150);
    } else { // D или E
        return Math.ceil(mass / 100);
    }
}

function calculateBattlePower(shipData) {
    // 1. Вычисляем общее количество клеток
    const totalCells = calculateTotalCells(shipData.class_type, shipData.mass);

    // 2. Вычисляем компоненты боевой мощи (уровни систем)
    const systemLevels = {
        GRAV: 0,
        PLAZ: 0,
        ATOM: 0,
        ZASH: 0,
        KOMP: 0,
        EKIP: 0
    };

    // --- GRAV: Искусственная гравитация ---
    // Гравиганы учитываются только если они установлены и нет штрафа меткости,
    // но штраф меткости влияет только на КОМП, а не на сам факт учета GRAV.
    // Из примера: "Дестроер не несет гравиганов, поэтому Искусственная гравитация ур=3 не учитывается"
    // Следовательно, GRAV = tech_gravity только если gravity_guns > 0.
    if (shipData.gravity_guns > 0) {
        systemLevels.GRAV = shipData.tech_gravity;
    }
    // Если гравиганов нет, GRAV = 0, что и есть значение по умолчанию.

    // --- PLAZ: Физика плазмы ---
    // Аналогично, модификатор применяется только если есть плазмаганы.
    if (shipData.plasma_guns > 0) {
        systemLevels.PLAZ = shipData.tech_plasma;
    }

    // --- ATOM: Ядерная физика ---
    // Модификатор применяется, если есть Р-заряды любого типа (ракеты или торпеды).
    // Из примера: "Линкор не имеет на борту Р-зарядов... АТОМ 0 (2)"
    // Следовательно, ATOM = tech_nuclear только если есть Р-заряды.
    const hasRCharges = shipData.r_torpedo_launchers > 0 || shipData.r_missile_launchers > 0;
    if (hasRCharges) {
        systemLevels.ATOM = shipData.tech_nuclear;
    }

    // --- ZASH: Борьба за живучесть ---
    // Модификатор применяется, если есть ионные экраны.
    // Из примера: "корабль не имеет модулей ионных экранов, поэтому получает штраф... ЗАЩ 0 (2)"
    // Следовательно, ZASH = tech_survivability только если есть ионные экраны.
    if (shipData.ion_shield_generators > 0) {
        systemLevels.ZASH =  shipData.tech_survivability;
    }

    // --- KOMP: Сенсоры и компьютеры ---
    // Бортовые системы обязательны для всех, поэтому KOMP всегда >= tech_sensors.
    // Но если есть штраф за гравиган на D/E, он применяется здесь.
    systemLevels.KOMP = shipData.tech_sensors;
    if (shipData.has_gravity_penalty) {
        systemLevels.KOMP = Math.max(0, systemLevels.KOMP - 2); // Уровень не может быть отрицательным
    }

    // --- EKIP: Тактика и организация ---
    // Экипаж обязателен для всех, поэтому EKIP всегда = tech_tactics.
    systemLevels.EKIP = shipData.tech_tactics;

    // 3. Вычисляем базовую БМ (до модификатора класса)
    const baseBM = systemLevels.GRAV + systemLevels.PLAZ + systemLevels.ATOM + 
                   systemLevels.ZASH + systemLevels.KOMP + systemLevels.EKIP;

    // 4. Применяем модификатор класса и массы
    let classModifier;
    if (shipData.class_type === 'B') classModifier = 3;
    else if (shipData.class_type === 'C') classModifier = 1.5;
    else if (shipData.class_type === 'D') classModifier = 1;
    else if (shipData.class_type === 'E') classModifier = 0.8;

    const massInThousands = shipData.mass / 1000;
    const classAndMassComponent = Math.round(massInThousands * classModifier);

    let bm = classAndMassComponent + baseBM;

    // 5. Добавляем бонус для дестроера за дополнительные Р-торпеды
    // "Если на борту более 1 Р-торпеды, БМ дестроера возрастает на 1."
    // Предположим, что 1 установка = 1 торпеда, 2 установки = 2+ торпеды.
    if (shipData.class_type === 'D' && shipData.r_torpedo_launchers > 1) {
        bm += 1;
    }

    // 6. Проверка на переполнение клеток (неофициальный штраф)
    // Суммируем все клетки, занятые модулями.
    // Предположения: 1 модуль оружия/защиты = 1 клетка.
    // Исключение: Р-торпедная установка: 1 клетка = 1 заряд, 2 клетки = перезаряжаемая (1 установка).
    // В вводе пользователь указывает *количество установок*, а не клеток.
    // Для упрощения считаем, что 1 `r_torpedo_launchers` = 1 клетка (если не перезаряжаемый) или 2 клетки.
    // Но это неоднозначно. Из правил: "1 клетка — однозарядная, 2 клетки — перезаряжаемая".
    // Будем считать, что значение `r_torpedo_launchers` уже учитывает клетки.
    // То есть, если у пользователя 1 однозарядная установка - он вводит 1.
    // Если у него 1 перезаряжаемая - он вводит 2.
    // Аналогично для Р-ракет: 1 клетка = 1 установка.

    const totalOccupiedCells = 
        shipData.engine_cells +
        shipData.fuel_cells +
        shipData.systems_cells +
        shipData.crew_cells +
        shipData.plasma_guns +
        shipData.gravity_guns +
        shipData.r_torpedo_launchers +
        shipData.r_missile_launchers +
        shipData.ion_shield_generators +
        shipData.plasma_mirrors +
        shipData.dock_bays;

    if (totalOccupiedCells > totalCells) {
        // Это ошибка проектирования. Можно выдать предупреждение.
        console.warn(`Внимание! Занято клеток: ${totalOccupiedCells}, доступно: ${totalCells}. Корабль перегружен.`);
        // Игра не предусматривает штрафа БМ, но мастер может отклонить проект.
    }

    // 7. Возвращаем результат
    return {
        totalCells: totalCells,
        systemLevels: systemLevels,
        classAndMassComponent: classAndMassComponent,
        baseBM: baseBM,
        finalBM: bm,
        totalOccupiedCells: totalOccupiedCells
    };
}

function applyIonShieldPenalty(shipData, bmCalculation) {
    // 1. Определяем требуемое количество ионных экранов
    // "1 модуль на каждые 3000 тонн"
    // Если масса <= 3000, всё равно нужно хотя бы 1 модуль для избежания 50% штрафа.
    const requiredShields = Math.ceil(shipData.mass / 3000);

    // 2. Проверяем условия для штрафов
    let shieldPenaltyPercentage = 0;
    if (shipData.ion_shield_generators === 0) {
        // Условие: "вообще не имеет ионных экранов"
        shieldPenaltyPercentage = 50;
    } else if (shipData.ion_shield_generators < requiredShields) {
        // Условие: "меньше модулей, чем требуется"
        shieldPenaltyPercentage = 25;
    }
    // Если экранов достаточно, штраф = 0%.

    // 3. Применяем штраф к уровню ЗАЩ
    // Берем исходный уровень ZASH из bmCalculation
    const originalZASH = bmCalculation.systemLevels.ZASH;
    const penaltyAmount = Math.floor(originalZASH * (shieldPenaltyPercentage / 100));
    const correctedZASH = originalZASH - penaltyAmount;

    // Уровень не может быть отрицательным
    bmCalculation.systemLevels.ZASH = Math.max(0, correctedZASH);

    // 4. Пересчитываем базовую и итоговую БМ
    // Новый baseBM = старый baseBM - (оригинальный ZASH - скорректированный ZASH)
    const zashDifference = originalZASH - bmCalculation.systemLevels.ZASH;
    bmCalculation.baseBM -= zashDifference;
    bmCalculation.finalBM -= zashDifference;

    // 5. Сохраняем информацию о штрафе для вывода
    bmCalculation.ionShieldInfo = {
        required: requiredShields,
        installed: shipData.ion_shield_generators,
        penaltyPercentage: shieldPenaltyPercentage,
        originalZASH: originalZASH,
        correctedZASH: bmCalculation.systemLevels.ZASH
    };

    return bmCalculation;
}

function displayResult(shipData, bmCalculation) {
    // Очистим предыдущий результат
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = '';

    // --- Основная информация ---
    const classNames = { 'B': 'Линкор', 'C': 'Крейсер', 'D': 'Дестроер', 'E': 'Эксплорер' };
    const className = classNames[shipData.class_type] || 'Неизвестный класс';

    let html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 8px auto; padding: 8px; border: 1px solid #333; border-radius: 8px; background-color: #f9f9f9; margin-top: -20px;">
            <b style="color: #2c3e50; text-align: center;">Результат проектирования корабля</b><br>
            <span><strong>Корабль:</strong> ${className} (${shipData.mass} т)</span>
            <span style="float: right"><strong>Занято клеток:</strong> ${bmCalculation.totalOccupiedCells} / ${bmCalculation.totalCells} 
                ${bmCalculation.totalOccupiedCells > bmCalculation.totalCells ? 
                    '<span style="color: #e74c3c;">⚠️ ПЕРЕГРУЖЕН</span>' : 
                    '<span style="color: #27ae60;">✓ OK</span>'}</span>
            <hr>
    `;

    // --- Уровни систем (горизонтальная таблица: названия в первой строке, уровни во второй) ---
    html += `
        <b hidden style="color: #3498db;">Уровни систем (влияют на БМ):</b>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">
            <thead>
                <tr style="background-color: #ecf0f1;">
    `;

    // Системы с их названиями и значениями
    const systems = [
        { key: 'GRAV', name: 'ГРАВ', value: bmCalculation.systemLevels.GRAV, active: shipData.gravity_guns > 0 },
        { key: 'PLAZ', name: 'ПЛАЗ', value: bmCalculation.systemLevels.PLAZ, active: shipData.plasma_guns > 0 },
        { key: 'ATOM', name: 'АТОМ', value: bmCalculation.systemLevels.ATOM, active: shipData.r_torpedo_launchers > 0 || shipData.r_missile_launchers > 0 },
        { key: 'ZASH', name: 'ЗАЩ', value: bmCalculation.systemLevels.ZASH, active: shipData.ion_shield_generators > 0 },
        { key: 'KOMP', name: 'КОМП', value: bmCalculation.systemLevels.KOMP, active: true },
        { key: 'EKIP', name: 'ЭКИП', value: bmCalculation.systemLevels.EKIP, active: true }
    ];

    // Первая строка: названия систем
    systems.forEach(sys => {
        html += `<th style="padding: 8px; text-align: center;" class="${sys.name}">${sys.name}</th>`;
    });

    html += `
                </tr>
                <tr style="background-color: #f9f9f9;">
    `;

    // Вторая строка: уровни систем
    systems.forEach(sys => {
        const color = sys.value > 0 ? '#27ae60' : '#7f8c8d';
        html += `<td style="padding: 8px; text-align: center; color: ${color}; font-weight: bold;">${sys.value}</td>`;
    });

    html += `
                </tr>
            </thead>
            <tbody>
            </tbody>
        </table>
    `;

    // --- Штраф за ионные экраны ---
    if (bmCalculation.ionShieldInfo && bmCalculation.ionShieldInfo.penaltyPercentage > 0) {
        const info = bmCalculation.ionShieldInfo;
        const penaltyText = info.penaltyPercentage === 50 ? 'Полный штраф (50%) — нет ионных экранов' : 'Частичный штраф (25%) — недостаточно экранов';
        html += `
            <div style="background-color: #f8d7da; border-left: 4px solid #e74c3c; padding: 12px; margin: 15px 0; border-radius: 0 4px 4px 0;">
                <strong>⚠️ Штраф к Уровню ЗАЩ:</strong> ${penaltyText}<br>
                Требуется: ${info.required} модулей, установлено: ${info.installed} → Уровень снижен с ${info.originalZASH} до ${info.correctedZASH}
            </div>
        `;
    }

    // --- Штраф за гравиган на D/E ---
    if (shipData.has_gravity_penalty) {
        html += `
            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 15px 0; border-radius: 0 4px 4px 0;">
                <strong>⚠️ Штраф к КОМП:</strong> Установлен гравиган на ${shipData.class_type} — уровень Сенсоров и компьютеров снижен на 2.
            </div>
        `;
    }

    // --- Дополнительные замечания ---
    const warnings = [];

    if (shipData.plasma_mirrors > 0 && shipData.class_type !== 'B') {
        warnings.push("⚠️ Плазменные зеркала установлены на корабле, не являющемся линкором — это невозможно в реальных условиях.");
    }

    if (shipData.class_type === 'D' && shipData.gravity_guns > 0) {
        warnings.push("⚠️ Установка гравигана на дестроере — крайне неэффективно. Штраф к меткости уже применён.");
    }

    if (shipData.class_type === 'E' && shipData.gravity_guns > 0) {
        warnings.push("⚠️ Установка гравигана на эксплорере — неоправданно. Штраф к меткости уже применён.");
    }

    if (shipData.class_type === 'D' && shipData.r_torpedo_launchers > 1) {
        warnings.push("✅ Бонус к БМ: Дестроер несёт более 1 Р-торпеды → +1 к боевой мощности.");
    }

    if (shipData.class_type === 'B' && shipData.r_missile_launchers > 0) {
        warnings.push("✅ Р-ракеты на линкоре: каждая установка даёт 2 ракеты (база).");
    }

    if (warnings.length > 0) {
        html += `<h4 style="color: #e67e22;">Замечания:</h4>`;
        html += `<ul style="margin: 10px 0; padding-left: 20px;">`;
        warnings.forEach(warn => {
            html += `<li style="margin: 5px 0;">${warn}</li>`;
        });
        html += `</ul>`;
    }

    // --- Итоговая боевая мощь ---
    const classModifier = shipData.class_type === 'B' ? 3 : 
                          shipData.class_type === 'C' ? 1.5 : 
                          shipData.class_type === 'D' ? 1 : 0.8;

    html += `
        <hr>
        <div style="text-align: center; padding: 20px; background-color: #3498db; color: white; border-radius: 8px; font-weight: bold; margin: 8px 0;">
            💥 <span style="">БОЕВАЯ МОЩНОСТЬ (БМ): ${bmCalculation.finalBM}</span>
        </div>
        <p style="text-align: center; color: #555; font-size: 14px;">
            Расчёт: (${Math.round(shipData.mass / 1000)} × ${classModifier}) + (${bmCalculation.baseBM}) = ${bmCalculation.classAndMassComponent} + ${bmCalculation.baseBM} = ${bmCalculation.finalBM}
        </p>
    `;

    // --- Закрытие контейнера ---
    html += `
        </div>
    `;

    resultDiv.innerHTML = html;
}

// --- 1. Сохранение и восстановление данных формы ---

function saveFormData() {
    const formData = {};
    const inputs = document.querySelectorAll('#shipForm input, #shipForm select');
    inputs.forEach(input => {
        if (input.type === 'checkbox') {
            formData[input.name] = input.checked;
        } else {
            formData[input.name] = input.value;
        }
    });
    localStorage.setItem('shipFormData', JSON.stringify(formData));
}

function loadFormData() {
    const saved = localStorage.getItem('shipFormData');
    if (saved) {
        const formData = JSON.parse(saved);
        Object.keys(formData).forEach(key => {
            const element = document.querySelector(`[name="${key}"]`);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = formData[key];
                } else {
                    element.value = formData[key];
                }
            }
        });
    }
}

function clearFormData() {
    localStorage.removeItem('shipFormData');
    document.getElementById('shipForm').reset();
    document.getElementById('result').innerHTML = '';
    // После сброса формы, если выбран класс, нужно снова установить min
    setMinimumsForClass();
}

// --- 2. Установка минимальных значений при выборе класса ---

// --- Новая переиспользуемая функция расчёта минимальных значений ---
function calculateMinimumModuleCells(shipClass, mass) {
    if (!shipClass || mass <= 0) {
        return null;
    }

    const req = requirements[shipClass];
    if (!req) {
        return null;
    }

    const totalCells = calculateTotalCells(shipClass, mass);

    return {
        engine_cells: Math.ceil((req.min_engine_percentage / 100) * totalCells),
        fuel_cells: Math.ceil((req.min_fuel_percentage / 100) * totalCells),
        systems_cells: Math.ceil((req.min_systems_percentage / 100) * totalCells),
        crew_cells: Math.ceil((req.min_crew_percentage / 100) * totalCells),
        totalCells: totalCells
    };
}

// --- Обновлённая функция setMinimumsForClass ---
function setMinimumsForClass() {
    const classSelect = document.getElementById('ship_class');
    const classData = classSelect.value;
    const massInput = document.getElementById('ship_mass');
    const mass = parseInt(massInput.value) || 0;

    // Очищаем поля перед установкой новых значений
    document.getElementById('engine_cells').value = '';
    document.getElementById('fuel_cells').value = '';
    document.getElementById('systems_cells').value = '';
    document.getElementById('crew_cells').value = '';

    const minValues = calculateMinimumModuleCells(classData, mass);
    if (!minValues) {
        return;
    }

    document.getElementById('engine_cells').value = minValues.engine_cells;
    document.getElementById('fuel_cells').value = minValues.fuel_cells;
    document.getElementById('systems_cells').value = minValues.systems_cells;
    document.getElementById('crew_cells').value = minValues.crew_cells;
}

function renderFreeCellsTable(containerId = 'freeCellsTable') {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with id "${containerId}" not found.`);
        return;
    }

    // Диапазоны масс (в тоннах) для отображения
    const massRanges = [500, 1000, 1500, 2000, 3000, 4000, 5000, 6000, 7500, 10000];

    let html = `
        <h3 style="margin-top: 20px;">Свободные клетки по классам и массе</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
                <tr style="background-color: #f2f2f2;">
                    <th style="padding: 8px; border: 1px solid #ccc;">Масса (т)</th>
    `;

    // Заголовки: один столбец на класс
    for (const cls of ['B', 'C', 'D', 'E']) {
        html += `<th style="padding: 8px; border: 1px solid #ccc;">${cls}</th>`;
    }

    html += `
                </tr>
            </thead>
            <tbody>
    `;

    // Для каждой массы — строка
    for (const mass of massRanges) {
        html += `<tr><td style="padding: 6px; border: 1px solid #ccc; text-align: center;">${mass}</td>`;

        // Для каждого класса — ячейка
        for (const cls of ['B', 'C', 'D', 'E']) {
            const minCells = calculateMinimumModuleCells(cls, mass);
            if (!minCells) {
                html += `<td style="padding: 6px; border: 1px solid #ccc; text-align: center; color: #999;">—</td>`;
                continue;
            }

            const totalCells = minCells.totalCells;
            const requiredCells = minCells.engine_cells
               + minCells.fuel_cells + minCells.systems_cells + minCells.crew_cells;
            const freeCells = totalCells - requiredCells;

            let cellStyle = 'padding: 6px; border: 1px solid #ccc; text-align: center;';
            if (freeCells < 0) {
                cellStyle += ' background-color: #ffe6e6; color: #d32f2f;'; // перегруз
            } else if (freeCells === 0) {
                cellStyle += ' background-color: #fff3e0; color: #e65100;'; // впритык
            } else {
                cellStyle += ' background-color: #e8f5e9; color: #2e7d32;'; // свободно
            }

            html += `<td style="${cellStyle}">${freeCells} / ${totalCells}</td>`;
        }

        html += `</tr>`;
    }

    html += `
            </tbody>
        </table>
        <p style="font-size: 11px; color: #666; margin-top: 5px;">
            Формат: <strong>свободно / всего</strong>. Зелёный — есть место под вооружение. Оранжевый — впритык. Красный — невозможно.
        </p>
    `;

    container.innerHTML = html;
}

function calculateShipStats() {
    // 1. Считываем данные из формы
    const shipData = {
        class_type: document.getElementById('ship_class').value,
        mass: parseInt(document.getElementById('ship_mass').value),
        engine_cells: parseInt(document.getElementById('engine_cells').value) || 0,
        fuel_cells: parseInt(document.getElementById('fuel_cells').value) || 0,
        systems_cells: parseInt(document.getElementById('systems_cells').value) || 0,
        crew_cells: parseInt(document.getElementById('crew_cells').value) || 0,
        plasma_guns: parseInt(document.getElementById('plasma_guns').value) || 0,
        gravity_guns: parseInt(document.getElementById('gravity_guns').value) || 0,
        r_torpedo_launchers: parseInt(document.getElementById('r_torpedo_launchers').value) || 0,
        r_missile_launchers: parseInt(document.getElementById('r_missile_launchers').value) || 0,
        ion_shield_generators: parseInt(document.getElementById('ion_shield_generators').value) || 0,
        plasma_mirrors: parseInt(document.getElementById('plasma_mirrors').value) || 0,
        dock_bays: parseInt(document.getElementById('dock_bays').value) || 0,
        tech_gravity: parseInt(document.getElementById('tech_gravity').value) || 0,
        tech_plasma: parseInt(document.getElementById('tech_plasma').value) || 0,
        tech_nuclear: parseInt(document.getElementById('tech_nuclear').value) || 0,
        tech_propulsion: parseInt(document.getElementById('tech_propulsion').value) || 0,
        tech_survivability: parseInt(document.getElementById('tech_survivability').value) || 0,
        tech_sensors: parseInt(document.getElementById('tech_sensors').value) || 0,
        tech_tactics: parseInt(document.getElementById('tech_tactics').value) || 0,
    };

    shipData.has_gravity_penalty = ['D', 'E'].includes(shipData.class_type) && shipData.gravity_guns > 0

    // 2. Проверяем валидность конфигурации
    if (!validateShipConfiguration(shipData)) {
        // Если проверка не пройдена, функция уже вывела сообщение об ошибке
        // и расчет не продолжается.
        return;
    }

    // 3. Если валидация пройдена, можно переходить к следующему блоку (расчету БМ)
    // Здесь будет вызов следующих функций из Блока 3.
    console.log("Данные корабля валидны. Начинаем расчет БМ...");
    
    let bmCalculation = calculateBattlePower(shipData);

    // 2. Применяем штрафы за ионные экраны
    bmCalculation = applyIonShieldPenalty(shipData, bmCalculation);

    // 3. Вывод результата (см. Блок 5)
    displayResult(shipData, bmCalculation);
}


// --- Обновление обработчиков событий ---
document.getElementById('ship_class').addEventListener('change', function() {
    setMinimumsForClass();
});
document.getElementById('ship_mass').addEventListener('input', function() {
    setMinimumsForClass();
});

// --- Вызов загрузки данных при загрузке страницы ---
window.onload = function() {
    loadFormData();
    setMinimumsForClass(); // Установить минимумы сразу после загрузки, если данные были
    updateCellCounts();
};

// --- Обновленная функция для отображения занятых и общих клеток ---
function updateCellCounts() {
    const classSelect = document.getElementById('ship_class');
    const massInput = document.getElementById('ship_mass');
    const mass = parseInt(massInput.value) || 0;

    if (!classSelect.value || mass <= 0) {
        document.getElementById('cellCountInfo').innerHTML = '';
        return;
    }

    const totalCells = calculateTotalCells(classSelect.value, mass);

    // Суммируем занятые клетки
    const engine_cells = parseInt(document.getElementById('engine_cells').value) || 0;
    const fuel_cells = parseInt(document.getElementById('fuel_cells').value) || 0;
    const systems_cells = parseInt(document.getElementById('systems_cells').value) || 0;
    const crew_cells = parseInt(document.getElementById('crew_cells').value) || 0;
    const plasma_guns = parseInt(document.getElementById('plasma_guns').value) || 0;
    const gravity_guns = parseInt(document.getElementById('gravity_guns').value) || 0;
    const r_torpedo_launchers = parseInt(document.getElementById('r_torpedo_launchers').value) || 0;
    const r_missile_launchers = parseInt(document.getElementById('r_missile_launchers').value) || 0;
    const ion_shield_generators = parseInt(document.getElementById('ion_shield_generators').value) || 0;
    const plasma_mirrors = parseInt(document.getElementById('plasma_mirrors').value) || 0;
    const dock_bays = parseInt(document.getElementById('dock_bays').value) || 0;

    const totalOccupiedCells = engine_cells + fuel_cells + systems_cells + crew_cells +
                               plasma_guns + gravity_guns + r_torpedo_launchers +
                               r_missile_launchers + ion_shield_generators + plasma_mirrors + dock_bays;

    let statusClass = '';
    if (totalOccupiedCells > totalCells) {
        statusClass = 'overloaded';
    } else if (totalOccupiedCells === totalCells) {
        statusClass = 'full';
    } else {
        statusClass = 'ok';
    }

    document.getElementById('cellCountInfo').innerHTML = `
        <div id="cellCountsDisplay" class="${statusClass}">
            Занято клеток: <strong>${totalOccupiedCells}</strong> / ${totalCells}
        </div>
    `;

    updateTonnageCells();
}

function updateTonnageCells() {
    const classSelect = document.getElementById('ship_class');
    if (!classSelect.value) {
        // Если класс корабля не выбран, выходим
        return;
    }

    // Получаем множитель для класса
    const multiplier = TONNS_PER_CLASS[classSelect.value] || 0;

    // Список идентификаторов соответствующих input'ов
    const cellIds = [
        'engine_cells',
        'fuel_cells',
        'systems_cells',
        'crew_cells',
        'plasma_guns',
        'gravity_guns',
        'r_torpedo_launchers',
        'r_missile_launchers',
        'ion_shield_generators',
        'plasma_mirrors',
        'dock_bays'
    ];

    // Проходим по каждому ID
    for (const id of cellIds) {
        const inputElement = document.getElementById(id);
        if (!inputElement) continue; // Пропускаем, если элемент не найден

        // Получаем числовое значение из input
        const value = parseInt(inputElement.value) || 0;

        // Вычисляем итоговое значение
        const result = value * multiplier;

        // Находим все ячейки с классом, соответствующим ID, и классом tonnage
        const targetCells = document.querySelectorAll(`td.${id}.tonnage`);
        targetCells.forEach(cell => {
            cell.textContent = result; // Заполняем ячейку числом
        });
    }
}
// --- Обновление обработчиков событий ---
document.getElementById('shipForm').addEventListener('change', function(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
        saveFormData();
        updateCellCounts();
    }
});
document.getElementById('shipForm').addEventListener('input', function(e) {
    if (e.target.tagName === 'INPUT' && e.target.type === 'number') {
        updateCellCounts(); // Обновляем при вводе чисел
    }
});

document.getElementById('massLabel').addEventListener('click', function(e) {
    e.preventDefault();
    const overlay = document.getElementById('overlay');
    overlay.style.display = 'block';
    
    // Рендерим таблицу прямо в оверлей
    renderFreeCellsTable('freeCellsTableInOverlay');
    
    // Фокус на оверлее для обработки Escape
    overlay.focus();
});

// Закрытие по клику вне контента
document.getElementById('overlay').addEventListener('click', function(e) {
    if (e.target === this) {
        this.style.display = 'none';
    }
});

// Закрытие по нажатию Escape
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        document.getElementById('overlay').style.display = 'none';
    }
});
