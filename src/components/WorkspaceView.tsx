import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Card,
  CardContent,
  Chip,
  Tooltip
} from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import { Workspace, WorkspaceMap } from '../types/workspace';

export interface WorkspaceViewProps {
  workspace: Workspace | null;
  onSelectMap: (mapId: string) => void;
  onRegenerateMap: (mapId: string) => void;
  onDeleteMap: (mapId: string) => void;
}

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({
  workspace,
  onSelectMap,
  onRegenerateMap,
  onDeleteMap
}) => {
  if (!workspace) {
    return (
      <Box p={4} textAlign="center">
        <Typography variant="h6" color="text.secondary">
          No workspace loaded
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={1}>
          Use the Campaign Wizard to create a new workspace from your campaign write-up
        </Typography>
      </Box>
    );
  }

  return (
    <Box p={2}>
      {/* Workspace Header */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <MapIcon color="primary" />
            <Typography variant="h5">{workspace.metadata.name}</Typography>
          </Box>
          
          {workspace.metadata.description && (
            <Typography variant="body2" color="text.secondary" mb={2}>
              {workspace.metadata.description}
            </Typography>
          )}

          <Box display="flex" gap={1} flexWrap="wrap">
            <Chip 
              label={`${workspace.maps.length} maps`} 
              size="small" 
              color="primary" 
              variant="outlined" 
            />
            <Chip 
              label={`Created ${new Date(workspace.metadata.createdAt).toLocaleDateString()}`} 
              size="small" 
              variant="outlined" 
            />
            {workspace.metadata.author && (
              <Chip 
                label={`By ${workspace.metadata.author}`} 
                size="small" 
                variant="outlined" 
              />
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Maps List */}
      <Typography variant="h6" gutterBottom>
        Maps
      </Typography>

      {workspace.maps.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No maps in workspace
        </Typography>
      ) : (
        <List>
          {workspace.maps.map((map: WorkspaceMap) => (
            <Card key={map.id} sx={{ mb: 1 }}>
              <ListItem>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="h6">{map.name}</Typography>
                      <Chip label={map.category} size="small" color="secondary" variant="outlined" />
                      {map.tags.filter(t => t).map((tag, idx) => (
                        <Chip key={idx} label={tag} size="small" variant="outlined" />
                      ))}
                    </Box>
                  }
                  secondary={
                    <Box mt={0.5}>
                      <Typography variant="body2" color="text.secondary">
                        {map.description || 'No description'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                        {(map.mapData as any).width}x{(map.mapData as any).height} | 
                        Terrain: {(map.mapData as any).terrainType} |
                        Last modified: {new Date(map.lastModified).toLocaleString()}
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Box display="flex" gap={0.5}>
                    <Tooltip title="View Map">
                      <IconButton 
                        edge="end" 
                        onClick={() => onSelectMap(map.id)}
                        size="small"
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Regenerate Map">
                      <IconButton 
                        edge="end" 
                        onClick={() => onRegenerateMap(map.id)}
                        size="small"
                      >
                        <RefreshIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Map">
                      <IconButton 
                        edge="end" 
                        onClick={() => onDeleteMap(map.id)}
                        size="small"
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
            </Card>
          ))}
        </List>
      )}
    </Box>
  );
};
