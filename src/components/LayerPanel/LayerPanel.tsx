import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Menu,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Slider,
  Chip,
  Tooltip
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  DragIndicator,
  MoreVert,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Layers as LayersIcon,
  Terrain as TerrainIcon,
  Category as ObjectsIcon,
  Brush as OverlayIcon,
  Lock,
  LockOpen
} from '@mui/icons-material';
import { DnDMap, MapLayer, LayerType } from '../../types/map';

interface LayerPanelProps {
  map: DnDMap;
  onMapChange: (map: DnDMap) => void;
  activeLayerId: string;
  onActiveLayerChange: (layerId: string) => void;
  onClose?: () => void;
}

interface LayerMenuState {
  anchorEl: HTMLElement | null;
  layerId: string | null;
}

interface NewLayerDialogState {
  open: boolean;
  name: string;
  type: LayerType;
  opacity: number;
}

const LayerPanel: React.FC<LayerPanelProps> = ({
  map,
  onMapChange,
  activeLayerId,
  onActiveLayerChange,
  onClose
}) => {
  const [layerMenu, setLayerMenu] = useState<LayerMenuState>({ anchorEl: null, layerId: null });
  const [newLayerDialog, setNewLayerDialog] = useState<NewLayerDialogState>({
    open: false,
    name: '',
    type: LayerType.OVERLAY,
    opacity: 1
  });

  // Get layer icon based on type
  const getLayerIcon = (layer: MapLayer) => {
    const iconProps = { 
      fontSize: 'small' as const, 
      color: layer.isVisible ? ('inherit' as const) : ('disabled' as const)
    };
    
    switch (layer.type) {
      case LayerType.TERRAIN:
        return <TerrainIcon {...iconProps} />;
      case LayerType.OBJECTS:
        return <ObjectsIcon {...iconProps} />;
      case LayerType.OVERLAY:
        return <OverlayIcon {...iconProps} />;
      default:
        return <LayersIcon {...iconProps} />;
    }
  };

  // Get layer description
  const getLayerDescription = (layer: MapLayer) => {
    switch (layer.type) {
      case 'terrain':
        return `${layer.tiles?.length || 0} tiles`;
      case 'objects':
        return `${layer.objects?.length || 0} objects`;
      case 'overlay':
        return `Opacity: ${Math.round((layer.opacity || 1) * 100)}%`;
      default:
        return '';
    }
  };

  // Toggle layer visibility
  const handleVisibilityToggle = useCallback((layerId: string) => {
    const updatedLayers = map.layers.map(layer =>
      layer.id === layerId ? { ...layer, isVisible: !layer.isVisible } : layer
    );
    
    const updatedMap = { ...map, layers: updatedLayers };
    onMapChange(updatedMap);
  }, [map, onMapChange]);

  // Toggle layer lock
  const handleLockToggle = useCallback((layerId: string) => {
    const updatedLayers = map.layers.map(layer =>
      layer.id === layerId ? { ...layer, isLocked: !layer.isLocked } : layer
    );
    
    const updatedMap = { ...map, layers: updatedLayers };
    onMapChange(updatedMap);
  }, [map, onMapChange]);

  // Change layer opacity
  const handleOpacityChange = useCallback((layerId: string, opacity: number) => {
    const updatedLayers = map.layers.map(layer =>
      layer.id === layerId ? { ...layer, opacity } : layer
    );
    
    const updatedMap = { ...map, layers: updatedLayers };
    onMapChange(updatedMap);
  }, [map, onMapChange]);

  // Move layer up/down
  const moveLayer = useCallback((layerId: string, direction: 'up' | 'down') => {
    const layers = [...map.layers];
    const currentIndex = layers.findIndex(layer => layer.id === layerId);
    
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex < 0 || newIndex >= layers.length) return;
    
    // Swap layers
    [layers[currentIndex], layers[newIndex]] = [layers[newIndex], layers[currentIndex]];
    
    const updatedMap = { ...map, layers };
    onMapChange(updatedMap);
  }, [map, onMapChange]);

  // Delete layer
  const handleDeleteLayer = useCallback((layerId: string) => {
    const layer = map.layers.find(l => l.id === layerId);
    
    // Prevent deletion of essential layers
    if (layer && ['terrain', 'objects'].includes(layer.type)) {
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this layer?')) {
      const updatedLayers = map.layers.filter(layer => layer.id !== layerId);
      const updatedMap = { ...map, layers: updatedLayers };
      
      // If deleted layer was active, switch to first available layer
      if (activeLayerId === layerId && updatedLayers.length > 0) {
        onActiveLayerChange(updatedLayers[0].id);
      }
      
      onMapChange(updatedMap);
    }
  }, [map, onMapChange, activeLayerId, onActiveLayerChange]);

  // Add new layer
  const handleAddLayer = useCallback(() => {
    const newLayer: MapLayer = {
      id: crypto.randomUUID(),
      name: newLayerDialog.name || `New ${newLayerDialog.type} Layer`,
      type: newLayerDialog.type,
      isVisible: true,
      isLocked: false,
      opacity: newLayerDialog.opacity,
      tiles: newLayerDialog.type === 'terrain' ? [] : undefined,
      objects: newLayerDialog.type === 'objects' ? [] : undefined
    };
    
    const updatedLayers = [...map.layers, newLayer];
    const updatedMap = { ...map, layers: updatedLayers };
    
    onMapChange(updatedMap);
    onActiveLayerChange(newLayer.id);
    
    setNewLayerDialog({ open: false, name: '', type: LayerType.OVERLAY, opacity: 1 });
  }, [map, onMapChange, onActiveLayerChange, newLayerDialog]);

  // Handle layer menu
  const handleLayerMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>, layerId: string) => {
    event.stopPropagation();
    setLayerMenu({ anchorEl: event.currentTarget, layerId });
  }, []);

  const handleLayerMenuClose = useCallback(() => {
    setLayerMenu({ anchorEl: null, layerId: null });
  }, []);

  // Duplicate layer
  const handleDuplicateLayer = useCallback((layerId: string) => {
    const sourceLayer = map.layers.find(l => l.id === layerId);
    if (!sourceLayer) return;
    
    const duplicatedLayer: MapLayer = {
      ...sourceLayer,
      id: crypto.randomUUID(),
      name: `${sourceLayer.name} Copy`,
      tiles: sourceLayer.tiles ? [...sourceLayer.tiles] : undefined,
      objects: sourceLayer.objects ? [...sourceLayer.objects] : undefined
    };
    
    const updatedLayers = [...map.layers, duplicatedLayer];
    const updatedMap = { ...map, layers: updatedLayers };
    
    onMapChange(updatedMap);
    handleLayerMenuClose();
  }, [map, onMapChange, handleLayerMenuClose]);

  return (
    <Paper sx={{ width: 300, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LayersIcon />
            Layers
          </Typography>
          {onClose && (
            <IconButton size="small" onClick={onClose}>
              <EditIcon />
            </IconButton>
          )}
        </Box>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setNewLayerDialog({ ...newLayerDialog, open: true })}
          sx={{ mt: 1 }}
        >
          Add Layer
        </Button>
      </Box>

      {/* Layer List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List dense>
          {map.layers.map((layer, index) => (
            <ListItem
              key={layer.id}
              onClick={() => onActiveLayerChange(layer.id)}
              sx={{
                cursor: 'pointer',
                opacity: layer.isVisible ? 1 : 0.6,
                backgroundColor: layer.id === activeLayerId ? 'primary.main' : 'transparent',
                color: layer.id === activeLayerId ? 'primary.contrastText' : 'inherit',
                '&:hover': {
                  backgroundColor: layer.id === activeLayerId ? 'primary.dark' : 'action.hover',
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <DragIndicator sx={{ cursor: 'grab', mr: 0.5 }} />
                {getLayerIcon(layer)}
              </ListItemIcon>
              
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" noWrap>
                      {layer.name}
                    </Typography>
                    {layer.isLocked && (
                      <Lock fontSize="small" sx={{ opacity: 0.7 }} />
                    )}
                    <Chip
                      label={layer.type}
                      size="small"
                      variant="outlined"
                      sx={{ height: 18, fontSize: '0.65rem' }}
                    />
                  </Box>
                }
                secondary={getLayerDescription(layer)}
              />
              
              <ListItemSecondaryAction>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Tooltip title={layer.isLocked ? 'Unlock layer' : 'Lock layer'}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLockToggle(layer.id);
                      }}
                    >
                      {layer.isLocked ? <Lock /> : <LockOpen />}
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title={layer.isVisible ? 'Hide layer' : 'Show layer'}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVisibilityToggle(layer.id);
                      }}
                    >
                      {layer.isVisible ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </Tooltip>
                  
                  <IconButton
                    size="small"
                    onClick={(e) => handleLayerMenuOpen(e, layer.id)}
                  >
                    <MoreVert />
                  </IconButton>
                </Box>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Layer Controls for Active Layer */}
      {(() => {
        const activeLayer = map.layers.find(l => l.id === activeLayerId);
        return activeLayer && (activeLayer.type === 'overlay' || activeLayer.opacity !== undefined) ? (
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" gutterBottom>
              Layer Opacity
            </Typography>
            <Slider
              value={(activeLayer.opacity || 1) * 100}
              onChange={(_, value) => handleOpacityChange(activeLayerId, (value as number) / 100)}
              min={0}
              max={100}
              step={1}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value}%`}
            />
          </Box>
        ) : null;
      })()}

      {/* Layer Menu */}
      <Menu
        anchorEl={layerMenu.anchorEl}
        open={Boolean(layerMenu.anchorEl)}
        onClose={handleLayerMenuClose}
      >
        <MenuItem onClick={() => {
          if (layerMenu.layerId) moveLayer(layerMenu.layerId, 'up');
          handleLayerMenuClose();
        }}>
          Move Up
        </MenuItem>
        <MenuItem onClick={() => {
          if (layerMenu.layerId) moveLayer(layerMenu.layerId, 'down');
          handleLayerMenuClose();
        }}>
          Move Down
        </MenuItem>
        <MenuItem onClick={() => {
          if (layerMenu.layerId) handleDuplicateLayer(layerMenu.layerId);
        }}>
          Duplicate Layer
        </MenuItem>
        <MenuItem 
          onClick={() => {
            if (layerMenu.layerId) handleDeleteLayer(layerMenu.layerId);
            handleLayerMenuClose();
          }}
          disabled={layerMenu.layerId ? ['terrain', 'objects'].includes(
            map.layers.find(l => l.id === layerMenu.layerId)?.type || ''
          ) : false}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          Delete Layer
        </MenuItem>
      </Menu>

      {/* New Layer Dialog */}
      <Dialog open={newLayerDialog.open} onClose={() => setNewLayerDialog({ ...newLayerDialog, open: false })}>
        <DialogTitle>Add New Layer</DialogTitle>
        <DialogContent sx={{ minWidth: 300 }}>
          <TextField
            fullWidth
            label="Layer Name"
            value={newLayerDialog.name}
            onChange={(e) => setNewLayerDialog({ ...newLayerDialog, name: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
          />
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Layer Type</InputLabel>
            <Select
              value={newLayerDialog.type}
              label="Layer Type"
              onChange={(e) => setNewLayerDialog({ ...newLayerDialog, type: e.target.value as LayerType })}
            >
              <MenuItem value={LayerType.OVERLAY}>Overlay</MenuItem>
              <MenuItem value={LayerType.OBJECTS}>Objects</MenuItem>
              <MenuItem value={LayerType.TERRAIN}>Terrain</MenuItem>
            </Select>
          </FormControl>
          
          <Typography variant="subtitle2" gutterBottom>
            Opacity: {Math.round(newLayerDialog.opacity * 100)}%
          </Typography>
          <Slider
            value={newLayerDialog.opacity * 100}
            onChange={(_, value) => setNewLayerDialog({ ...newLayerDialog, opacity: (value as number) / 100 })}
            min={0}
            max={100}
            step={5}
            marks={[
              { value: 0, label: '0%' },
              { value: 50, label: '50%' },
              { value: 100, label: '100%' }
            ]}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewLayerDialog({ ...newLayerDialog, open: false })}>
            Cancel
          </Button>
          <Button onClick={handleAddLayer} variant="contained">
            Add Layer
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default LayerPanel;