import JSZip from 'jszip';
import { 
  Workspace, 
  WorkspaceMetadata, 
  ExportOptions, 
  ImportOptions, 
  WorkspaceImportResult,
  DroppedFile 
} from '../types/workspace';
import { DnDMap } from '../types/map';
import { exportMapToJSON, importMapFromJSON } from '../utils/mapUtils';
import workspaceService from './workspaceService';

export class WorkspaceExportImportService {
  private static instance: WorkspaceExportImportService;

  static getInstance(): WorkspaceExportImportService {
    if (!WorkspaceExportImportService.instance) {
      WorkspaceExportImportService.instance = new WorkspaceExportImportService();
    }
    return WorkspaceExportImportService.instance;
  }

  // Export workspace as ZIP file
  async exportWorkspaceAsZip(
    workspace: Workspace, 
    options: ExportOptions = {
      includeAssets: true,
      includeBackups: false,
      format: 'zip',
      compression: 'medium'
    }
  ): Promise<Blob> {
    const zip = new JSZip();

    // Create workspace metadata file
    const workspaceMetadata = {
      ...workspace.metadata,
      exportedAt: new Date().toISOString(),
      exportVersion: '1.0.0',
      exportOptions: options
    };

    zip.file('workspace.json', JSON.stringify(workspaceMetadata, null, 2));

    // Create settings file
    zip.file('settings.json', JSON.stringify(workspace.settings, null, 2));

    // Create folders structure file
    zip.file('folders.json', JSON.stringify(workspace.folders, null, 2));

    // Create campaign folder if campaign info exists
    if (workspace.metadata.campaignInfo) {
      const campaignFolder = zip.folder('campaign');
      if (campaignFolder) {
        campaignFolder.file('info.json', JSON.stringify(workspace.metadata.campaignInfo, null, 2));
        
        // Add session notes
        if (workspace.metadata.campaignInfo.sessionNotes) {
          const notesFolder = campaignFolder.folder('notes');
          if (notesFolder) {
            workspace.metadata.campaignInfo.sessionNotes.forEach(note => {
              notesFolder.file(`session-${note.sessionNumber}.json`, JSON.stringify(note, null, 2));
            });
          }
        }
      }
    }

    // Create maps folder and add all maps
    const mapsFolder = zip.folder('maps');
    if (mapsFolder) {
      for (const workspaceMap of workspace.maps) {
        const mapFolder = mapsFolder.folder(workspaceMap.id);
        if (mapFolder) {
          // Export map data
          const mapJson = exportMapToJSON(workspaceMap.mapData, options.includeAssets);
          mapFolder.file('map.json', mapJson);

          // Add map metadata
          const mapMetadata = {
            id: workspaceMap.id,
            name: workspaceMap.name,
            description: workspaceMap.description,
            category: workspaceMap.category,
            tags: workspaceMap.tags,
            createdAt: workspaceMap.createdAt,
            lastModified: workspaceMap.lastModified,
            isArchived: workspaceMap.isArchived
          };
          mapFolder.file('metadata.json', JSON.stringify(mapMetadata, null, 2));

          // Add thumbnail if it exists
          if (workspaceMap.thumbnailPath) {
            // In a real implementation, you would load the actual thumbnail data
            mapFolder.file('thumbnail.png', 'placeholder thumbnail data');
          }

          // Add assets folder if including assets
          if (options.includeAssets) {
            const assetsFolder = mapFolder.folder('assets');
            // In a real implementation, you would collect and add asset files
          }
        }
      }
    }

    // Create assets folder for shared assets
    if (options.includeAssets) {
      const sharedAssetsFolder = zip.folder('shared-assets');
      // In a real implementation, you would add shared assets here
    }

    // Generate the ZIP file
    const compressionLevel = this.getCompressionLevel(options.compression);
    return zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: compressionLevel
      }
    });
  }

  // Import workspace from ZIP file
  async importWorkspaceFromZip(
    zipFile: File,
    options: ImportOptions = {
      includeAssets: true,
      mergeDuplicates: false,
      preserveFolderStructure: true
    }
  ): Promise<WorkspaceImportResult> {
    const result: WorkspaceImportResult = {
      success: false,
      errors: [],
      warnings: [],
      mapsImported: 0,
      assetsImported: 0
    };

    try {
      const zip = await JSZip.loadAsync(zipFile);
      
      // Read workspace metadata
      const workspaceFile = zip.file('workspace.json');
      if (!workspaceFile) {
        result.errors.push('No workspace.json found in ZIP file');
        return result;
      }

      const workspaceData = JSON.parse(await workspaceFile.async('string'));
      
      // Create new workspace from metadata
      const workspace = workspaceService.createWorkspace(
        workspaceData.name,
        workspaceData.author,
        workspaceData.description || ''
      );

      // Import settings if available
      const settingsFile = zip.file('settings.json');
      if (settingsFile) {
        const settings = JSON.parse(await settingsFile.async('string'));
        workspace.settings = { ...workspace.settings, ...settings };
      }

      // Import folders structure
      const foldersFile = zip.file('folders.json');
      if (foldersFile && options.preserveFolderStructure) {
        const folders = JSON.parse(await foldersFile.async('string'));
        workspace.folders = folders;
      }

      // Import campaign info
      const campaignInfoFile = zip.file('campaign/info.json');
      if (campaignInfoFile) {
        const campaignInfo = JSON.parse(await campaignInfoFile.async('string'));
        workspace.metadata.campaignInfo = campaignInfo;
      }

      // Import session notes
      const notesFolder = zip.folder('campaign/notes');
      if (notesFolder) {
        const sessionNotes: any[] = [];
        for (const [fileName, file] of Object.entries(notesFolder.files)) {
          if (fileName.endsWith('.json')) {
            const note = JSON.parse(await file.async('string'));
            sessionNotes.push(note);
          }
        }
        if (workspace.metadata.campaignInfo) {
          workspace.metadata.campaignInfo.sessionNotes = sessionNotes;
        }
      }

      // Import maps
      // Find all map folders by looking for files matching pattern maps/*/map.json
      const mapFiles = Object.keys(zip.files).filter(path => 
        path.match(/^maps\/[^/]+\/map\.json$/)
      );

      for (const mapFilePath of mapFiles) {
        try {
          const mapFile = zip.files[mapFilePath];
          if (mapFile) {
            const mapJson = await mapFile.async('string');
            const map = importMapFromJSON(mapJson);
            
            // Extract folder name from path (maps/{foldername}/map.json)
            const folderName = mapFilePath.split('/')[1];
            
            // Try to read map metadata
            const metadataPath = `maps/${folderName}/metadata.json`;
            const metadataFile = zip.files[metadataPath];
            
            if (metadataFile) {
              const metadata = JSON.parse(await metadataFile.async('string'));
              
              // Check for duplicates
              if (options.mergeDuplicates) {
                const existingMap = workspace.maps.find(m => m.id === metadata.id);
                if (existingMap) {
                  result.warnings.push(`Map ${metadata.name} already exists, skipping`);
                  continue;
                }
              }

              workspaceService.addMap(map, metadata.category);
              result.mapsImported++;
            } else {
              workspaceService.addMap(map);
              result.mapsImported++;
            }
          }
        } catch (error) {
          result.errors.push(`Failed to import map from ${mapFilePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Import assets if requested
      if (options.includeAssets) {
        const sharedAssetsFolder = zip.folder('shared-assets');
        if (sharedAssetsFolder) {
          result.assetsImported += Object.keys(sharedAssetsFolder.files).length;
          // In a real implementation, you would process and store these assets
        }

        // Count map-specific assets by finding all asset files
        const assetFiles = Object.keys(zip.files).filter(path => 
          path.match(/^maps\/[^/]+\/assets\/.*$/)
        );
        result.assetsImported += assetFiles.length;
      }

      result.success = result.mapsImported > 0 || result.assetsImported > 0;
      result.workspace = workspace;

    } catch (error) {
      result.success = false;
      result.errors.push(`Failed to import ZIP file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  // Export workspace as folder structure (JSON files)
  async exportWorkspaceAsFiles(workspace: Workspace): Promise<Map<string, string>> {
    const files = new Map<string, string>();

    // Workspace metadata
    files.set('workspace.json', JSON.stringify(workspace.metadata, null, 2));

    // Settings
    files.set('settings.json', JSON.stringify(workspace.settings, null, 2));

    // Folders structure
    files.set('folders.json', JSON.stringify(workspace.folders, null, 2));

    // Campaign info
    if (workspace.metadata.campaignInfo) {
      files.set('campaign/info.json', JSON.stringify(workspace.metadata.campaignInfo, null, 2));
      
      // Session notes
      workspace.metadata.campaignInfo.sessionNotes?.forEach(note => {
        files.set(`campaign/notes/session-${note.sessionNumber}.json`, JSON.stringify(note, null, 2));
      });
    }

    // Maps
    workspace.maps.forEach(workspaceMap => {
      const mapJson = exportMapToJSON(workspaceMap.mapData, true);
      files.set(`maps/${workspaceMap.id}/map.json`, mapJson);
      
      // Map metadata
      const mapMetadata = {
        id: workspaceMap.id,
        name: workspaceMap.name,
        description: workspaceMap.description,
        category: workspaceMap.category,
        tags: workspaceMap.tags,
        createdAt: workspaceMap.createdAt,
        lastModified: workspaceMap.lastModified,
        isArchived: workspaceMap.isArchived
      };
      files.set(`maps/${workspaceMap.id}/metadata.json`, JSON.stringify(mapMetadata, null, 2));
    });

    return files;
  }

  // Import workspace from individual files
  async importWorkspaceFromFiles(
    files: DroppedFile[],
    options: ImportOptions = {
      includeAssets: true,
      mergeDuplicates: false,
      preserveFolderStructure: true
    }
  ): Promise<WorkspaceImportResult> {
    return workspaceService.importFromFiles(files, options);
  }

  // Create backup of current workspace
  async createBackup(workspace: Workspace): Promise<Blob> {
    return this.exportWorkspaceAsZip(workspace, {
      includeAssets: true,
      includeBackups: false,
      format: 'zip',
      compression: 'high'
    });
  }

  // Validate workspace integrity before export
  validateWorkspace(workspace: Workspace): string[] {
    const errors: string[] = [];

    if (!workspace.metadata.id) {
      errors.push('Workspace must have a valid ID');
    }

    if (!workspace.metadata.name.trim()) {
      errors.push('Workspace must have a valid name');
    }

    if (workspace.maps.length === 0) {
      errors.push('Workspace should contain at least one map');
    }

    // Validate map integrity
    workspace.maps.forEach(map => {
      if (!map.mapData.metadata.id) {
        errors.push(`Map ${map.name} has invalid metadata`);
      }
    });

    // Check for duplicate map IDs
    const mapIds = workspace.maps.map(m => m.id);
    const duplicateIds = mapIds.filter((id, index) => mapIds.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
      errors.push(`Duplicate map IDs found: ${duplicateIds.join(', ')}`);
    }

    return errors;
  }

  // Helper method to get compression level
  private getCompressionLevel(compression: ExportOptions['compression']): number {
    switch (compression) {
      case 'none': return 0;
      case 'low': return 3;
      case 'medium': return 6;
      case 'high': return 9;
      default: return 6;
    }
  }

  // Generate workspace statistics for export summary
  generateExportStatistics(workspace: Workspace): {
    totalMaps: number;
    totalFolders: number;
    totalAssets: number;
    sizeEstimate: string;
    categories: Record<string, number>;
  } {
    const categories: Record<string, number> = {};
    
    workspace.maps.forEach(map => {
      categories[map.category] = (categories[map.category] || 0) + 1;
    });

    // Rough size estimate (in a real implementation, you'd calculate actual sizes)
    const estimatedSize = workspace.maps.length * 50; // KB per map estimate

    return {
      totalMaps: workspace.maps.length,
      totalFolders: workspace.folders.length,
      totalAssets: 0, // Would count actual assets
      sizeEstimate: `~${estimatedSize}KB`,
      categories
    };
  }
}

export const workspaceExportImportService = WorkspaceExportImportService.getInstance();
export default workspaceExportImportService;