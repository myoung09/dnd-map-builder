import { DnDMap, MapTile, TerrainType, Position, MapLayer, Size, LayerType } from '../types/map';
import { v4 as uuidv4 } from 'uuid';

export interface Room {
  id: string;
  center: Position;
  size: Size;
  shape: Position[]; // Organic shape points
  entrances: Position[]; // Connection points to corridors
}

export interface Corridor {
  id: string;
  path: Position[]; // Curved path points
  width: number;
  connections: string[]; // Connected room IDs
}

export interface MapGenerationOptions {
  width: number;
  height: number;
  numberOfRooms: number;
  minRoomSize: number;
  maxRoomSize: number;
  corridorWidth: number;
  organicFactor: number; // 0-1, how organic vs rectangular
  environmentType: 'dungeon' | 'forest' | 'tavern';
}

export interface EdgeMap {
  edges: Set<string>; // Set of "x,y" position strings for edge tiles
  interior: Set<string>; // Set of "x,y" position strings for interior tiles
}

export class MapGenerationService {
  private random: () => number;
  private seed: number;

  constructor(seed?: number) {
    this.seed = seed || Math.floor(Math.random() * 1000000);
    this.random = this.seededRandom(this.seed);
  }

  // Seeded random number generator for consistent results
  private seededRandom(seed: number): () => number {
    let current = seed;
    return () => {
      current = (current * 9301 + 49297) % 233280;
      return current / 233280;
    };
  }

  // Generate a complete layered map
  generateLayeredMap(options: MapGenerationOptions): DnDMap {
    const { width, height } = options;
    
    // Step 1: Create base map structure
    const map: DnDMap = {
      dimensions: { width, height },
      layers: [],
      metadata: {
        id: uuidv4(),
        name: `Generated ${options.environmentType} Map`,
        version: '1.0',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [options.environmentType, 'generated', 'layered']
      },
      gridConfig: {
        cellSize: 32,
        showGrid: true,
        gridColor: { r: 51, g: 51, b: 51 },
        snapToGrid: true,
        gridType: 'square'
      }
    };

    // Step 2: Generate rooms and corridors
    const rooms = this.generateRooms(options);
    const corridors = this.generateCorridors(rooms, options);

    // Step 3: Create map entrances and exits
    const mapEntrances = this.createMapEntrances(corridors, options);
    
    // Step 4: Generate edge maps for rooms and corridors
    const roomEdges = this.generateRoomEdges(rooms, options);
    const corridorEdges = this.generateCorridorEdges(corridors, options);
    
    // Step 5: Create layers using edge-based approach
    const backgroundLayer = this.createBackgroundLayer(options);
    const edgesLayer = this.createEdgesLayer(roomEdges, corridorEdges, options);
    const interiorLayer = this.createInteriorLayer(rooms, corridors, roomEdges, corridorEdges, options);
    const entrancesLayer = this.createEntrancesLayer(rooms, corridors, mapEntrances, options);

    map.layers = [backgroundLayer, edgesLayer, interiorLayer, entrancesLayer];

    return map;
  }

  // Generate organic room shapes and positions
  private generateRooms(options: MapGenerationOptions): Room[] {
    const rooms: Room[] = [];
    const { width, height, numberOfRooms, minRoomSize, maxRoomSize, organicFactor } = options;
    const attempts = numberOfRooms * 10; // Try multiple times to avoid overlaps

    for (let i = 0; i < attempts && rooms.length < numberOfRooms; i++) {
      const roomWidth = Math.floor(minRoomSize + this.random() * (maxRoomSize - minRoomSize));
      const roomHeight = Math.floor(minRoomSize + this.random() * (maxRoomSize - minRoomSize));
      
      const center: Position = {
        x: Math.floor(roomWidth / 2 + this.random() * (width - roomWidth)),
        y: Math.floor(roomHeight / 2 + this.random() * (height - roomHeight))
      };

      // Create organic room shape
      const shape = this.generateOrganicRoomShape(center, { width: roomWidth, height: roomHeight }, organicFactor);
      
      // Check for overlaps with existing rooms
      if (!this.roomsOverlap(shape, rooms)) {
        const room: Room = {
          id: uuidv4(),
          center,
          size: { width: roomWidth, height: roomHeight },
          shape,
          entrances: [] // Will be filled when generating corridors
        };
        rooms.push(room);
      }
    }

    return rooms;
  }

  // Generate organic room shape using organic curves
  private generateOrganicRoomShape(center: Position, size: Size, organicFactor: number): Position[] {
    const points: Position[] = [];
    const numPoints = 8; // Number of points around the perimeter
    const variance = Math.min(size.width, size.height) * 0.3 * organicFactor;

    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * 2 * Math.PI;
      const baseRadius = Math.min(size.width, size.height) / 2;
      
      // Add organic variation
      const radiusVariation = (this.random() - 0.5) * variance;
      const radius = Math.max(baseRadius * 0.5, baseRadius + radiusVariation);
      
      const x = Math.round(center.x + Math.cos(angle) * radius);
      const y = Math.round(center.y + Math.sin(angle) * radius);
      
      points.push({ x, y });
    }

    return points;
  }

  // Check if room shapes overlap
  private roomsOverlap(newShape: Position[], existingRooms: Room[]): boolean {
    const buffer = 3; // Minimum distance between rooms
    
    for (const room of existingRooms) {
      for (const newPoint of newShape) {
        for (const existingPoint of room.shape) {
          const distance = Math.sqrt(
            Math.pow(newPoint.x - existingPoint.x, 2) + 
            Math.pow(newPoint.y - existingPoint.y, 2)
          );
          if (distance < buffer) {
            return true;
          }
        }
      }
    }
    return false;
  }

  // Generate organic corridors connecting all rooms
  private generateCorridors(rooms: Room[], options: MapGenerationOptions): Corridor[] {
    const corridors: Corridor[] = [];
    
    if (rooms.length < 2) return corridors;

    // Create minimum spanning tree to connect all rooms
    const connections = this.generateMinimumSpanningTree(rooms);
    
    // Generate curved paths between connected rooms
    for (const connection of connections) {
      const corridor = this.generateCurvedCorridor(
        connection.roomA, 
        connection.roomB, 
        options.corridorWidth,
        options.organicFactor
      );
      corridors.push(corridor);
      
      // Add entrance points to rooms
      connection.roomA.entrances.push(corridor.path[0]);
      connection.roomB.entrances.push(corridor.path[corridor.path.length - 1]);
    }

    return corridors;
  }

  // Generate minimum spanning tree for room connections
  private generateMinimumSpanningTree(rooms: Room[]): Array<{roomA: Room, roomB: Room, distance: number}> {
    const connections: Array<{roomA: Room, roomB: Room, distance: number}> = [];
    const visited = new Set<string>();
    
    if (rooms.length === 0) return connections;
    
    // Start with first room
    visited.add(rooms[0].id);
    
    while (visited.size < rooms.length) {
      let shortestConnection: {roomA: Room, roomB: Room, distance: number} | null = null;
      
      // Find shortest connection from visited to unvisited room
      for (const visitedRoom of rooms.filter(r => visited.has(r.id))) {
        for (const unvisitedRoom of rooms.filter(r => !visited.has(r.id))) {
          const distance = Math.sqrt(
            Math.pow(visitedRoom.center.x - unvisitedRoom.center.x, 2) +
            Math.pow(visitedRoom.center.y - unvisitedRoom.center.y, 2)
          );
          
          if (!shortestConnection || distance < shortestConnection.distance) {
            shortestConnection = { roomA: visitedRoom, roomB: unvisitedRoom, distance };
          }
        }
      }
      
      if (shortestConnection) {
        connections.push(shortestConnection);
        visited.add(shortestConnection.roomB.id);
      }
    }
    
    return connections;
  }

  // Generate curved corridor between two rooms
  private generateCurvedCorridor(roomA: Room, roomB: Room, width: number, organicFactor: number): Corridor {
    const startPoint = this.findNearestPointOnRoom(roomA, roomB.center);
    const endPoint = this.findNearestPointOnRoom(roomB, roomA.center);
    
    // Create curved path using bezier curve approximation
    const path = this.generateCurvedPath(startPoint, endPoint, organicFactor);
    
    return {
      id: uuidv4(),
      path,
      width,
      connections: [roomA.id, roomB.id]
    };
  }

  // Find nearest point on room perimeter to target
  private findNearestPointOnRoom(room: Room, target: Position): Position {
    let nearestPoint = room.shape[0];
    let nearestDistance = Infinity;
    
    for (const point of room.shape) {
      const distance = Math.sqrt(
        Math.pow(point.x - target.x, 2) + Math.pow(point.y - target.y, 2)
      );
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestPoint = point;
      }
    }
    
    return nearestPoint;
  }

  // Generate curved path between two points
  private generateCurvedPath(start: Position, end: Position, organicFactor: number): Position[] {
    const path: Position[] = [];
    const steps = Math.max(10, Math.floor(Math.sqrt(
      Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
    ) / 2));
    
    // Create control points for curve
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    
    // Add organic curve variation
    const perpX = -(end.y - start.y);
    const perpY = (end.x - start.x);
    const length = Math.sqrt(perpX * perpX + perpY * perpY);
    const normalizedPerpX = length > 0 ? perpX / length : 0;
    const normalizedPerpY = length > 0 ? perpY / length : 0;
    
    const curvature = (this.random() - 0.5) * 50 * organicFactor;
    const controlX = midX + normalizedPerpX * curvature;
    const controlY = midY + normalizedPerpY * curvature;
    
    // Generate path points along quadratic bezier curve
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = Math.round((1 - t) * (1 - t) * start.x + 2 * (1 - t) * t * controlX + t * t * end.x);
      const y = Math.round((1 - t) * (1 - t) * start.y + 2 * (1 - t) * t * controlY + t * t * end.y);
      path.push({ x, y });
    }
    
    return path;
  }

  // Create edges layer (walls around rooms and corridors)
  private createEdgesLayer(roomEdges: EdgeMap, corridorEdges: EdgeMap, options: MapGenerationOptions): MapLayer {
    const tiles: MapTile[] = [];
    
    // Add room edge walls
    const roomEdgesArray = Array.from(roomEdges.edges);
    for (const edgeKey of roomEdgesArray) {
      const [x, y] = edgeKey.split(',').map(Number);
      if (x >= 0 && x < options.width && y >= 0 && y < options.height) {
        tiles.push({
          id: uuidv4(),
          position: { x, y },
          terrainType: TerrainType.WALL,
          isVisible: true,
          isExplored: false
        });
      }
    }
    
    // Add corridor edge walls
    const corridorEdgesArray = Array.from(corridorEdges.edges);
    for (const edgeKey of corridorEdgesArray) {
      const [x, y] = edgeKey.split(',').map(Number);
      if (x >= 0 && x < options.width && y >= 0 && y < options.height) {
        tiles.push({
          id: uuidv4(),
          position: { x, y },
          terrainType: TerrainType.WALL,
          isVisible: true,
          isExplored: false
        });
      }
    }
    
    return {
      id: uuidv4(),
      name: 'Edges',
      type: LayerType.TERRAIN,
      tiles,
      isVisible: true,
      isLocked: false,
      opacity: 1
    };
  }

  // Create interior layer (floors inside rooms and corridors)
  private createInteriorLayer(rooms: Room[], corridors: Corridor[], roomEdges: EdgeMap, corridorEdges: EdgeMap, options: MapGenerationOptions): MapLayer {
    const tiles: MapTile[] = [];
    
    // Add room interior floors
    const roomInteriorsArray = Array.from(roomEdges.interior);
    for (const interiorKey of roomInteriorsArray) {
      const [x, y] = interiorKey.split(',').map(Number);
      if (x >= 0 && x < options.width && y >= 0 && y < options.height) {
        tiles.push({
          id: uuidv4(),
          position: { x, y },
          terrainType: TerrainType.FLOOR,
          isVisible: true,
          isExplored: false
        });
      }
    }
    
    // Add corridor interior floors
    const corridorInteriorsArray = Array.from(corridorEdges.interior);
    for (const interiorKey of corridorInteriorsArray) {
      const [x, y] = interiorKey.split(',').map(Number);
      if (x >= 0 && x < options.width && y >= 0 && y < options.height) {
        tiles.push({
          id: uuidv4(),
          position: { x, y },
          terrainType: TerrainType.FLOOR,
          isVisible: true,
          isExplored: false
        });
      }
    }
    
    return {
      id: uuidv4(),
      name: 'Interiors',
      type: LayerType.TERRAIN,
      tiles,
      isVisible: true,
      isLocked: false,
      opacity: 1
    };
  }

  // Create background layer (unwalkable areas)
  private createBackgroundLayer(options: MapGenerationOptions): MapLayer {
    const tiles: MapTile[] = [];
    const { width, height } = options;
    
    // Fill entire map with walls/impassable terrain
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        tiles.push({
          id: uuidv4(),
          position: { x, y },
          terrainType: TerrainType.WALL,
          isVisible: true,
          isExplored: false
        });
      }
    }
    
    return {
      id: uuidv4(),
      name: 'Background',
      type: LayerType.BACKGROUND,
      tiles,
      isVisible: true,
      isLocked: false,
      opacity: 1
    };
  }



  // Check if point is inside room using ray casting
  private isPointInRoom(room: Room, point: Position): boolean {
    const { shape } = room;
    let inside = false;
    
    for (let i = 0, j = shape.length - 1; i < shape.length; j = i++) {
      if (((shape[i].y > point.y) !== (shape[j].y > point.y)) &&
          (point.x < (shape[j].x - shape[i].x) * (point.y - shape[i].y) / (shape[j].y - shape[i].y) + shape[i].x)) {
        inside = !inside;
      }
    }
    
    return inside;
  }

  // Generate room edges and interiors
  private generateRoomEdges(rooms: Room[], options: MapGenerationOptions): EdgeMap {
    const edges = new Set<string>();
    const interior = new Set<string>();
    
    for (const room of rooms) {
      // Get all points inside the room
      const roomPoints = this.getRoomPoints(room, options);
      
      // Determine which points are edges (adjacent to non-room tiles)
      const roomPointsArray = Array.from(roomPoints);
      for (const point of roomPointsArray) {
        const isEdge = this.isPointOnRoomEdge(point, roomPoints);
        const key = `${point.x},${point.y}`;
        
        if (isEdge) {
          edges.add(key);
        } else {
          interior.add(key);
        }
      }
    }
    
    return { edges, interior };
  }

  // Generate corridor edges and interiors
  private generateCorridorEdges(corridors: Corridor[], options: MapGenerationOptions): EdgeMap {
    const edges = new Set<string>();
    const interior = new Set<string>();
    
    for (const corridor of corridors) {
      // Get all points that make up the corridor
      const corridorPoints = this.getCorridorPoints(corridor, options);
      
      // Determine which points are edges (adjacent to non-corridor tiles)
      const corridorPointsArray = Array.from(corridorPoints);
      for (const point of corridorPointsArray) {
        const isEdge = this.isPointOnCorridorEdge(point, corridorPoints);
        const key = `${point.x},${point.y}`;
        
        if (isEdge) {
          edges.add(key);
        } else {
          interior.add(key);
        }
      }
    }
    
    return { edges, interior };
  }

  // Get all points that belong to a room
  private getRoomPoints(room: Room, options: MapGenerationOptions): Set<Position> {
    const points = new Set<Position>();
    
    // Use bounding box and point-in-polygon test
    const minX = Math.max(0, Math.min(...room.shape.map(p => p.x)));
    const maxX = Math.min(options.width - 1, Math.max(...room.shape.map(p => p.x)));
    const minY = Math.max(0, Math.min(...room.shape.map(p => p.y)));
    const maxY = Math.min(options.height - 1, Math.max(...room.shape.map(p => p.y)));
    
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        if (this.isPointInRoom(room, { x, y })) {
          points.add({ x, y });
        }
      }
    }
    
    return points;
  }

  // Get all points that belong to a corridor
  private getCorridorPoints(corridor: Corridor, options: MapGenerationOptions): Set<Position> {
    const points = new Set<Position>();
    
    for (const pathPoint of corridor.path) {
      // Add corridor width around each path point
      const halfWidth = Math.floor(corridor.width / 2);
      
      for (let dx = -halfWidth; dx <= halfWidth; dx++) {
        for (let dy = -halfWidth; dy <= halfWidth; dy++) {
          const x = pathPoint.x + dx;
          const y = pathPoint.y + dy;
          
          if (x >= 0 && x < options.width && y >= 0 && y < options.height) {
            points.add({ x, y });
          }
        }
      }
    }
    
    return points;
  }

  // Check if a point is on the edge of a room (has non-room neighbors)
  private isPointOnRoomEdge(point: Position, roomPoints: Set<Position>): boolean {
    const neighbors = [
      { x: point.x - 1, y: point.y },
      { x: point.x + 1, y: point.y },
      { x: point.x, y: point.y - 1 },
      { x: point.x, y: point.y + 1 }
    ];
    
    for (const neighbor of neighbors) {
      if (!this.setContainsPosition(roomPoints, neighbor)) {
        return true; // Has a neighbor that's not in the room
      }
    }
    
    return false;
  }

  // Check if a point is on the edge of a corridor
  private isPointOnCorridorEdge(point: Position, corridorPoints: Set<Position>): boolean {
    const neighbors = [
      { x: point.x - 1, y: point.y },
      { x: point.x + 1, y: point.y },
      { x: point.x, y: point.y - 1 },
      { x: point.x, y: point.y + 1 }
    ];
    
    for (const neighbor of neighbors) {
      if (!this.setContainsPosition(corridorPoints, neighbor)) {
        return true; // Has a neighbor that's not in the corridor
      }
    }
    
    return false;
  }

  // Helper to check if set contains position
  private setContainsPosition(positions: Set<Position>, target: Position): boolean {
    const positionsArray = Array.from(positions);
    for (const pos of positionsArray) {
      if (pos.x === target.x && pos.y === target.y) {
        return true;
      }
    }
    return false;
  }

  // Create map entrances and exits
  private createMapEntrances(corridors: Corridor[], options: MapGenerationOptions): Position[] {
    const entrances: Position[] = [];
    
    if (corridors.length === 0) return entrances;
    
    // Find corridors that are closest to map edges for entrances/exits
    let topEntrance: { corridor: Corridor, point: Position, distance: number } | null = null;
    let bottomEntrance: { corridor: Corridor, point: Position, distance: number } | null = null;
    
    for (const corridor of corridors) {
      for (const point of corridor.path) {
        // Check distance to top edge
        const topDistance = point.y;
        if (!topEntrance || topDistance < topEntrance.distance) {
          topEntrance = { corridor, point, distance: topDistance };
        }
        
        // Check distance to bottom edge
        const bottomDistance = options.height - point.y;
        if (!bottomEntrance || bottomDistance < bottomEntrance.distance) {
          bottomEntrance = { corridor, point, distance: bottomDistance };
        }
      }
    }
    
    // Add entrance at top
    if (topEntrance && topEntrance.point.y > 2) {
      entrances.push({ x: topEntrance.point.x, y: 0 });
      // Create path from edge to corridor
      for (let y = 0; y <= topEntrance.point.y; y++) {
        entrances.push({ x: topEntrance.point.x, y });
      }
    }
    
    // Add exit at bottom
    if (bottomEntrance && bottomEntrance.point.y < options.height - 3) {
      entrances.push({ x: bottomEntrance.point.x, y: options.height - 1 });
      // Create path from corridor to edge
      for (let y = bottomEntrance.point.y; y < options.height; y++) {
        entrances.push({ x: bottomEntrance.point.x, y });
      }
    }
    
    return entrances;
  }

  // Create entrances layer (doors connecting rooms to corridors and map entrances/exits)
  private createEntrancesLayer(rooms: Room[], corridors: Corridor[], mapEntrances: Position[], options: MapGenerationOptions): MapLayer {
    const tiles: MapTile[] = [];
    
    // Add room entrances (doors)
    for (const room of rooms) {
      for (const entrance of room.entrances) {
        if (entrance.x >= 0 && entrance.x < options.width && 
            entrance.y >= 0 && entrance.y < options.height) {
          tiles.push({
            id: uuidv4(),
            position: entrance,
            terrainType: TerrainType.DOOR,
            isVisible: true,
            isExplored: false
          });
        }
      }
    }
    
    // Add map entrances/exits (floor tiles creating paths to edges)
    for (const entrance of mapEntrances) {
      if (entrance.x >= 0 && entrance.x < options.width && 
          entrance.y >= 0 && entrance.y < options.height) {
        tiles.push({
          id: uuidv4(),
          position: entrance,
          terrainType: TerrainType.FLOOR,
          isVisible: true,
          isExplored: false
        });
      }
    }
    
    return {
      id: uuidv4(),
      name: 'Entrances',
      type: LayerType.TERRAIN,
      tiles,
      isVisible: true,
      isLocked: false,
      opacity: 1
    };
  }
}

export const mapGenerationService = new MapGenerationService();