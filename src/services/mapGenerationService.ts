import { v4 as uuidv4 } from 'uuid';
import { DnDMap, LayerType, MapLayer, MapObject, Position, Color, ObjectType } from '../types/map';
import { 
  getHouseConfig, 
  getColorThemes,
  type TerrainColorTheme
} from '../config';

// Import enums for use in this file
import {
  MapTerrainType,
  HouseSubtype,
  ForestSubtype,
  CaveSubtype,
  TownSubtype,
  DungeonSubtype,
  HouseStory
} from '../types/enums';

// Re-export enums for other modules
export { 
  MapTerrainType,
  HouseSubtype,
  ForestSubtype,
  CaveSubtype,
  TownSubtype,
  DungeonSubtype,
  HouseStory
};

export type TerrainSubtype = HouseSubtype | ForestSubtype | CaveSubtype | TownSubtype | DungeonSubtype;

export interface MapGenerationOptions {
  width: number;
  height: number;
  terrainType: MapTerrainType;
  subtype?: TerrainSubtype;
  story?: HouseStory; // Only used for HOUSE terrain type
  numberOfRooms: number;
  minRoomSize: number;
  maxRoomSize: number;
  organicFactor: number; // 0.0 = geometric, 1.0 = very organic
  objectDensity: number; // 0.0 = sparse, 1.0 = dense
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
  padding?: number; // Interior padding percentage (0.0 to 1.0)
}

interface RoomShape {
  type: 'rectangle' | 'circle' | 'organic' | 'polygon';
  points?: Position[]; // For organic/polygon shapes
  radius?: number; // For circles
}

// BSP Tree structures for dungeon generation
class BSPTree {
  leaf: BSPContainer;
  lchild?: BSPTree;
  rchild?: BSPTree;

  constructor(leaf: BSPContainer) {
    this.leaf = leaf;
  }

  getLeafs(): BSPContainer[] {
    if (!this.lchild && !this.rchild) {
      return [this.leaf];
    }
    const leftLeafs = this.lchild ? this.lchild.getLeafs() : [];
    const rightLeafs = this.rchild ? this.rchild.getLeafs() : [];
    return [...leftLeafs, ...rightLeafs];
  }

  getLevel(level: number, queue: BSPTree[] = []): BSPTree[] {
    if (level === 1) {
      queue.push(this);
    } else {
      if (this.lchild) this.lchild.getLevel(level - 1, queue);
      if (this.rchild) this.rchild.getLevel(level - 1, queue);
    }
    return queue;
  }
}

class BSPContainer {
  x: number;
  y: number;
  w: number;
  h: number;
  center: Position;
  room?: GeneratedRoom;

  constructor(x: number, y: number, w: number, h: number) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.center = {
      x: this.x + this.w / 2,
      y: this.y + this.h / 2
    };
  }
}

interface EntranceExit {
  entrance: Position;
  exit?: Position;
  entrancePath: Position[];
  exitPath?: Position[];
  mainRoom?: GeneratedRoom;
}

export class MapGenerationService {
  private seed: number = Math.random();
  private terrainObjectSets: Map<MapTerrainType, TerrainObjectSet> = new Map();

  constructor() {
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
    const colorTheme = this.selectColorTheme(options);
    
    // Generate complete map structure (rooms + corridors + entrance/exit)
    const mapStructure = this.generateCompleteMapStructure(options);
    
    // Create unified layers: Background → Terrain (rooms + paths combined) → Objects → Grid
    const backgroundLayer = this.createBackgroundLayer(colorTheme, options);
    const terrainLayer = this.createUnifiedTerrainLayer(
      mapStructure.rooms, 
      mapStructure.corridors, 
      colorTheme
    );
    const objectsLayer = this.createObjectsLayer(mapStructure.rooms, options);
    const gridLayer = this.createGridLayer(options);
    
    // Add entrance/exit markers if they exist
    if (mapStructure.entrance) {
      const entranceObject = this.createEntranceMarker(mapStructure.entrance, 'entrance', colorTheme);
      if (objectsLayer.objects) {
        objectsLayer.objects.push(entranceObject);
      }
    }
    if (mapStructure.exit) {
      const exitObject = this.createEntranceMarker(mapStructure.exit, 'exit', colorTheme);
      if (objectsLayer.objects) {
        objectsLayer.objects.push(exitObject);
      }
    }

    const mapId = uuidv4();
    const mapName = this.generateMapName(options);

    // Determine grid cell size and map dimensions based on house configuration
    let gridCellSize = 32; // Default
    let mapWidth = options.width; // Default to user input
    let mapHeight = options.height; // Default to user input
    
    if (options.terrainType === MapTerrainType.HOUSE && options.subtype && options.story) {
      const houseConfig = getHouseConfig(options.subtype as HouseSubtype);
      if (houseConfig && houseConfig.stories) {
        const storyConfig = houseConfig.stories.find((s: any) => s.story === options.story);
        if (storyConfig) {
          if (storyConfig.gridCellSize) {
            gridCellSize = storyConfig.gridCellSize;
          } else if (houseConfig.gridCellSize) {
            gridCellSize = houseConfig.gridCellSize;
          }
          
          // Use configured map dimensions if available
          if (storyConfig.mapWidth) {
            mapWidth = storyConfig.mapWidth;
          }
          if (storyConfig.mapHeight) {
            mapHeight = storyConfig.mapHeight;
          }
        }
      }
    }

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
        width: mapWidth,
        height: mapHeight
      },
      gridConfig: {
        cellSize: gridCellSize,
        showGrid: true,
        gridColor: { r: 200, g: 200, b: 200, a: 0.3 },
        snapToGrid: true,
        gridType: 'square'
      },
      layers: [backgroundLayer, terrainLayer, objectsLayer, gridLayer],
      backgroundColor: colorTheme.backgroundColor
    };
  }

  /**
   * Generate complete map structure with rooms, corridors, and entrance/exit
   */
  private generateCompleteMapStructure(options: MapGenerationOptions): {
    rooms: GeneratedRoom[];
    corridors: Position[][];
    entrance?: Position;
    exit?: Position;
  } {
    const { width, height, terrainType, story } = options;
    
    // Step 1: Generate rooms
    const rooms = this.generateRoomsByTerrain(options);
    
    // Step 2: Generate corridors using MST approach for all terrain types
    let corridors: Position[][] = [];
    
    // All terrains now use BSP + MST corridor connections
    corridors = this.connectRoomsWithCorridors(rooms, options);
    console.log(`Generated ${corridors.length} corridors for ${rooms.length} rooms`);
    corridors.forEach((c, i) => console.log(`Corridor ${i}: ${c.length} points`));
    
    // Step 3: Build grid map for connectivity check
    const gridMap = this.buildGridMap(rooms, corridors, width, height);
    
    // Step 4: Check for disconnected groups and connect with Dijkstra
    const groups = this.findDisconnectedGroups(rooms, gridMap);
    if (groups.length > 1) {
      const dijkstraCorridors = this.connectDisconnectedGroups(groups, gridMap, width, height);
      corridors.push(...dijkstraCorridors);
    }
    
    // Step 5: Create entrance/exit for all terrain types except TOWN
    // For HOUSE terrain, only create entrance/exit for first floor (STORY_1)
    // Basements and upper floors have internal stairs, so no edge entrances
    let entrance: Position | undefined;
    let exit: Position | undefined;
    
    const shouldCreateEntrance = terrainType !== MapTerrainType.TOWN && 
      !(terrainType === MapTerrainType.HOUSE && story && story !== HouseStory.STORY_1);
    
    if (shouldCreateEntrance) {
      const entranceExit = this.createEntranceExit(rooms, corridors, options);
      entrance = entranceExit.entrance;
      exit = entranceExit.exit;
      
      // Add entrance/exit paths to corridors
      if (entranceExit.entrancePath.length > 0) {
        corridors.push(entranceExit.entrancePath);
      }
      if (entranceExit.exitPath && entranceExit.exitPath.length > 0) {
        corridors.push(entranceExit.exitPath);
      }
    }
    
    return { rooms, corridors, entrance, exit };
  }

  /**
   * Generate traditional paths for non-BSP terrains
   */
  private generateTraditionalPaths(rooms: GeneratedRoom[], options: MapGenerationOptions, width: number, height: number): Position[][] {
    const corridors: Position[][] = [];
    
    // Simple: connect each room to nearest neighbor
    for (let i = 0; i < rooms.length - 1; i++) {
      const corridor = this.createLShapedCorridor(
        { x: rooms[i].position.x + rooms[i].size.width / 2, y: rooms[i].position.y + rooms[i].size.height / 2 },
        { x: rooms[i + 1].position.x + rooms[i + 1].size.width / 2, y: rooms[i + 1].position.y + rooms[i + 1].size.height / 2 }
      );
      corridors.push(corridor);
    }
    
    return corridors;
  }

  /**
   * Create entrance/exit marker object
   */
  private createEntranceMarker(position: Position, type: 'entrance' | 'exit', colorTheme: TerrainColorTheme): MapObject {
    return {
      id: uuidv4(),
      type: ObjectType.DECORATION,
      position,
      size: { width: 3, height: 3 },
      name: type === 'entrance' ? '🚪 Entrance' : '🏁 Exit',
      color: type === 'entrance' ? { r: 0, g: 255, b: 0 } : { r: 255, g: 0, b: 0 },
      properties: {
        entranceType: type,
        isInteractive: true
      },
      isVisible: true,
      isInteractive: true
    };
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
  private selectColorTheme(options: MapGenerationOptions): TerrainColorTheme {
    const { terrainType, subtype, story } = options;
    
    // Check if this is a basement level - use dungeon colors
    if (terrainType === MapTerrainType.HOUSE && subtype && story === HouseStory.BASEMENT) {
      const houseConfig = getHouseConfig(subtype as HouseSubtype);
      if (houseConfig && houseConfig.stories) {
        const storyConfig = houseConfig.stories.find((s: any) => s.story === story);
        if (storyConfig && storyConfig.useBasementColors) {
          // Use darkened cave/dungeon colors for basement
          const caveThemes = getColorThemes(MapTerrainType.CAVE);
          const selectedTheme = caveThemes[Math.floor(this.random() * caveThemes.length)];
          
          return {
            ...selectedTheme,
            name: `Basement ${selectedTheme.name}`,
            backgroundColor: this.darkenColor(selectedTheme.backgroundColor, 0.2),
            pathColor: this.darkenColor(selectedTheme.pathColor, 0.15)
          };
        }
      }
    }
    
    if (terrainType === MapTerrainType.DUNGEON) {
      // DUNGEON inherits from a random base terrain type
      const baseTerrains = [MapTerrainType.HOUSE, MapTerrainType.CAVE, MapTerrainType.FOREST];
      const baseTerrain = baseTerrains[Math.floor(this.random() * baseTerrains.length)];
      const baseThemes = getColorThemes(baseTerrain);
      const selectedTheme = baseThemes[Math.floor(this.random() * baseThemes.length)];
      
      // Darken the theme for dungeon atmosphere
      return {
        ...selectedTheme,
        name: `Dark ${selectedTheme.name}`,
        backgroundColor: this.darkenColor(selectedTheme.backgroundColor, 0.3),
        pathColor: this.darkenColor(selectedTheme.pathColor, 0.2)
      };
    }

    const themes = getColorThemes(terrainType);
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

  private lightenColor(color: Color, factor: number): Color {
    return {
      r: Math.min(255, Math.floor(color.r + (255 - color.r) * factor)),
      g: Math.min(255, Math.floor(color.g + (255 - color.g) * factor)),
      b: Math.min(255, Math.floor(color.b + (255 - color.b) * factor)),
      a: color.a
    };
  }

  // Generate map name based on terrain type and subtype/story
  private generateMapName(options: MapGenerationOptions): string {
    const { terrainType, subtype, story } = options;
    
    // If house with subtype, use subtype name and story
    if (terrainType === MapTerrainType.HOUSE && subtype && story) {
      const houseConfig = getHouseConfig(subtype as HouseSubtype);
      if (houseConfig) {
        const storyName = story === HouseStory.BASEMENT ? 'Basement' :
                         story === HouseStory.STORY_1 ? 'First Floor' :
                         story === HouseStory.STORY_2 ? 'Second Floor' :
                         story === HouseStory.STORY_3 ? 'Third Floor' : '';
        
        return `${houseConfig.name} - ${storyName}`;
      }
    }
    
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
  // ============================================================================
  // BSP (Binary Space Partitioning) DUNGEON GENERATION
  // ============================================================================

  /**
   * Generate rooms using Hybrid BSP approach
   * - Creates exact number of rooms (not limited to powers of 2)
   * - Connects rooms using BSP tree structure
   * - Fills gaps with Dijkstra pathfinding
   * - Supports house subtype configurations
   */
  private generateBSPRooms(options: MapGenerationOptions): GeneratedRoom[] {
    const { terrainType, subtype, story } = options;
    
    // Create modified options based on house configuration if applicable
    let modifiedOptions = { ...options };
    
    // Override room generation parameters with house configuration if applicable
    if (terrainType === MapTerrainType.HOUSE && subtype && story) {
      const houseConfig = getHouseConfig(subtype as HouseSubtype);
      if (houseConfig && houseConfig.stories) {
        const storyConfig = houseConfig.stories.find((s: any) => s.story === story);
        if (storyConfig) {
          modifiedOptions = {
            ...options,
            // Use user's numberOfRooms if provided, otherwise use config default
            numberOfRooms: options.numberOfRooms || storyConfig.numberOfRooms,
            minRoomSize: storyConfig.minRoomSize,
            maxRoomSize: storyConfig.maxRoomSize,
            // Use config's map dimensions if available
            width: storyConfig.mapWidth || options.width,
            height: storyConfig.mapHeight || options.height
          };
        }
      }
    }
    
    const { numberOfRooms, width, height } = modifiedOptions;
    
    // Calculate BSP iterations needed
    const iterations = this.calculateBSPIterations(numberOfRooms);
    
    // For Wizard Tower, constrain the BSP container to fit within the main tower circle
    let containerX = 2;
    let containerY = 2;
    let containerW = width - 4;
    let containerH = height - 4;
    
    if (terrainType === MapTerrainType.HOUSE && subtype === HouseSubtype.WIZARD_TOWER) {
      // Main tower is 35% of map size, centered
      const mainTowerRadius = Math.min(width, height) * 0.35;
      const centerX = width / 2;
      const centerY = height / 2;
      
      // Inscribe a square within the circle (use ~70% of diameter to ensure rooms fit)
      const inscribedSquareSize = mainTowerRadius * 2 * 0.7;
      containerX = Math.floor(centerX - inscribedSquareSize / 2);
      containerY = Math.floor(centerY - inscribedSquareSize / 2);
      containerW = Math.floor(inscribedSquareSize);
      containerH = Math.floor(inscribedSquareSize);
    }
    
    // Create BSP tree with hybrid splitting (stops early for exact room count)
    const mainContainer = new BSPContainer(containerX, containerY, containerW, containerH);
    const tree = this.splitContainerHybrid(mainContainer, iterations, numberOfRooms);
    
    // Get leaf containers and create rooms
    let leafs = tree.getLeafs();
    
    // IMPORTANT: Trim or add leafs to match exact room count
    if (leafs.length > numberOfRooms) {
      // Too many rooms - randomly remove some
      while (leafs.length > numberOfRooms) {
        const removeIndex = Math.floor(this.random() * leafs.length);
        leafs.splice(removeIndex, 1);
      }
    } else if (leafs.length < numberOfRooms) {
      // Too few rooms - split the largest containers
      while (leafs.length < numberOfRooms) {
        // Find the largest leaf
        let largestIndex = 0;
        let largestArea = leafs[0].w * leafs[0].h;
        
        for (let i = 1; i < leafs.length; i++) {
          const area = leafs[i].w * leafs[i].h;
          if (area > largestArea) {
            largestArea = area;
            largestIndex = i;
          }
        }
        
        // Split the largest container
        const containerToSplit = leafs[largestIndex];
        const [r1, r2] = this.randomSplitContainer(containerToSplit);
        
        if (r1 && r2) {
          // Replace the container with its two children
          leafs.splice(largestIndex, 1);
          leafs.push(r1, r2);
        } else {
          // Can't split anymore - stop
          break;
        }
      }
    }
    
    const rooms: GeneratedRoom[] = [];
    
    for (const container of leafs) {
      const room = this.createRoomInContainer(container, modifiedOptions);
      container.room = room;
      rooms.push(room);
    }
    
    return rooms;
  }

  /**
   * Calculate BSP iterations needed for target room count
   */
  private calculateBSPIterations(targetRooms: number): number {
    // For hybrid approach, use slightly higher iterations to allow flexibility
    const baseIterations = Math.ceil(Math.log2(targetRooms));
    return Math.max(3, Math.min(baseIterations + 1, 7)); // Clamp 3-7
  }

  /**
   * Hybrid BSP splitting - stops splitting when we have enough rooms
   */
  private splitContainerHybrid(
    container: BSPContainer, 
    maxIter: number, 
    targetRooms: number, 
    currentDepth: number = 0,
    roomsSoFar: number = 1
  ): BSPTree {
    const tree = new BSPTree(container);
    
    // Stop conditions:
    // 1. Reached max iterations
    // 2. Container too small to split further
    // 3. We have enough rooms (with some buffer for variety)
    const shouldStop = 
      currentDepth >= maxIter ||
      container.w < 8 || container.h < 8 ||
      (roomsSoFar >= targetRooms && this.random() < 0.6);
    
    if (shouldStop) {
      return tree; // Leaf node
    }
    
    // Split the container
    const [r1, r2] = this.randomSplitContainer(container);
    
    if (!r1 || !r2) {
      return tree; // Failed to split, return as leaf
    }
    
    // Recursively split children
    const estimatedLeft = Math.ceil(targetRooms / 2);
    const estimatedRight = targetRooms - estimatedLeft;
    
    tree.lchild = this.splitContainerHybrid(r1, maxIter, estimatedLeft, currentDepth + 1, roomsSoFar);
    tree.rchild = this.splitContainerHybrid(r2, maxIter, estimatedRight, currentDepth + 1, roomsSoFar + 1);
    
    return tree;
  }

  /**
   * Split a container randomly (vertical or horizontal) with ratio filtering
   */
  private randomSplitContainer(container: BSPContainer): [BSPContainer | null, BSPContainer | null] {
    const MIN_SIZE = 6;
    const W_RATIO = 0.4; // Minimum width/height ratio
    const H_RATIO = 0.4; // Minimum height/width ratio
    
    let r1: BSPContainer | null = null;
    let r2: BSPContainer | null = null;
    
    // Try up to 5 times to get a good split
    for (let attempt = 0; attempt < 5; attempt++) {
      const splitVertical = this.random() < 0.5;
      
      if (splitVertical && container.w >= MIN_SIZE * 2) {
        // Vertical split
        const splitPoint = Math.floor(container.w * (0.3 + this.random() * 0.4)); // 30-70%
        
        r1 = new BSPContainer(container.x, container.y, splitPoint, container.h);
        r2 = new BSPContainer(container.x + splitPoint, container.y, container.w - splitPoint, container.h);
        
        // Check ratios
        const r1Ratio = r1.w / r1.h;
        const r2Ratio = r2.w / r2.h;
        
        if (r1Ratio >= W_RATIO && r2Ratio >= W_RATIO) {
          return [r1, r2]; // Good split!
        }
      } else if (!splitVertical && container.h >= MIN_SIZE * 2) {
        // Horizontal split
        const splitPoint = Math.floor(container.h * (0.3 + this.random() * 0.4)); // 30-70%
        
        r1 = new BSPContainer(container.x, container.y, container.w, splitPoint);
        r2 = new BSPContainer(container.x, container.y + splitPoint, container.w, container.h - splitPoint);
        
        // Check ratios
        const r1Ratio = r1.h / r1.w;
        const r2Ratio = r2.h / r2.w;
        
        if (r1Ratio >= H_RATIO && r2Ratio >= H_RATIO) {
          return [r1, r2]; // Good split!
        }
      }
    }
    
    // Failed to find good split
    return [null, null];
  }

  /**
   * Create a room within a BSP container with configurable padding
   */
  private createRoomInContainer(container: BSPContainer, options: MapGenerationOptions): GeneratedRoom {
    // Determine minimum room spacing from configuration
    let minSpacing = 2; // Default: 2 grid cells between rooms (acts as padding)
    let roomPadding = 0.0; // Default: no interior padding
    
    if (options.terrainType === MapTerrainType.HOUSE && options.subtype && options.story) {
      const houseConfig = getHouseConfig(options.subtype as HouseSubtype);
      if (houseConfig && houseConfig.stories) {
        const storyConfig = houseConfig.stories.find((s: any) => s.story === options.story);
        if (storyConfig) {
          if (storyConfig.minRoomSpacing !== undefined) {
            minSpacing = storyConfig.minRoomSpacing;
          } else if (houseConfig.minRoomSpacing !== undefined) {
            minSpacing = houseConfig.minRoomSpacing;
          }
          if (storyConfig.roomPadding !== undefined) {
            roomPadding = storyConfig.roomPadding;
          }
        }
      }
    }
    
    // Create padding based on minimum spacing (deterministic: exactly minSpacing cells)
    const paddingLeft = minSpacing;
    const paddingTop = minSpacing;
    const paddingRight = minSpacing;
    const paddingBottom = minSpacing;
    
    const roomX = container.x + paddingLeft;
    const roomY = container.y + paddingTop;
    const roomW = Math.max(3, container.w - paddingLeft - paddingRight);
    const roomH = Math.max(3, container.h - paddingTop - paddingBottom);
    
    // Determine room type based on terrain
    let roomType = 'room';
    if (options.terrainType === MapTerrainType.CAVE) {
      roomType = Math.random() < 0.3 ? 'large_cavern' : 'cavern';
    } else if (options.terrainType === MapTerrainType.HOUSE) {
      const houseRooms = ['bedroom', 'kitchen', 'living_room', 'study', 'bathroom', 'storage'];
      roomType = houseRooms[Math.floor(this.random() * houseRooms.length)];
    } else if (options.terrainType === MapTerrainType.DUNGEON) {
      const dungeonRooms = ['chamber', 'corridor', 'trap_room', 'treasure_room', 'guard_room'];
      roomType = dungeonRooms[Math.floor(this.random() * dungeonRooms.length)];
    }
    
    // Determine room shape based on house configuration
    let roomShape: 'rectangle' | 'circle' = 'rectangle';
    if (options.terrainType === MapTerrainType.HOUSE && options.subtype) {
      const houseConfig = getHouseConfig(options.subtype as HouseSubtype);
      if (houseConfig && houseConfig.roomShape === 'circle') {
        roomShape = 'circle';
      }
    }
    
    return {
      id: uuidv4(),
      type: roomType,
      shape: { type: roomShape },
      position: { x: roomX, y: roomY },
      size: { width: roomW, height: roomH },
      doors: [],
      padding: roomPadding
    };
  }

  /**
   * Connect BSP rooms using tree structure + Dijkstra for gaps
   */
  /**
   * Connect rooms with L-shaped corridors
   * Uses minimum spanning tree approach: connect each room to nearest unconnected room
   */
  private connectRoomsWithCorridors(rooms: GeneratedRoom[], options: MapGenerationOptions): Position[][] {
    const corridors: Position[][] = [];
    
    if (rooms.length === 0) return corridors;
    
    // Get corridor width from configuration
    let corridorWidth = 1; // Default
    if (options.terrainType === MapTerrainType.HOUSE && options.subtype && options.story) {
      const houseConfig = getHouseConfig(options.subtype as HouseSubtype);
      if (houseConfig && houseConfig.stories) {
        const storyConfig = houseConfig.stories.find((s: any) => s.story === options.story);
        if (storyConfig && storyConfig.corridorWidth) {
          corridorWidth = storyConfig.corridorWidth;
        }
      }
    }
    
    // Track which rooms are connected
    const connected = new Set<string>();
    connected.add(rooms[0].id);
    
    // Keep connecting until all rooms are connected
    while (connected.size < rooms.length) {
      let bestConnection: { from: GeneratedRoom; to: GeneratedRoom; distance: number } | null = null;
      
      // Find the shortest connection from any connected room to any unconnected room
      for (const room of rooms) {
        if (!connected.has(room.id)) continue;
        
        const centerA = {
          x: Math.floor(room.position.x + room.size.width / 2),
          y: Math.floor(room.position.y + room.size.height / 2)
        };
        
        for (const otherRoom of rooms) {
          if (connected.has(otherRoom.id)) continue;
          
          const centerB = {
            x: Math.floor(otherRoom.position.x + otherRoom.size.width / 2),
            y: Math.floor(otherRoom.position.y + otherRoom.size.height / 2)
          };
          
          const distance = Math.abs(centerA.x - centerB.x) + Math.abs(centerA.y - centerB.y);
          
          if (!bestConnection || distance < bestConnection.distance) {
            bestConnection = { from: room, to: otherRoom, distance };
          }
        }
      }
      
      // Connect the best pair
      if (bestConnection) {
        const centerA = {
          x: Math.floor(bestConnection.from.position.x + bestConnection.from.size.width / 2),
          y: Math.floor(bestConnection.from.position.y + bestConnection.from.size.height / 2)
        };
        const centerB = {
          x: Math.floor(bestConnection.to.position.x + bestConnection.to.size.width / 2),
          y: Math.floor(bestConnection.to.position.y + bestConnection.to.size.height / 2)
        };
        
        const corridor = this.createLShapedCorridor(centerA, centerB, corridorWidth);
        corridors.push(corridor);
        connected.add(bestConnection.to.id);
      } else {
        break; // Safety: prevent infinite loop
      }
    }
    
    return corridors;
  }

  private connectBSPRooms(tree: BSPTree, gridMap: boolean[][], width: number, height: number): Position[][] {
    const corridors: Position[][] = [];
    
    // Connect sibling nodes recursively
    this.connectBSPSiblings(tree, corridors);
    
    // TODO: Add Dijkstra for disconnected groups
    
    return corridors;
  }

  /**
   * Recursively connect BSP sibling containers
   */
  private connectBSPSiblings(tree: BSPTree, corridors: Position[][]): void {
    if (!tree.lchild || !tree.rchild) {
      return; // Leaf node, nothing to connect
    }
    
    // Get leaf nodes from each child
    const leftLeaf = this.getRandomLeaf(tree.lchild);
    const rightLeaf = this.getRandomLeaf(tree.rchild);
    
    if (leftLeaf && rightLeaf) {
      // Create L-shaped corridor between container centers
      const corridor = this.createLShapedCorridor(leftLeaf.center, rightLeaf.center);
      corridors.push(corridor);
    }
    
    // Recurse on children
    this.connectBSPSiblings(tree.lchild, corridors);
    this.connectBSPSiblings(tree.rchild, corridors);
  }

  /**
   * Get a random leaf from a tree branch
   */
  private getRandomLeaf(tree: BSPTree): BSPContainer | null {
    const leafs = tree.getLeafs();
    if (leafs.length === 0) return null;
    return leafs[Math.floor(this.random() * leafs.length)];
  }

  /**
   * Create L-shaped corridor between two points with configurable width
   */
  private createLShapedCorridor(start: Position, end: Position, width: number = 1): Position[] {
    const corridor: Position[] = [];
    const turnHorizontalFirst = this.random() < 0.5;
    
    // Calculate corridor width offset (center corridor around path)
    const offset = Math.floor(width / 2);
    
    if (turnHorizontalFirst) {
      // Horizontal then vertical
      for (let x = Math.min(start.x, end.x); x <= Math.max(start.x, end.x); x++) {
        // Add width by adding parallel lines
        for (let w = -offset; w < width - offset; w++) {
          corridor.push({ x: Math.floor(x), y: Math.floor(start.y) + w });
        }
      }
      for (let y = Math.min(start.y, end.y); y <= Math.max(start.y, end.y); y++) {
        // Add width by adding parallel lines
        for (let w = -offset; w < width - offset; w++) {
          corridor.push({ x: Math.floor(end.x) + w, y: Math.floor(y) });
        }
      }
    } else {
      // Vertical then horizontal
      for (let y = Math.min(start.y, end.y); y <= Math.max(start.y, end.y); y++) {
        // Add width by adding parallel lines
        for (let w = -offset; w < width - offset; w++) {
          corridor.push({ x: Math.floor(start.x) + w, y: Math.floor(y) });
        }
      }
      for (let x = Math.min(start.x, end.x); x <= Math.max(start.x, end.x); x++) {
        // Add width by adding parallel lines
        for (let w = -offset; w < width - offset; w++) {
          corridor.push({ x: Math.floor(x), y: Math.floor(end.y) + w });
        }
      }
    }
    
    return corridor;
  }

  // ============================================================================
  // END BSP GENERATION
  // ============================================================================

  // ============================================================================
  // DIJKSTRA PATHFINDING & CONNECTIVITY
  // ============================================================================

  /**
   * Build a grid map from rooms and corridors (true = wall, false = floor)
   */
  private buildGridMap(rooms: GeneratedRoom[], corridors: Position[][], width: number, height: number): boolean[][] {
    const map: boolean[][] = Array(height).fill(null).map(() => Array(width).fill(true));
    
    // Carve out rooms
    for (const room of rooms) {
      for (let y = 0; y < room.size.height; y++) {
        for (let x = 0; x < room.size.width; x++) {
          const mapX = Math.floor(room.position.x + x);
          const mapY = Math.floor(room.position.y + y);
          if (mapX >= 0 && mapX < width && mapY >= 0 && mapY < height) {
            map[mapY][mapX] = false; // Floor
          }
        }
      }
    }
    
    // Carve out corridors
    for (const corridor of corridors) {
      for (const point of corridor) {
        const x = Math.floor(point.x);
        const y = Math.floor(point.y);
        if (x >= 0 && x < width && y >= 0 && y < height) {
          map[y][x] = false; // Floor
          // Widen corridor slightly
          if (x > 0) map[y][x - 1] = false;
          if (x < width - 1) map[y][x + 1] = false;
        }
      }
    }
    
    return map;
  }

  /**
   * Find disconnected room groups using flood fill
   */
  private findDisconnectedGroups(rooms: GeneratedRoom[], gridMap: boolean[][]): GeneratedRoom[][] {
    const visited = new Set<string>();
    const groups: GeneratedRoom[][] = [];
    
    for (const room of rooms) {
      if (!visited.has(room.id)) {
        const group = this.floodFillGroup(room, rooms, gridMap, visited);
        if (group.length > 0) {
          groups.push(group);
        }
      }
    }
    
    return groups;
  }

  /**
   * Flood fill to find all rooms connected to start room
   */
  private floodFillGroup(
    startRoom: GeneratedRoom,
    allRooms: GeneratedRoom[],
    gridMap: boolean[][],
    visited: Set<string>
  ): GeneratedRoom[] {
    const group: GeneratedRoom[] = [];
    const queue: GeneratedRoom[] = [startRoom];
    visited.add(startRoom.id);
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      group.push(current);
      
      // Check which rooms are reachable from current
      for (const other of allRooms) {
        if (!visited.has(other.id) && this.areRoomsConnected(current, other, gridMap)) {
          visited.add(other.id);
          queue.push(other);
        }
      }
    }
    
    return group;
  }

  /**
   * Check if two rooms are connected via floor cells
   */
  private areRoomsConnected(roomA: GeneratedRoom, roomB: GeneratedRoom, gridMap: boolean[][]): boolean {
    // Simple check: see if there's a floor path between centers
    const path = this.dijkstraPathfinding(
      { x: Math.floor(roomA.position.x + roomA.size.width / 2), y: Math.floor(roomA.position.y + roomA.size.height / 2) },
      { x: Math.floor(roomB.position.x + roomB.size.width / 2), y: Math.floor(roomB.position.y + roomB.size.height / 2) },
      gridMap
    );
    return path.length > 0;
  }

  /**
   * Dijkstra pathfinding algorithm
   * Returns array of positions from start to goal (empty if no path exists)
   */
  private dijkstraPathfinding(start: Position, goal: Position, gridMap: boolean[][]): Position[] {
    const width = gridMap[0].length;
    const height = gridMap.length;
    
    // Distance map (Infinity = unvisited)
    const dist: number[][] = Array(height).fill(null).map(() => Array(width).fill(Infinity));
    const prev: (Position | null)[][] = Array(height).fill(null).map(() => Array(width).fill(null));
    
    // Priority queue (simple array implementation)
    const queue: Array<{ pos: Position; dist: number }> = [];
    
    const startX = Math.floor(start.x);
    const startY = Math.floor(start.y);
    const goalX = Math.floor(goal.x);
    const goalY = Math.floor(goal.y);
    
    // Bounds check
    if (startX < 0 || startX >= width || startY < 0 || startY >= height ||
        goalX < 0 || goalX >= width || goalY < 0 || goalY >= height) {
      return [];
    }
    
    dist[startY][startX] = 0;
    queue.push({ pos: { x: startX, y: startY }, dist: 0 });
    
    const directions = [
      { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }
    ];
    
    while (queue.length > 0) {
      // Get node with minimum distance
      queue.sort((a, b) => a.dist - b.dist);
      const current = queue.shift()!;
      const { x, y } = current.pos;
      
      // Reached goal?
      if (x === goalX && y === goalY) {
        // Reconstruct path
        const path: Position[] = [];
        let curr: Position | null = { x: goalX, y: goalY };
        while (curr) {
          path.unshift(curr);
          curr = prev[curr.y][curr.x];
        }
        return path;
      }
      
      // Already found better path to this node
      if (current.dist > dist[y][x]) continue;
      
      // Check neighbors
      for (const dir of directions) {
        const nx = x + dir.x;
        const ny = y + dir.y;
        
        // Bounds check
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        
        // Wall check (can pathfind through walls with higher cost)
        const moveCost = gridMap[ny][nx] ? 5 : 1; // Walls cost 5x more
        const newDist = dist[y][x] + moveCost;
        
        if (newDist < dist[ny][nx]) {
          dist[ny][nx] = newDist;
          prev[ny][nx] = { x, y };
          queue.push({ pos: { x: nx, y: ny }, dist: newDist });
        }
      }
    }
    
    // No path found
    return [];
  }

  /**
   * Connect disconnected groups using Dijkstra
   */
  private connectDisconnectedGroups(
    groups: GeneratedRoom[][],
    gridMap: boolean[][],
    width: number,
    height: number
  ): Position[][] {
    const newCorridors: Position[][] = [];
    
    // Connect each group to the next
    for (let i = 0; i < groups.length - 1; i++) {
      const groupA = groups[i];
      const groupB = groups[i + 1];
      
      // Find closest room pair between groups
      let bestPath: Position[] = [];
      let shortestDist = Infinity;
      
      for (const roomA of groupA) {
        for (const roomB of groupB) {
          const centerA = {
            x: Math.floor(roomA.position.x + roomA.size.width / 2),
            y: Math.floor(roomA.position.y + roomA.size.height / 2)
          };
          const centerB = {
            x: Math.floor(roomB.position.x + roomB.size.width / 2),
            y: Math.floor(roomB.position.y + roomB.size.height / 2)
          };
          
          const path = this.dijkstraPathfinding(centerA, centerB, gridMap);
          
          if (path.length > 0 && path.length < shortestDist) {
            shortestDist = path.length;
            bestPath = path;
          }
        }
      }
      
      if (bestPath.length > 0) {
        newCorridors.push(bestPath);
        // Carve this corridor into the grid map so future paths can use it
        for (const point of bestPath) {
          if (point.y >= 0 && point.y < height && point.x >= 0 && point.x < width) {
            gridMap[point.y][point.x] = false;
          }
        }
      }
    }
    
    return newCorridors;
  }

  // ============================================================================
  // ENTRANCE & EXIT SYSTEM
  // ============================================================================

  /**
   * Create entrance and optional exit for terrain
   */
  private createEntranceExit(
    rooms: GeneratedRoom[],
    corridors: Position[][],
    options: MapGenerationOptions
  ): EntranceExit {
    const { terrainType, width, height } = options;
    
    if (terrainType === MapTerrainType.CAVE || terrainType === MapTerrainType.DUNGEON) {
      // Cave and dungeon: single entrance from edge to largest room
      return this.createCaveEntrance(rooms, corridors, width, height);
    } else if (terrainType === MapTerrainType.FOREST) {
      // Forest: entrance and exit on opposite edges
      return this.createForestEntranceExit(rooms, corridors, width, height);
    } else if (terrainType === MapTerrainType.HOUSE) {
      // House: entrance from edge (like a front door)
      return this.createCaveEntrance(rooms, corridors, width, height);
    }
    
    // Default: no entrance/exit for towns
    return {
      entrance: { x: 0, y: 0 },
      entrancePath: []
    };
  }

  /**
   * Create entrance for cave (single entrance on edge)
   */
  private createCaveEntrance(
    rooms: GeneratedRoom[],
    corridors: Position[][],
    width: number,
    height: number
  ): EntranceExit {
    // Choose entrance side (prefer left or top)
    const sides = ['left', 'top', 'right', 'bottom'];
    const entranceSide = sides[Math.floor(this.random() * sides.length)];
    
    let entrance: Position;
    switch (entranceSide) {
      case 'left':
        entrance = { x: 0, y: Math.floor(height / 2) };
        break;
      case 'right':
        entrance = { x: width - 1, y: Math.floor(height / 2) };
        break;
      case 'top':
        entrance = { x: Math.floor(width / 2), y: 0 };
        break;
      default: // bottom
        entrance = { x: Math.floor(width / 2), y: height - 1 };
    }
    
    // Find main chamber (largest room)
    const mainChamber = rooms.reduce((largest, room) => {
      const areaLargest = largest.size.width * largest.size.height;
      const areaRoom = room.size.width * room.size.height;
      return areaRoom > areaLargest ? room : largest;
    });
    
    // Build grid map
    const gridMap = this.buildGridMap(rooms, corridors, width, height);
    
    // Find path from entrance to main chamber
    const chamberCenter = {
      x: Math.floor(mainChamber.position.x + mainChamber.size.width / 2),
      y: Math.floor(mainChamber.position.y + mainChamber.size.height / 2)
    };
    
    const entrancePath = this.dijkstraPathfinding(entrance, chamberCenter, gridMap);
    
    // Widen entrance opening
    this.widenPath(entrancePath.slice(0, Math.min(10, entrancePath.length)), gridMap, 3);
    
    return {
      entrance,
      entrancePath,
      mainRoom: mainChamber
    };
  }

  /**
   * Create entrance and exit for forest (through-path)
   */
  private createForestEntranceExit(
    clearings: GeneratedRoom[],
    paths: Position[][],
    width: number,
    height: number
  ): EntranceExit {
    // Entrance on left, exit on right
    const entrance = { x: 0, y: Math.floor(height / 2) };
    const exit = { x: width - 1, y: Math.floor(height / 2) };
    
    // Build grid map
    const gridMap = this.buildGridMap(clearings, paths, width, height);
    
    // Create main through-path
    const mainPath = this.dijkstraPathfinding(entrance, exit, gridMap);
    
    // Find clearings near the main path
    const pathClearings = clearings.filter(clearing => {
      const centerX = Math.floor(clearing.position.x + clearing.size.width / 2);
      const centerY = Math.floor(clearing.position.y + clearing.size.height / 2);
      // Check if clearing is within 15 units of main path
      return mainPath.some(point => 
        Math.abs(point.x - centerX) + Math.abs(point.y - centerY) < 15
      );
    });
    
    // Widen entrance and exit
    this.widenPath(mainPath.slice(0, 10), gridMap, 3);
    this.widenPath(mainPath.slice(-10), gridMap, 3);
    
    return {
      entrance,
      exit,
      entrancePath: mainPath.slice(0, Math.floor(mainPath.length / 2)),
      exitPath: mainPath.slice(Math.floor(mainPath.length / 2)),
      mainRoom: pathClearings[0] // First clearing on path
    };
  }

  /**
   * Widen a path by carving neighboring cells
   */
  private widenPath(path: Position[], gridMap: boolean[][], width: number): void {
    const height = gridMap.length;
    const gridWidth = gridMap[0].length;
    const radius = Math.floor(width / 2);
    
    for (const point of path) {
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const x = Math.floor(point.x) + dx;
          const y = Math.floor(point.y) + dy;
          if (x >= 0 && x < gridWidth && y >= 0 && y < height) {
            gridMap[y][x] = false; // Floor
          }
        }
      }
    }
  }

  // ============================================================================
  // END ENTRANCE & EXIT
  // ============================================================================

  private generateRoomsByTerrain(options: MapGenerationOptions): GeneratedRoom[] {
    switch (options.terrainType) {
      case MapTerrainType.HOUSE:
        return this.generateBSPRooms(options); // Use BSP for houses
      case MapTerrainType.FOREST:
        return this.generateBSPRooms(options); // Use BSP for forests (clearings as rooms)
      case MapTerrainType.CAVE:
        return this.generateBSPRooms(options); // Use BSP for caves
      case MapTerrainType.TOWN:
        return this.generateBSPRooms(options); // Use BSP for towns (buildings as rooms)
      case MapTerrainType.DUNGEON:
        return this.generateBSPRooms(options); // Use BSP for dungeons
      default:
        return this.generateBSPRooms(options);
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
  private createBackgroundLayer(colorTheme: TerrainColorTheme, options: MapGenerationOptions): MapLayer {
    const objects: MapObject[] = [];
    
    // Special handling for Wizard Tower - add circular tower structures
    if (options.terrainType === MapTerrainType.HOUSE && options.subtype === HouseSubtype.WIZARD_TOWER) {
      const { width, height } = options;
      
      // Main tower - large circle in center
      const mainTowerRadius = Math.min(width, height) * 0.35;
      const mainTowerX = width / 2;
      const mainTowerY = height / 2;
      
      objects.push({
        id: uuidv4(),
        type: ObjectType.DECORATION,
        position: { x: mainTowerX - mainTowerRadius, y: mainTowerY - mainTowerRadius },
        size: { width: mainTowerRadius * 2, height: mainTowerRadius * 2 },
        name: 'main_tower',
        color: colorTheme.pathColor,
        properties: {
          shape: { type: 'circle' },
          isTower: true,
          towerType: 'main'
        },
        isVisible: true,
        isInteractive: false
      });
      
      // Randomly add 1-2 smaller towers
      const numSmallTowers = Math.floor(this.random() * 2) + 1; // 1 or 2 towers
      
      for (let i = 0; i < numSmallTowers; i++) {
        const smallTowerRadius = mainTowerRadius * (0.3 + this.random() * 0.2); // 30-50% of main tower
        
        // Position around the main tower
        const angle = (i / numSmallTowers) * Math.PI * 2 + this.random() * 0.5;
        const distance = mainTowerRadius * 0.8;
        const smallTowerX = mainTowerX + Math.cos(angle) * distance;
        const smallTowerY = mainTowerY + Math.sin(angle) * distance;
        
        objects.push({
          id: uuidv4(),
          type: ObjectType.DECORATION,
          position: { x: smallTowerX - smallTowerRadius, y: smallTowerY - smallTowerRadius },
          size: { width: smallTowerRadius * 2, height: smallTowerRadius * 2 },
          name: `small_tower_${i}`,
          color: colorTheme.pathColor,
          properties: {
            shape: { type: 'circle' },
            isTower: true,
            towerType: 'small'
          },
          isVisible: true,
          isInteractive: false
        });
      }
    }
    
    return {
      id: uuidv4(),
      name: 'Background',
      type: LayerType.BACKGROUND,
      objects,
      isVisible: true,
      isLocked: false,
      opacity: 1
    };
  }

  /**
   * Create unified terrain layer combining rooms and corridors
   * This merges what used to be separate room and path layers
   */
  private createUnifiedTerrainLayer(
    rooms: GeneratedRoom[], 
    corridors: Position[][], 
    colorTheme: TerrainColorTheme
  ): MapLayer {
    const terrainObjects: MapObject[] = [];
    
    // 1. Add all rooms as terrain objects
    rooms.forEach(room => {
      terrainObjects.push({
        id: room.id,
        type: ObjectType.DECORATION,
        position: room.position,
        size: room.size,
        name: `${room.type}_room`,
        color: colorTheme.pathColor,
        properties: {
          roomType: room.type,
          shape: room.shape,
          isRoom: true
        },
        isVisible: true,
        isInteractive: false
      });
    });
    
    // 2. Add all corridors as individual path cells
    corridors.forEach((corridor, corridorIndex) => {
      if (corridor.length === 0) return;
      
      // Create an object for each cell in the corridor
      corridor.forEach((point, pointIndex) => {
        terrainObjects.push({
          id: uuidv4(),
          type: ObjectType.DECORATION,
          position: { x: point.x, y: point.y },
          size: { width: 1, height: 1 }, // Single grid cell
          name: `path_corridor_${corridorIndex}_${pointIndex}`, // Include 'path' for rendering
          color: colorTheme.pathColor, // Same color as rooms
          properties: {
            isCorridor: true,
            corridorIndex: corridorIndex
          },
          isVisible: true,
          isInteractive: false
        });
      });
    });
    
    return {
      id: uuidv4(),
      name: 'Terrain',
      type: LayerType.TERRAIN,
      objects: terrainObjects,
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
      opacity: 1.0, // Full opacity - layer opacity will control visibility
      properties: {
        gridType: 'square',
        cellSize: 1, // 1 grid cell = 1 unit
        lineColor: { r: 0, g: 0, b: 0, a: 1.0 }, // Black grid lines
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
      opacity: 1.0 // Start at 100% opacity
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
      // Create curved, natural-looking path using Bezier curves
      const pathPoints: (Position & { width?: number })[] = [];
      const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
      
      // Calculate control point once for consistent curve
      const midX = (startX + endX) / 2 + (this.random() - 0.5) * distance * 0.4;
      const midY = (startY + endY) / 2 + (this.random() - 0.5) * distance * 0.4;
      
      // Create dense path segments (every 0.5 units) for smooth overlapping appearance
      const numSegments = Math.max(16, Math.floor(distance * 2));
      
      for (let i = 0; i <= numSegments; i++) {
        const t = i / numSegments;
        
        // Quadratic Bezier curve formula: B(t) = (1-t)²P0 + 2(1-t)tP1 + t²P2
        const bezierX = Math.pow(1-t, 2) * startX + 2 * (1-t) * t * midX + Math.pow(t, 2) * endX;
        const bezierY = Math.pow(1-t, 2) * startY + 2 * (1-t) * t * midY + Math.pow(t, 2) * endY;
        
        // Add subtle wobble for organic feel (reduced for smoother paths)
        const wobbleX = (this.random() - 0.5) * 0.5;
        const wobbleY = (this.random() - 0.5) * 0.5;
        
        const finalX = bezierX + wobbleX;
        const finalY = bezierY + wobbleY;
        
        // Variable width (less variation for smoother appearance)
        const widthVariation = this.random() < 0.15 ? (this.random() < 0.5 ? 0.5 : -0.5) : 0;
        
        pathPoints.push({
          x: finalX, // Don't round - keep decimal precision for smooth curves
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
    // Return empty layer - users will place their own objects
    return {
      id: uuidv4(),
      name: 'Objects',
      type: LayerType.OBJECTS,
      objects: [],
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