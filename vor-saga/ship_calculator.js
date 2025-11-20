/* 
exported
 
*/ 

// Пример структуры объекта Ship
let shipData = {
    // --- Основные параметры ---
    class_type: "", // 'B', 'C', 'D', 'E'
    mass: 0,        // в тоннах

    // --- Модули (в клетках) ---
    engine_cells: 0,
    fuel_cells: 0,
    systems_cells: 0,
    crew_cells: 0,
    plasma_guns: 0,
    gravity_guns: 0,
    r_torpedo_launchers: 0, // 1 клетка = 1 заряд, 2 клетки = 2+ заряда
    r_missile_launchers: 0, // 1 клетка = 1 или 2 ракеты (B), остальные = 1
    ion_shield_generators: 0,
    plasma_mirrors: 0,
    dock_bays: 0,

    // --- Уровни технологий ---
    tech_gravity: 0,
    tech_plasma: 0,
    tech_nuclear: 0,
    tech_propulsion: 0,
    tech_survivability: 0,
    tech_sensors: 0,
    tech_tactics: 0,

    // --- Дополнительные параметры ---
    has_gravity_penalty: false // true, если на D/E установлен гравиган
};

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
        alert("Ошибка: Необходимо указать класс корабля и положительную массу.");
        return false;
    }

    // 2. Определение требований на основе класса
    const req = requirements[shipData.class_type];
    if (!req) {
        alert("Ошибка: Неизвестный класс корабля.");
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
        alert(`Ошибка: Недостаточно клеток под двигатели. Минимум требуется: ${minEngineCells} (на основе ${req.min_engine_percentage}% от ${totalCells} клеток). Введено: ${shipData.engine_cells}.`);
        return false;
    }

    // 5. Проверка минимального процента топлива
    const minFuelCells = Math.ceil((req.min_fuel_percentage / 100) * totalCells);
    if (shipData.fuel_cells < minFuelCells) {
        alert(`Ошибка: Недостаточно клеток под топливо. Минимум требуется: ${minFuelCells} (на основе ${req.min_fuel_percentage}% от ${totalCells} клеток). Введено: ${shipData.fuel_cells}.`);
        return false;
    }

    // 6. Проверка минимального процента борт. систем
    const minSystemsCells = Math.ceil((req.min_systems_percentage / 100) * totalCells);
    if (shipData.systems_cells < minSystemsCells) {
        alert(`Ошибка: Недостаточно клеток под бортовые системы. Минимум требуется: ${minSystemsCells} (на основе ${req.min_systems_percentage}% от ${totalCells} клеток). Введено: ${shipData.systems_cells}.`);
        return false;
    }

    // 7. Проверка минимального процента экипажа
    const minCrewCells = Math.ceil((req.min_crew_percentage / 100) * totalCells);
    if (shipData.crew_cells < minCrewCells) {
        alert(`Ошибка: Недостаточно клеток под экипаж. Минимум требуется: ${minCrewCells} (на основе ${req.min_crew_percentage}% от ${totalCells} клеток). Введено: ${shipData.crew_cells}.`);
        return false;
    }

    // 8. Проверка плазменных зеркал (только на линкорах B)
    if (shipData.class_type !== 'B' && shipData.plasma_mirrors > 0) {
        alert(`Ошибка: Плазменные зеркала (${shipData.plasma_mirrors} шт.) могут быть установлены только на линкорах (B).`);
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
            alert(`Ошибка: Модуль(и) плазменного зеркала должен(ны) занимать минимум ${mirrorCellsRequired} клеток (22% от ${totalCells} или 8 клеток, смотря что больше). Введено: ${totalMirrorCells} клеток.`);
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
        systemLevels.ZASH = shipData.tech_survivability;
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
        has_gravity_penalty: document.getElementById('has_gravity_penalty').checked
    };

    // 2. Проверяем валидность конфигурации
    if (!validateShipConfiguration(shipData)) {
        // Если проверка не пройдена, функция уже вывела сообщение об ошибке
        // и расчет не продолжается.
        return;
    }

    // 3. Если валидация пройдена, можно переходить к следующему блоку (расчету БМ)
    // Здесь будет вызов следующих функций из Блока 3.
    console.log("Данные корабля валидны. Начинаем расчет БМ...");
    
    const bmCalculation = calculateBattlePower(shipData);
}

