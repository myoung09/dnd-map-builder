import { v4 as uuidv4 } from 'uuid';
import { DnDMap, LayerType, MapLayer, MapTile, Position, TerrainType } from '../types/map';

export interface MapGenerationOptions {
  width: number;
  height: number;
  numberOfRooms: number;
  minRoomSize: number;
  maxRoomSize: number;
  corridorWidth: number;
  organicFactor: number;
}

interface SimpleRoom {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SimplePath {
  id: string;
  startRoom: string;
  endRoom: string;
  points: Position[];
}

export class MapGenerationService {
  private seed: number = Math.random();

  setSeed(seed: number) {
    this.seed = seed;
  }

  private random(): number {
    // Simple seeded random number generator
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  generateLayeredMap(options: MapGenerationOptions): DnDMap {
    // Set a random seed for reproducible generation
    this.setSeed(Math.random() * 1000000);

    // Generate simple rooms first
    const rooms = this.generateSimpleRooms(options);
    
    // Generate simple paths between rooms
    const paths = this.generateSimplePaths(rooms, options);
    
    // Create the main terrain layer
    const terrainLayer = this.createSimpleTerrainLayer(rooms, paths, options);

    // Create background layer (just empty for now)
    const backgroundLayer: MapLayer = {
      id: uuidv4(),
      name: 'Background',
      type: LayerType.BACKGROUND,
      tiles: [],
      isVisible: true,
      isLocked: false,
      opacity: 1
    };

    // Create objects layer (empty for now)
    const objectsLayer: MapLayer = {
      id: uuidv4(),
      name: 'Objects',
      type: LayerType.OBJECTS,
      tiles: [],
      isVisible: true,
      isLocked: false,
      opacity: 1
    };

    const mapId = uuidv4();

    return {
      metadata: {
        id: mapId,
        name: 'Generated Dungeon',
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '1.0'
      },
      dimensions: {
        width: options.width,
        height: options.height
      },
      gridConfig: {
        cellSize: 32,
        showGrid: true,
        gridColor: { r: 200, g: 200, b: 200, a: 0.5 },
        snapToGrid: true,
        gridType: 'square'
      },
      layers: [backgroundLayer, terrainLayer, objectsLayer],
      backgroundColor: { r: 50, g: 50, b: 50 }
    };
  }

  // Generate simple rectangular rooms
  private generateSimpleRooms(options: MapGenerationOptions): SimpleRoom[] {
    const rooms: SimpleRoom[] = [];
    const { width, height, numberOfRooms, minRoomSize, maxRoomSize } = options;

    for (let i = 0; i < numberOfRooms; i++) {
      const roomWidth = minRoomSize + Math.floor(this.random() * (maxRoomSize - minRoomSize));
      const roomHeight = minRoomSize + Math.floor(this.random() * (maxRoomSize - minRoomSize));
      
      let attempts = 0;
      let validPlacement = false;
      
      while (!validPlacement && attempts < 50) {
        const x = 2 + Math.floor(this.random() * (width - roomWidth - 4));
        const y = 2 + Math.floor(this.random() * (height - roomHeight - 4));
        
        const newRoom: SimpleRoom = {
          id: uuidv4(),
          x,
          y,
          width: roomWidth,
          height: roomHeight
        };
        
        // Check if this room overlaps with existing rooms
        const overlaps = rooms.some(existingRoom => 
          this.roomsOverlap(newRoom, existingRoom)
        );
        
        if (!overlaps) {
          rooms.push(newRoom);
          validPlacement = true;
        }
        
        attempts++;
      }
    }

    return rooms;
  }

  // Check if two simple rooms overlap (with buffer)
  private roomsOverlap(roomA: SimpleRoom, roomB: SimpleRoom): boolean {
    const buffer = 2; // Minimum space between rooms
    
    return !(roomA.x + roomA.width + buffer < roomB.x ||
             roomB.x + roomB.width + buffer < roomA.x ||
             roomA.y + roomA.height + buffer < roomB.y ||
             roomB.y + roomB.height + buffer < roomA.y);
  }

  // Generate simple straight paths between rooms
  private generateSimplePaths(rooms: SimpleRoom[], options: MapGenerationOptions): SimplePath[] {
    const paths: SimplePath[] = [];
    
    if (rooms.length < 2) return paths;
    
    // Connect each room to the next one in a chain
    for (let i = 0; i < rooms.length - 1; i++) {
      const roomA = rooms[i];
      const roomB = rooms[i + 1];
      
      // Create a simple L-shaped path between room centers
      const path: SimplePath = {
        id: uuidv4(),
        startRoom: roomA.id,
        endRoom: roomB.id,
        points: this.createLShapedPath(roomA, roomB)
      };
      
      paths.push(path);
    }
    
    // Connect last room back to first to create a circuit
    if (rooms.length > 2) {
      const firstRoom = rooms[0];
      const lastRoom = rooms[rooms.length - 1];
      
      const path: SimplePath = {
        id: uuidv4(),
        startRoom: lastRoom.id,
        endRoom: firstRoom.id,
        points: this.createLShapedPath(lastRoom, firstRoom)
      };
      
      paths.push(path);
    }
    
    return paths;
  }

  // Create a simple L-shaped path between two rooms
  private createLShapedPath(roomA: SimpleRoom, roomB: SimpleRoom): Position[] {
    const points: Position[] = [];
    
    const startX = Math.floor(roomA.x + roomA.width / 2);
    const startY = Math.floor(roomA.y + roomA.height / 2);
    const endX = Math.floor(roomB.x + roomB.width / 2);
    const endY = Math.floor(roomB.y + roomB.height / 2);
    
    // Start from room A center
    points.push({ x: startX, y: startY });
    
    // Go horizontal first, then vertical (L-shaped)
    if (startX !== endX) {
      // Horizontal segment
      const stepX = startX < endX ? 1 : -1;
      for (let x = startX + stepX; x !== endX; x += stepX) {
        points.push({ x, y: startY });
      }
    }
    
    // Then vertical segment
    if (startY !== endY) {
      const stepY = startY < endY ? 1 : -1;
      for (let y = startY + stepY; y !== endY; y += stepY) {
        points.push({ x: endX, y });
      }
    }
    
    // End at room B center
    points.push({ x: endX, y: endY });
    
    return points;
  }

  // Create a simple terrain layer with walls, floors, and paths
  private createSimpleTerrainLayer(rooms: SimpleRoom[], paths: SimplePath[], options: MapGenerationOptions): MapLayer {
    const tiles: MapTile[] = [];
    const { width, height } = options;
    
    // Start with all walls
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
    
    // Carve out room floors
    for (const room of rooms) {
      for (let x = room.x; x < room.x + room.width; x++) {
        for (let y = room.y; y < room.y + room.height; y++) {
          const tileIndex = y * width + x;
          if (tileIndex < tiles.length) {
            tiles[tileIndex].terrainType = TerrainType.FLOOR;
          }
        }
      }
    }
    
    // Carve out path floors
    for (const path of paths) {
      for (const point of path.points) {
        const tileIndex = point.y * width + point.x;
        if (tileIndex < tiles.length) {
          tiles[tileIndex].terrainType = TerrainType.FLOOR;
        }
      }
    }
    
    return {
      id: uuidv4(),
      name: 'Terrain',
      type: LayerType.TERRAIN,
      tiles,
      isVisible: true,
      isLocked: false,
      opacity: 1
    };
  }
}

export const mapGenerationService = new MapGenerationService();