import { workspaceService } from './workspaceService';
import { aiMapGenerationService, AIGenerationOptions } from './aiGenerationService';
import {
  PointOfInterest,
  SimpleCampaignStory,
  GenerationProgress,
  MapGenerationResult,
  GenerationError,
  CampaignSettings
} from '../types/campaign';
import { Workspace, WorkspaceMap } from '../types/workspace';

export interface BulkGenerationOptions {
  story: SimpleCampaignStory;
  pointsOfInterest: PointOfInterest[];
  settings: CampaignSettings;
  workspaceName?: string;
  onProgress?: (progress: GenerationProgress) => void;
  onMapComplete?: (mapResult: MapGenerationResult) => void;
  onError?: (error: GenerationError) => void;
  abortSignal?: AbortSignal;
}

export interface GenerationResult {
  workspace: Workspace;
  maps: WorkspaceMap[];
  errors: GenerationError[];
  totalTime: number;
  successCount: number;
  failureCount: number;
}

class CampaignMapGeneratorService {
  private currentGeneration: AbortController | null = null;

  /**
   * Generate all maps for a campaign in bulk
   */
  async generateCampaignMaps(options: BulkGenerationOptions): Promise<GenerationResult> {
    const startTime = Date.now();
    const {
      story,
      pointsOfInterest,
      settings,
      workspaceName,
      onProgress,
      onMapComplete,
      onError,
      abortSignal
    } = options;

    // Create abort controller if not provided
    this.currentGeneration = new AbortController();
    
    // Set up signal handling - if external signal aborts, abort internal generation
    if (abortSignal) {
      abortSignal.addEventListener('abort', () => {
        this.currentGeneration?.abort();
      });
    }
    
    const controller = this.currentGeneration.signal;

    const maps: WorkspaceMap[] = [];
    const errors: GenerationError[] = [];
    let successCount = 0;
    let failureCount = 0;

    try {
      // Create workspace
      const workspace = await this.createCampaignWorkspace(story, workspaceName);
      
      // Initial progress update
      onProgress?.({
        status: 'preparing',
        currentStep: 'creating_workspace',
        stepsCompleted: 0,
        totalSteps: pointsOfInterest.length + 2, // +2 for workspace and finalization
        completedPOIs: [],
        failedPOIs: [],
        logs: []
      });

      // Check for abort
      if (controller.aborted) {
        throw new Error('Generation aborted');
      }

      // Sort POIs by generation order
      const sortedPOIs = [...pointsOfInterest].sort((a, b) => a.order - b.order);

      // Generate maps for each POI
      for (let i = 0; i < sortedPOIs.length; i++) {
        const poi = sortedPOIs[i];
        
        // Check for abort before each map
        if (controller.aborted) {
          throw new Error('Generation aborted');
        }

        try {
          // Update progress
          onProgress?.({
            status: 'generating',
            currentStep: 'generating_maps',
            stepsCompleted: i + 1,
            totalSteps: sortedPOIs.length + 2,
            currentPOI: poi.id,
            completedPOIs: sortedPOIs.slice(0, i).map(p => p.id),
            failedPOIs: errors,
            logs: []
          });

          // Generate the map
          const mapResult = await this.generateSingleMap(poi, settings, controller);
          
          // Add map to workspace
          const workspaceMap = this.addMapToWorkspace(workspace.metadata.id, mapResult, poi);
          maps.push(workspaceMap);
          successCount++;

          onMapComplete?.(mapResult);

        } catch (error) {
          failureCount++;
          const generationError: GenerationError = {
            poiId: poi.id,
            poiName: poi.name,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date(),
            retryable: true,
            recoverable: true
          };
          
          errors.push(generationError);
          onError?.(generationError);

          // Continue with other maps unless critical error
          if (!this.isCriticalError(error)) {
            continue;
          } else {
            throw error;
          }
        }
      }

      // Final progress update
      onProgress?.({
        status: successCount > 0 ? 'completed' : 'failed',
        currentStep: 'completed',
        stepsCompleted: sortedPOIs.length + 2,
        totalSteps: sortedPOIs.length + 2,
        completedPOIs: maps.map(m => m.id),
        failedPOIs: errors,
        logs: []
      });

      return {
        workspace,
        maps,
        errors,
        totalTime: Date.now() - startTime,
        successCount,
        failureCount
      };

    } catch (error) {
      // Handle critical errors
      const criticalError: GenerationError = {
        poiId: 'system',
        poiName: 'Campaign Generation',
        error: error instanceof Error ? error.message : 'Critical system error',
        timestamp: new Date(),
        retryable: false,
        recoverable: false
      };

      onProgress?.({
        status: 'failed',
        currentStep: 'error',
        stepsCompleted: 0,
        totalSteps: pointsOfInterest.length + 2,
        completedPOIs: [],
        failedPOIs: [...errors, criticalError],
        logs: []
      });

      throw error;
    } finally {
      this.currentGeneration = null;
    }
  }

  /**
   * Abort current generation process
   */
  abortGeneration(): void {
    if (this.currentGeneration) {
      this.currentGeneration.abort();
    }
  }

  /**
   * Check if generation is currently running
   */
  isGenerating(): boolean {
    return this.currentGeneration !== null;
  }

  /**
   * Create workspace for campaign
   */
  private async createCampaignWorkspace(
    story: SimpleCampaignStory, 
    customName?: string
  ): Promise<Workspace> {
    const workspaceName = customName || `${story.title} Campaign`;
    
    const workspace = workspaceService.createWorkspace(
      workspaceName,
      'Campaign Builder',
      story.description || `Campaign workspace for ${story.title}`
    );

    return workspace;
  }

  /**
   * Generate a single map from POI
   */
  private async generateSingleMap(
    poi: PointOfInterest,
    settings: CampaignSettings,
    abortSignal: AbortSignal
  ): Promise<MapGenerationResult> {
    // Check for abort
    if (abortSignal.aborted) {
      throw new Error('Generation aborted');
    }

    try {
      // Convert POI to AI generation prompt and options
      const prompt = this.poiToPrompt(poi);
      const options = this.poiToAIOptions(poi, settings);
      
      // Generate the map using AI generation service
      const generationResult = await aiMapGenerationService.generateMap(prompt, options);

      // Check for abort after generation
      if (abortSignal.aborted) {
        throw new Error('Generation aborted');
      }

      if (!generationResult.success || !generationResult.map) {
        throw new Error(generationResult.message || 'Failed to generate map');
      }

      return {
        poi,
        mapData: generationResult.map,
        generationTime: 0, // Will be calculated by caller
        success: true
      };

    } catch (error) {
      return {
        poi,
        mapData: null,
        generationTime: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Convert POI to map generation parameters
   */
  private poiToMapParams(poi: PointOfInterest, settings: CampaignSettings): any {
    return {
      name: poi.name,
      width: poi.mapRequirements.dimensions.width,
      height: poi.mapRequirements.dimensions.height,
      type: poi.type,
      theme: settings.mapStyle,
      difficulty: poi.difficultyRating,
      features: poi.mapRequirements.requiredFeatures,
      lighting: poi.mapRequirements.lightingConditions,
      terrainDistribution: poi.mapRequirements.terrainTypes,
      includeSecrets: settings.detailLevel !== 'basic',
      includeTreasure: poi.treasures.length > 0,
      includeTraps: settings.includeRandomEncounters,
      entryPoints: poi.mapRequirements.entryPoints,
      exitPoints: poi.mapRequirements.exitPoints
    };
  }

  /**
   * Add generated map to workspace
   */
  private addMapToWorkspace(
    workspaceId: string,
    mapResult: MapGenerationResult,
    poi: PointOfInterest
  ): WorkspaceMap {
    if (!mapResult.success || !mapResult.mapData) {
      throw new Error(`Failed to generate map for ${poi.name}`);
    }

    // Create a DnDMap object from the generated data
    const dndMap: any = { // Using any for now until proper map types are available
      metadata: {
        id: `poi-${poi.id}-${Date.now()}`,
        name: poi.name,
        description: poi.description,
        author: 'Campaign Builder',
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '1.0.0',
        tags: [poi.type, poi.category ? poi.category.replace('_', ' ') : 'other'].filter(Boolean),
        generationHistory: [{
          id: `gen-${Date.now()}`,
          timestamp: new Date(),
          method: 'campaign_builder',
          parameters: {
            poiId: poi.id,
            storyRelevance: poi.storyRelevance,
            difficulty: poi.difficultyRating
          }
        }]
      },
      dimensions: { 
        width: poi.mapRequirements.dimensions.width, 
        height: poi.mapRequirements.dimensions.height 
      },
      gridConfig: { size: 20, visible: true, snapToGrid: true },
      layers: [],
      ...mapResult.mapData
    };

    const workspaceMap = workspaceService.addMap(dndMap, 'dungeon');
    return workspaceMap;
  }

  /**
   * Estimate total generation time
   */
  private estimateGenerationTime(pois: PointOfInterest[]): number {
    // Base time per map + complexity factors
    const baseTimePerMap = 30000; // 30 seconds
    const complexityFactor = pois.reduce((sum, poi) => {
      const areaFactor = (poi.mapRequirements.dimensions.width * poi.mapRequirements.dimensions.height) / 900; // normalize to 30x30
      const featureFactor = poi.mapRequirements.requiredFeatures.length * 0.1;
      const difficultyFactor = poi.difficultyRating / 10;
      return sum + (1 + areaFactor + featureFactor + difficultyFactor);
    }, 0);

    return Math.ceil(baseTimePerMap * complexityFactor);
  }

  /**
   * Estimate remaining generation time
   */
  private estimateRemainingTime(
    currentIndex: number,
    totalMaps: number,
    startTime: number
  ): number {
    if (currentIndex === 0) {
      return this.estimateGenerationTime([]);
    }

    const elapsedTime = Date.now() - startTime;
    const averageTimePerMap = elapsedTime / currentIndex;
    const remainingMaps = totalMaps - currentIndex;
    
    return Math.ceil(remainingMaps * averageTimePerMap);
  }

  /**
   * Convert POI to AI generation prompt
   */
  private poiToPrompt(poi: PointOfInterest): string {
    const parts = [
      `Create a D&D map for "${poi.name}"`,
      `Description: ${poi.description}`,
      `Type: ${poi.type}`,
      `Difficulty: ${poi.difficultyRating}/10`
    ];

    if (poi.atmosphericDetails.mood) {
      parts.push(`Mood: ${poi.atmosphericDetails.mood}`);
    }

    if (poi.mapRequirements.lightingConditions) {
      parts.push(`Lighting: ${poi.mapRequirements.lightingConditions}`);
    }

    if (poi.npcs.length > 0) {
      parts.push(`NPCs: ${poi.npcs.join(', ')}`);
    }

    if (poi.mapRequirements.requiredFeatures.length > 0) {
      const featureTypes = poi.mapRequirements.requiredFeatures.map(f => f.type);
      parts.push(`Required features: ${featureTypes.join(', ')}`);
    }

    // Convert terrain distribution object to readable format
    const terrainTypes = Object.keys(poi.mapRequirements.terrainTypes);
    if (terrainTypes.length > 0) {
      parts.push(`Terrain types: ${terrainTypes.join(', ')}`);
    }

    return parts.join('. ');
  }

  /**
   * Convert POI to AI generation options
   */
  private poiToAIOptions(poi: PointOfInterest, settings: CampaignSettings): AIGenerationOptions {
    // Map POI type to AI style
    let style: AIGenerationOptions['style'] = 'dungeon';
    
    switch (poi.type.toLowerCase()) {
      case 'wilderness':
      case 'forest':
      case 'mountain':
        style = 'wilderness';
        break;
      case 'city':
      case 'town':
      case 'village':
        style = 'city';
        break;
      case 'tavern':
      case 'inn':
        style = 'tavern';
        break;
      case 'temple':
      case 'shrine':
      case 'church':
        style = 'temple';
        break;
      default:
        style = 'dungeon';
    }

    // Map settings to complexity
    let complexity: AIGenerationOptions['complexity'] = 'moderate';
    switch (settings.detailLevel) {
      case 'basic':
        complexity = 'simple';
        break;
      case 'detailed':
        complexity = 'complex';
        break;
      default:
        complexity = 'moderate';
    }

    return {
      mapSize: {
        width: poi.mapRequirements.dimensions.width,
        height: poi.mapRequirements.dimensions.height
      },
      style,
      complexity,
      includeObjects: settings.detailLevel !== 'basic',
      seed: settings.generationSeed 
        ? `${settings.generationSeed}-${poi.id}` // Use user seed + POI ID for consistency
        : `${poi.id}-${Date.now()}` // Random seed if no user seed provided
    };
  }

  /**
   * Check if error is critical and should stop generation
   */
  private isCriticalError(error: any): boolean {
    if (error instanceof Error) {
      // Abort signals are critical
      if (error.message.includes('aborted')) {
        return true;
      }
      
      // System errors are critical
      if (error.message.includes('system') || error.message.includes('memory')) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Validate POIs before generation
   */
  validatePOIs(pois: PointOfInterest[]): string[] {
    const errors: string[] = [];

    if (pois.length === 0) {
      errors.push('No points of interest provided');
      return errors;
    }

    pois.forEach((poi, index) => {
      if (!poi.name || poi.name.trim().length === 0) {
        errors.push(`POI ${index + 1}: Name is required`);
      }

      if (!poi.mapRequirements.dimensions.width || poi.mapRequirements.dimensions.width < 10) {
        errors.push(`POI "${poi.name}": Map width must be at least 10`);
      }

      if (!poi.mapRequirements.dimensions.height || poi.mapRequirements.dimensions.height < 10) {
        errors.push(`POI "${poi.name}": Map height must be at least 10`);
      }

      if (poi.mapRequirements.dimensions.width > 100 || poi.mapRequirements.dimensions.height > 100) {
        errors.push(`POI "${poi.name}": Maps larger than 100x100 are not recommended`);
      }
    });

    return errors;
  }

  /**
   * Get generation statistics
   */
  getGenerationStats(pois: PointOfInterest[]): {
    totalMaps: number;
    estimatedTime: number;
    totalArea: number;
    averageComplexity: number;
    mapsByType: Record<string, number>;
    mapsByCategory: Record<string, number>;
  } {
    const totalMaps = pois.length;
    const estimatedTime = this.estimateGenerationTime(pois);
    const totalArea = pois.reduce((sum, poi) => 
      sum + (poi.mapRequirements.dimensions.width * poi.mapRequirements.dimensions.height), 0
    );
    const averageComplexity = pois.reduce((sum, poi) => sum + poi.difficultyRating, 0) / pois.length;

    const mapsByType = pois.reduce((counts, poi) => {
      counts[poi.type] = (counts[poi.type] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    const mapsByCategory = pois.reduce((counts, poi) => {
      counts[poi.category] = (counts[poi.category] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    return {
      totalMaps,
      estimatedTime,
      totalArea,
      averageComplexity,
      mapsByType,
      mapsByCategory
    };
  }
}

// Export singleton instance
export const campaignMapGenerator = new CampaignMapGeneratorService();