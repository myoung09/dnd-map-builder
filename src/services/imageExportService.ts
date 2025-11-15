import { DnDMap } from '../types/map';
import { EXPORT_SETTINGS } from '../utils/constants';

export interface ExportOptions {
  format: 'png' | 'jpeg' | 'webp';
  quality: number;
  dpi: number;
  includeGrid: boolean;
  backgroundColor?: string;
  scale?: number;
}

export interface ExportResult {
  success: boolean;
  message: string;
  blob?: Blob;
  dataUrl?: string;
}

class ImageExportService {
  // Create a high-resolution canvas for export
  private createExportCanvas(map: DnDMap, options: ExportOptions): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Calculate dimensions based on DPI
    const scale = options.scale || (options.dpi / 96); // 96 DPI is standard screen DPI
    const cellSize = map.gridConfig.cellSize * scale;
    
    canvas.width = map.dimensions.width * cellSize;
    canvas.height = map.dimensions.height * cellSize;

    // Set high-quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Fill background
    const bgColor = options.backgroundColor || 
      (map.backgroundColor ? 
        `rgba(${map.backgroundColor.r}, ${map.backgroundColor.g}, ${map.backgroundColor.b}, 1)` : 
        '#2A2A2A'
      );
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render each layer
    this.renderMapLayers(ctx, map, cellSize, options);

    return canvas;
  }

  // Render all visible map layers
  private renderMapLayers(
    ctx: CanvasRenderingContext2D, 
    map: DnDMap, 
    cellSize: number, 
    options: ExportOptions
  ): void {
    // Render layers in order
    const sortedLayers = [...map.layers].sort((a, b) => {
      const layerOrder = ['background', 'terrain', 'objects', 'creatures', 'overlay'];
      return layerOrder.indexOf(a.type) - layerOrder.indexOf(b.type);
    });

    for (const layer of sortedLayers) {
      if (!layer.isVisible) continue;

      ctx.save();
      ctx.globalAlpha = layer.opacity;

      // Render tiles
      if (layer.tiles) {
        for (const tile of layer.tiles) {
          if (!tile.isVisible) continue;

          const x = tile.position.x * cellSize;
          const y = tile.position.y * cellSize;

          const color = tile.color ? 
            `rgba(${tile.color.r}, ${tile.color.g}, ${tile.color.b}, ${tile.color.a || 1})` : 
            '#808080';

          ctx.fillStyle = color;
          ctx.fillRect(x, y, cellSize, cellSize);
        }
      }

      // Render objects
      if (layer.objects) {
        for (const obj of layer.objects) {
          if (!obj.isVisible) continue;

          const x = obj.position.x * cellSize;
          const y = obj.position.y * cellSize;
          const width = obj.size.width * cellSize;
          const height = obj.size.height * cellSize;

          ctx.save();
          
          if (obj.rotation) {
            ctx.translate(x + width / 2, y + height / 2);
            ctx.rotate((obj.rotation * Math.PI) / 180);
            ctx.translate(-width / 2, -height / 2);
          } else {
            ctx.translate(x, y);
          }

          const color = obj.color ? 
            `rgba(${obj.color.r}, ${obj.color.g}, ${obj.color.b}, ${obj.opacity || 1})` : 
            '#FF6B6B';

          ctx.fillStyle = color;
          ctx.fillRect(0, 0, width, height);

          // Add border
          ctx.strokeStyle = '#333';
          ctx.lineWidth = 1;
          ctx.strokeRect(0, 0, width, height);

          ctx.restore();
        }
      }

      ctx.restore();
    }

    // Render grid if requested
    if (options.includeGrid && map.gridConfig.showGrid) {
      this.renderGrid(ctx, map, cellSize);
    }
  }

  // Render grid lines
  private renderGrid(ctx: CanvasRenderingContext2D, map: DnDMap, cellSize: number): void {
    ctx.save();
    
    const gridColor = map.gridConfig.gridColor;
    ctx.strokeStyle = `rgba(${gridColor.r}, ${gridColor.g}, ${gridColor.b}, ${gridColor.a || 0.5})`;
    ctx.lineWidth = 1;

    const width = map.dimensions.width * cellSize;
    const height = map.dimensions.height * cellSize;

    // Draw vertical lines
    for (let x = 0; x <= width; x += cellSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = 0; y <= height; y += cellSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.restore();
  }

  // Export map to image blob
  async exportMapToBlob(map: DnDMap, options: Partial<ExportOptions> = {}): Promise<ExportResult> {
    try {
      const exportOptions: ExportOptions = {
        format: options.format || EXPORT_SETTINGS.DEFAULT_FORMAT as 'png',
        quality: options.quality || EXPORT_SETTINGS.QUALITY.HIGH,
        dpi: options.dpi || EXPORT_SETTINGS.DEFAULT_DPI,
        includeGrid: options.includeGrid !== undefined ? options.includeGrid : true,
        backgroundColor: options.backgroundColor,
        scale: options.scale
      };

      const canvas = this.createExportCanvas(map, exportOptions);

      return new Promise((resolve) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({
                success: true,
                message: 'Image exported successfully',
                blob
              });
            } else {
              resolve({
                success: false,
                message: 'Failed to create image blob'
              });
            }
          },
          `image/${exportOptions.format}`,
          exportOptions.quality
        );
      });
    } catch (error) {
      console.error('Export error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown export error'
      };
    }
  }

  // Export map to data URL
  async exportMapToDataUrl(map: DnDMap, options: Partial<ExportOptions> = {}): Promise<ExportResult> {
    try {
      const exportOptions: ExportOptions = {
        format: options.format || EXPORT_SETTINGS.DEFAULT_FORMAT as 'png',
        quality: options.quality || EXPORT_SETTINGS.QUALITY.HIGH,
        dpi: options.dpi || EXPORT_SETTINGS.DEFAULT_DPI,
        includeGrid: options.includeGrid !== undefined ? options.includeGrid : true,
        backgroundColor: options.backgroundColor,
        scale: options.scale
      };

      const canvas = this.createExportCanvas(map, exportOptions);
      const dataUrl = canvas.toDataURL(`image/${exportOptions.format}`, exportOptions.quality);

      return {
        success: true,
        message: 'Image exported successfully',
        dataUrl
      };
    } catch (error) {
      console.error('Export error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown export error'
      };
    }
  }

  // Download map as image file
  async downloadMapAsImage(
    map: DnDMap, 
    filename?: string, 
    options: Partial<ExportOptions> = {}
  ): Promise<ExportResult> {
    try {
      const result = await this.exportMapToBlob(map, options);
      
      if (!result.success || !result.blob) {
        return result;
      }

      // Create download link
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      
      const format = options.format || EXPORT_SETTINGS.DEFAULT_FORMAT;
      const mapName = map.metadata.name.replace(/[^a-z0-9]/gi, '_');
      link.download = filename || `${mapName}.${format}`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return {
        success: true,
        message: 'Image downloaded successfully'
      };
    } catch (error) {
      console.error('Download error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to download image'
      };
    }
  }

  // Get estimated file size
  getEstimatedFileSize(map: DnDMap, options: Partial<ExportOptions> = {}): number {
    const scale = options.scale || (options.dpi || EXPORT_SETTINGS.DEFAULT_DPI) / 96;
    const cellSize = map.gridConfig.cellSize * scale;
    const width = map.dimensions.width * cellSize;
    const height = map.dimensions.height * cellSize;
    
    // Rough estimation: 4 bytes per pixel for uncompressed data
    // Actual file size will be smaller due to compression
    const uncompressedSize = width * height * 4;
    
    // Apply compression factor based on format
    const compressionFactors = {
      png: 0.3,   // PNG typically compresses to about 30% of uncompressed
      jpeg: 0.1,  // JPEG typically compresses to about 10%
      webp: 0.08  // WebP typically compresses even better
    };
    
    const format = options.format || EXPORT_SETTINGS.DEFAULT_FORMAT as keyof typeof compressionFactors;
    return Math.round(uncompressedSize * compressionFactors[format]);
  }
}

// Export singleton instance
export const imageExportService = new ImageExportService();