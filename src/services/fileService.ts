import { DnDMap } from '../types/map';
import { exportMapToJSON, importMapFromJSON } from '../utils/mapUtils';
import { STORAGE_KEYS, SUPPORTED_MAP_FORMATS, MAX_FILE_SIZE } from '../utils/constants';

export interface SavedMapInfo {
  id: string;
  name: string;
  lastModified: Date;
  size: number;
  preview?: string; // Base64 encoded thumbnail
}

export interface FileOperationResult {
  success: boolean;
  message: string;
  data?: any;
}

class FileService {
  // Save map to local storage
  saveMapToStorage(map: DnDMap): FileOperationResult {
    try {
      const savedMaps = this.getSavedMapsList();
      const mapData = exportMapToJSON(map);
      
      // Update the map's metadata
      const updatedMap = {
        ...map,
        metadata: {
          ...map.metadata,
          updatedAt: new Date()
        }
      };

      // Store the map data
      localStorage.setItem(`${STORAGE_KEYS.MAPS}_${map.metadata.id}`, exportMapToJSON(updatedMap));
      
      // Update the maps list
      const existingIndex = savedMaps.findIndex(m => m.id === map.metadata.id);
      const mapInfo: SavedMapInfo = {
        id: map.metadata.id,
        name: map.metadata.name,
        lastModified: new Date(),
        size: mapData.length
      };

      if (existingIndex >= 0) {
        savedMaps[existingIndex] = mapInfo;
      } else {
        savedMaps.push(mapInfo);
      }

      localStorage.setItem(STORAGE_KEYS.MAPS, JSON.stringify(savedMaps));
      
      return {
        success: true,
        message: 'Map saved successfully'
      };
    } catch (error) {
      console.error('Error saving map:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save map'
      };
    }
  }

  // Load map from local storage
  loadMapFromStorage(mapId: string): FileOperationResult {
    try {
      const mapData = localStorage.getItem(`${STORAGE_KEYS.MAPS}_${mapId}`);
      if (!mapData) {
        return {
          success: false,
          message: 'Map not found'
        };
      }

      const map = importMapFromJSON(mapData);
      return {
        success: true,
        message: 'Map loaded successfully',
        data: map
      };
    } catch (error) {
      console.error('Error loading map:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to load map'
      };
    }
  }

  // Get list of saved maps
  getSavedMapsList(): SavedMapInfo[] {
    try {
      const mapsData = localStorage.getItem(STORAGE_KEYS.MAPS);
      return mapsData ? JSON.parse(mapsData) : [];
    } catch (error) {
      console.error('Error loading maps list:', error);
      return [];
    }
  }

  // Delete map from storage
  deleteMapFromStorage(mapId: string): FileOperationResult {
    try {
      localStorage.removeItem(`${STORAGE_KEYS.MAPS}_${mapId}`);
      
      const savedMaps = this.getSavedMapsList();
      const updatedMaps = savedMaps.filter(m => m.id !== mapId);
      localStorage.setItem(STORAGE_KEYS.MAPS, JSON.stringify(updatedMaps));
      
      return {
        success: true,
        message: 'Map deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting map:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete map'
      };
    }
  }

  // Export map to file
  exportMapToFile(map: DnDMap, filename?: string): FileOperationResult {
    try {
      const mapData = exportMapToJSON(map, true); // Include assets
      const blob = new Blob([mapData], { type: 'application/json' });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `${map.metadata.name.replace(/[^a-z0-9]/gi, '_')}.json`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return {
        success: true,
        message: 'Map exported successfully'
      };
    } catch (error) {
      console.error('Error exporting map:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to export map'
      };
    }
  }

  // Import map from file
  importMapFromFile(file: File): Promise<FileOperationResult> {
    return new Promise((resolve) => {
      // Validate file
      const validationResult = this.validateMapFile(file);
      if (!validationResult.success) {
        resolve(validationResult);
        return;
      }

      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const map = importMapFromJSON(content);
          
          // Generate new ID to avoid conflicts
          const importedMap = {
            ...map,
            metadata: {
              ...map.metadata,
              id: crypto.randomUUID(),
              name: `${map.metadata.name} (Imported)`,
              updatedAt: new Date()
            }
          };
          
          resolve({
            success: true,
            message: 'Map imported successfully',
            data: importedMap
          });
        } catch (error) {
          console.error('Error parsing map file:', error);
          resolve({
            success: false,
            message: error instanceof Error ? error.message : 'Invalid map file format'
          });
        }
      };
      
      reader.onerror = () => {
        resolve({
          success: false,
          message: 'Failed to read file'
        });
      };
      
      reader.readAsText(file);
    });
  }

  // Validate map file
  private validateMapFile(file: File): FileOperationResult {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        message: `File is too large. Maximum size is ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`
      };
    }

    // Check file extension
    const extension = file.name.toLowerCase().split('.').pop();
    if (!extension || !SUPPORTED_MAP_FORMATS.includes(extension)) {
      return {
        success: false,
        message: `Unsupported file format. Supported formats: ${SUPPORTED_MAP_FORMATS.join(', ')}`
      };
    }

    return {
      success: true,
      message: 'File is valid'
    };
  }

  // Auto-save functionality
  autoSaveMap(map: DnDMap): void {
    try {
      const autoSaveKey = `${STORAGE_KEYS.MAPS}_autosave`;
      const mapData = exportMapToJSON(map);
      localStorage.setItem(autoSaveKey, mapData);
      localStorage.setItem(`${autoSaveKey}_timestamp`, new Date().toISOString());
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }

  // Load auto-saved map
  loadAutoSavedMap(): DnDMap | null {
    try {
      const autoSaveKey = `${STORAGE_KEYS.MAPS}_autosave`;
      const mapData = localStorage.getItem(autoSaveKey);
      
      if (!mapData) return null;
      
      return importMapFromJSON(mapData);
    } catch (error) {
      console.error('Error loading auto-saved map:', error);
      return null;
    }
  }

  // Check if auto-save exists and when it was created
  getAutoSaveInfo(): { exists: boolean; timestamp?: Date } {
    const autoSaveKey = `${STORAGE_KEYS.MAPS}_autosave`;
    const timestampKey = `${autoSaveKey}_timestamp`;
    
    const exists = localStorage.getItem(autoSaveKey) !== null;
    const timestampStr = localStorage.getItem(timestampKey);
    
    return {
      exists,
      timestamp: timestampStr ? new Date(timestampStr) : undefined
    };
  }

  // Clear auto-save
  clearAutoSave(): void {
    const autoSaveKey = `${STORAGE_KEYS.MAPS}_autosave`;
    localStorage.removeItem(autoSaveKey);
    localStorage.removeItem(`${autoSaveKey}_timestamp`);
  }

  // Get storage usage info
  getStorageInfo(): { used: number; available: number; percentage: number } {
    let used = 0;
    const available = 5 * 1024 * 1024; // Assume 5MB localStorage limit
    
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length;
      }
    }
    
    return {
      used,
      available,
      percentage: Math.round((used / available) * 100)
    };
  }
}

// Export singleton instance
export const fileService = new FileService();