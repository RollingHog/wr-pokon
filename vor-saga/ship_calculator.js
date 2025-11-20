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

