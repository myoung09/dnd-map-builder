// Application constants for D&D Map Builder

// Version information
export const APP_VERSION = '1.0.0';
export const MAP_FORMAT_VERSION = '1.0.0';

// Default map settings
export const DEFAULT_MAP_DIMENSIONS = {
  width: 50,
  height: 50
};

export const DEFAULT_GRID_SIZE = 32; // pixels per grid cell
export const MIN_GRID_SIZE = 8;
export const MAX_GRID_SIZE = 128;

// Canvas settings
export const DEFAULT_ZOOM = 1.0;
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 10.0;
export const ZOOM_STEP = 0.1;

// Tool settings
export const DEFAULT_BRUSH_SIZE = 1;
export const MIN_BRUSH_SIZE = 1;
export const MAX_BRUSH_SIZE = 20;

// File format settings
export const SUPPORTED_IMAGE_FORMATS = ['png', 'jpeg', 'jpg', 'webp'];
export const SUPPORTED_MAP_FORMATS = ['json'];
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// Local storage keys
export const STORAGE_KEYS = {
  MAPS: 'dnd_maps',
  SETTINGS: 'dnd_settings',
  RECENT_FILES: 'dnd_recent_files',
  USER_PREFERENCES: 'dnd_user_preferences'
} as const;

// AI Generation settings
export const AI_GENERATION = {
  MAX_PROMPT_LENGTH: 500,
  TIMEOUT_MS: 30000,
  MAX_RETRIES: 3,
  DEFAULT_PARAMETERS: {
    temperature: 0.7,
    maxTokens: 1000
  }
} as const;

// Asset library settings
export const ASSET_LIBRARY = {
  SUPPORTED_FORMATS: ['png', 'jpg', 'jpeg', 'svg', 'webp'],
  MAX_ASSET_SIZE: 5 * 1024 * 1024, // 5MB per asset
  THUMBNAIL_SIZE: 64, // pixels
  CATEGORIES: [
    'walls',
    'floors',
    'doors',
    'furniture',
    'decorations',
    'creatures',
    'treasures',
    'hazards',
    'nature',
    'structures'
  ]
} as const;

// Export settings
export const EXPORT_SETTINGS = {
  DEFAULT_DPI: 150,
  MAX_DPI: 600,
  DEFAULT_FORMAT: 'png',
  QUALITY: {
    LOW: 0.6,
    MEDIUM: 0.8,
    HIGH: 1.0
  }
} as const;

// UI layout constants
export const UI_LAYOUT = {
  TOOLBAR_WIDTH: 80,
  SIDEBAR_WIDTH: 300,
  HEADER_HEIGHT: 60,
  STATUS_BAR_HEIGHT: 30,
  PANEL_BORDER_RADIUS: 8,
  ANIMATION_DURATION: 200 // ms
} as const;

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  NEW_MAP: 'Ctrl+N',
  OPEN_MAP: 'Ctrl+O',
  SAVE_MAP: 'Ctrl+S',
  SAVE_AS: 'Ctrl+Shift+S',
  EXPORT_IMAGE: 'Ctrl+E',
  UNDO: 'Ctrl+Z',
  REDO: 'Ctrl+Y',
  COPY: 'Ctrl+C',
  PASTE: 'Ctrl+V',
  DELETE: 'Delete',
  SELECT_ALL: 'Ctrl+A',
  ZOOM_IN: 'Ctrl+=',
  ZOOM_OUT: 'Ctrl+-',
  ZOOM_FIT: 'Ctrl+0',
  TOGGLE_GRID: 'G',
  TOGGLE_SNAP: 'S'
} as const;

// Tool icons (Material-UI icon names)
export const TOOL_ICONS = {
  select: 'CropFree',
  brush: 'Brush',
  eraser: 'Clear',
  rectangle: 'CropSquare',
  circle: 'RadioButtonUnchecked',
  line: 'Timeline',
  text: 'TextFields',
  object_place: 'AddBox',
  eyedropper: 'Colorize',
  zoom: 'ZoomIn',
  pan: 'PanTool'
} as const;

// Color palettes for quick selection
export const COLOR_PALETTES = {
  BASIC: [
    { r: 0, g: 0, b: 0 },       // Black
    { r: 255, g: 255, b: 255 }, // White
    { r: 255, g: 0, b: 0 },     // Red
    { r: 0, g: 255, b: 0 },     // Green
    { r: 0, g: 0, b: 255 },     // Blue
    { r: 255, g: 255, b: 0 },   // Yellow
    { r: 255, g: 0, b: 255 },   // Magenta
    { r: 0, g: 255, b: 255 }    // Cyan
  ],
  DUNGEON: [
    { r: 64, g: 64, b: 64 },    // Wall gray
    { r: 139, g: 126, b: 102 }, // Floor brown
    { r: 101, g: 67, b: 33 },   // Door brown
    { r: 25, g: 25, b: 25 },    // Deep shadow
    { r: 160, g: 82, b: 45 },   // Wood
    { r: 192, g: 192, b: 192 }, // Stone
    { r: 255, g: 215, b: 0 },   // Gold
    { r: 220, g: 20, b: 60 }    // Crimson
  ],
  NATURE: [
    { r: 34, g: 139, b: 34 },   // Forest green
    { r: 107, g: 142, b: 35 },  // Olive
    { r: 139, g: 90, b: 43 },   // Saddle brown
    { r: 65, g: 105, b: 225 },  // Royal blue
    { r: 238, g: 203, b: 173 }, // Navajo white
    { r: 46, g: 125, b: 50 },   // Sea green
    { r: 121, g: 85, b: 72 },   // Brown
    { r: 33, g: 150, b: 243 }   // Light blue
  ]
} as const;

// Layer configuration
export const DEFAULT_LAYER_OPACITY = 1.0;
export const MIN_LAYER_OPACITY = 0.0;
export const MAX_LAYER_OPACITY = 1.0;

// Performance settings
export const PERFORMANCE = {
  MAX_VISIBLE_OBJECTS: 10000,
  RENDER_CHUNK_SIZE: 100,
  DEBOUNCE_DELAY: 100, // ms for input debouncing
  AUTO_SAVE_INTERVAL: 30000 // 30 seconds
} as const;

// Error messages
export const ERROR_MESSAGES = {
  INVALID_FILE_FORMAT: 'Invalid file format. Please select a supported file type.',
  FILE_TOO_LARGE: 'File is too large. Maximum size allowed is',
  NETWORK_ERROR: 'Network error occurred. Please check your connection and try again.',
  AI_GENERATION_FAILED: 'AI generation failed. Please try again with a different prompt.',
  SAVE_FAILED: 'Failed to save the map. Please try again.',
  LOAD_FAILED: 'Failed to load the map. The file may be corrupted.',
  EXPORT_FAILED: 'Failed to export the map. Please try again.',
  INVALID_MAP_DATA: 'Invalid map data detected. Some features may not work correctly.'
} as const;