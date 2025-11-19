/**
 * ObjectPalette Component
 * Displays categorized objects for placement on the map
 */

import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tabs,
  Tab,
  Grid,
  Tooltip,
  Collapse
} from '@mui/material';
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { Sprite, ObjectCategory, getCategoryDisplayName, getCategoriesForTerrain } from '../types/objects';
import { TerrainType } from '../types/generator';
import { filterSprites, createSpriteThumbnail, getSpriteById } from '../utils/spritesheet';

interface ObjectPaletteProps {
  spritesheets: any[]; // SpriteSheet[]
  terrainType: TerrainType;
  selectedSpriteId: string | null;
  onSpriteSelect: (spriteId: string | null) => void;
  onClose: () => void;
  visible: boolean;
}

export const ObjectPalette: React.FC<ObjectPaletteProps> = ({
  spritesheets,
  terrainType,
  selectedSpriteId,
  onSpriteSelect,
  onClose,
  visible
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ObjectCategory | null>(null);
  const [expanded, setExpanded] = useState(true);
  
  // Get relevant categories for current terrain
  const availableCategories = useMemo(() => {
    return getCategoriesForTerrain(terrainType);
  }, [terrainType]);
  
  // Filter sprites based on terrain and category
  const filteredSprites = useMemo(() => {
    return filterSprites(spritesheets, terrainType, selectedCategory || undefined);
  }, [spritesheets, terrainType, selectedCategory]);
  
  if (!visible) return null;
  
  return (
    <Paper
      elevation={3}
      sx={{
        position: 'fixed',
        right: 16,
        top: 80,
        width: 320,
        maxHeight: 'calc(100vh - 100px)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 1,
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        <Typography variant="h6" sx={{ fontSize: '1rem' }}>
          Object Palette
        </Typography>
        <Box>
          <IconButton size="small" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>
      
      <Collapse in={expanded}>
        {/* Category Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={selectedCategory}
            onChange={(_, value) => setSelectedCategory(value)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ minHeight: 40 }}
          >
            <Tab label="All" value={null} sx={{ minHeight: 40, py: 1 }} />
            {availableCategories.map(category => (
              <Tab
                key={category}
                label={getCategoryDisplayName(category)}
                value={category}
                sx={{ minHeight: 40, py: 1 }}
              />
            ))}
          </Tabs>
        </Box>
        
        {/* Sprite Grid */}
        <Box
          sx={{
            p: 2,
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 240px)'
          }}
        >
          {filteredSprites.length === 0 ? (
            <Typography variant="body2" color="text.secondary" align="center">
              No objects available.
              <br />
              Add spritesheets to get started.
            </Typography>
          ) : (
            <Grid container spacing={1}>
              {filteredSprites.map(sprite => (
                <Grid size={{ xs: 4 }} key={sprite.id}>
                  <SpriteItem
                    sprite={sprite}
                    spritesheets={spritesheets}
                    selected={sprite.id === selectedSpriteId}
                    onClick={() => onSpriteSelect(sprite.id === selectedSpriteId ? null : sprite.id)}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};

interface SpriteItemProps {
  sprite: Sprite;
  spritesheets: any[];
  selected: boolean;
  onClick: () => void;
}

const SpriteItem: React.FC<SpriteItemProps> = ({ sprite, spritesheets, selected, onClick }) => {
  const [thumbnail, setThumbnail] = useState<HTMLCanvasElement | null>(null);
  
  React.useEffect(() => {
    const result = getSpriteById(sprite.id, spritesheets);
    if (result) {
      const thumb = createSpriteThumbnail(result.sprite, result.sheet, 80);
      setThumbnail(thumb);
    }
  }, [sprite.id, spritesheets]);
  
  return (
    <Tooltip title={sprite.name} arrow>
      <Paper
        elevation={selected ? 4 : 1}
        sx={{
          width: '100%',
          aspectRatio: '1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          border: selected ? 2 : 0,
          borderColor: 'primary.main',
          transition: 'all 0.2s',
          '&:hover': {
            elevation: 3,
            transform: 'scale(1.05)'
          }
        }}
        onClick={onClick}
      >
        {thumbnail ? (
          <Box
            component="img"
            src={thumbnail.toDataURL()}
            sx={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain'
            }}
          />
        ) : (
          <Box
            sx={{
              width: 60,
              height: 60,
              backgroundColor: '#e0e0e0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {sprite.name.substring(0, 2)}
            </Typography>
          </Box>
        )}
      </Paper>
    </Tooltip>
  );
};

export default ObjectPalette;
