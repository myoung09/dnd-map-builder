// Export utilities for PNG and JSON

import { MapData } from '../types/generator';

export class ExportUtils {
  static exportMapToPNG(canvas: HTMLCanvasElement, filename: string = 'map.png'): void {
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  }

  static exportMapToJSON(mapData: MapData, filename: string = 'map.json'): void {
    const jsonString = JSON.stringify(mapData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    link.click();
    
    URL.revokeObjectURL(url);
  }

  static importMapFromJSON(file: File): Promise<MapData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const result = e.target?.result;
          if (typeof result === 'string') {
            const mapData = JSON.parse(result) as MapData;
            resolve(mapData);
          } else {
            reject(new Error('Invalid file content'));
          }
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  static downloadCombinedExport(
    mapData: MapData,
    canvasDataUrl: string,
    baseName: string = 'map'
  ): void {
    // Download JSON
    this.exportMapToJSON(mapData, `${baseName}.json`);
    
    // Download PNG
    const link = document.createElement('a');
    link.download = `${baseName}.png`;
    link.href = canvasDataUrl;
    link.click();
  }
}
