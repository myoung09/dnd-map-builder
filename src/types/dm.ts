// DM/Player system type definitions

export interface LightSource {
  id: string;
  x: number;
  y: number;
  radius: number;
  intensity: number; // 0-1
  color?: string;
  type: 'torch' | 'lantern' | 'spell' | 'ambient';
}

export interface LightingState {
  brightness: number; // 0-2 (1 is normal)
  contrast: number; // 0-2 (1 is normal)
  fogOfWarEnabled: boolean;
  lightSources: LightSource[];
}

export interface RevealedArea {
  id: string;
  coordinates: Array<{ x: number; y: number }>;
  shape: 'circle' | 'rectangle' | 'polygon';
}

export interface DMObject {
  id: string;
  spriteId: string;
  x: number;
  y: number;
  category: 'monster' | 'trap' | 'npc' | 'treasure' | 'environment';
  visibleToPlayers: boolean;
  name?: string;
  notes?: string;
  scaleX: number;
  scaleY: number;
  rotation: number;
  zIndex: number;
}

export interface DMSessionState {
  sessionId: string;
  workspaceId: string;
  mapId: string;
  mapData?: any; // MapData from generator types
  lighting: LightingState;
  objects: DMObject[];
  revealedAreas: RevealedArea[];
  createdAt: number;
  updatedAt: number;
}

// WebSocket Event Types
export enum WSEventType {
  MAP_INIT = 'MAP_INIT',
  LIGHTING_UPDATE = 'LIGHTING_UPDATE',
  OBJECT_PLACED = 'OBJECT_PLACED',
  OBJECT_REMOVED = 'OBJECT_REMOVED',
  OBJECT_UPDATED = 'OBJECT_UPDATED',
  AREA_REVEALED = 'AREA_REVEALED',
  AREA_HIDDEN = 'AREA_HIDDEN',
  SYNC_NOW = 'SYNC_NOW',
  SESSION_SAVE = 'SESSION_SAVE',
  SESSION_LOAD = 'SESSION_LOAD',
  PLAYER_JOIN = 'PLAYER_JOIN',
  PLAYER_LEAVE = 'PLAYER_LEAVE',
}

// WebSocket Event Payloads
export interface WSMapInitEvent {
  type: WSEventType.MAP_INIT;
  payload: {
    mapId: string;
    terrainType: string;
    seed: number;
    workspaceId: string;
    width: number;
    height: number;
  };
}

export interface WSLightingUpdateEvent {
  type: WSEventType.LIGHTING_UPDATE;
  payload: {
    brightness: number;
    contrast: number;
    fogOfWarEnabled: boolean;
    lightSources: LightSource[];
  };
}

export interface WSObjectPlacedEvent {
  type: WSEventType.OBJECT_PLACED;
  payload: DMObject;
}

export interface WSObjectRemovedEvent {
  type: WSEventType.OBJECT_REMOVED;
  payload: {
    objectId: string;
  };
}

export interface WSObjectUpdatedEvent {
  type: WSEventType.OBJECT_UPDATED;
  payload: DMObject;
}

export interface WSAreaRevealedEvent {
  type: WSEventType.AREA_REVEALED;
  payload: RevealedArea;
}

export interface WSAreaHiddenEvent {
  type: WSEventType.AREA_HIDDEN;
  payload: {
    areaId: string;
  };
}

export interface WSSyncNowEvent {
  type: WSEventType.SYNC_NOW;
  payload: {
    sessionState: DMSessionState;
  };
}

export interface WSSessionSaveEvent {
  type: WSEventType.SESSION_SAVE;
  payload: {
    workspaceId: string;
    sessionData: DMSessionState;
  };
}

export interface WSSessionLoadEvent {
  type: WSEventType.SESSION_LOAD;
  payload: {
    workspaceId: string;
    sessionData: DMSessionState;
  };
}

export interface WSPlayerJoinEvent {
  type: WSEventType.PLAYER_JOIN;
  payload: {
    playerId: string;
    sessionId: string;
  };
}

export interface WSPlayerLeaveEvent {
  type: WSEventType.PLAYER_LEAVE;
  payload: {
    playerId: string;
  };
}

export type WSEvent =
  | WSMapInitEvent
  | WSLightingUpdateEvent
  | WSObjectPlacedEvent
  | WSObjectRemovedEvent
  | WSObjectUpdatedEvent
  | WSAreaRevealedEvent
  | WSAreaHiddenEvent
  | WSSyncNowEvent
  | WSSessionSaveEvent
  | WSSessionLoadEvent
  | WSPlayerJoinEvent
  | WSPlayerLeaveEvent;

// Connection state
export interface WSConnectionState {
  connected: boolean;
  sessionId: string | null;
  role: 'dm' | 'player' | null;
  error: string | null;
}
