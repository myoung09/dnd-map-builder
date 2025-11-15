import { 
  Workspace, 
  WorkspaceMetadata, 
  WorkspaceMap, 
  WorkspaceFolder, 
  WorkspaceSettings,
  ImportOptions,
  ExportOptions,
  WorkspaceImportResult,
  DroppedFile
} from '../types/workspace';
import { DnDMap } from '../types/map';
import { v4 as uuidv4 } from 'uuid';

class WorkspaceService {
  private currentWorkspace: Workspace | null = null;
  private eventListeners: ((event: string, data: any) => void)[] = [];

  // Create a new workspace
  createWorkspace(name: string, author: string, description: string = ''): Workspace {
    const defaultSettings: WorkspaceSettings = {
      defaultGridSize: 32,
      defaultMapDimensions: { width: 50, height: 50 },
      autoSave: true,
      autoSaveInterval: 5,
      backupCount: 3,
      exportFormat: 'zip',
      thumbnailGeneration: true,
      recentWorkspaces: []
    };

    const metadata: WorkspaceMetadata = {
      id: uuidv4(),
      name,
      description,
      author,
      version: '1.0.0',
      createdAt: new Date(),
      lastModified: new Date(),
      tags: [],
      mapCount: 0
    };

    const workspace: Workspace = {
      metadata,
      maps: [],
      folders: [],
      settings: defaultSettings
    };

    this.currentWorkspace = workspace;
    this.emit('workspace-created', workspace);
    
    return workspace;
  }

  // Load workspace from JSON data
  loadWorkspace(workspaceData: any): { success: boolean; workspace?: Workspace; error?: string } {
    try {
      // Validate and parse workspace data
      const workspace: Workspace = {
        metadata: {
          ...workspaceData.metadata,
          createdAt: new Date(workspaceData.metadata.createdAt),
          lastModified: new Date(workspaceData.metadata.lastModified)
        },
        maps: workspaceData.maps.map((map: any) => ({
          ...map,
          createdAt: new Date(map.createdAt),
          lastModified: new Date(map.lastModified)
        })),
        folders: workspaceData.folders || [],
        settings: {
          ...workspaceData.settings,
          recentWorkspaces: workspaceData.settings?.recentWorkspaces || []
        }
      };

      this.currentWorkspace = workspace;
      this.emit('workspace-loaded', workspace);
      
      return { success: true, workspace };
    } catch (error) {
      return { 
        success: false, 
        error: `Failed to load workspace: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  // Add a map to the current workspace
  addMap(map: DnDMap, category: WorkspaceMap['category'] = 'other', folderId?: string): WorkspaceMap {
    if (!this.currentWorkspace) {
      throw new Error('No workspace is currently loaded');
    }

    const workspaceMap: WorkspaceMap = {
      id: map.metadata.id,
      name: map.metadata.name,
      description: map.metadata.description || '',
      filePath: `maps/${map.metadata.id}/map.json`,
      tags: [],
      createdAt: new Date(),
      lastModified: new Date(),
      mapData: map,
      isArchived: false,
      category
    };

    this.currentWorkspace.maps.push(workspaceMap);
    this.currentWorkspace.metadata.mapCount = this.currentWorkspace.maps.length;
    this.currentWorkspace.metadata.lastModified = new Date();

    // Add to folder if specified
    if (folderId) {
      const folder = this.currentWorkspace.folders.find(f => f.id === folderId);
      if (folder) {
        folder.mapIds.push(map.metadata.id);
      }
    }

    this.emit('map-added', workspaceMap);
    return workspaceMap;
  }

  // Remove a map from the workspace
  removeMap(mapId: string): boolean {
    if (!this.currentWorkspace) return false;

    const mapIndex = this.currentWorkspace.maps.findIndex(m => m.id === mapId);
    if (mapIndex === -1) return false;

    const removedMap = this.currentWorkspace.maps[mapIndex];
    this.currentWorkspace.maps.splice(mapIndex, 1);
    this.currentWorkspace.metadata.mapCount = this.currentWorkspace.maps.length;
    this.currentWorkspace.metadata.lastModified = new Date();

    // Remove from folders
    this.currentWorkspace.folders.forEach(folder => {
      const mapIdIndex = folder.mapIds.indexOf(mapId);
      if (mapIdIndex !== -1) {
        folder.mapIds.splice(mapIdIndex, 1);
      }
    });

    this.emit('map-removed', removedMap);
    return true;
  }

  // Update a map in the workspace
  updateMap(mapId: string, updatedMap: DnDMap): boolean {
    if (!this.currentWorkspace) return false;

    const workspaceMap = this.currentWorkspace.maps.find(m => m.id === mapId);
    if (!workspaceMap) return false;

    workspaceMap.mapData = updatedMap;
    workspaceMap.name = updatedMap.metadata.name;
    workspaceMap.description = updatedMap.metadata.description || '';
    workspaceMap.lastModified = new Date();
    this.currentWorkspace.metadata.lastModified = new Date();

    this.emit('map-updated', workspaceMap);
    return true;
  }

  // Create a folder in the workspace
  createFolder(name: string, parentId?: string, color?: string): WorkspaceFolder {
    if (!this.currentWorkspace) {
      throw new Error('No workspace is currently loaded');
    }

    const folder: WorkspaceFolder = {
      id: uuidv4(),
      name,
      path: parentId ? `${this.getFolderPath(parentId)}/${name}` : name,
      parentId,
      mapIds: [],
      subFolderIds: [],
      color,
      isExpanded: true
    };

    this.currentWorkspace.folders.push(folder);

    // Add to parent folder if specified
    if (parentId) {
      const parentFolder = this.currentWorkspace.folders.find(f => f.id === parentId);
      if (parentFolder) {
        parentFolder.subFolderIds.push(folder.id);
      }
    }

    this.emit('folder-created', folder);
    return folder;
  }

  // Delete a folder and optionally its contents
  deleteFolder(folderId: string, deleteContents: boolean = false): boolean {
    if (!this.currentWorkspace) return false;

    const folder = this.currentWorkspace.folders.find(f => f.id === folderId);
    if (!folder) return false;

    // Handle maps in the folder
    if (deleteContents) {
      folder.mapIds.forEach(mapId => this.removeMap(mapId));
    } else {
      // Move maps to parent folder or root
      folder.mapIds.forEach(mapId => {
        if (folder.parentId) {
          const parentFolder = this.currentWorkspace!.folders.find(f => f.id === folder.parentId);
          if (parentFolder) {
            parentFolder.mapIds.push(mapId);
          }
        }
      });
    }

    // Handle subfolders
    if (deleteContents) {
      folder.subFolderIds.forEach(subFolderId => this.deleteFolder(subFolderId, true));
    } else {
      // Move subfolders to parent
      folder.subFolderIds.forEach(subFolderId => {
        const subFolder = this.currentWorkspace!.folders.find(f => f.id === subFolderId);
        if (subFolder) {
          subFolder.parentId = folder.parentId;
          if (folder.parentId) {
            const parentFolder = this.currentWorkspace!.folders.find(f => f.id === folder.parentId);
            if (parentFolder) {
              parentFolder.subFolderIds.push(subFolderId);
            }
          }
        }
      });
    }

    // Remove from parent folder
    if (folder.parentId) {
      const parentFolder = this.currentWorkspace.folders.find(f => f.id === folder.parentId);
      if (parentFolder) {
        const index = parentFolder.subFolderIds.indexOf(folderId);
        if (index !== -1) {
          parentFolder.subFolderIds.splice(index, 1);
        }
      }
    }

    // Remove the folder itself
    const folderIndex = this.currentWorkspace.folders.findIndex(f => f.id === folderId);
    if (folderIndex !== -1) {
      this.currentWorkspace.folders.splice(folderIndex, 1);
    }

    this.emit('folder-deleted', folder);
    return true;
  }

  // Move a map to a different folder
  moveMapToFolder(mapId: string, targetFolderId?: string): boolean {
    if (!this.currentWorkspace) return false;

    // Remove from current folders
    this.currentWorkspace.folders.forEach(folder => {
      const index = folder.mapIds.indexOf(mapId);
      if (index !== -1) {
        folder.mapIds.splice(index, 1);
      }
    });

    // Add to target folder
    if (targetFolderId) {
      const targetFolder = this.currentWorkspace.folders.find(f => f.id === targetFolderId);
      if (targetFolder) {
        targetFolder.mapIds.push(mapId);
      }
    }

    this.emit('map-moved', { mapId, targetFolderId });
    return true;
  }

  // Get folder path string
  private getFolderPath(folderId: string): string {
    const folder = this.currentWorkspace?.folders.find(f => f.id === folderId);
    if (!folder) return '';
    
    if (folder.parentId) {
      return `${this.getFolderPath(folder.parentId)}/${folder.name}`;
    }
    
    return folder.name;
  }

  // Export workspace to JSON string
  exportWorkspace(options: ExportOptions = {
    includeAssets: true,
    includeBackups: false,
    format: 'zip',
    compression: 'medium'
  }): string {
    if (!this.currentWorkspace) {
      throw new Error('No workspace is currently loaded');
    }

    return JSON.stringify(this.currentWorkspace, null, 2);
  }

  // Import workspace from files (drag and drop support)
  async importFromFiles(files: DroppedFile[], options: ImportOptions = {
    includeAssets: true,
    mergeDuplicates: false,
    preserveFolderStructure: true
  }): Promise<WorkspaceImportResult> {
    const result: WorkspaceImportResult = {
      success: false,
      errors: [],
      warnings: [],
      mapsImported: 0,
      assetsImported: 0
    };

    try {
      // Look for workspace.json file
      const workspaceFile = files.find(f => f.name === 'workspace.json' || f.name.endsWith('/workspace.json'));
      
      if (workspaceFile) {
        // Import full workspace
        const workspaceData = JSON.parse(workspaceFile.content as string);
        const loadResult = this.loadWorkspace(workspaceData);
        
        if (loadResult.success && loadResult.workspace) {
          result.success = true;
          result.workspace = loadResult.workspace;
          result.mapsImported = loadResult.workspace.maps.length;
        } else {
          result.errors.push(loadResult.error || 'Failed to load workspace');
          return result;
        }
      } else {
        // Import individual maps and try to create workspace structure
        result.warnings.push('No workspace.json found, creating new workspace from files');
        
        const mapFiles = files.filter(f => f.name.endsWith('.json') && f.name.includes('map'));
        
        for (const mapFile of mapFiles) {
          try {
            const mapData: DnDMap = JSON.parse(mapFile.content as string);
            if (this.currentWorkspace) {
              this.addMap(mapData);
              result.mapsImported++;
            }
          } catch (error) {
            result.errors.push(`Failed to import map from ${mapFile.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
        
        result.success = result.mapsImported > 0;
      }

      // Import asset files if requested
      if (options.includeAssets) {
        const assetFiles = files.filter(f => 
          f.name.endsWith('.png') || 
          f.name.endsWith('.jpg') || 
          f.name.endsWith('.jpeg') || 
          f.name.endsWith('.gif')
        );
        result.assetsImported = assetFiles.length;
      }

    } catch (error) {
      result.success = false;
      result.errors.push(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  // Get current workspace
  getCurrentWorkspace(): Workspace | null {
    return this.currentWorkspace;
  }

  // Check if workspace has unsaved changes
  hasUnsavedChanges(): boolean {
    // This would integrate with a persistence layer
    return false; // Placeholder
  }

  // Event system
  private emit(event: string, data: any): void {
    this.eventListeners.forEach(listener => listener(event, data));
  }

  addEventListener(listener: (event: string, data: any) => void): void {
    this.eventListeners.push(listener);
  }

  removeEventListener(listener: (event: string, data: any) => void): void {
    const index = this.eventListeners.indexOf(listener);
    if (index !== -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  // Search and filter methods
  searchMaps(query: string, category?: WorkspaceMap['category']): WorkspaceMap[] {
    if (!this.currentWorkspace) return [];

    return this.currentWorkspace.maps.filter(map => {
      const matchesQuery = !query || 
        map.name.toLowerCase().includes(query.toLowerCase()) ||
        map.description.toLowerCase().includes(query.toLowerCase()) ||
        map.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()));
        
      const matchesCategory = !category || map.category === category;
      
      return matchesQuery && matchesCategory && !map.isArchived;
    });
  }

  // Get maps in a specific folder
  getMapsInFolder(folderId?: string): WorkspaceMap[] {
    if (!this.currentWorkspace) return [];

    if (!folderId) {
      // Root level maps (not in any folder)
      const mapsInFolders = new Set(
        this.currentWorkspace.folders.flatMap(folder => folder.mapIds)
      );
      return this.currentWorkspace.maps.filter(map => !mapsInFolders.has(map.id));
    }

    const folder = this.currentWorkspace.folders.find(f => f.id === folderId);
    if (!folder) return [];

    return this.currentWorkspace.maps.filter(map => folder.mapIds.includes(map.id));
  }
}

export const workspaceService = new WorkspaceService();
export default workspaceService;