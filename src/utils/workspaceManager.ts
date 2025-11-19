import { Workspace, WorkspaceMetadata, WorkspaceMap, WorkspaceSettings, WorkspaceFolder } from '../types/workspace';
import { ParsedCampaignData } from './campaignParser';
import { TerrainType } from '../types/generator';
import { DungeonGenerator } from '../generators/DungeonGenerator';
import { CaveGenerator } from '../generators/CaveGenerator';
import { ForestGenerator } from '../generators/ForestGenerator';
import { HouseGenerator } from '../generators/HouseGenerator';

export class WorkspaceManager {
  
  /**
   * Create a new workspace from parsed campaign data
   */
  static createWorkspaceFromCampaign(parsedData: ParsedCampaignData): Workspace {
    const workspaceId = `workspace_${Date.now()}`;
    const now = new Date();

    const metadata: WorkspaceMetadata = {
      id: workspaceId,
      name: parsedData.title || 'Untitled Campaign',
      description: parsedData.description || '',
      author: 'DM',
      version: '1.0.0',
      createdAt: now,
      lastModified: now,
      campaignInfo: {
        name: parsedData.title,
        description: parsedData.description,
        playerNames: [],
        dmName: 'DM',
        systemType: 'D&D 5e',
        campaignNotes: '',
        sessionNotes: []
      },
      tags: [],
      mapCount: parsedData.pois.length
    };

    // Generate maps from POIs
    const maps: WorkspaceMap[] = parsedData.pois.map((poi, index) => {
      const terrainType = this.mapPOITypeToTerrainType(poi.type || 'dungeon');
      const mapData = this.generateMapFromPOI(poi, terrainType);

      return {
        id: poi.id || `map_${index}`,
        name: poi.name || `Map ${index + 1}`,
        description: poi.description || '',
        filePath: `maps/${poi.id || `map_${index}`}.json`,
        tags: [poi.type || '', poi.category || ''],
        createdAt: now,
        lastModified: now,
        mapData,
        isArchived: false,
        category: this.mapPOICategoryToMapCategory(poi.category || 'exploration')
      };
    });

    const settings: WorkspaceSettings = {
      defaultGridSize: 32,
      defaultMapDimensions: { width: 100, height: 100 },
      autoSave: true,
      autoSaveInterval: 5,
      backupCount: 3,
      exportFormat: 'json',
      thumbnailGeneration: true,
      recentWorkspaces: []
    };

    const folders: WorkspaceFolder[] = [];

    return {
      metadata,
      maps,
      folders,
      settings
    };
  }

  /**
   * Map POI type to terrain type
   */
  private static mapPOITypeToTerrainType(poiType: string): TerrainType {
    const mapping: Record<string, TerrainType> = {
      'dungeon': TerrainType.Dungeon,
      'cave': TerrainType.Cave,
      'cavern': TerrainType.Cave,
      'forest': TerrainType.Forest,
      'woods': TerrainType.Forest,
      'jungle': TerrainType.Forest,
      'building': TerrainType.House,
      'house': TerrainType.House,
      'temple': TerrainType.House,
      'tower': TerrainType.House,
      'castle': TerrainType.Dungeon,
      'fortress': TerrainType.Dungeon,
      'ruins': TerrainType.Dungeon
    };

    return mapping[poiType.toLowerCase()] || TerrainType.Dungeon;
  }

  /**
   * Map POI category to workspace map category
   */
  private static mapPOICategoryToMapCategory(
    poiCategory: string
  ): WorkspaceMap['category'] {
    const mapping: Record<string, WorkspaceMap['category']> = {
      'starting_location': 'encounter',
      'hub': 'city',
      'main_quest': 'dungeon',
      'side_quest': 'encounter',
      'social_encounter': 'city',
      'combat_encounter': 'encounter',
      'puzzle': 'dungeon',
      'exploration': 'other',
      'boss_fight': 'dungeon',
      'finale': 'dungeon',
      'rest_area': 'building',
      'shop': 'building',
      'information': 'city'
    };

    return mapping[poiCategory] || 'other';
  }

  /**
   * Generate a map from POI data
   */
  private static generateMapFromPOI(poi: any, terrainType: TerrainType): any {
    // Use the existing map generator
    const parameters = {
      width: poi.mapRequirements?.dimensions?.width || 100,
      height: poi.mapRequirements?.dimensions?.height || 100,
      seed: Date.now() + Math.random(),
      roomCount: 5,
      minRoomSize: 3,
      maxRoomSize: 8,
      corridorWidth: 1
    };

    let generator;
    switch (terrainType) {
      case TerrainType.House:
        generator = new HouseGenerator(parameters);
        break;
      case TerrainType.Forest:
        generator = new ForestGenerator(parameters);
        break;
      case TerrainType.Cave:
        generator = new CaveGenerator(parameters);
        break;
      case TerrainType.Dungeon:
      default:
        generator = new DungeonGenerator(parameters);
        break;
    }

    return generator.generate();
  }

  /**
   * Export workspace to JSON
   */
  static exportToJSON(workspace: Workspace): string {
    return JSON.stringify(workspace, null, 2);
  }

  /**
   * Export and download workspace as JSON file
   */
  static downloadWorkspace(workspace: Workspace, filename?: string): void {
    const json = this.exportToJSON(workspace);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `${workspace.metadata.name.replace(/\s+/g, '_')}_workspace.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Import workspace from JSON string
   */
  static importFromJSON(json: string): Workspace {
    try {
      const workspace = JSON.parse(json);
      
      // Validate required fields
      if (!workspace.metadata || !workspace.maps) {
        throw new Error('Invalid workspace format: missing required fields');
      }

      // Convert date strings back to Date objects
      workspace.metadata.createdAt = new Date(workspace.metadata.createdAt);
      workspace.metadata.lastModified = new Date(workspace.metadata.lastModified);
      
      workspace.maps.forEach((map: WorkspaceMap) => {
        map.createdAt = new Date(map.createdAt);
        map.lastModified = new Date(map.lastModified);
      });

      return workspace;
    } catch (error) {
      throw new Error(`Failed to import workspace: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Import workspace from file
   */
  static async importFromFile(file: File): Promise<Workspace> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const json = event.target?.result as string;
          const workspace = this.importFromJSON(json);
          resolve(workspace);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  }

  /**
   * Save workspace to localStorage
   */
  static saveToLocalStorage(workspace: Workspace, key: string = 'dnd_workspace'): void {
    try {
      const json = this.exportToJSON(workspace);
      localStorage.setItem(key, json);
      localStorage.setItem(`${key}_timestamp`, new Date().toISOString());
    } catch (error) {
      console.error('Failed to save workspace to localStorage:', error);
      throw new Error('Failed to save workspace: Storage quota may be exceeded');
    }
  }

  /**
   * Load workspace from localStorage
   */
  static loadFromLocalStorage(key: string = 'dnd_workspace'): Workspace | null {
    try {
      const json = localStorage.getItem(key);
      if (!json) return null;
      
      return this.importFromJSON(json);
    } catch (error) {
      console.error('Failed to load workspace from localStorage:', error);
      return null;
    }
  }

  /**
   * Clear workspace from localStorage
   */
  static clearLocalStorage(key: string = 'dnd_workspace'): void {
    localStorage.removeItem(key);
    localStorage.removeItem(`${key}_timestamp`);
  }

  /**
   * Check if localStorage has a saved workspace
   */
  static hasLocalStorageWorkspace(key: string = 'dnd_workspace'): boolean {
    return localStorage.getItem(key) !== null;
  }

  /**
   * Get timestamp of last save
   */
  static getLastSaveTimestamp(key: string = 'dnd_workspace'): Date | null {
    const timestamp = localStorage.getItem(`${key}_timestamp`);
    return timestamp ? new Date(timestamp) : null;
  }

  /**
   * Add a map to workspace
   */
  static addMapToWorkspace(workspace: Workspace, map: WorkspaceMap): Workspace {
    return {
      ...workspace,
      maps: [...workspace.maps, map],
      metadata: {
        ...workspace.metadata,
        mapCount: workspace.maps.length + 1,
        lastModified: new Date()
      }
    };
  }

  /**
   * Remove a map from workspace
   */
  static removeMapFromWorkspace(workspace: Workspace, mapId: string): Workspace {
    return {
      ...workspace,
      maps: workspace.maps.filter(m => m.id !== mapId),
      metadata: {
        ...workspace.metadata,
        mapCount: workspace.maps.length - 1,
        lastModified: new Date()
      }
    };
  }

  /**
   * Update a map in workspace
   */
  static updateMapInWorkspace(workspace: Workspace, mapId: string, updates: Partial<WorkspaceMap>): Workspace {
    return {
      ...workspace,
      maps: workspace.maps.map(m => 
        m.id === mapId 
          ? { ...m, ...updates, lastModified: new Date() }
          : m
      ),
      metadata: {
        ...workspace.metadata,
        lastModified: new Date()
      }
    };
  }
}
