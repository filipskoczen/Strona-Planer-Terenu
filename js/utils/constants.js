/* ============================================
   CONSTANTS
   ============================================ */

const CONSTANTS = {
    // Canvas
    DEFAULT_ZOOM: 1,
    MIN_ZOOM: 0.05,
    MAX_ZOOM: 5,
    ZOOM_STEP: 0.1,

    // Grid
    DEFAULT_GRID_SIZE: 1,
    DEFAULT_PIXELS_PER_METER: 30,

    // Elements
    MIN_ELEMENT_SIZE: 0.1,
    MAX_ELEMENT_SIZE: 500,

    // Storage
    STORAGE_KEY: 'landPlanner_projects',
    STORAGE_CURRENT_PROJECT: 'landPlanner_currentProject',

    // Element Types
    ELEMENT_TYPES: {
        HOUSE: 'house',
        GARAGE: 'garage',
        GARDEN: 'garden',
        TREE: 'tree',
        FLOWER: 'flower',
        POND: 'pond',
        PATH: 'path',
        DRIVEWAY: 'driveway',
        FENCE: 'fence',
        BENCH: 'bench',
        LIGHT: 'light',
        BLUEBERRY: 'blueberry',
        CURRANT: 'currant',
        FRUIT_TREE: 'fruit_tree',
        CROP: 'crop',
        PORCH: 'porch',
        WELL: 'well',
        BARBECUE: 'barbecue',
        FLOWER_BED: 'flower_bed',
        SWING: 'swing',
        SHED: 'shed',
        COMPOST: 'compost',
        // Nowe
        GAZEBO: 'gazebo',
        GREENHOUSE: 'greenhouse',
        POOL: 'pool',
        JACUZZI: 'jacuzzi',
        CARPORT: 'carport',
        SEPTIC: 'septic',
        RAINWATER_TANK: 'rainwater_tank',
        SOLAR_PANEL: 'solar_panel',
        HEDGE: 'hedge',
        LAWN: 'lawn',
        TEXT_LABEL: 'text_label',
        HEAT_PUMP: 'heat_pump',
        FIREPLACE: 'fireplace',
        PLAYGROUND: 'playground',
        LAND_PLOT: 'land_plot', // Działka z geoportalu
    },

    // Element categories for area calculations
    BUILDING_TYPES: ['house', 'garage', 'shed', 'porch', 'gazebo', 'greenhouse', 'carport'],
    GREEN_TYPES: ['garden', 'tree', 'fruit_tree', 'flower', 'flower_bed', 'crop', 'blueberry', 'currant', 'hedge', 'lawn'],
    HARDSCAPE_TYPES: ['path', 'driveway', 'pond', 'pool', 'jacuzzi'],
    INFRASTRUCTURE_TYPES: ['septic', 'rainwater_tank', 'solar_panel', 'heat_pump', 'well', 'light', 'compost'],

    // Element Defaults
    ELEMENT_DEFAULTS: {
        house: { width: 10, height: 12, color: '#ef4444', icon: '🏠' },
        garage: { width: 6, height: 7, color: '#f97316', icon: '🛠️' },
        garden: { width: 8, height: 8, color: '#10b981', icon: '🌾' },
        tree: { width: 2, height: 2, color: '#059669', icon: '🌲' },
        flower: { width: 4, height: 4, color: '#ec4899', icon: '🌸' },
        pond: { width: 6, height: 6, color: '#0ea5e9', icon: '💧' },
        path: { width: 2, height: 10, color: '#78716c', icon: '🚶' },
        driveway: { width: 4, height: 15, color: '#64748b', icon: '🚗' },
        fence: { width: 0.3, height: 20, color: '#7c3aed', icon: '🔒' },
        bench: { width: 1.5, height: 1.5, color: '#a16207', icon: '🪑' },
        light: { width: 0.5, height: 0.5, color: '#fbbf24', icon: '💡' },
        blueberry: { width: 1.5, height: 1.5, color: '#4f46e5', icon: '🫐' },
        currant: { width: 1.8, height: 1.8, color: '#991b1b', icon: '🍒' },
        fruit_tree: { width: 5, height: 5, color: '#84cc16', icon: '🍎' },
        crop: { width: 10, height: 10, color: '#ca8a04', icon: '🌽' },
        porch: { width: 3, height: 4, color: '#d946ef', icon: '🏡' },
        well: { width: 1.2, height: 1.2, color: '#06b6d4', icon: '🚰' },
        barbecue: { width: 1.5, height: 1.5, color: '#dc2626', icon: '🔥' },
        flower_bed: { width: 2, height: 5, color: '#f472b6', icon: '🌹' },
        swing: { width: 2, height: 2, color: '#f59e0b', icon: '🎪' },
        shed: { width: 4, height: 5, color: '#92400e', icon: '🏚️' },
        compost: { width: 1.5, height: 2, color: '#713f12', icon: '📦' },
        // Nowe
        gazebo: { width: 4, height: 4, color: '#7c3aed', icon: '⛺' },
        greenhouse: { width: 4, height: 8, color: '#86efac', icon: '🌿' },
        pool: { width: 5, height: 10, color: '#38bdf8', icon: '🏊' },
        jacuzzi: { width: 2, height: 2, color: '#7dd3fc', icon: '🛁' },
        carport: { width: 3, height: 6, color: '#94a3b8', icon: '🏗️' },
        septic: { width: 2, height: 3, color: '#a8a29e', icon: '⚫' },
        rainwater_tank: { width: 1.5, height: 1.5, color: '#0284c7', icon: '🪣' },
        solar_panel: { width: 2, height: 4, color: '#fcd34d', icon: '⚡' },
        hedge: { width: 1, height: 10, color: '#15803d', icon: '🌿' },
        lawn: { width: 10, height: 10, color: '#4ade80', icon: '🌱' },
        text_label: { width: 4, height: 2, color: '#e2e8f0', icon: '📝' },
        heat_pump: { width: 1, height: 1.5, color: '#818cf8', icon: '🌀' },
        fireplace: { width: 2, height: 2, color: '#f97316', icon: '🪵' },
        playground: { width: 6, height: 6, color: '#fb923c', icon: '🛝' },
        land_plot: { width: 40, height: 40, color: '#6b7280', icon: '📍' },
    },

    // History
    MAX_HISTORY_STATES: 100,

    // Element Shapes
    ELEMENT_SHAPES: {
        RECTANGLE: 'rectangle',
        CIRCLE: 'circle',
        ELLIPSE: 'ellipse',
        TRIANGLE: 'triangle',
        DIAMOND: 'diamond',
        HEXAGON: 'hexagon',
        POLYGON: 'polygon' // For custom polygons (e.g., from geoportal)
    },

    // Snap
    SNAP_THRESHOLD: 10,
    SHOW_DIMENSIONS_THRESHOLD: 5,

    // Planning thresholds (Polish law)
    MAX_BUILDING_COVERAGE: 30, // %
    MIN_BIOLOGICAL_SURFACE: 25, // %
    BUFFER_ZONE_METERS: 3, // m from boundary
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONSTANTS;
}
