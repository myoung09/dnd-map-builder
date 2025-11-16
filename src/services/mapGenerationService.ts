import { v4 as uuidv4 } from 'uuid';
import { DnDMap, LayerType, MapLayer, MapObject, Position, Color, ObjectType } from '../types/map';

// Terrain types for map generation
export enum MapTerrainType {
  HOUSE = 'house',
  FOREST = 'forest', 
  CAVE = 'cave',
  TOWN = 'town',
  DUNGEON = 'dungeon'
}

export interface MapGenerationOptions {
  width: number;
  height: number;
  terrainType: MapTerrainType;
  numberOfRooms: number;
  minRoomSize: number;
  maxRoomSize: number;
  organicFactor: number; // 0.0 = geometric, 1.0 = very organic
  objectDensity: number; // 0.0 = sparse, 1.0 = dense
}

// Coordinated color themes for terrain types
interface TerrainColorTheme {
  name: string;
  backgroundColor: Color;
  pathColor: Color;
  roomAccentColor?: Color;
  contrastRatio: number;
}

interface TerrainObjectSet {
  terrain: MapTerrainType;
  commonObjects: ObjectIcon[];
  rareObjects: ObjectIcon[];
  decorativeObjects: ObjectIcon[];
}

interface ObjectIcon {
  emoji: string;
  type: ObjectType;
  probability: number;
  roomTypes?: string[];
  size: { width: number; height: number };
}

// Room/space definitions  
interface GeneratedRoom {
  id: string;
  type: string; // 'bedroom', 'clearing', 'cavern', 'building_plot'
  shape: RoomShape;
  position: Position;
  size: { width: number; height: number };
  color?: Color;
  doors?: Position[]; // Door/opening positions for path connections
}

interface RoomShape {
  type: 'rectangle' | 'circle' | 'organic' | 'polygon';
  points?: Position[]; // For organic/polygon shapes
  radius?: number; // For circles
}

export class MapGenerationService {
  private seed: number = Math.random();
  private terrainColorSets: Map<MapTerrainType, TerrainColorTheme[]> = new Map();
  private terrainObjectSets: Map<MapTerrainType, TerrainObjectSet> = new Map();

  constructor() {
    this.initializeTerrainColorSets();
    this.initializeTerrainObjectSets();
  }

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

    // Select coordinated color theme for this terrain
    const colorTheme = this.selectColorTheme(options.terrainType);
    
    // Generate rooms based on terrain type
    const rooms = this.generateRoomsByTerrain(options);
    
    // Create the layers: Background → Rooms → Paths → Objects → Grid (Grid must be last to render on top)
    const backgroundLayer = this.createBackgroundLayer(colorTheme);
    const roomLayer = this.createRoomLayer(rooms, colorTheme);
    const pathLayer = this.createPathLayer(rooms, options, colorTheme);
    const objectsLayer = this.createObjectsLayer(rooms, options);
    const gridLayer = this.createGridLayer(options);

    const mapId = uuidv4();
    const mapName = this.generateMapName(options.terrainType);

    return {
      metadata: {
        id: mapId,
        name: mapName,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '1.0',
        tags: [options.terrainType]
      },
      dimensions: {
        width: options.width,
        height: options.height
      },
      gridConfig: {
        cellSize: 32,
        showGrid: true,
        gridColor: { r: 200, g: 200, b: 200, a: 0.3 },
        snapToGrid: true,
        gridType: 'square'
      },
      layers: [backgroundLayer, roomLayer, pathLayer, objectsLayer, gridLayer],
      backgroundColor: colorTheme.backgroundColor
    };
  }

  // Initialize coordinated color themes for each terrain type
  private initializeTerrainColorSets(): void {
    // HOUSE terrain themes
    this.terrainColorSets.set(MapTerrainType.HOUSE, [
      {
        name: 'Warm Wood & Dark Halls',
        backgroundColor: { r: 222, g: 184, b: 135 }, // burlywood
        pathColor: { r: 101, g: 67, b: 33 }, // dark brown
        contrastRatio: 4.5
      },
      {
        name: 'Stone & Slate',
        backgroundColor: { r: 105, g: 105, b: 105 }, // dim gray
        pathColor: { r: 47, g: 79, b: 79 }, // dark slate gray
        contrastRatio: 3.2
      },
      {
        name: 'Rich Wood & Light Stone',
        backgroundColor: { r: 139, g: 69, b: 19 }, // saddle brown
        pathColor: { r: 119, g: 136, b: 153 }, // light slate gray
        contrastRatio: 5.1
      }
    ]);

    // FOREST terrain themes
    this.terrainColorSets.set(MapTerrainType.FOREST, [
      {
        name: 'Deep Forest & Earth Trails',
        backgroundColor: { r: 34, g: 139, b: 34 }, // forest green
        pathColor: { r: 139, g: 115, b: 85 }, // burlywood4
        contrastRatio: 3.8
      },
      {
        name: 'Olive Grove & Peru Paths',
        backgroundColor: { r: 85, g: 107, b: 47 }, // dark olive green
        pathColor: { r: 205, g: 133, b: 63 }, // peru
        contrastRatio: 4.2
      },
      {
        name: 'Meadow & Brown Trails',
        backgroundColor: { r: 107, g: 142, b: 35 }, // olive drab
        pathColor: { r: 93, g: 78, b: 55 }, // dark brown
        contrastRatio: 3.5
      }
    ]);

    // CAVE terrain themes
    this.terrainColorSets.set(MapTerrainType.CAVE, [
      {
        name: 'Dark Stone & Slate',
        backgroundColor: { r: 47, g: 47, b: 47 }, // dark gray
        pathColor: { r: 112, g: 128, b: 144 }, // slate gray
        contrastRatio: 4.1
      },
      {
        name: 'Deep Cave & Steel Blue',
        backgroundColor: { r: 28, g: 28, b: 28 }, // very dark
        pathColor: { r: 70, g: 130, b: 180 }, // steel blue
        contrastRatio: 6.2
      },
      {
        name: 'Charcoal & Light Steel',
        backgroundColor: { r: 54, g: 69, b: 79 }, // charcoal
        pathColor: { r: 176, g: 196, b: 222 }, // light steel blue
        contrastRatio: 5.8
      }
    ]);

    // TOWN terrain themes  
    this.terrainColorSets.set(MapTerrainType.TOWN, [
      {
        name: 'Green Commons & Tan Streets',
        backgroundColor: { r: 143, g: 188, b: 143 }, // dark sea green
        pathColor: { r: 210, g: 180, b: 140 }, // tan
        contrastRatio: 3.1
      },
      {
        name: 'Forest Green & Wheat Stone',
        backgroundColor: { r: 34, g: 139, b: 34 }, // forest green
        pathColor: { r: 245, g: 222, b: 179 }, // wheat
        contrastRatio: 4.9
      },
      {
        name: 'Lime Green & Sienna Brick',
        backgroundColor: { r: 50, g: 205, b: 50 }, // lime green
        pathColor: { r: 160, g: 82, b: 45 }, // sienna
        contrastRatio: 3.7
      }
    ]);

    // DUNGEON inherits from other terrain types (implemented in selectColorTheme)
  }

  // Initialize object sets for each terrain type
  private initializeTerrainObjectSets(): void {
    // HOUSE objects
    this.terrainObjectSets.set(MapTerrainType.HOUSE, {
      terrain: MapTerrainType.HOUSE,
      commonObjects: [
        { emoji: '🪑', type: ObjectType.FURNITURE, probability: 0.7, size: { width: 1, height: 1 } },
        { emoji: '🚪', type: ObjectType.INTERACTIVE, probability: 0.4, size: { width: 1, height: 1 } },
        { emoji: '🛏️', type: ObjectType.FURNITURE, probability: 0.5, roomTypes: ['bedroom'], size: { width: 2, height: 1 } }
      ],
      rareObjects: [
        { emoji: '📚', type: ObjectType.DECORATION, probability: 0.2, roomTypes: ['study', 'library'], size: { width: 1, height: 1 } },
        { emoji: '🍽️', type: ObjectType.FURNITURE, probability: 0.3, roomTypes: ['kitchen', 'dining'], size: { width: 1, height: 1 } }
      ],
      decorativeObjects: [
        { emoji: '🕯️', type: ObjectType.LIGHT_SOURCE, probability: 0.4, size: { width: 1, height: 1 } }
      ]
    });

    // FOREST objects
    this.terrainObjectSets.set(MapTerrainType.FOREST, {
      terrain: MapTerrainType.FOREST,
      commonObjects: [
        { emoji: '🌲', type: ObjectType.DECORATION, probability: 0.8, size: { width: 1, height: 1 } },
        { emoji: '🪨', type: ObjectType.DECORATION, probability: 0.6, size: { width: 1, height: 1 } },
        { emoji: '🍄', type: ObjectType.DECORATION, probability: 0.4, size: { width: 1, height: 1 } }
      ],
      rareObjects: [
        { emoji: '🦌', type: ObjectType.CREATURE, probability: 0.2, size: { width: 1, height: 1 } },
        { emoji: '🏕️', type: ObjectType.INTERACTIVE, probability: 0.1, size: { width: 2, height: 2 } }
      ],
      decorativeObjects: [
        { emoji: '🪵', type: ObjectType.DECORATION, probability: 0.3, size: { width: 1, height: 1 } }
      ]
    });

    // CAVE objects
    this.terrainObjectSets.set(MapTerrainType.CAVE, {
      terrain: MapTerrainType.CAVE,
      commonObjects: [
        { emoji: '🪨', type: ObjectType.DECORATION, probability: 0.7, size: { width: 1, height: 1 } },
        { emoji: '🔥', type: ObjectType.LIGHT_SOURCE, probability: 0.3, size: { width: 1, height: 1 } },
        { emoji: '💧', type: ObjectType.DECORATION, probability: 0.4, size: { width: 1, height: 1 } }
      ],
      rareObjects: [
        { emoji: '💎', type: ObjectType.TREASURE, probability: 0.1, size: { width: 1, height: 1 } },
        { emoji: '🦇', type: ObjectType.CREATURE, probability: 0.2, size: { width: 1, height: 1 } }
      ],
      decorativeObjects: [
        { emoji: '⚱️', type: ObjectType.DECORATION, probability: 0.2, size: { width: 1, height: 1 } }
      ]
    });

    // TOWN objects
    this.terrainObjectSets.set(MapTerrainType.TOWN, {
      terrain: MapTerrainType.TOWN,
      commonObjects: [
        { emoji: '🏠', type: ObjectType.INTERACTIVE, probability: 0.6, size: { width: 2, height: 2 } },
        { emoji: '🧺', type: ObjectType.DECORATION, probability: 0.4, size: { width: 1, height: 1 } },
        { emoji: '🚧', type: ObjectType.DECORATION, probability: 0.3, size: { width: 1, height: 1 } }
      ],
      rareObjects: [
        { emoji: '🍺', type: ObjectType.INTERACTIVE, probability: 0.2, size: { width: 2, height: 2 } },
        { emoji: '👮', type: ObjectType.CREATURE, probability: 0.1, size: { width: 1, height: 1 } },
        { emoji: '🐎', type: ObjectType.CREATURE, probability: 0.1, size: { width: 1, height: 1 } }
      ],
      decorativeObjects: [
        { emoji: '🧑‍⚖️', type: ObjectType.CREATURE, probability: 0.3, size: { width: 1, height: 1 } },
        { emoji: '🛒', type: ObjectType.DECORATION, probability: 0.2, size: { width: 1, height: 1 } }
      ]
    });
  }

  // Select a coordinated color theme for the terrain type
  private selectColorTheme(terrainType: MapTerrainType): TerrainColorTheme {
    if (terrainType === MapTerrainType.DUNGEON) {
      // DUNGEON inherits from a random base terrain type
      const baseTerrains = [MapTerrainType.HOUSE, MapTerrainType.CAVE, MapTerrainType.FOREST];
      const baseTerrain = baseTerrains[Math.floor(this.random() * baseTerrains.length)];
      const baseThemes = this.terrainColorSets.get(baseTerrain) || [];
      const selectedTheme = baseThemes[Math.floor(this.random() * baseThemes.length)];
      
      // Darken the theme for dungeon atmosphere
      return {
        ...selectedTheme,
        name: `Dark ${selectedTheme.name}`,
        backgroundColor: this.darkenColor(selectedTheme.backgroundColor, 0.3),
        pathColor: this.darkenColor(selectedTheme.pathColor, 0.2)
      };
    }

    const themes = this.terrainColorSets.get(terrainType) || [];
    return themes[Math.floor(this.random() * themes.length)] || themes[0];
  }

  // Helper method to darken a color
  private darkenColor(color: Color, factor: number): Color {
    return {
      r: Math.max(0, Math.floor(color.r * (1 - factor))),
      g: Math.max(0, Math.floor(color.g * (1 - factor))),
      b: Math.max(0, Math.floor(color.b * (1 - factor))),
      a: color.a
    };
  }

  // Generate map name based on terrain type
  private generateMapName(terrainType: MapTerrainType): string {
    const prefixes: { [key in MapTerrainType]: string[] } = {
      [MapTerrainType.HOUSE]: ['Cozy', 'Grand', 'Ancient', 'Mysterious', 'Humble'],
      [MapTerrainType.FOREST]: ['Enchanted', 'Dark', 'Whispering', 'Ancient', 'Moonlit'],
      [MapTerrainType.CAVE]: ['Crystal', 'Shadow', 'Echoing', 'Deep', 'Forgotten'],
      [MapTerrainType.TOWN]: ['Bustling', 'Peaceful', 'Trading', 'Border', 'Riverside'],
      [MapTerrainType.DUNGEON]: ['Cursed', 'Lost', 'Forbidden', 'Ancient', 'Treacherous']
    };

    const suffixes: { [key in MapTerrainType]: string[] } = {
      [MapTerrainType.HOUSE]: ['Manor', 'Cottage', 'Estate', 'Villa', 'Homestead'],
      [MapTerrainType.FOREST]: ['Woods', 'Grove', 'Thicket', 'Glade', 'Woodland'],
      [MapTerrainType.CAVE]: ['Caverns', 'Grotto', 'Depths', 'Hollow', 'Abyss'],
      [MapTerrainType.TOWN]: ['Village', 'Township', 'Settlement', 'Hamlet', 'Outpost'],
      [MapTerrainType.DUNGEON]: ['Dungeon', 'Catacombs', 'Ruins', 'Sanctum', 'Labyrinth']
    };

    const prefix = prefixes[terrainType][Math.floor(this.random() * prefixes[terrainType].length)];
    const suffix = suffixes[terrainType][Math.floor(this.random() * suffixes[terrainType].length)];

    return `${prefix} ${suffix}`;
  }

  // Generate rooms based on terrain type rules
  private generateRoomsByTerrain(options: MapGenerationOptions): GeneratedRoom[] {
    switch (options.terrainType) {
      case MapTerrainType.HOUSE:
        return this.generateOrganizedRooms(options);
      case MapTerrainType.FOREST:
        return this.generateOrganicClearings(options);
      case MapTerrainType.CAVE:
        return this.generateCaveChambers(options);
      case MapTerrainType.TOWN:
        return this.generateBuildingPlots(options);
      case MapTerrainType.DUNGEON:
        return this.generateDungeonRooms(options);
      default:
        return this.generateOrganizedRooms(options);
    }
  }

  // Generate organized rectangular rooms for houses
  private generateOrganizedRooms(options: MapGenerationOptions): GeneratedRoom[] {
    const rooms: GeneratedRoom[] = [];
    const { width, height, numberOfRooms, minRoomSize, maxRoomSize } = options;
    
    const roomTypes = ['bedroom', 'kitchen', 'living_room', 'study', 'storage'];
    
    for (let i = 0; i < numberOfRooms; i++) {
      const roomWidth = minRoomSize + Math.floor(this.random() * (maxRoomSize - minRoomSize));
      const roomHeight = minRoomSize + Math.floor(this.random() * (maxRoomSize - minRoomSize));
      
      let attempts = 0;
      let validPlacement = false;
      
      while (!validPlacement && attempts < 50) {
        const x = 2 + Math.floor(this.random() * (width - roomWidth - 4));
        const y = 2 + Math.floor(this.random() * (height - roomHeight - 4));
        
        const newRoom: GeneratedRoom = {
          id: uuidv4(),
          type: roomTypes[i % roomTypes.length],
          shape: { type: 'rectangle' },
          position: { x, y },
          size: { width: roomWidth, height: roomHeight },
          doors: this.generateRoomDoors({ x, y }, { width: roomWidth, height: roomHeight })
        };
        
        const overlaps = rooms.some(existingRoom => 
          this.roomsOverlap(newRoom, existingRoom, 3)
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

  // Generate door positions for a room
  private generateRoomDoors(position: Position, size: { width: number; height: number }): Position[] {
    const doors: Position[] = [];
    const numDoors = 1 + Math.floor(this.random() * 2); // 1-2 doors per room
    
    for (let i = 0; i < numDoors; i++) {
      const side = Math.floor(this.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
      
      let doorX, doorY;
      switch (side) {
        case 0: // Top
          doorX = position.x + Math.floor(size.width / 2);
          doorY = position.y;
          break;
        case 1: // Right
          doorX = position.x + size.width - 1;
          doorY = position.y + Math.floor(size.height / 2);
          break;
        case 2: // Bottom
          doorX = position.x + Math.floor(size.width / 2);
          doorY = position.y + size.height - 1;
          break;
        case 3: // Left
        default:
          doorX = position.x;
          doorY = position.y + Math.floor(size.height / 2);
          break;
      }
      
      doors.push({ x: doorX, y: doorY });
    }
    
    return doors;
  }

  // Generate organic clearings for forests
  private generateOrganicClearings(options: MapGenerationOptions): GeneratedRoom[] {
    const rooms: GeneratedRoom[] = [];
    const { width, height, numberOfRooms, minRoomSize, maxRoomSize, organicFactor } = options;
    
    for (let i = 0; i < numberOfRooms; i++) {
      const baseRadius = (minRoomSize + Math.floor(this.random() * (maxRoomSize - minRoomSize))) / 2;
      
      let attempts = 0;
      let validPlacement = false;
      
      while (!validPlacement && attempts < 50) {
        const x = baseRadius + 2 + Math.floor(this.random() * (width - baseRadius * 2 - 4));
        const y = baseRadius + 2 + Math.floor(this.random() * (height - baseRadius * 2 - 4));
        
        const newRoom: GeneratedRoom = {
          id: uuidv4(),
          type: 'clearing',
          shape: this.generateOrganicShape(baseRadius, organicFactor),
          position: { x: x - baseRadius, y: y - baseRadius },
          size: { width: baseRadius * 2, height: baseRadius * 2 },
          doors: [{ x, y }] // Single connection point at center
        };
        
        const overlaps = rooms.some(existingRoom => 
          this.roomsOverlap(newRoom, existingRoom, 4)
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

  // Generate irregular cave chambers
  private generateCaveChambers(options: MapGenerationOptions): GeneratedRoom[] {
    const rooms: GeneratedRoom[] = [];
    const { width, height, numberOfRooms, minRoomSize, maxRoomSize, organicFactor } = options;
    
    for (let i = 0; i < numberOfRooms; i++) {
      const baseRadius = (minRoomSize + Math.floor(this.random() * (maxRoomSize - minRoomSize))) / 2;
      
      let attempts = 0;
      let validPlacement = false;
      
      while (!validPlacement && attempts < 50) {
        const x = baseRadius + 2 + Math.floor(this.random() * (width - baseRadius * 2 - 4));
        const y = baseRadius + 2 + Math.floor(this.random() * (height - baseRadius * 2 - 4));
        
        const newRoom: GeneratedRoom = {
          id: uuidv4(),
          type: 'cavern',
          shape: this.generateOrganicShape(baseRadius, Math.max(0.7, organicFactor)),
          position: { x: x - baseRadius, y: y - baseRadius },
          size: { width: baseRadius * 2, height: baseRadius * 2 },
          doors: [{ x, y }] // Single connection point at center
        };
        
        const overlaps = rooms.some(existingRoom => 
          this.roomsOverlap(newRoom, existingRoom, 2)
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

  // Generate building plots for towns
  private generateBuildingPlots(options: MapGenerationOptions): GeneratedRoom[] {
    const rooms: GeneratedRoom[] = [];
    const { width, height, numberOfRooms, minRoomSize, maxRoomSize } = options;
    
    const buildingTypes = ['house', 'shop', 'tavern', 'stable', 'workshop'];
    
    for (let i = 0; i < numberOfRooms; i++) {
      const roomWidth = minRoomSize + Math.floor(this.random() * (maxRoomSize - minRoomSize));
      const roomHeight = minRoomSize + Math.floor(this.random() * (maxRoomSize - minRoomSize));
      
      let attempts = 0;
      let validPlacement = false;
      
      while (!validPlacement && attempts < 50) {
        const x = 3 + Math.floor(this.random() * (width - roomWidth - 6));
        const y = 3 + Math.floor(this.random() * (height - roomHeight - 6));
        
        const newRoom: GeneratedRoom = {
          id: uuidv4(),
          type: buildingTypes[Math.floor(this.random() * buildingTypes.length)],
          shape: { type: 'rectangle' },
          position: { x, y },
          size: { width: roomWidth, height: roomHeight },
          doors: this.generateRoomDoors({ x, y }, { width: roomWidth, height: roomHeight })
        };
        
        const overlaps = rooms.some(existingRoom => 
          this.roomsOverlap(newRoom, existingRoom, 4)
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

  // Generate dungeon rooms (inherits from base terrain type)
  private generateDungeonRooms(options: MapGenerationOptions): GeneratedRoom[] {
    // Randomly choose base generation method
    const methods = [
      () => this.generateOrganizedRooms(options),
      () => this.generateCaveChambers(options)
    ];
    
    const selectedMethod = methods[Math.floor(this.random() * methods.length)];
    const rooms = selectedMethod();
    
    // Add dungeon-specific room types and ensure doors exist
    rooms.forEach(room => {
      const dungeonTypes = ['chamber', 'corridor', 'trap_room', 'treasure_room', 'guard_room'];
      room.type = dungeonTypes[Math.floor(this.random() * dungeonTypes.length)];
      
      // Ensure doors exist
      if (!room.doors || room.doors.length === 0) {
        room.doors = this.generateRoomDoors(room.position, room.size);
      }
    });
    
    return rooms;
  }

  // Generate organic shape for clearings and caverns
  private generateOrganicShape(baseRadius: number, organicFactor: number): RoomShape {
    const points: Position[] = [];
    const numPoints = 8 + Math.floor(this.random() * 8); // 8-16 points
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * 2 * Math.PI;
      const radiusVariation = 1 + (this.random() - 0.5) * organicFactor * 0.5;
      const radius = baseRadius * radiusVariation;
      
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      points.push({ x: Math.round(x), y: Math.round(y) });
    }
    
    return {
      type: 'organic',
      points
    };
  }

  // Check if two rooms overlap with buffer
  private roomsOverlap(roomA: GeneratedRoom, roomB: GeneratedRoom, buffer: number): boolean {
    const aLeft = roomA.position.x - buffer;
    const aRight = roomA.position.x + roomA.size.width + buffer;
    const aTop = roomA.position.y - buffer;
    const aBottom = roomA.position.y + roomA.size.height + buffer;
    
    const bLeft = roomB.position.x;
    const bRight = roomB.position.x + roomB.size.width;
    const bTop = roomB.position.y;
    const bBottom = roomB.position.y + roomB.size.height;
    
    return !(aRight < bLeft || bRight < aLeft || aBottom < bTop || bBottom < aTop);
  }

  // Create background layer
  private createBackgroundLayer(colorTheme: TerrainColorTheme): MapLayer {
    return {
      id: uuidv4(),
      name: 'Background',
      type: LayerType.BACKGROUND,
      objects: [],
      isVisible: true,
      isLocked: false,
      opacity: 1
    };
  }

  // Create room layer with room shapes as objects
  private createRoomLayer(rooms: GeneratedRoom[], colorTheme: TerrainColorTheme): MapLayer {
    const roomObjects: MapObject[] = rooms.map(room => ({
      id: room.id,
      type: ObjectType.DECORATION,
      position: room.position,
      size: room.size,
      name: `${room.type}_room`,
      color: colorTheme.pathColor, // Use same color as paths for consistency
      properties: {
        roomType: room.type,
        shape: room.shape
      },
      isVisible: true,
      isInteractive: false
    }));

    return {
      id: uuidv4(),
      name: 'Rooms',
      type: LayerType.TERRAIN,
      objects: roomObjects,
      isVisible: true,
      isLocked: false,
      opacity: 1
    };
  }

  // Create path layer
  private createPathLayer(rooms: GeneratedRoom[], options: MapGenerationOptions, colorTheme: TerrainColorTheme): MapLayer {
    const pathObjects: MapObject[] = [];
    
    if (options.terrainType === MapTerrainType.TOWN) {
      // Generate full-coverage organic rectangle for town
      const townPath = this.generateTownPaths(options, colorTheme);
      pathObjects.push(townPath);
    } else {
      // Generate connecting paths between rooms
      const connectingPaths = this.generateConnectingPaths(rooms, options, colorTheme);
      pathObjects.push(...connectingPaths);
    }

    return {
      id: uuidv4(),
      name: 'Paths',
      type: LayerType.TERRAIN,
      objects: pathObjects,
      isVisible: true,
      isLocked: false,
      opacity: 1
    };
  }

  // Create grid layer as a resizable object
  private createGridLayer(options: MapGenerationOptions): MapLayer {
    const gridObject: MapObject = {
      id: uuidv4(),
      type: ObjectType.GRID,
      position: { x: 0, y: 0 },
      size: { width: options.width, height: options.height },
      name: 'Grid Overlay',
      description: 'Resizable grid overlay',
      isVisible: true,
      isInteractive: true,
      opacity: 0.3,
      properties: {
        gridType: 'square',
        cellSize: 1, // 1 grid cell = 1 unit
        lineColor: { r: 200, g: 200, b: 200, a: 0.3 },
        lineWidth: 1
      }
    };

    return {
      id: uuidv4(),
      name: 'Grid',
      type: LayerType.OVERLAY,
      objects: [gridObject],
      isVisible: true,
      isLocked: false,
      opacity: 0.3
    };
  }

  // Generate town paths (full-coverage organic rectangle)
  private generateTownPaths(options: MapGenerationOptions, colorTheme: TerrainColorTheme): MapObject {
    const { width, height } = options;
    const margin = 2;
    
    // Create organic rectangle covering most of the map
    const baseWidth = width - margin * 2;
    const baseHeight = height - margin * 2;
    
    return {
      id: uuidv4(),
      type: ObjectType.DECORATION,
      position: { x: margin, y: margin },
      size: { width: baseWidth, height: baseHeight },
      name: 'town_streets',
      color: colorTheme.pathColor,
      properties: {
        pathType: 'town_streets',
        coverage: 0.85
      },
      isVisible: true,
      isInteractive: false
    };
  }

  // Generate connecting paths between rooms
  private generateConnectingPaths(rooms: GeneratedRoom[], options: MapGenerationOptions, colorTheme: TerrainColorTheme): MapObject[] {
    const pathObjects: MapObject[] = [];
    
    if (rooms.length < 2) return pathObjects;
    
    // Connect rooms in sequence
    for (let i = 0; i < rooms.length - 1; i++) {
      const roomA = rooms[i];
      const roomB = rooms[i + 1];
      
      const path = this.createPathBetweenRooms(roomA, roomB, options, colorTheme);
      pathObjects.push(path);
    }
    
    // Connect last room to first to create circuit
    if (rooms.length > 2) {
      const lastRoom = rooms[rooms.length - 1];
      const firstRoom = rooms[0];
      const path = this.createPathBetweenRooms(lastRoom, firstRoom, options, colorTheme);
      pathObjects.push(path);
    }
    
    return pathObjects;
  }

  // Create a path between two rooms
  private createPathBetweenRooms(roomA: GeneratedRoom, roomB: GeneratedRoom, options: MapGenerationOptions, colorTheme: TerrainColorTheme): MapObject {
    // Find the closest door positions between the two rooms
    let startX, startY, endX, endY;
    
    if (roomA.doors && roomA.doors.length > 0 && roomB.doors && roomB.doors.length > 0) {
      // Find closest pair of doors
      let minDistance = Infinity;
      let bestDoorA = roomA.doors[0];
      let bestDoorB = roomB.doors[0];
      
      for (const doorA of roomA.doors) {
        for (const doorB of roomB.doors) {
          const distance = Math.abs(doorA.x - doorB.x) + Math.abs(doorA.y - doorB.y);
          if (distance < minDistance) {
            minDistance = distance;
            bestDoorA = doorA;
            bestDoorB = doorB;
          }
        }
      }
      
      startX = bestDoorA.x;
      startY = bestDoorA.y;
      endX = bestDoorB.x;
      endY = bestDoorB.y;
    } else {
      // Fallback to room centers if no doors defined
      startX = roomA.position.x + roomA.size.width / 2;
      startY = roomA.position.y + roomA.size.height / 2;
      endX = roomB.position.x + roomB.size.width / 2;
      endY = roomB.position.y + roomB.size.height / 2;
    }
    
    const pathWidth = options.terrainType === MapTerrainType.FOREST ? 1 : 
                     options.terrainType === MapTerrainType.CAVE ? 2 + Math.floor(this.random() * 2) : 2;
    
    // For organic terrain types (forest, cave), create truly organic winding paths
    const isOrganicTerrain = options.terrainType === MapTerrainType.FOREST || 
                             options.terrainType === MapTerrainType.CAVE;
    
    if (isOrganicTerrain) {
      // Create curved, natural-looking path
      const pathPoints: (Position & { width?: number })[] = [];
      const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
      const numSegments = Math.max(8, Math.floor(distance / 3)); // More segments for smoother curves
      
      for (let i = 0; i <= numSegments; i++) {
        const t = i / numSegments;
        
        // Use quadratic bezier curve as base path
        const midX = (startX + endX) / 2 + (this.random() - 0.5) * distance * 0.3;
        const midY = (startY + endY) / 2 + (this.random() - 0.5) * distance * 0.3;
        
        const bezierX = Math.pow(1-t, 2) * startX + 2 * (1-t) * t * midX + Math.pow(t, 2) * endX;
        const bezierY = Math.pow(1-t, 2) * startY + 2 * (1-t) * t * midY + Math.pow(t, 2) * endY;
        
        // Add random wobble
        const wobbleX = (this.random() - 0.5) * 2;
        const wobbleY = (this.random() - 0.5) * 2;
        
        const finalX = Math.round(bezierX + wobbleX);
        const finalY = Math.round(bezierY + wobbleY);
        
        // Variable width
        const widthVariation = this.random() < 0.3 ? (this.random() < 0.5 ? 1 : -1) : 0;
        
        pathPoints.push({
          x: finalX,
          y: finalY,
          width: Math.max(1, pathWidth + widthVariation)
        });
      }
      
      return {
        id: uuidv4(),
        type: ObjectType.DECORATION,
        position: { x: Math.min(startX, endX), y: Math.min(startY, endY) },
        size: { 
          width: Math.max(1, Math.abs(endX - startX)), 
          height: Math.max(1, Math.abs(endY - startY))
        },
        name: 'connecting_path',
        color: colorTheme.pathColor,
        properties: {
          pathType: 'organic',
          width: pathWidth,
          start: { x: startX, y: startY },
          end: { x: endX, y: endY },
          pathPoints, // Organic curved path
          isOrganic: true
        },
        isVisible: true,
        isInteractive: false
      };
    }
    
    // For structured terrain types (house, town, dungeon), use L-shaped corridors
    // Create organic-looking corridor with natural variation
    // Store the corridor as a series of points with width variation
    const corridorPoints: (Position & { width?: number })[] = [];
    
    // Decide whether to go horizontal-first or vertical-first
    const horizontalFirst = this.random() > 0.5;
    
    // Add wandering/organic feel with occasional offsets
    const createOrganicPath = (fromX: number, fromY: number, toX: number, toY: number, isHorizontal: boolean) => {
      const points: (Position & { width?: number })[] = [];
      
      if (isHorizontal) {
        const minX = Math.min(fromX, toX);
        const maxX = Math.max(fromX, toX);
        let currentY = fromY;
        
        for (let x = minX; x <= maxX; x++) {
          // Add slight vertical wandering for organic feel (30% chance every few cells)
          if (x > minX && x < maxX - 1 && this.random() < 0.3 && (x - minX) % 3 === 0) {
            currentY += this.random() < 0.5 ? 1 : -1;
          }
          
          // Vary width slightly for natural look
          const widthVariation = this.random() < 0.2 ? (this.random() < 0.5 ? 1 : -1) : 0;
          points.push({ 
            x, 
            y: currentY,
            width: Math.max(1, pathWidth + widthVariation)
          });
        }
      } else {
        const minY = Math.min(fromY, toY);
        const maxY = Math.max(fromY, toY);
        let currentX = fromX;
        
        for (let y = minY; y <= maxY; y++) {
          // Add slight horizontal wandering for organic feel
          if (y > minY && y < maxY - 1 && this.random() < 0.3 && (y - minY) % 3 === 0) {
            currentX += this.random() < 0.5 ? 1 : -1;
          }
          
          const widthVariation = this.random() < 0.2 ? (this.random() < 0.5 ? 1 : -1) : 0;
          points.push({ 
            x: currentX, 
            y,
            width: Math.max(1, pathWidth + widthVariation)
          });
        }
      }
      
      return points;
    };
    
    if (horizontalFirst) {
      // Horizontal segment then vertical
      corridorPoints.push(...createOrganicPath(startX, startY, endX, startY, true));
      corridorPoints.push(...createOrganicPath(endX, startY, endX, endY, false));
    } else {
      // Vertical segment then horizontal
      corridorPoints.push(...createOrganicPath(startX, startY, startX, endY, false));
      corridorPoints.push(...createOrganicPath(startX, endY, endX, endY, true));
    }
    
    return {
      id: uuidv4(),
      type: ObjectType.DECORATION,
      position: { x: Math.min(startX, endX), y: Math.min(startY, endY) },
      size: { 
        width: Math.max(1, Math.abs(endX - startX)), 
        height: Math.max(1, Math.abs(endY - startY))
      },
      name: 'connecting_path',
      color: colorTheme.pathColor,
      properties: {
        pathType: 'corridor',
        width: pathWidth,
        start: { x: startX, y: startY },
        end: { x: endX, y: endY },
        corridorPoints, // Store the actual corridor cells
        isLShaped: true
      },
      isVisible: true,
      isInteractive: false
    };
  }

  // Create objects layer with terrain-appropriate objects
  private createObjectsLayer(rooms: GeneratedRoom[], options: MapGenerationOptions): MapLayer {
    const objects: MapObject[] = [];
    const objectSet = this.terrainObjectSets.get(options.terrainType);
    
    if (!objectSet) return {
      id: uuidv4(),
      name: 'Objects',
      type: LayerType.OBJECTS,
      objects: [],
      isVisible: true,
      isLocked: false,
      opacity: 1
    };
    
    // Place objects in rooms
    rooms.forEach(room => {
      this.placeObjectsInRoom(room, objectSet, options.objectDensity, objects);
    });
    
    return {
      id: uuidv4(),
      name: 'Objects',
      type: LayerType.OBJECTS,
      objects,
      isVisible: true,
      isLocked: false,
      opacity: 1
    };
  }

  // Place objects within a specific room
  private placeObjectsInRoom(room: GeneratedRoom, objectSet: TerrainObjectSet, density: number, objects: MapObject[]): void {
    const allObjects = [...objectSet.commonObjects, ...objectSet.rareObjects, ...objectSet.decorativeObjects];
    
    // Filter objects appropriate for this room type
    const appropriateObjects = allObjects.filter(obj => 
      !obj.roomTypes || obj.roomTypes.includes(room.type)
    );
    
    const maxObjects = Math.floor((room.size.width * room.size.height / 4) * density);
    
    for (let i = 0; i < maxObjects; i++) {
      if (this.random() > 0.6) continue; // 40% chance to place object
      
      const objDef = appropriateObjects[Math.floor(this.random() * appropriateObjects.length)];
      if (this.random() > objDef.probability) continue;
      
      // Find valid position within room
      const objX = room.position.x + Math.floor(this.random() * (room.size.width - objDef.size.width));
      const objY = room.position.y + Math.floor(this.random() * (room.size.height - objDef.size.height));
      
      objects.push({
        id: uuidv4(),
        type: objDef.type,
        position: { x: objX, y: objY },
        size: objDef.size,
        name: objDef.emoji,
        properties: {
          emoji: objDef.emoji,
          roomId: room.id
        },
        isVisible: true,
        isInteractive: objDef.type === ObjectType.INTERACTIVE
      });
    }
  }
}

export const mapGenerationService = new MapGenerationService();