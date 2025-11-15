import { TerrainType, ObjectType, MapObject } from '../types/map';
import { AssetCategory } from '../components/AssetBrowser/AssetBrowser';

export interface GenerationSeed {
  seed: string;
  hash: number;
}

export interface ProceduralAsset {
  id: string;
  type: ObjectType;
  category: AssetCategory;
  name: string;
  description: string;
  size: { width: number; height: number };
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  placementRules: PlacementRule[];
}

export interface PlacementRule {
  type: 'near' | 'avoid' | 'on_terrain' | 'edge' | 'center' | 'corner';
  target?: ObjectType | TerrainType | 'wall' | 'door';
  distance?: number;
  probability: number;
}

export interface AssetGenerationContext {
  poiType: string;
  difficulty: number;
  mood: string;
  theme: string;
  size: { width: number; height: number };
  requiredFeatures: string[];
  terrainTypes: string[];
}

export interface Room {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'room' | 'hallway' | 'entrance' | 'exit' | 'clearing' | 'trail';
  connections: string[]; // IDs of connected rooms
  environmentType?: string; // e.g., 'clearing', 'chamber', 'room', 'study'
}

export interface MapLayout {
  rooms: Room[];
  corridors: Array<{ from: string; to: string; path: Array<{ x: number; y: number }> }>;
  entrances: Array<{ x: number; y: number; roomId: string }>;
  exits: Array<{ x: number; y: number; roomId: string }>;
  environmentType: string; // 'dungeon', 'forest', 'tavern', 'home', etc.
}

class ProceduralGenerationService {
  private rng: SeededRNG;
  private lastMapLayout: MapLayout | null = null;

  constructor() {
    this.rng = new SeededRNG('default');
  }

  /**
   * Set the seed for reproducible generation
   */
  setSeed(seed: string): GenerationSeed {
    const hash = this.hashSeed(seed);
    this.rng = new SeededRNG(seed);
    return { seed, hash };
  }

  /**
   * Generate contextual assets based on POI requirements
   */
  generateAssetsForPOI(context: AssetGenerationContext): ProceduralAsset[] {
    const assets: ProceduralAsset[] = [];

    // Generate required features first
    for (const feature of context.requiredFeatures) {
      const asset = this.generateFeatureAsset(feature, context);
      if (asset) {
        assets.push(asset);
      }
    }

    // Generate theme-appropriate furniture and decorations
    const furnitureAssets = this.generateThematicFurniture(context);
    assets.push(...furnitureAssets);

    // Generate creatures based on difficulty and mood
    const creatureAssets = this.generateCreatures(context);
    assets.push(...creatureAssets);

    // Generate treasure and interactive objects
    const interactiveAssets = this.generateInteractiveObjects(context);
    assets.push(...interactiveAssets);

    // Generate atmospheric decorations
    const decorativeAssets = this.generateDecorations(context);
    assets.push(...decorativeAssets);

    return assets;
  }

  /**
   * Generate placement positions for assets on a map
   */
  generateAssetPlacements(
    assets: ProceduralAsset[], 
    mapSize: { width: number; height: number },
    terrainMap: TerrainType[][]
  ): MapObject[] {
    const placements: MapObject[] = [];
    const occupiedPositions = new Set<string>();

    // Sort assets by rarity (legendary first, then rare, etc.)
    const sortedAssets = [...assets].sort((a, b) => {
      const rarityOrder = { legendary: 0, rare: 1, uncommon: 2, common: 3 };
      return rarityOrder[a.rarity] - rarityOrder[b.rarity];
    });

    for (const asset of sortedAssets) {
      const positions = this.findValidPositions(asset, mapSize, terrainMap, placements);
      
      if (positions.length > 0) {
        // Apply placement rules to filter positions
        const validPositions = this.filterPositionsByRules(positions, asset, placements, terrainMap);
        
        if (validPositions.length > 0) {
          const chosenPosition = validPositions[this.rng.nextInt(validPositions.length)];
          
          const mapObject: MapObject = {
            id: asset.id,
            type: asset.type,
            position: { x: chosenPosition.x, y: chosenPosition.y },
            size: { width: asset.size.width, height: asset.size.height },
            rotation: this.rng.nextInt(4) * 90, // Random rotation in 90° increments
            name: asset.name,
            description: asset.description,
            properties: {
              procedural: true,
              rarity: asset.rarity,
              seed: this.rng.getSeed()
            }
          };

          placements.push(mapObject);

          // Mark occupied positions
          for (let x = chosenPosition.x; x < chosenPosition.x + asset.size.width; x++) {
            for (let y = chosenPosition.y; y < chosenPosition.y + asset.size.height; y++) {
              occupiedPositions.add(`${x},${y}`);
            }
          }
        }
      }
    }

    return placements;
  }

  /**
   * Generate terrain layout using procedural algorithms
   */
  generateTerrainLayout(
    size: { width: number; height: number },
    terrainTypes: string[],
    style: string
  ): TerrainType[][] {
    const terrain: TerrainType[][] = Array(size.height).fill(null).map(() => 
      Array(size.width).fill(TerrainType.FLOOR)
    );

    switch (style.toLowerCase()) {
      case 'dungeon':
        return this.generateStructuredTerrain(size, terrain, 'dungeon');
      case 'wilderness':
      case 'forest':
        return this.generateStructuredTerrain(size, terrain, 'forest');
      case 'city':
        return this.generateStructuredTerrain(size, terrain, 'city');
      case 'temple':
        return this.generateStructuredTerrain(size, terrain, 'temple');
      case 'tavern':
        return this.generateStructuredTerrain(size, terrain, 'tavern');
      case 'home':
        return this.generateStructuredTerrain(size, terrain, 'home');
      default:
        return this.generateStructuredTerrain(size, terrain, 'dungeon');
    }
  }

  // Private helper methods

  private hashSeed(seed: string): number {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private generateFeatureAsset(feature: string, context: AssetGenerationContext): ProceduralAsset | null {
    const featureMap: Record<string, Partial<ProceduralAsset>> = {
      'altar': {
        type: ObjectType.FURNITURE,
        category: AssetCategory.FURNITURE,
        name: `${context.theme} Altar`,
        size: { width: 2, height: 2 },
        rarity: 'uncommon',
        placementRules: [
          { type: 'center', probability: 0.7 },
          { type: 'avoid', target: 'door', distance: 3, probability: 1.0 }
        ]
      },
      'trap': {
        type: ObjectType.FURNITURE,
        category: AssetCategory.FURNITURE,
        name: 'Hidden Trap',
        size: { width: 1, height: 1 },
        rarity: 'rare',
        placementRules: [
          { type: 'near', target: 'door', distance: 2, probability: 0.8 }
        ]
      },
      'treasure_chest': {
        type: ObjectType.FURNITURE,
        category: AssetCategory.FURNITURE,
        name: 'Treasure Chest',
        size: { width: 1, height: 1 },
        rarity: 'rare',
        placementRules: [
          { type: 'corner', probability: 0.6 },
          { type: 'avoid', target: 'door', distance: 2, probability: 0.8 }
        ]
      }
    };

    const template = featureMap[feature.toLowerCase()];
    if (!template) return null;

    return {
      id: `feature_${feature}_${this.rng.nextInt(10000)}`,
      description: `A ${feature} fitting the ${context.theme} theme`,
      ...template,
      placementRules: template.placementRules || []
    } as ProceduralAsset;
  }

  private generateThematicFurniture(context: AssetGenerationContext): ProceduralAsset[] {
    const furnitureCount = Math.floor(context.size.width * context.size.height / 20) + this.rng.nextInt(3);
    const furniture: ProceduralAsset[] = [];

    const thematicItems = this.getThematicFurniture(context.theme, context.poiType);
    
    for (let i = 0; i < furnitureCount; i++) {
      const item = thematicItems[this.rng.nextInt(thematicItems.length)];
      furniture.push({
        id: `furniture_${i}_${this.rng.nextInt(10000)}`,
        type: ObjectType.FURNITURE,
        category: AssetCategory.FURNITURE,
        name: item.name,
        description: item.description,
        size: item.size,
        rarity: item.rarity,
        placementRules: item.placementRules
      });
    }

    return furniture;
  }

  private generateCreatures(context: AssetGenerationContext): ProceduralAsset[] {
    const creatureCount = Math.max(1, Math.floor(context.difficulty / 3));
    const creatures: ProceduralAsset[] = [];

    for (let i = 0; i < creatureCount; i++) {
      const creature = this.getRandomCreature(context);
      creatures.push({
        id: `creature_${i}_${this.rng.nextInt(10000)}`,
        type: ObjectType.CREATURE,
        category: AssetCategory.CREATURES,
        name: creature.name,
        description: creature.description,
        size: { width: 1, height: 1 },
        rarity: creature.rarity,
        placementRules: [
          { type: 'avoid', target: 'door', distance: 1, probability: 0.7 },
          { type: 'on_terrain', target: 'floor' as TerrainType, probability: 1.0 }
        ]
      });
    }

    return creatures;
  }

  private generateInteractiveObjects(context: AssetGenerationContext): ProceduralAsset[] {
    const objects: ProceduralAsset[] = [];
    
    // Add doors
    const doorCount = Math.max(1, Math.floor(context.size.width / 10));
    for (let i = 0; i < doorCount; i++) {
      objects.push({
        id: `door_${i}_${this.rng.nextInt(10000)}`,
        type: ObjectType.FURNITURE,
        category: AssetCategory.FURNITURE,
        name: 'Door',
        description: 'A sturdy door',
        size: { width: 1, height: 1 },
        rarity: 'common',
        placementRules: [
          { type: 'edge', probability: 1.0 }
        ]
      });
    }

    return objects;
  }

  private generateDecorations(context: AssetGenerationContext): ProceduralAsset[] {
    const decorationCount = Math.floor(context.size.width * context.size.height / 30);
    const decorations: ProceduralAsset[] = [];

    for (let i = 0; i < decorationCount; i++) {
      const decoration = this.getRandomDecoration(context);
      decorations.push({
        id: `decoration_${i}_${this.rng.nextInt(10000)}`,
        type: ObjectType.DECORATION,
        category: AssetCategory.DECORATIONS,
        name: decoration.name,
        description: decoration.description,
        size: { width: 1, height: 1 },
        rarity: 'common',
        placementRules: [
          { type: 'avoid', target: 'door', distance: 1, probability: 0.9 }
        ]
      });
    }

    return decorations;
  }

  private findValidPositions(
    asset: ProceduralAsset, 
    mapSize: { width: number; height: number },
    terrainMap: TerrainType[][],
    existingPlacements: MapObject[]
  ): { x: number; y: number }[] {
    const positions: { x: number; y: number }[] = [];

    for (let x = 0; x <= mapSize.width - asset.size.width; x++) {
      for (let y = 0; y <= mapSize.height - asset.size.height; y++) {
        if (this.isPositionValid(x, y, asset, terrainMap, existingPlacements)) {
          positions.push({ x, y });
        }
      }
    }

    return positions;
  }

  private isPositionValid(
    x: number, 
    y: number, 
    asset: ProceduralAsset, 
    terrainMap: TerrainType[][],
    existingPlacements: MapObject[]
  ): boolean {
    // Check if position is within bounds
    if (x < 0 || y < 0 || x + asset.size.width > terrainMap[0].length || y + asset.size.height > terrainMap.length) {
      return false;
    }

    // Check that all positions of the asset are inside room interiors (not in hallways or walls)
    for (let assetX = x; assetX < x + asset.size.width; assetX++) {
      for (let assetY = y; assetY < y + asset.size.height; assetY++) {
        if (!this.isPositionInRoomInterior(assetX, assetY)) {
          return false;
        }
      }
    }

    // Check for overlaps with existing placements
    for (const placement of existingPlacements) {
      if (this.objectsOverlap(
        { x, y, width: asset.size.width, height: asset.size.height },
        { x: placement.position.x, y: placement.position.y, width: placement.size.width, height: placement.size.height }
      )) {
        return false;
      }
    }

    return true;
  }

  private objectsOverlap(
    obj1: { x: number; y: number; width: number; height: number },
    obj2: { x: number; y: number; width: number; height: number }
  ): boolean {
    return !(obj1.x + obj1.width <= obj2.x || 
             obj2.x + obj2.width <= obj1.x || 
             obj1.y + obj1.height <= obj2.y || 
             obj2.y + obj2.height <= obj1.y);
  }

  private filterPositionsByRules(
    positions: { x: number; y: number }[], 
    asset: ProceduralAsset,
    placements: MapObject[],
    terrainMap: TerrainType[][]
  ): { x: number; y: number }[] {
    return positions.filter(pos => {
      for (const rule of asset.placementRules) {
        if (this.rng.nextFloat() > rule.probability) continue;

        if (!this.satisfiesPlacementRule(pos, rule, placements, terrainMap)) {
          return false;
        }
      }
      return true;
    });
  }

  private satisfiesPlacementRule(
    position: { x: number; y: number },
    rule: PlacementRule,
    placements: MapObject[],
    terrainMap: TerrainType[][]
  ): boolean {
    const mapWidth = terrainMap[0].length;
    const mapHeight = terrainMap.length;

    switch (rule.type) {
      case 'center':
        const centerX = mapWidth / 2;
        const centerY = mapHeight / 2;
        const distanceToCenter = Math.sqrt(
          Math.pow(position.x - centerX, 2) + Math.pow(position.y - centerY, 2)
        );
        return distanceToCenter <= Math.min(mapWidth, mapHeight) / 4;

      case 'edge':
        return position.x === 0 || position.y === 0 || 
               position.x === mapWidth - 1 || position.y === mapHeight - 1;

      case 'corner':
        return (position.x === 0 || position.x === mapWidth - 1) && 
               (position.y === 0 || position.y === mapHeight - 1);

      default:
        return true;
    }
  }

  private getThematicFurniture(theme: string, poiType: string): any[] {
    // This would be expanded with comprehensive furniture lists
    const furnitureDB: Record<string, any[]> = {
      'dungeon': [
        { name: 'Ancient Pillar', description: 'A cracked stone pillar', size: { width: 1, height: 1 }, rarity: 'common', placementRules: [] },
        { name: 'Iron Brazier', description: 'A rusty iron brazier', size: { width: 1, height: 1 }, rarity: 'uncommon', placementRules: [] }
      ],
      'temple': [
        { name: 'Prayer Bench', description: 'A wooden prayer bench', size: { width: 2, height: 1 }, rarity: 'common', placementRules: [] },
        { name: 'Holy Symbol', description: 'A carved holy symbol', size: { width: 1, height: 1 }, rarity: 'uncommon', placementRules: [] }
      ]
    };

    return furnitureDB[theme.toLowerCase()] || furnitureDB['dungeon'];
  }

  private getRandomCreature(context: AssetGenerationContext): any {
    const creatures = [
      { name: 'Goblin', description: 'A small, mischievous creature', rarity: 'common' as const },
      { name: 'Orc Warrior', description: 'A fierce orc warrior', rarity: 'uncommon' as const },
      { name: 'Troll', description: 'A large, intimidating troll', rarity: 'rare' as const }
    ];

    return creatures[this.rng.nextInt(creatures.length)];
  }

  private getRandomDecoration(context: AssetGenerationContext): any {
    const decorations = [
      { name: 'Stone Rubble', description: 'Scattered stone debris' },
      { name: 'Moss Patch', description: 'A patch of green moss' },
      { name: 'Cobweb', description: 'Dusty cobwebs in the corner' }
    ];

    return decorations[this.rng.nextInt(decorations.length)];
  }

  private generateStructuredTerrain(size: { width: number; height: number }, terrain: TerrainType[][], environmentType: string): TerrainType[][] {
    // Generate proper layout with connected rooms/areas
    const layout = this.generateMapLayout(size, environmentType);
    
    // Apply environment-specific terrain generation
    this.applyEnvironmentTerrain(terrain, layout, size, environmentType);
    
    // Store the layout for use in asset placement
    this.lastMapLayout = layout;
    
    return terrain;
  }

  private applyEnvironmentTerrain(terrain: TerrainType[][], layout: MapLayout, size: { width: number; height: number }, environmentType: string): void {
    switch (environmentType.toLowerCase()) {
      case 'dungeon':
        this.applyDungeonTerrain(terrain, layout, size);
        break;
      case 'forest':
        this.applyForestTerrain(terrain, layout, size);
        break;
      case 'tavern':
      case 'home':
        this.applyBuildingTerrain(terrain, layout, size);
        break;
      case 'temple':
        this.applyTempleTerrain(terrain, layout, size);
        break;
      case 'city':
        this.applyCityTerrain(terrain, layout, size);
        break;
      default:
        this.applyDungeonTerrain(terrain, layout, size);
        break;
    }
  }

  private applyDungeonTerrain(terrain: TerrainType[][], layout: MapLayout, size: { width: number; height: number }): void {
    // Fill everything with walls initially
    for (let y = 0; y < size.height; y++) {
      for (let x = 0; x < size.width; x++) {
        terrain[y][x] = TerrainType.WALL;
      }
    }
    
    // Carve out rooms (chambers)
    layout.rooms.forEach((room: Room) => {
      for (let y = room.y; y < room.y + room.height; y++) {
        for (let x = room.x; x < room.x + room.width; x++) {
          if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
            // Create walls around the edges, floor inside
            if (x === room.x || x === room.x + room.width - 1 || 
                y === room.y || y === room.y + room.height - 1) {
              terrain[y][x] = TerrainType.WALL;
            } else {
              terrain[y][x] = TerrainType.FLOOR;
            }
          }
        }
      }
    });
    
    // Carve out corridors
    layout.corridors.forEach((corridor) => {
      corridor.path.forEach((point) => {
        if (point.x >= 0 && point.x < size.width && point.y >= 0 && point.y < size.height) {
          terrain[point.y][point.x] = TerrainType.FLOOR;
        }
      });
    });
    
    // Place doors at entrances and exits
    layout.entrances.forEach((entrance) => {
      if (entrance.x >= 0 && entrance.x < size.width && entrance.y >= 0 && entrance.y < size.height) {
        terrain[entrance.y][entrance.x] = TerrainType.DOOR;
      }
    });
    
    layout.exits.forEach((exit) => {
      if (exit.x >= 0 && exit.x < size.width && exit.y >= 0 && exit.y < size.height) {
        terrain[exit.y][exit.x] = TerrainType.DOOR;
      }
    });
  }

  private applyForestTerrain(terrain: TerrainType[][], layout: MapLayout, size: { width: number; height: number }): void {
    // Fill everything with forest/dense terrain initially
    for (let y = 0; y < size.height; y++) {
      for (let x = 0; x < size.width; x++) {
        terrain[y][x] = TerrainType.DIFFICULT_TERRAIN; // Dense forest/undergrowth
      }
    }
    
    // Create clearings (open spaces)
    layout.rooms.forEach((room: Room) => {
      for (let y = room.y; y < room.y + room.height; y++) {
        for (let x = room.x; x < room.x + room.width; x++) {
          if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
            terrain[y][x] = TerrainType.FLOOR; // Clearing
          }
        }
      }
    });
    
    // Create trails (paths between clearings)
    layout.corridors.forEach((corridor) => {
      corridor.path.forEach((point) => {
        if (point.x >= 0 && point.x < size.width && point.y >= 0 && point.y < size.height) {
          terrain[point.y][point.x] = TerrainType.FLOOR; // Trail
        }
      });
    });
    
    // Mark entrances and exits (forest edges)
    layout.entrances.forEach((entrance) => {
      if (entrance.x >= 0 && entrance.x < size.width && entrance.y >= 0 && entrance.y < size.height) {
        terrain[entrance.y][entrance.x] = TerrainType.FLOOR;
      }
    });
    
    layout.exits.forEach((exit) => {
      if (exit.x >= 0 && exit.x < size.width && exit.y >= 0 && exit.y < size.height) {
        terrain[exit.y][exit.x] = TerrainType.FLOOR;
      }
    });
  }

  private applyBuildingTerrain(terrain: TerrainType[][], layout: MapLayout, size: { width: number; height: number }): void {
    // Similar to dungeon but more domestic
    this.applyDungeonTerrain(terrain, layout, size);
  }

  private applyTempleTerrain(terrain: TerrainType[][], layout: MapLayout, size: { width: number; height: number }): void {
    // Similar to dungeon but more sacred
    this.applyDungeonTerrain(terrain, layout, size);
  }

  private applyCityTerrain(terrain: TerrainType[][], layout: MapLayout, size: { width: number; height: number }): void {
    // Fill with floor (plaza/street base)
    for (let y = 0; y < size.height; y++) {
      for (let x = 0; x < size.width; x++) {
        terrain[y][x] = TerrainType.FLOOR;
      }
    }
    
    // Create areas/plazas
    layout.rooms.forEach((room: Room) => {
      // City areas are just marked zones, keep as floor
      for (let y = room.y; y < room.y + room.height; y++) {
        for (let x = room.x; x < room.x + room.width; x++) {
          if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
            terrain[y][x] = TerrainType.FLOOR;
          }
        }
      }
    });
  }

  private isPositionInRoomInterior(x: number, y: number): boolean {
    if (!this.lastMapLayout) return false;
    
    for (const room of this.lastMapLayout.rooms) {
      // Check if position is inside room interior (not on walls)
      if (x > room.x && x < room.x + room.width - 1 &&
          y > room.y && y < room.y + room.height - 1) {
        return true;
      }
    }
    return false;
  }

  private generateWildernessTerrain(size: { width: number; height: number }, terrain: TerrainType[][], terrainTypes: string[]): TerrainType[][] {
    // Use Perlin-like noise for natural terrain variation
    for (let y = 0; y < size.height; y++) {
      for (let x = 0; x < size.width; x++) {
        const noise = this.noise2D(x * 0.1, y * 0.1);
        if (noise > 0.3) terrain[y][x] = TerrainType.GRASS;
        else if (noise > 0.0) terrain[y][x] = TerrainType.DIRT;
        else terrain[y][x] = TerrainType.WATER;
      }
    }
    
    return terrain;
  }

  private generateCityTerrain(size: { width: number; height: number }, terrain: TerrainType[][]): TerrainType[][] {
    // Create street patterns
    const streetWidth = 2;
    
      // Horizontal streets
      for (let y = streetWidth; y < size.height; y += 6) {
        for (let x = 0; x < size.width; x++) {
          if (y < size.height) terrain[y][x] = TerrainType.STONE;
          if (y + 1 < size.height) terrain[y + 1][x] = TerrainType.STONE;
        }
      }
      
      // Vertical streets
      for (let x = streetWidth; x < size.width; x += 6) {
        for (let y = 0; y < size.height; y++) {
          if (x < size.width) terrain[y][x] = TerrainType.STONE;
          if (x + 1 < size.width) terrain[y][x + 1] = TerrainType.STONE;
        }
      }    return terrain;
  }

  private generateTempleTerrain(size: { width: number; height: number }, terrain: TerrainType[][]): TerrainType[][] {
    // Create a formal, symmetrical layout
    for (let y = 0; y < size.height; y++) {
      for (let x = 0; x < size.width; x++) {
        if (x === 0 || x === size.width - 1 || y === 0 || y === size.height - 1) {
          terrain[y][x] = TerrainType.WALL;
        } else if ((x + y) % 2 === 0) {
          terrain[y][x] = TerrainType.STONE; // No marble in enum, use stone
        } else {
          terrain[y][x] = TerrainType.STONE;
        }
      }
    }
    
    return terrain;
  }

  private getEnvironmentConfig(environmentType: string) {
    const configs: Record<string, any> = {
      dungeon: {
        minRooms: 3,
        maxRooms: 6,
        minRoomSize: 4,
        maxRoomSize: 9,
        buffer: 3,
        roomPrefix: 'chamber',
        roomType: 'room',
        roomEnvironmentType: 'chamber',
        connectionType: 'corridor'
      },
      forest: {
        minRooms: 2,
        maxRooms: 5,
        minRoomSize: 6,
        maxRoomSize: 12,
        buffer: 4,
        roomPrefix: 'clearing',
        roomType: 'clearing',
        roomEnvironmentType: 'clearing',
        connectionType: 'trail'
      },
      tavern: {
        minRooms: 4,
        maxRooms: 8,
        minRoomSize: 3,
        maxRoomSize: 7,
        buffer: 2,
        roomPrefix: 'room',
        roomType: 'room',
        roomEnvironmentType: 'room',
        connectionType: 'hallway'
      },
      home: {
        minRooms: 3,
        maxRooms: 6,
        minRoomSize: 3,
        maxRoomSize: 8,
        buffer: 2,
        roomPrefix: 'room',
        roomType: 'room',
        roomEnvironmentType: 'room',
        connectionType: 'hallway'
      },
      temple: {
        minRooms: 2,
        maxRooms: 4,
        minRoomSize: 5,
        maxRoomSize: 12,
        buffer: 4,
        roomPrefix: 'chamber',
        roomType: 'room',
        roomEnvironmentType: 'sacred_chamber',
        connectionType: 'passage'
      },
      city: {
        minRooms: 5,
        maxRooms: 10,
        minRoomSize: 4,
        maxRoomSize: 8,
        buffer: 2,
        roomPrefix: 'area',
        roomType: 'clearing',
        roomEnvironmentType: 'plaza',
        connectionType: 'street'
      }
    };

    return configs[environmentType.toLowerCase()] || configs.dungeon;
  }

  private generateMapLayout(size: { width: number; height: number }, environmentType: string): MapLayout {
    const rooms: Room[] = [];
    const corridors: Array<{ from: string; to: string; path: Array<{ x: number; y: number }> }> = [];
    const entrances: Array<{ x: number; y: number; roomId: string }> = [];
    const exits: Array<{ x: number; y: number; roomId: string }> = [];

    // Context-aware generation parameters
    const config = this.getEnvironmentConfig(environmentType);
    const numRooms = config.minRooms + this.rng.nextInt(config.maxRooms - config.minRooms + 1);
    const maxAttempts = 50;
    
    for (let i = 0; i < numRooms; i++) {
      let roomPlaced = false;
      let attempts = 0;
      
      while (!roomPlaced && attempts < maxAttempts) {
        const roomWidth = config.minRoomSize + this.rng.nextInt(config.maxRoomSize - config.minRoomSize + 1);
        const roomHeight = config.minRoomSize + this.rng.nextInt(config.maxRoomSize - config.minRoomSize + 1);
        const x = config.buffer + this.rng.nextInt(size.width - roomWidth - (config.buffer * 2));
        const y = config.buffer + this.rng.nextInt(size.height - roomHeight - (config.buffer * 2));
        
        // Check if room overlaps with existing rooms (with spacing buffer)
        let overlaps = false;
        for (const existingRoom of rooms) {
          if (!(x + roomWidth + config.buffer <= existingRoom.x || 
                x - config.buffer >= existingRoom.x + existingRoom.width ||
                y + roomHeight + config.buffer <= existingRoom.y || 
                y - config.buffer >= existingRoom.y + existingRoom.height)) {
            overlaps = true;
            break;
          }
        }
        
        if (!overlaps) {
          const room: Room = {
            id: `${config.roomPrefix}_${i}`,
            x,
            y,
            width: roomWidth,
            height: roomHeight,
            type: config.roomType,
            connections: [],
            environmentType: config.roomEnvironmentType
          };
          rooms.push(room);
          roomPlaced = true;
        }
        
        attempts++;
      }
    }

    // Connect all rooms using minimum spanning tree approach
    if (rooms.length > 1) {
      const connected = new Set<string>([rooms[0].id]);
      const unconnected = new Set(rooms.slice(1).map(r => r.id));
      
      while (unconnected.size > 0) {
        let minDistance = Infinity;
        let closestPair: { from: Room; to: Room } | null = null;
        
        // Find closest room pair (connected to unconnected)
        const connectedIds = Array.from(connected);
        const unconnectedIds = Array.from(unconnected);
        
        for (const connectedId of connectedIds) {
          const connectedRoom = rooms.find(r => r.id === connectedId)!;
          for (const unconnectedId of unconnectedIds) {
            const unconnectedRoom = rooms.find(r => r.id === unconnectedId)!;
            const distance = Math.abs(connectedRoom.x + connectedRoom.width/2 - unconnectedRoom.x - unconnectedRoom.width/2) +
                           Math.abs(connectedRoom.y + connectedRoom.height/2 - unconnectedRoom.y - unconnectedRoom.height/2);
            
            if (distance < minDistance) {
              minDistance = distance;
              closestPair = { from: connectedRoom, to: unconnectedRoom };
            }
          }
        }
        
        if (closestPair) {
          // Create corridor between rooms
          const corridor = this.createCorridor(closestPair.from, closestPair.to);
          corridors.push(corridor);
          
          // Update connections
          closestPair.from.connections.push(closestPair.to.id);
          closestPair.to.connections.push(closestPair.from.id);
          
          connected.add(closestPair.to.id);
          unconnected.delete(closestPair.to.id);
        }
      }
    }

    // Add entrance and exit
    if (rooms.length > 0) {
      // Entrance in first room
      const entranceRoom = rooms[0];
      const entranceX = entranceRoom.x + Math.floor(entranceRoom.width / 2);
      const entranceY = entranceRoom.y;
      entrances.push({ x: entranceX, y: entranceY, roomId: entranceRoom.id });
      
      // Exit in last room (or random room if only one)
      const exitRoom = rooms.length > 1 ? rooms[rooms.length - 1] : rooms[0];
      const exitX = exitRoom.x + Math.floor(exitRoom.width / 2);
      const exitY = exitRoom.y + exitRoom.height - 1;
      exits.push({ x: exitX, y: exitY, roomId: exitRoom.id });
    }

    return { rooms, corridors, entrances, exits, environmentType };
  }

  private createCorridor(from: Room, to: Room): { from: string; to: string; path: Array<{ x: number; y: number }> } {
    const path: Array<{ x: number; y: number }> = [];
    
    // Find connection points (center of closest edges)
    const fromCenterX = from.x + Math.floor(from.width / 2);
    const fromCenterY = from.y + Math.floor(from.height / 2);
    const toCenterX = to.x + Math.floor(to.width / 2);
    const toCenterY = to.y + Math.floor(to.height / 2);
    
    // Start from edge of 'from' room closest to 'to' room
    let startX, startY;
    if (fromCenterX < toCenterX) {
      startX = from.x + from.width;
      startY = fromCenterY;
    } else {
      startX = from.x - 1;
      startY = fromCenterY;
    }
    
    // End at edge of 'to' room closest to 'from' room  
    let endX, endY;
    if (toCenterX < fromCenterX) {
      endX = to.x + to.width;
      endY = toCenterY;
    } else {
      endX = to.x - 1;
      endY = toCenterY;
    }
    
    // Create L-shaped corridor (horizontal then vertical or vice versa)
    const horizontal_first = this.rng.nextBool();
    
    if (horizontal_first) {
      // Horizontal then vertical
      for (let x = Math.min(startX, endX); x <= Math.max(startX, endX); x++) {
        path.push({ x, y: startY });
      }
      for (let y = Math.min(startY, endY); y <= Math.max(startY, endY); y++) {
        path.push({ x: endX, y });
      }
    } else {
      // Vertical then horizontal
      for (let y = Math.min(startY, endY); y <= Math.max(startY, endY); y++) {
        path.push({ x: startX, y });
      }
      for (let x = Math.min(startX, endX); x <= Math.max(startX, endX); x++) {
        path.push({ x, y: endY });
      }
    }
    
    return { from: from.id, to: to.id, path };
  }

  private addRandomRooms(terrain: TerrainType[][], size: { width: number; height: number }): void {
    // This method is now deprecated in favor of generateDungeonLayout
    // Keeping for backward compatibility
    const numRooms = 2 + this.rng.nextInt(4);
    
    for (let i = 0; i < numRooms; i++) {
      const roomWidth = 3 + this.rng.nextInt(4);
      const roomHeight = 3 + this.rng.nextInt(4);
      const startX = 2 + this.rng.nextInt(size.width - roomWidth - 4);
      const startY = 2 + this.rng.nextInt(size.height - roomHeight - 4);
      
      // Create room walls
      for (let x = startX; x < startX + roomWidth; x++) {
        terrain[startY][x] = TerrainType.WALL;
        terrain[startY + roomHeight - 1][x] = TerrainType.WALL;
      }
      for (let y = startY; y < startY + roomHeight; y++) {
        terrain[y][startX] = TerrainType.WALL;
        terrain[y][startX + roomWidth - 1] = TerrainType.WALL;
      }
    }
  }

  private noise2D(x: number, y: number): number {
    // Simple pseudo-random noise function
    const hash = this.hashSeed(`${x},${y}`);
    return (hash % 1000) / 500 - 1; // Returns value between -1 and 1
  }
}

/**
 * Seeded Random Number Generator
 */
class SeededRNG {
  private seed: string;
  private state: number;

  constructor(seed: string) {
    this.seed = seed;
    this.state = this.hashString(seed);
  }

  getSeed(): string {
    return this.seed;
  }

  nextFloat(): number {
    this.state = (this.state * 1664525 + 1013904223) % 0x100000000;
    return this.state / 0x100000000;
  }

  nextInt(max: number): number {
    return Math.floor(this.nextFloat() * max);
  }

  nextBool(): boolean {
    return this.nextFloat() > 0.5;
  }

  choice<T>(array: T[]): T {
    return array[this.nextInt(array.length)];
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}

// Export singleton instance
export const proceduralGenerationService = new ProceduralGenerationService();