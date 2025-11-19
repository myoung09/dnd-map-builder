// Type definitions for map generation

export enum TerrainType {
  House = 'House',
  Forest = 'Forest',
  Cave = 'Cave',
  Dungeon = 'Dungeon'
}

export interface Room {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Corridor {
  start: [number, number];
  end: [number, number];
}

export interface Tree {
  x: number;
  y: number;
  size?: number;
  clusterId?: number; // Optional: ID of the cluster this tree belongs to
}

export interface PathPoint {
  x: number;
  y: number;
}

export interface MapData {
  width: number;
  height: number;
  rooms?: Room[];
  corridors?: Corridor[];
  trees?: Tree[];
  paths?: PathPoint[]; // Main walkable path through the map (entrance to exit)
  branchPaths?: PathPoint[][]; // Optional branching paths (for exploration)
  entrance?: PathPoint; // Entrance point (e.g., left edge for forests)
  exit?: PathPoint; // Exit point (e.g., right edge for forests)
  grid?: number[][];
  seed?: number;
  terrainType?: TerrainType;
}

export interface GeneratorParameters {
  width: number;
  height: number;
  seed?: number;
  
  // Room/Building parameters
  minRoomSize?: number;
  maxRoomSize?: number;
  roomCount?: number;
  gridSize?: number; // Grid alignment spacing for rooms and corridors
  
  // Corridor parameters
  corridorWidth?: number;
  
  // Forest parameters
  treeDensity?: number;
  minTreeDistance?: number;
  noiseScale?: number;
  treeRadius?: number; // Radius of individual tree circles
  clusterSize?: number; // Average number of trees per cluster (default: 8)
  clusterRadius?: number; // Radius of each cluster in grid units (default: 8)
  clearingSize?: number; // Minimum width of walkable clearings (default: 6)
  numClusters?: number; // Number of tree clusters to generate (default: auto-calculated)
  
  // Cave parameters
  fillProbability?: number;
  smoothIterations?: number;
  wallThreshold?: number;
  caveRoughness?: number; // Multiplier for fillProbability (0.5-2.0). Higher = rougher caves
  
  // Dungeon parameters
  organicFactor?: number;
  connectivityFactor?: number;
  walkSteps?: number; // Random walk bias (1-10). Higher = straighter corridors. Default 7
}

export interface Preset {
  name: string;
  terrainType: TerrainType;
  parameters: GeneratorParameters;
}

export interface Point {
  x: number;
  y: number;
}

export interface Edge {
  from: number;
  to: number;
  weight: number;
}
