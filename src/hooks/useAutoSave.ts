import { useEffect, useCallback, useRef } from 'react';
import { DnDMap } from '../types/map';
import { fileService } from '../services/fileService';
import { PERFORMANCE } from '../utils/constants';

interface UseAutoSaveOptions {
  map: DnDMap;
  isDirty: boolean;
  onAutoSave?: () => void;
  enabled?: boolean;
}

export const useAutoSave = ({ 
  map, 
  isDirty, 
  onAutoSave, 
  enabled = true 
}: UseAutoSaveOptions) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<Date>(new Date());

  const performAutoSave = useCallback(() => {
    if (!enabled || !isDirty) return;

    try {
      fileService.autoSaveMap(map);
      lastSaveRef.current = new Date();
      onAutoSave?.();
      console.log('Auto-saved map:', map.metadata.name);
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [map, isDirty, enabled, onAutoSave]);

  // Set up auto-save timer
  useEffect(() => {
    if (!enabled || !isDirty) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      performAutoSave();
    }, PERFORMANCE.AUTO_SAVE_INTERVAL);

    // Cleanup on unmount or dependency change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [map, isDirty, enabled, performAutoSave]);

  // Manual save function
  const manualSave = useCallback(() => {
    performAutoSave();
  }, [performAutoSave]);

  // Get last save time
  const getLastSaveTime = useCallback(() => {
    return lastSaveRef.current;
  }, []);

  return {
    manualSave,
    getLastSaveTime
  };
};