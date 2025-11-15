import { Workspace, WorkspaceMetadata } from '../types/workspace';

export class WorkspacePersistenceService {
  private static instance: WorkspacePersistenceService;
  private readonly STORAGE_PREFIX = 'dnd-map-builder-workspace';
  private readonly RECENT_WORKSPACES_KEY = 'recent-workspaces';
  private readonly CURRENT_WORKSPACE_KEY = 'current-workspace-id';
  private readonly MAX_RECENT_WORKSPACES = 10;

  static getInstance(): WorkspacePersistenceService {
    if (!WorkspacePersistenceService.instance) {
      WorkspacePersistenceService.instance = new WorkspacePersistenceService();
    }
    return WorkspacePersistenceService.instance;
  }

  // Save workspace to localStorage
  async saveWorkspace(workspace: Workspace): Promise<{ success: boolean; error?: string }> {
    try {
      const workspaceKey = `${this.STORAGE_PREFIX}-${workspace.metadata.id}`;
      const serializedWorkspace = JSON.stringify(workspace, this.dateReplacer);
      
      // Check if we have enough storage space
      const storageSize = this.estimateStorageSize(serializedWorkspace);
      if (storageSize > 5 * 1024 * 1024) { // 5MB limit
        return { 
          success: false, 
          error: 'Workspace is too large for local storage (>5MB)' 
        };
      }

      localStorage.setItem(workspaceKey, serializedWorkspace);
      
      // Update recent workspaces list
      this.updateRecentWorkspaces(workspace.metadata);
      
      // Update current workspace reference
      localStorage.setItem(this.CURRENT_WORKSPACE_KEY, workspace.metadata.id);
      
      return { success: true };
    } catch (error) {
      console.error('Failed to save workspace:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Load workspace from localStorage
  async loadWorkspace(workspaceId: string): Promise<{ success: boolean; workspace?: Workspace; error?: string }> {
    try {
      const workspaceKey = `${this.STORAGE_PREFIX}-${workspaceId}`;
      const serializedWorkspace = localStorage.getItem(workspaceKey);
      
      if (!serializedWorkspace) {
        return { success: false, error: 'Workspace not found' };
      }

      const workspace: Workspace = JSON.parse(serializedWorkspace, this.dateReviver);
      
      // Validate workspace integrity
      if (!workspace.metadata || !workspace.metadata.id) {
        return { success: false, error: 'Invalid workspace data' };
      }

      // Update recent workspaces
      this.updateRecentWorkspaces(workspace.metadata);
      
      return { success: true, workspace };
    } catch (error) {
      console.error('Failed to load workspace:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to parse workspace data' 
      };
    }
  }

  // Load the last active workspace
  async loadCurrentWorkspace(): Promise<{ success: boolean; workspace?: Workspace; error?: string }> {
    const currentWorkspaceId = localStorage.getItem(this.CURRENT_WORKSPACE_KEY);
    
    if (!currentWorkspaceId) {
      return { success: false, error: 'No current workspace set' };
    }

    return this.loadWorkspace(currentWorkspaceId);
  }

  // Get list of recent workspaces
  getRecentWorkspaces(): WorkspaceMetadata[] {
    try {
      const recentWorkspacesStr = localStorage.getItem(this.RECENT_WORKSPACES_KEY);
      
      if (!recentWorkspacesStr) {
        return [];
      }

      const recentWorkspaces: WorkspaceMetadata[] = JSON.parse(recentWorkspacesStr, this.dateReviver);
      
      // Filter out workspaces that no longer exist
      return recentWorkspaces.filter(metadata => {
        const workspaceKey = `${this.STORAGE_PREFIX}-${metadata.id}`;
        return localStorage.getItem(workspaceKey) !== null;
      });
    } catch (error) {
      console.error('Failed to get recent workspaces:', error);
      return [];
    }
  }

  // Delete workspace from localStorage
  async deleteWorkspace(workspaceId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const workspaceKey = `${this.STORAGE_PREFIX}-${workspaceId}`;
      localStorage.removeItem(workspaceKey);
      
      // Remove from recent workspaces
      this.removeFromRecentWorkspaces(workspaceId);
      
      // Clear current workspace if it was the deleted one
      const currentWorkspaceId = localStorage.getItem(this.CURRENT_WORKSPACE_KEY);
      if (currentWorkspaceId === workspaceId) {
        localStorage.removeItem(this.CURRENT_WORKSPACE_KEY);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Failed to delete workspace:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Check if workspace exists in storage
  workspaceExists(workspaceId: string): boolean {
    const workspaceKey = `${this.STORAGE_PREFIX}-${workspaceId}`;
    return localStorage.getItem(workspaceKey) !== null;
  }

  // Get storage usage information
  getStorageInfo(): {
    totalSize: number;
    workspaceCount: number;
    availableSpace: number;
    workspaces: Array<{ id: string; name: string; size: number }>;
  } {
    let totalSize = 0;
    let workspaceCount = 0;
    const workspaces: Array<{ id: string; name: string; size: number }> = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.STORAGE_PREFIX) && !key.includes('recent') && !key.includes('current')) {
        const value = localStorage.getItem(key);
        if (value) {
          const size = new Blob([value]).size;
          totalSize += size;
          workspaceCount++;

          try {
            const workspace = JSON.parse(value);
            workspaces.push({
              id: workspace.metadata.id,
              name: workspace.metadata.name,
              size
            });
          } catch (error) {
            // Skip invalid workspace data
          }
        }
      }
    }

    // Estimate available space (localStorage typically has 5-10MB limit)
    const estimatedLimit = 5 * 1024 * 1024; // 5MB conservative estimate
    const availableSpace = Math.max(0, estimatedLimit - totalSize);

    return {
      totalSize,
      workspaceCount,
      availableSpace,
      workspaces: workspaces.sort((a, b) => b.size - a.size)
    };
  }

  // Clear all workspace data
  async clearAllWorkspaces(): Promise<{ success: boolean; error?: string }> {
    try {
      // Find and remove all workspace-related keys
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.STORAGE_PREFIX)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      return { success: true };
    } catch (error) {
      console.error('Failed to clear workspaces:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Export workspace data for backup
  exportWorkspaceData(workspaceId: string): string | null {
    try {
      const workspaceKey = `${this.STORAGE_PREFIX}-${workspaceId}`;
      const workspaceData = localStorage.getItem(workspaceKey);
      
      if (!workspaceData) {
        return null;
      }

      // Create backup object with metadata
      const backup = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        workspaceId,
        data: workspaceData
      };

      return JSON.stringify(backup);
    } catch (error) {
      console.error('Failed to export workspace data:', error);
      return null;
    }
  }

  // Import workspace data from backup
  async importWorkspaceData(backupData: string): Promise<{ success: boolean; workspaceId?: string; error?: string }> {
    try {
      const backup = JSON.parse(backupData);
      
      if (!backup.version || !backup.data) {
        return { success: false, error: 'Invalid backup format' };
      }

      const workspace: Workspace = JSON.parse(backup.data, this.dateReviver);
      
      // Save the imported workspace
      const saveResult = await this.saveWorkspace(workspace);
      
      if (saveResult.success) {
        return { 
          success: true, 
          workspaceId: workspace.metadata.id 
        };
      } else {
        return saveResult;
      }
    } catch (error) {
      console.error('Failed to import workspace data:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to parse backup data' 
      };
    }
  }

  // Helper method to update recent workspaces list
  private updateRecentWorkspaces(metadata: WorkspaceMetadata): void {
    try {
      const recentWorkspaces = this.getRecentWorkspaces();
      
      // Remove if already exists (to move to front)
      const filtered = recentWorkspaces.filter(ws => ws.id !== metadata.id);
      
      // Add to front
      filtered.unshift(metadata);
      
      // Keep only the most recent ones
      const trimmed = filtered.slice(0, this.MAX_RECENT_WORKSPACES);
      
      localStorage.setItem(this.RECENT_WORKSPACES_KEY, JSON.stringify(trimmed, this.dateReplacer));
    } catch (error) {
      console.error('Failed to update recent workspaces:', error);
    }
  }

  // Helper method to remove workspace from recent list
  private removeFromRecentWorkspaces(workspaceId: string): void {
    try {
      const recentWorkspaces = this.getRecentWorkspaces();
      const filtered = recentWorkspaces.filter(ws => ws.id !== workspaceId);
      
      localStorage.setItem(this.RECENT_WORKSPACES_KEY, JSON.stringify(filtered, this.dateReplacer));
    } catch (error) {
      console.error('Failed to remove from recent workspaces:', error);
    }
  }

  // Helper method to estimate storage size
  private estimateStorageSize(data: string): number {
    return new Blob([data]).size;
  }

  // JSON serialization helpers for Date objects
  private dateReplacer(key: string, value: any): any {
    if (value instanceof Date) {
      return { __isDate: true, value: value.toISOString() };
    }
    return value;
  }

  private dateReviver(key: string, value: any): any {
    if (value && typeof value === 'object' && value.__isDate) {
      return new Date(value.value);
    }
    return value;
  }
}

export const workspacePersistenceService = WorkspacePersistenceService.getInstance();
export default workspacePersistenceService;