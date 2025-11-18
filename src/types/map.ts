// Core map data structures for D&D Map Builder
// Clean slate - minimal types for starting fresh

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
  a?: number;
}

export interface GridConfig {
  cellSize: number;
  showGrid: boolean;
  gridColor: Color;
  snapToGrid: boolean;
  gridType: 'square' | 'hexagonal';
  displayScale?: number;
}

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
}

export interface DnDMap {
  metadata: MapMetadata;
  dimensions: Size;
  gridConfig: GridConfig;
  backgroundColor?: Color;
}

export interface MapExportData {
  formatVersion: string;
  exportedAt: Date;
  map: DnDMap;
}

export interface ViewportState {
  position: Position;
  zoom: number;
  rotation: number;
}

export interface EditorState {
  currentMap: DnDMap;
  viewportState: ViewportState;
  isDirty: boolean;
}
