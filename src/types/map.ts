// Core map data structures for D&D Map Builder

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Color {
  r: number;
  g: number;
  b: number;
  a?: number; // alpha for transparency
}

// Terrain types for D&D maps
export enum TerrainType {
  WALL = 'wall',
  FLOOR = 'floor',
  DOOR = 'door',
  WATER = 'water',
  GRASS = 'grass',
  STONE = 'stone',
  DIRT = 'dirt',
  SAND = 'sand',
  LAVA = 'lava',
  ICE = 'ice',
  WOOD = 'wood',
  METAL = 'metal',
  TRAP = 'trap',
  DIFFICULT_TERRAIN = 'difficult_terrain',
  IMPASSABLE = 'impassable'
}

// Object types that can be placed on the map
export enum ObjectType {
  FURNITURE = 'furniture',
  DECORATION = 'decoration',
  INTERACTIVE = 'interactive',
  CREATURE = 'creature',
  TREASURE = 'treasure',
  HAZARD = 'hazard',
  LIGHT_SOURCE = 'light_source',
  MARKER = 'marker',
  TEXT_LABEL = 'text_label'
}

// Individual map cell/tile
export interface MapTile {
  id: string;
  position: Position;
  terrainType: TerrainType;
  color?: Color;
  textureId?: string; // Reference to texture asset
  elevation?: number; // For 3D-like effects
  isVisible?: boolean; // For fog of war
  isExplored?: boolean; // For exploration tracking
}

// Objects that can be placed on the map
export interface MapObject {
  id: string;
  type: ObjectType;
  position: Position;
  size: Size;
  name: string;
  description?: string;
  assetId?: string; // Reference to visual asset
  color?: Color;
  rotation?: number; // Degrees
  opacity?: number;
  isVisible?: boolean;
  isInteractive?: boolean;
  properties?: Record<string, any>; // Custom properties for specific object types
}

// Map layers for organizing different elements
export enum LayerType {
  BACKGROUND = 'background',
  TERRAIN = 'terrain',
  OBJECTS = 'objects',
  CREATURES = 'creatures',
  OVERLAY = 'overlay',
  UI = 'ui'
}

export interface MapLayer {
  id: string;
  name: string;
  type: LayerType;
  isVisible: boolean;
  isLocked: boolean;
  opacity: number;
  tiles?: MapTile[];
  objects?: MapObject[];
}

// Grid configuration
export interface GridConfig {
  cellSize: number; // Size of each grid cell in pixels
  showGrid: boolean;
  gridColor: Color;
  snapToGrid: boolean;
  gridType: 'square' | 'hexagonal';
}

// Map metadata
export interface MapMetadata {
  id: string;
  name: string;
  description?: string;
  author?: string;
  createdAt: Date;
  updatedAt: Date;
  version: string;
  tags?: string[];
  isPublic?: boolean;
  generationHistory?: GenerationHistoryEntry[];
}

// AI generation history tracking
export interface GenerationHistoryEntry {
  id: string;
  prompt: string;
  timestamp: Date;
  parameters?: Record<string, any>;
  resultPreview?: string; // Base64 image or description
}

// Main map data structure
export interface DnDMap {
  metadata: MapMetadata;
  dimensions: Size; // Map dimensions in grid cells
  gridConfig: GridConfig;
  layers: MapLayer[];
  backgroundColor?: Color;
  ambientLighting?: Color;
}

// Export/Import format
export interface MapExportData {
  formatVersion: string;
  exportedAt: Date;
  map: DnDMap;
  assets?: AssetReference[]; // Referenced assets for portability
}

// Asset references for portability
export interface AssetReference {
  id: string;
  name: string;
  type: 'texture' | 'sprite' | 'icon';
  url?: string;
  data?: string; // Base64 encoded asset data
  metadata?: Record<string, any>;
}

// Tool states for the map editor
export enum ToolType {
  SELECT = 'select',
  BRUSH = 'brush',
  ERASER = 'eraser',
  RECTANGLE = 'rectangle',
  CIRCLE = 'circle',
  LINE = 'line',
  TEXT = 'text',
  OBJECT_PLACE = 'object_place',
  EYEDROPPER = 'eyedropper',
  ZOOM = 'zoom',
  PAN = 'pan'
}

export interface ToolState {
  activeTool: ToolType;
  brushSize: number;
  selectedTerrainType: TerrainType;
  selectedObjectType: ObjectType;
  selectedColor: Color;
  selectedLayer: string; // Layer ID
}

// Viewport state for canvas rendering
export interface ViewportState {
  position: Position;
  zoom: number;
  rotation: number;
}

// Undo/Redo system
export interface MapAction {
  id: string;
  type: string;
  timestamp: Date;
  data: any;
  inverse?: MapAction; // For undo functionality
}

export interface EditorState {
  currentMap: DnDMap;
  toolState: ToolState;
  viewportState: ViewportState;
  selectedObjects: string[]; // Selected object IDs
  clipboard: MapObject[];
  actionHistory: MapAction[];
  actionIndex: number;
  isDirty: boolean; // Has unsaved changes
}