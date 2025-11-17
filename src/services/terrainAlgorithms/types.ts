import { Position, Color } from '../../types/map';

/**
 * Shared type definitions for terrain generation algorithms
 */

export interface RoomShape {
  type: 'rectangle' | 'circle' | 'organic' | 'polygon';
  points?: Position[];
  radius?: number;
}

export interface GeneratedRoom {
  id: string;
  type: string;
  shape: RoomShape;
  position: Position;
  size: { width: number; height: number };
  color?: Color;
  doors?: Position[];
  padding?: number;
}
