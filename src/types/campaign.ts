import { WorkspaceMap } from './workspace';

// Campaign story and narrative structure
export interface CampaignStory {
  id: string;
  title: string;
  description: string;
  theme: CampaignTheme;
  setting: CampaignSetting;
  playerLevel: PlayerLevel;
  estimatedSessions: number;
  genres: CampaignGenre[];
  plotSummary: string;
  keyNPCs: CampaignNPC[];
  mainAntagonist?: CampaignNPC;
  overarchingPlot: string;
  createdAt: Date;
  lastModified: Date;
}

export interface CampaignNPC {
  id: string;
  name: string;
  role: 'ally' | 'enemy' | 'neutral' | 'quest_giver' | 'merchant' | 'ruler';
  description: string;
  importance: 'major' | 'minor' | 'background';
  relatedPOIs: string[]; // POI IDs where this NPC appears
}

export type CampaignTheme = 
  | 'heroic_fantasy' 
  | 'dark_fantasy' 
  | 'gothic_horror' 
  | 'high_magic' 
  | 'low_magic' 
  | 'political_intrigue' 
  | 'exploration' 
  | 'mystery' 
  | 'war' 
  | 'survival';

export type CampaignSetting = 
  | 'medieval_fantasy' 
  | 'urban_fantasy' 
  | 'steampunk' 
  | 'post_apocalyptic' 
  | 'planar' 
  | 'nautical' 
  | 'desert' 
  | 'arctic' 
  | 'underground' 
  | 'forest';

export type CampaignGenre = 
  | 'dungeon_crawl' 
  | 'sandbox' 
  | 'railroad' 
  | 'hex_crawl' 
  | 'mystery' 
  | 'social' 
  | 'combat_heavy' 
  | 'roleplay_heavy';

export type PlayerLevel = 'beginner' | 'intermediate' | 'advanced' | 'mixed';

// Points of Interest (locations that need maps)
export interface PointOfInterest {
  id: string;
  name: string;
  type: POIType;
  category: POICategory;
  description: string;
  storyRelevance: StoryRelevance;
  mapRequirements: MapRequirements;
  connections: POIConnection[];
  npcs: string[]; // NPC IDs present at this location
  encounters: EncounterInfo[];
  treasures: TreasureInfo[];
  secrets: SecretInfo[];
  atmosphericDetails: AtmosphericDetails;
  estimatedPlayTime: number; // in minutes
  difficultyRating: number; // 1-10 scale
  order: number; // sequence in campaign
  isOptional: boolean;
  prerequisites?: string[]; // Other POI IDs that should be completed first
  generatedMapId?: string; // ID of generated map
}

export type POIType = 
  | 'dungeon' 
  | 'town' 
  | 'city' 
  | 'village' 
  | 'wilderness' 
  | 'building' 
  | 'ruins' 
  | 'cave' 
  | 'forest' 
  | 'mountain' 
  | 'swamp' 
  | 'desert' 
  | 'coast' 
  | 'underground' 
  | 'planar' 
  | 'ship' 
  | 'fortress';

export type POICategory = 
  | 'starting_location' 
  | 'hub' 
  | 'main_quest' 
  | 'side_quest' 
  | 'social_encounter' 
  | 'combat_encounter' 
  | 'puzzle' 
  | 'exploration' 
  | 'boss_fight' 
  | 'finale' 
  | 'rest_area' 
  | 'shop' 
  | 'information';

export type StoryRelevance = 'critical' | 'important' | 'optional' | 'flavor';

export interface MapRequirements {
  dimensions: { width: number; height: number };
  requiredFeatures: MapFeature[];
  terrainTypes: TerrainDistribution;
  lightingConditions: LightingCondition;
  weatherEffects?: WeatherEffect;
  specialMechanics?: SpecialMechanic[];
  entryPoints: EntryPoint[];
  exitPoints: ExitPoint[];
  hiddenAreas?: HiddenArea[];
}

export interface MapFeature {
  type: FeatureType;
  description: string;
  importance: 'required' | 'preferred' | 'optional';
  position?: 'center' | 'edge' | 'corner' | 'anywhere';
  quantity?: number;
}

export type FeatureType = 
  | 'altar' 
  | 'trap' 
  | 'secret_door' 
  | 'treasure_chest' 
  | 'fountain' 
  | 'statue' 
  | 'pillar' 
  | 'pit' 
  | 'bridge' 
  | 'stairs' 
  | 'throne' 
  | 'bed' 
  | 'table' 
  | 'bookshelf' 
  | 'forge' 
  | 'well' 
  | 'garden' 
  | 'campfire' 
  | 'portal';

export interface TerrainDistribution {
  [terrainType: string]: number; // percentage (0-100)
}

export type LightingCondition = 'bright' | 'dim' | 'dark' | 'magical' | 'flickering' | 'natural';
export type WeatherEffect = 'rain' | 'snow' | 'fog' | 'storm' | 'heat' | 'cold' | 'wind';

export interface SpecialMechanic {
  type: 'teleporter' | 'moving_platform' | 'puzzle_lock' | 'environmental_hazard' | 'magical_effect';
  description: string;
  triggerCondition?: string;
}

export interface EntryPoint {
  id: string;
  type: 'door' | 'stairs' | 'portal' | 'path' | 'window' | 'hole';
  position: 'north' | 'south' | 'east' | 'west' | 'center';
  description: string;
  connectsTo?: string; // POI ID
}

export interface ExitPoint {
  id: string;
  type: 'door' | 'stairs' | 'portal' | 'path' | 'window' | 'hole';
  position: 'north' | 'south' | 'east' | 'west' | 'center';
  description: string;
  leadsTo?: string; // POI ID or description
  isHidden: boolean;
}

export interface HiddenArea {
  name: string;
  description: string;
  discoveryMethod: 'search' | 'puzzle' | 'key' | 'magic' | 'story';
  contents: string;
}

export interface POIConnection {
  targetPOIId: string;
  connectionType: 'travel' | 'teleport' | 'story' | 'quest' | 'information';
  distance?: string;
  travelMethod?: string;
  description: string;
}

export interface EncounterInfo {
  id: string;
  type: 'combat' | 'social' | 'puzzle' | 'trap' | 'environmental';
  difficulty: 'trivial' | 'easy' | 'medium' | 'hard' | 'deadly';
  description: string;
  triggerCondition?: string;
  rewards?: string[];
  consequences?: string[];
}

export interface TreasureInfo {
  id: string;
  type: 'gold' | 'magic_item' | 'art' | 'information' | 'key_item';
  description: string;
  hiddenMethod?: 'search' | 'puzzle' | 'defeat_enemy' | 'story';
  value: 'trivial' | 'minor' | 'moderate' | 'major' | 'legendary';
}

export interface SecretInfo {
  id: string;
  description: string;
  discoveryMethod: 'investigation' | 'passive_perception' | 'story' | 'npc' | 'item';
  importance: 'flavor' | 'useful' | 'important' | 'critical';
  revealedInformation: string;
}

export interface AtmosphericDetails {
  ambiance: string;
  sounds: string[];
  smells: string[];
  visualDetails: string[];
  mood: 'cheerful' | 'neutral' | 'tense' | 'ominous' | 'mysterious' | 'peaceful' | 'chaotic';
  temperature: 'cold' | 'cool' | 'comfortable' | 'warm' | 'hot';
}

// Campaign Builder Project
export interface CampaignProject {
  id: string;
  metadata: CampaignProjectMetadata;
  story: CampaignStory;
  pointsOfInterest: PointOfInterest[];
  generationSettings: GenerationSettings;
  generationProgress: GenerationProgress;
  workspace?: string; // Workspace ID if created
}

export interface CampaignProjectMetadata {
  name: string;
  description: string;
  author: string;
  createdAt: Date;
  lastModified: Date;
  version: string;
  status: CampaignStatus;
  tags: string[];
}

export type CampaignStatus = 'draft' | 'preparing' | 'analyzing' | 'generating' | 'completed' | 'failed' | 'error' | 'cancelled';

export interface GenerationSettings {
  aiProvider: 'openai' | 'local' | 'claude';
  detailLevel: 'basic' | 'detailed' | 'comprehensive';
  artStyle: 'realistic' | 'stylized' | 'hand_drawn' | 'pixel_art';
  colorScheme: 'vibrant' | 'muted' | 'dark' | 'monochrome' | 'themed';
  generateConnections: boolean;
  includeSecrets: boolean;
  generateNPCs: boolean;
  createFolderStructure: boolean;
  estimatedTime: number; // in minutes
}

export interface GenerationProgress {
  status: CampaignStatus;
  currentStep: GenerationStep;
  stepsCompleted: number;
  totalSteps: number;
  currentPOI?: string; // Currently generating POI ID
  completedPOIs: string[];
  failedPOIs: GenerationError[];
  startTime?: Date;
  estimatedCompletion?: Date;
  logs: GenerationLog[];
}

export type GenerationStep = 
  | 'initializing' 
  | 'analyzing_story' 
  | 'creating_workspace' 
  | 'generating_maps' 
  | 'creating_connections' 
  | 'finalizing' 
  | 'completed'
  | 'error';

export interface GenerationError {
  poiId: string;
  poiName: string;
  error: string;
  timestamp: Date;
  retryable: boolean;
  recoverable: boolean;
}

export interface GenerationLog {
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  poiId?: string;
}

// Story Analysis and Suggestions
export interface StoryAnalysis {
  suggestedPOIs: SuggestedPOI[];
  identifiedThemes: CampaignTheme[];
  estimatedComplexity: 'simple' | 'moderate' | 'complex' | 'epic';
  recommendedPlayerLevel: PlayerLevel;
  suggestedGenres: CampaignGenre[];
  detectedNPCs: DetectedNPC[];
  plotPoints: PlotPoint[];
  warnings: string[];
  suggestions: string[];
}

export interface SuggestedPOI {
  name: string;
  type: POIType;
  category: POICategory;
  description: string;
  confidence: number; // 0-1 how confident the AI is about this suggestion
  reasoning: string;
  extractedFromText: string; // The text that led to this suggestion
}

export interface DetectedNPC {
  name: string;
  role: CampaignNPC['role'];
  description: string;
  importance: CampaignNPC['importance'];
  confidence: number;
  extractedFromText: string;
}

export interface PlotPoint {
  id: string;
  title: string;
  description: string;
  order: number;
  associatedPOIs: string[];
  importance: 'major' | 'minor' | 'subplot';
}

// Templates and Presets
export interface CampaignTemplate {
  id: string;
  name: string;
  description: string;
  theme: CampaignTheme;
  setting: CampaignSetting;
  genre: CampaignGenre[];
  estimatedSessions: number;
  defaultPOIs: Partial<PointOfInterest>[];
  storyOutline: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface POITemplate {
  id: string;
  name: string;
  type: POIType;
  category: POICategory;
  description: string;
  mapRequirements: Partial<MapRequirements>;
  commonEncounters: Partial<EncounterInfo>[];
  commonTreasures: Partial<TreasureInfo>[];
  atmosphericDefaults: Partial<AtmosphericDetails>;
}

// Generation Events
export interface CampaignGenerationEvent {
  type: 'GENERATION_STARTED' | 'POI_COMPLETED' | 'POI_FAILED' | 'GENERATION_COMPLETED' | 'GENERATION_FAILED' | 'PROGRESS_UPDATE';
  payload: {
    campaignId: string;
    progress?: GenerationProgress;
    poiId?: string;
    error?: string;
    completedMaps?: WorkspaceMap[];
  };
  timestamp: Date;
}

// Additional types for campaign generation service
export type GenerationStatus = 'preparing' | 'generating' | 'completed' | 'failed' | 'aborted';

export interface MapGenerationResult {
  poi: PointOfInterest;
  mapData: any | null; // Will be MapData when mapGenerator is available
  generationTime: number;
  success: boolean;
  error?: string;
}

export interface CampaignSettings {
  autoGenerateMaps: boolean;
  includeRandomEncounters: boolean;
  detailLevel: 'basic' | 'medium' | 'detailed';
  mapStyle: 'dungeon' | 'wilderness' | 'city' | 'mixed';
  generateNPCPortraits: boolean;
  createHandouts: boolean;
  generationSeed?: string; // For reproducible map generation
}

// Simple campaign story for the builder dialog
export interface SimpleCampaignStory {
  title: string;
  description: string;
  theme: string;
  playerCount: number;
  estimatedSessions: number;
  difficultyLevel: number;
  tags: string[];
}