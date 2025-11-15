import { DroppedFile, WorkspaceImportResult } from '../types/workspace';
import { DnDMap, MapExportData } from '../types/map';
import { importMapFromJSON } from '../utils/mapUtils';

export class DragDropHandler {
  private static instance: DragDropHandler;

  static getInstance(): DragDropHandler {
    if (!DragDropHandler.instance) {
      DragDropHandler.instance = new DragDropHandler();
    }
    return DragDropHandler.instance;
  }

  // Process dropped files and convert them to DroppedFile format
  async processDroppedFiles(items: DataTransferItemList): Promise<DroppedFile[]> {
    const files: DroppedFile[] = [];
    const promises: Promise<void>[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          promises.push(this.processFile(file, files));
        }
      } else if (item.kind === 'string' && item.type === 'text/uri-list') {
        // Handle folder drops (not fully supported in browsers, but we can try)
        promises.push(
          new Promise<void>((resolve) => {
            item.getAsString((data) => {
              console.log('Dropped URI:', data);
              resolve();
            });
          })
        );
      }
    }

    await Promise.all(promises);
    return files;
  }

  // Process individual file
  private async processFile(file: File, files: DroppedFile[]): Promise<void> {
    try {
      let content: ArrayBuffer | string;
      
      // Handle different file types
      if (this.isTextFile(file)) {
        content = await file.text();
      } else if (this.isImageFile(file)) {
        content = await file.arrayBuffer();
      } else {
        content = await file.arrayBuffer();
      }

      files.push({
        name: file.name,
        path: file.name, // In browser, we don't have full paths
        type: file.type,
        size: file.size,
        content: content
      });
    } catch (error) {
      console.error(`Failed to process file ${file.name}:`, error);
    }
  }

  // Check if file is a text file that we can parse
  private isTextFile(file: File): boolean {
    return (
      file.type === 'application/json' ||
      file.type === 'text/json' ||
      file.type === 'text/plain' ||
      file.name.endsWith('.json') ||
      file.name.endsWith('.txt')
    );
  }

  // Check if file is an image
  private isImageFile(file: File): boolean {
    return (
      file.type.startsWith('image/') ||
      file.name.match(/\.(png|jpg|jpeg|gif|bmp|webp)$/i) !== null
    );
  }

  // Parse workspace structure from files
  parseWorkspaceStructure(files: DroppedFile[]): {
    workspaceFile?: DroppedFile;
    mapFiles: DroppedFile[];
    assetFiles: DroppedFile[];
    folderStructure: Map<string, DroppedFile[]>;
  } {
    const result = {
      mapFiles: [] as DroppedFile[],
      assetFiles: [] as DroppedFile[],
      folderStructure: new Map<string, DroppedFile[]>()
    };

    let workspaceFile: DroppedFile | undefined;

    files.forEach(file => {
      // Check for workspace.json
      if (file.name === 'workspace.json' || file.name.endsWith('/workspace.json')) {
        workspaceFile = file;
        return;
      }

      // Check for map files
      if (file.name.includes('map') && file.name.endsWith('.json')) {
        result.mapFiles.push(file);
        return;
      }

      // Check for asset files
      if (this.isImageFile({ name: file.name, type: file.type } as File)) {
        result.assetFiles.push(file);
        return;
      }

      // Organize by folder structure (basic path parsing)
      const pathParts = (file.path || '').split('/');
      if (pathParts.length > 1) {
        const folder = pathParts[0];
        if (!result.folderStructure.has(folder)) {
          result.folderStructure.set(folder, []);
        }
        result.folderStructure.get(folder)!.push(file);
      }
    });

    return {
      workspaceFile,
      ...result
    };
  }

  // Validate and parse map files
  async validateMapFiles(mapFiles: DroppedFile[]): Promise<{
    validMaps: DnDMap[];
    errors: string[];
  }> {
    const validMaps: DnDMap[] = [];
    const errors: string[] = [];

    for (const file of mapFiles) {
      try {
        if (typeof file.content !== 'string') {
          errors.push(`Map file ${file.name} is not a text file`);
          continue;
        }

        const mapData = importMapFromJSON(file.content);
        validMaps.push(mapData);
      } catch (error) {
        errors.push(`Failed to parse map file ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { validMaps, errors };
  }

  // Create ZIP-like structure for workspace export
  createExportStructure(workspaceData: any, includeAssets: boolean = true): Blob {
    // For browser environments, we'll create a JSON export
    // In a more complete implementation, this would create an actual ZIP file
    const exportData = {
      workspace: workspaceData,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };

    return new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
  }

  // Handle folder structure creation for workspace organization
  createFolderStructure(files: DroppedFile[]): {
    folders: string[];
    fileMap: Map<string, DroppedFile[]>;
  } {
    const folders = new Set<string>();
    const fileMap = new Map<string, DroppedFile[]>();

    files.forEach(file => {
      const pathParts = (file.path || '').split('/');
      
      // Create folder hierarchy
      for (let i = 1; i <= pathParts.length; i++) {
        const folderPath = pathParts.slice(0, i).join('/');
        if (i < pathParts.length) {
          folders.add(folderPath);
        }
        
        // Add file to folder
        if (i === pathParts.length) {
          const parentFolder = i > 1 ? pathParts.slice(0, i - 1).join('/') : 'root';
          if (!fileMap.has(parentFolder)) {
            fileMap.set(parentFolder, []);
          }
          fileMap.get(parentFolder)!.push(file);
        }
      }
    });

    return {
      folders: Array.from(folders).sort(),
      fileMap
    };
  }

  // Detect workspace type from file structure
  detectWorkspaceType(files: DroppedFile[]): 'full_workspace' | 'map_collection' | 'single_map' | 'unknown' {
    const hasWorkspaceJson = files.some(f => f.name === 'workspace.json');
    const mapFiles = files.filter(f => f.name.includes('map') && f.name.endsWith('.json'));
    
    if (hasWorkspaceJson) {
      return 'full_workspace';
    } else if (mapFiles.length > 1) {
      return 'map_collection';
    } else if (mapFiles.length === 1) {
      return 'single_map';
    } else {
      return 'unknown';
    }
  }

  // Generate thumbnails for image assets
  async generateThumbnails(assetFiles: DroppedFile[]): Promise<Map<string, string>> {
    const thumbnails = new Map<string, string>();
    
    for (const file of assetFiles) {
      if (!this.isImageFile({ name: file.name, type: file.type } as File)) {
        continue;
      }

      try {
        const thumbnail = await this.createThumbnail(file);
        thumbnails.set(file.name, thumbnail);
      } catch (error) {
        console.warn(`Failed to create thumbnail for ${file.name}:`, error);
      }
    }

    return thumbnails;
  }

  // Create thumbnail from image file
  private async createThumbnail(file: DroppedFile): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        const maxSize = 200;
        const ratio = Math.min(maxSize / img.width, maxSize / img.height);
        
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/png'));
        } else {
          reject(new Error('Failed to get canvas context'));
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));

      if (file.content instanceof ArrayBuffer) {
        const blob = new Blob([file.content]);
        img.src = URL.createObjectURL(blob);
      } else {
        reject(new Error('Invalid file content type for image'));
      }
    });
  }
}

export const dragDropHandler = DragDropHandler.getInstance();
export default dragDropHandler;