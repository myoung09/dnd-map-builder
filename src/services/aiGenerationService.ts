import { DnDMap, MapObject, TerrainType, ObjectType } from '../types/map';
import { createNewMap, DEFAULT_TERRAIN_COLORS } from '../utils/mapUtils';
import { AI_GENERATION } from '../utils/constants';

export interface AIGenerationOptions {
  mapSize: { width: number; height: number };
  style: 'dungeon' | 'wilderness' | 'city' | 'tavern' | 'temple' | 'custom';
  complexity: 'simple' | 'moderate' | 'complex';
  includeObjects: boolean;
  seed?: string; // For reproducible results
}

export interface AIGenerationResult {
  success: boolean;
  message: string;
  map?: DnDMap;
  generationId?: string;
}

interface ParsedMapData {
  terrain: Array<{ x: number; y: number; type: TerrainType; description?: string }>;
  objects: Array<{ 
    x: number; 
    y: number; 
    width: number; 
    height: number; 
    type: ObjectType; 
    name: string; 
    description?: string 
  }>;
  metadata: {
    name: string;
    description: string;
    theme: string;
  };
}

class AIMapGenerationService {
  private apiKey: string | null = null;
  private baseUrl = 'https://api.openai.com/v1';

  constructor() {
    // In a real app, you'd get this from environment variables or user settings
    // For demo purposes, we'll simulate the API responses
    this.apiKey = process.env.REACT_APP_OPENAI_API_KEY || null;
  }

  setApiKey(key: string) {
    this.apiKey = key;
  }

  // Main generation method
  async generateMap(prompt: string, options: AIGenerationOptions): Promise<AIGenerationResult> {
    try {
      // Validate inputs
      if (!prompt.trim()) {
        return {
          success: false,
          message: 'Please provide a description for the map'
        };
      }

      if (prompt.length > AI_GENERATION.MAX_PROMPT_LENGTH) {
        return {
          success: false,
          message: `Prompt is too long. Maximum ${AI_GENERATION.MAX_PROMPT_LENGTH} characters allowed.`
        };
      }

      const generationId = crypto.randomUUID();

      // For now, we'll use a mock generation system
      // In production, you'd replace this with actual AI API calls
      const mapData = await this.mockGenerateMapData(prompt, options);
      
      if (!mapData) {
        return {
          success: false,
          message: 'Failed to generate map data'
        };
      }

      // Convert AI response to our map format
      const map = await this.convertToMapFormat(mapData, options, generationId, prompt);

      return {
        success: true,
        message: 'Map generated successfully',
        map,
        generationId
      };

    } catch (error) {
      console.error('AI Generation Error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown generation error'
      };
    }
  }

  // Mock generation for demonstration (replace with real AI API)
  private async mockGenerateMapData(prompt: string, options: AIGenerationOptions): Promise<ParsedMapData> {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const { width, height } = options.mapSize;
    const terrain: Array<{ x: number; y: number; type: TerrainType; description?: string }> = [];
    const objects: Array<{ 
      x: number; 
      y: number; 
      width: number; 
      height: number; 
      type: ObjectType; 
      name: string; 
      description?: string 
    }> = [];

    // Generate based on style and prompt keywords
    const promptLower = prompt.toLowerCase();
    
    // Determine primary terrain based on prompt
    let primaryTerrain = TerrainType.FLOOR;
    let wallTerrain = TerrainType.WALL;
    
    if (promptLower.includes('forest') || promptLower.includes('wilderness')) {
      primaryTerrain = TerrainType.GRASS;
      wallTerrain = TerrainType.WALL;
    } else if (promptLower.includes('water') || promptLower.includes('lake') || promptLower.includes('river')) {
      primaryTerrain = TerrainType.WATER;
    } else if (promptLower.includes('desert') || promptLower.includes('sand')) {
      primaryTerrain = TerrainType.SAND;
    } else if (promptLower.includes('cave') || promptLower.includes('stone')) {
      primaryTerrain = TerrainType.STONE;
    }

    // Generate basic room/area structure
    if (options.style === 'dungeon' || promptLower.includes('dungeon') || promptLower.includes('room')) {
      this.generateDungeonLayout(terrain, objects, width, height, options);
    } else if (options.style === 'wilderness' || promptLower.includes('forest') || promptLower.includes('wilderness')) {
      this.generateWildernessLayout(terrain, objects, width, height, options);
    } else {
      this.generateGenericLayout(terrain, objects, width, height, primaryTerrain, wallTerrain, options);
    }

    // Generate name and description
    const mapName = this.generateMapName(prompt, options.style);
    const description = `Generated map based on: "${prompt}"`;

    return {
      terrain,
      objects,
      metadata: {
        name: mapName,
        description,
        theme: options.style
      }
    };
  }

  private generateDungeonLayout(
    terrain: Array<{ x: number; y: number; type: TerrainType }>, 
    objects: Array<any>,
    width: number, 
    height: number, 
    options: AIGenerationOptions
  ) {
    // Fill with walls
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        terrain.push({ x, y, type: TerrainType.WALL });
      }
    }

    // Create rooms
    const rooms = [
      { x: 5, y: 5, width: 8, height: 6 },
      { x: 15, y: 3, width: 6, height: 8 },
      { x: 25, y: 8, width: 10, height: 7 },
      { x: 8, y: 15, width: 12, height: 8 }
    ];

    // Carve out rooms
    rooms.forEach(room => {
      for (let x = room.x; x < Math.min(room.x + room.width, width); x++) {
        for (let y = room.y; y < Math.min(room.y + room.height, height); y++) {
          const index = terrain.findIndex(t => t.x === x && t.y === y);
          if (index >= 0) {
            terrain[index].type = TerrainType.FLOOR;
          }
        }
      }

      // Add doors
      if (options.includeObjects && room.x + room.width < width - 1) {
        const doorY = room.y + Math.floor(room.height / 2);
        const doorIndex = terrain.findIndex(t => t.x === room.x + room.width && t.y === doorY);
        if (doorIndex >= 0) {
          terrain[doorIndex].type = TerrainType.DOOR;
        }
      }
    });

    // Add corridors between rooms
    this.addCorridors(terrain, rooms, width, height);

    // Add objects in rooms
    if (options.includeObjects) {
      rooms.forEach((room, index) => {
        if (index === 0) {
          // First room - treasure
          objects.push({
            x: room.x + 2,
            y: room.y + 2,
            width: 1,
            height: 1,
            type: ObjectType.TREASURE,
            name: 'Treasure Chest',
            description: 'A mysterious treasure chest'
          });
        } else if (index === 1) {
          // Second room - furniture
          objects.push({
            x: room.x + 1,
            y: room.y + 1,
            width: 2,
            height: 1,
            type: ObjectType.FURNITURE,
            name: 'Table',
            description: 'A wooden table'
          });
        }
      });
    }
  }

  private generateWildernessLayout(
    terrain: Array<{ x: number; y: number; type: TerrainType }>, 
    objects: Array<any>,
    width: number, 
    height: number, 
    options: AIGenerationOptions
  ) {
    // Fill with grass
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        terrain.push({ x, y, type: TerrainType.GRASS });
      }
    }

    // Add water features
    const riverY = Math.floor(height * 0.3);
    for (let x = 0; x < width; x++) {
      for (let y = riverY; y < riverY + 3 && y < height; y++) {
        const index = terrain.findIndex(t => t.x === x && t.y === y);
        if (index >= 0) {
          terrain[index].type = TerrainType.WATER;
        }
      }
    }

    // Add rocky areas
    const rocks = [
      { x: 10, y: 10, width: 4, height: 3 },
      { x: 25, y: 5, width: 3, height: 4 },
      { x: 15, y: 20, width: 5, height: 2 }
    ];

    rocks.forEach(rock => {
      for (let x = rock.x; x < Math.min(rock.x + rock.width, width); x++) {
        for (let y = rock.y; y < Math.min(rock.y + rock.height, height); y++) {
          const index = terrain.findIndex(t => t.x === x && t.y === y);
          if (index >= 0) {
            terrain[index].type = TerrainType.STONE;
          }
        }
      }
    });

    // Add paths
    const pathY = Math.floor(height * 0.7);
    for (let x = 0; x < width; x++) {
      const index = terrain.findIndex(t => t.x === x && t.y === pathY);
      if (index >= 0) {
        terrain[index].type = TerrainType.DIRT;
      }
    }
  }

  private generateGenericLayout(
    terrain: Array<{ x: number; y: number; type: TerrainType }>, 
    objects: Array<any>,
    width: number, 
    height: number, 
    primaryTerrain: TerrainType,
    wallTerrain: TerrainType,
    options: AIGenerationOptions
  ) {
    // Fill with primary terrain
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        terrain.push({ x, y, type: primaryTerrain });
      }
    }

    // Add border walls
    for (let x = 0; x < width; x++) {
      const topIndex = terrain.findIndex(t => t.x === x && t.y === 0);
      const bottomIndex = terrain.findIndex(t => t.x === x && t.y === height - 1);
      if (topIndex >= 0) terrain[topIndex].type = wallTerrain;
      if (bottomIndex >= 0) terrain[bottomIndex].type = wallTerrain;
    }
    for (let y = 0; y < height; y++) {
      const leftIndex = terrain.findIndex(t => t.x === 0 && t.y === y);
      const rightIndex = terrain.findIndex(t => t.x === width - 1 && t.y === y);
      if (leftIndex >= 0) terrain[leftIndex].type = wallTerrain;
      if (rightIndex >= 0) terrain[rightIndex].type = wallTerrain;
    }
  }

  private addCorridors(
    terrain: Array<{ x: number; y: number; type: TerrainType }>, 
    rooms: Array<{ x: number; y: number; width: number; height: number }>,
    width: number, 
    height: number
  ) {
    for (let i = 0; i < rooms.length - 1; i++) {
      const room1 = rooms[i];
      const room2 = rooms[i + 1];
      
      const start = {
        x: room1.x + Math.floor(room1.width / 2),
        y: room1.y + Math.floor(room1.height / 2)
      };
      
      const end = {
        x: room2.x + Math.floor(room2.width / 2),
        y: room2.y + Math.floor(room2.height / 2)
      };

      // Horizontal corridor
      const minX = Math.min(start.x, end.x);
      const maxX = Math.max(start.x, end.x);
      for (let x = minX; x <= maxX; x++) {
        const index = terrain.findIndex(t => t.x === x && t.y === start.y);
        if (index >= 0) {
          terrain[index].type = TerrainType.FLOOR;
        }
      }

      // Vertical corridor
      const minY = Math.min(start.y, end.y);
      const maxY = Math.max(start.y, end.y);
      for (let y = minY; y <= maxY; y++) {
        const index = terrain.findIndex(t => t.x === end.x && t.y === y);
        if (index >= 0) {
          terrain[index].type = TerrainType.FLOOR;
        }
      }
    }
  }

  private generateMapName(prompt: string, style: string): string {
    const words = prompt.toLowerCase().split(/\s+/);
    const keyWords = words.filter(word => 
      !['a', 'an', 'the', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'by'].includes(word)
    );
    
    const firstWord = keyWords[0] || style;
    const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
    
    const suffixes = {
      dungeon: ['Dungeon', 'Catacombs', 'Lair', 'Chambers'],
      wilderness: ['Forest', 'Wilderness', 'Grove', 'Woods'],
      city: ['City', 'Town', 'Settlement', 'District'],
      tavern: ['Tavern', 'Inn', 'Alehouse', 'Lodge'],
      temple: ['Temple', 'Shrine', 'Sanctum', 'Chapel'],
      custom: ['Map', 'Area', 'Region', 'Location']
    };

    const suffix = suffixes[style as keyof typeof suffixes] || suffixes.custom;
    const randomSuffix = suffix[Math.floor(Math.random() * suffix.length)];
    
    return `${capitalize(firstWord)} ${randomSuffix}`;
  }

  // Convert parsed AI data to our map format
  private async convertToMapFormat(
    data: ParsedMapData, 
    options: AIGenerationOptions, 
    generationId: string,
    originalPrompt: string
  ): Promise<DnDMap> {
    const map = createNewMap(data.metadata.name, options.mapSize);
    
    // Update metadata
    map.metadata.description = data.metadata.description;
    if (!map.metadata.generationHistory) {
      map.metadata.generationHistory = [];
    }
    map.metadata.generationHistory.push({
      id: generationId,
      prompt: originalPrompt,
      timestamp: new Date(),
      parameters: options
    });

    // Find terrain layer
    const terrainLayer = map.layers.find(layer => layer.type === 'terrain');
    if (terrainLayer && terrainLayer.tiles) {
      // Update terrain tiles
      data.terrain.forEach(terrainData => {
        const tile = terrainLayer.tiles!.find(t => 
          t.position.x === terrainData.x && t.position.y === terrainData.y
        );
        if (tile) {
          tile.terrainType = terrainData.type;
          tile.color = DEFAULT_TERRAIN_COLORS[terrainData.type];
        }
      });
    }

    // Add objects to objects layer
    const objectsLayer = map.layers.find(layer => layer.type === 'objects');
    if (objectsLayer && data.objects.length > 0) {
      if (!objectsLayer.objects) {
        objectsLayer.objects = [];
      }
      
      data.objects.forEach(objData => {
        const mapObject: MapObject = {
          id: crypto.randomUUID(),
          type: objData.type,
          position: { x: objData.x, y: objData.y },
          size: { width: objData.width, height: objData.height },
          name: objData.name,
          description: objData.description,
          color: { r: 255, g: 107, b: 107 }, // Default red color
          isVisible: true,
          isInteractive: true
        };
        
        objectsLayer.objects!.push(mapObject);
      });
    }

    return map;
  }

  // Check if AI service is configured
  isConfigured(): boolean {
    return this.apiKey !== null;
  }

  // Get available generation styles
  getAvailableStyles(): Array<{ value: string; label: string; description: string }> {
    return [
      { value: 'dungeon', label: 'Dungeon', description: 'Underground chambers and corridors' },
      { value: 'wilderness', label: 'Wilderness', description: 'Forests, rivers, and natural landscapes' },
      { value: 'city', label: 'City', description: 'Urban areas with buildings and streets' },
      { value: 'tavern', label: 'Tavern', description: 'Indoor tavern or inn layout' },
      { value: 'temple', label: 'Temple', description: 'Religious or ceremonial spaces' },
      { value: 'custom', label: 'Custom', description: 'Let AI determine based on prompt' }
    ];
  }
}

// Export singleton instance
export const aiMapGenerationService = new AIMapGenerationService();