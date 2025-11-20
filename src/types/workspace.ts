import { DnDMap } from './map';
import { Palette, PlacedSprite } from './palette';

export interface WorkspaceMetadata {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  createdAt: Date;
  lastModified: Date;
  campaignInfo?: CampaignInfo;
  tags: string[];
  mapCount: number;
}

export interface CampaignInfo {
  name: string;
  description: string;
  playerNames: string[];
  dmName: string;
  systemType: 'D&D 5e' | 'Pathfinder' | 'Custom' | string;
  campaignNotes: string;
  sessionNotes: SessionNote[];
}

export interface SessionNote {
  id: string;
  sessionNumber: number;
  date: Date;
  title: string;
  notes: string;
  mapsUsed: string[]; // Map IDs that were used in this session
}

export interface WorkspaceMap {
  id: string;
  name: string;
  description: string;
  filePath: string;
  thumbnailPath?: string;
  tags: string[];
  createdAt: Date;
  lastModified: Date;
  mapData: DnDMap;
  placedSprites?: PlacedSprite[]; // Sprites placed on this map
  isArchived: boolean;
  category: 'dungeon' | 'overworld' | 'city' | 'building' | 'encounter' | 'other';
}

export interface Workspace {
  metadata: WorkspaceMetadata;
  maps: WorkspaceMap[];
  folders: WorkspaceFolder[];
  settings: WorkspaceSettings;
  palette?: Palette; // Sprite palette for this workspace
}

export interface WorkspaceFolder {
  id: string;
  name: string;
  path: string;
  parentId?: string;
  mapIds: string[]; // Maps contained in this folder
  subFolderIds: string[]; // Nested folders
  color?: string;
  isExpanded: boolean;
}

export interface WorkspaceSettings {
  defaultGridSize: number;
  defaultMapDimensions: { width: number; height: number };
  autoSave: boolean;
  autoSaveInterval: number; // minutes
  backupCount: number;
  exportFormat: 'json' | 'zip';
  thumbnailGeneration: boolean;
  recentWorkspaces: string[]; // Paths to recent workspaces
}

export interface WorkspaceFileStructure {
  'workspace.json': WorkspaceMetadata;
  'maps/': {
    [mapId: string]: {
      'map.json': DnDMap;
      'thumbnail.png'?: Uint8Array;
      'assets/'?: {
        [assetName: string]: Uint8Array;
      };
    };
  };
  'campaign/': {
    'info.json': CampaignInfo;
    'notes/': {
      [sessionId: string]: SessionNote;
    };
  };
  'settings.json': WorkspaceSettings;
  'folders.json': WorkspaceFolder[];
}

// Events for workspace state management
export interface WorkspaceEvent {
  type: 'MAP_ADDED' | 'MAP_REMOVED' | 'MAP_UPDATED' | 'FOLDER_CREATED' | 'FOLDER_DELETED' | 'WORKSPACE_SAVED' | 'WORKSPACE_LOADED';
  payload: any;
  timestamp: Date;
}

export interface WorkspaceState {
  currentWorkspace: Workspace | null;
  isLoading: boolean;
  hasUnsavedChanges: boolean;
  recentWorkspaces: WorkspaceMetadata[];
  error: string | null;
}

// File import/export types
export interface ImportOptions {
  includeAssets: boolean;
  mergeDuplicates: boolean;
  preserveFolderStructure: boolean;
}

export interface ExportOptions {
  includeAssets: boolean;
  includeBackups: boolean;
  format: 'zip' | 'folder';
  compression: 'none' | 'low' | 'medium' | 'high';
}

// Drag and drop types
export interface DroppedFile {
  name: string;
  path: string;
  type: string;
  size: number;
  content: ArrayBuffer | string;
}

export interface WorkspaceImportResult {
  success: boolean;
  workspace?: Workspace;
  errors: string[];
  warnings: string[];
  mapsImported: number;
  assetsImported: number;
}