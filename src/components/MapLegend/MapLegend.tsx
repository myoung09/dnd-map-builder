import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Tooltip
} from '@mui/material';
import { TerrainType } from '../../types/map';

interface LegendItem {
  terrain: TerrainType;
  color: string;
  icon: string;
  label: string;
  description: string;
}

interface MapLegendProps {
  environmentType?: string;
  visibleTerrainTypes?: TerrainType[];
}

const MapLegend: React.FC<MapLegendProps> = ({ 
  environmentType = 'dungeon', 
  visibleTerrainTypes = [] 
}) => {
  
  const getEnvironmentLegend = (envType: string): LegendItem[] => {
    const baseLegends: Record<string, LegendItem[]> = {
      dungeon: [
        {
          terrain: TerrainType.WALL,
          color: '#37474f',
          icon: '🧱',
          label: 'Wall',
          description: 'Solid stone walls blocking movement'
        },
        {
          terrain: TerrainType.FLOOR,
          color: '#eceff1',
          icon: '⬜',
          label: 'Floor',
          description: 'Stone floor - safe to walk on'
        },
        {
          terrain: TerrainType.DOOR,
          color: '#6d4c41',
          icon: '🚪',
          label: 'Door',
          description: 'Entrance or exit'
        }
      ],
      forest: [
        {
          terrain: TerrainType.DIFFICULT_TERRAIN,
          color: '#1b5e20',
          icon: '🌲',
          label: 'Dense Forest',
          description: 'Thick undergrowth - difficult to navigate'
        },
        {
          terrain: TerrainType.FLOOR,
          color: '#66bb6a',
          icon: '🌿',
          label: 'Clearing',
          description: 'Open forest clearing - easy movement'
        },
        {
          terrain: TerrainType.GRASS,
          color: '#8bc34a',
          icon: '🌱',
          label: 'Trail',
          description: 'Forest path connecting clearings'
        }
      ],
      tavern: [
        {
          terrain: TerrainType.WALL,
          color: '#3e2723',
          icon: '🪵',
          label: 'Wall',
          description: 'Wooden walls and partitions'
        },
        {
          terrain: TerrainType.FLOOR,
          color: '#bcaaa4',
          icon: '🪵',
          label: 'Floor',
          description: 'Wooden flooring'
        },
        {
          terrain: TerrainType.DOOR,
          color: '#6d4c41',
          icon: '🚪',
          label: 'Door',
          description: 'Room entrance'
        }
      ],
      home: [
        {
          terrain: TerrainType.WALL,
          color: '#8d6e63',
          icon: '🏠',
          label: 'Wall',
          description: 'Interior walls'
        },
        {
          terrain: TerrainType.FLOOR,
          color: '#efebe9',
          icon: '⬜',
          label: 'Floor',
          description: 'Living space flooring'
        },
        {
          terrain: TerrainType.DOOR,
          color: '#6d4c41',
          icon: '🚪',
          label: 'Door',
          description: 'Room entrance'
        }
      ],
      temple: [
        {
          terrain: TerrainType.WALL,
          color: '#37474f',
          icon: '⛪',
          label: 'Wall',
          description: 'Sacred stone walls'
        },
        {
          terrain: TerrainType.FLOOR,
          color: '#eceff1',
          icon: '✨',
          label: 'Floor',
          description: 'Hallowed ground'
        },
        {
          terrain: TerrainType.DOOR,
          color: '#ff8f00',
          icon: '🚪',
          label: 'Door',
          description: 'Sacred entrance'
        }
      ],
      city: [
        {
          terrain: TerrainType.FLOOR,
          color: '#90a4ae',
          icon: '🏛️',
          label: 'Plaza',
          description: 'Open city square'
        },
        {
          terrain: TerrainType.STONE,
          color: '#546e7a',
          icon: '🛤️',
          label: 'Street',
          description: 'Paved city street'
        }
      ]
    };

    return baseLegends[envType.toLowerCase()] || baseLegends.dungeon;
  };

  const legendItems = getEnvironmentLegend(environmentType);
  
  // Filter to only show terrain types that are visible on the map
  const visibleLegendItems = visibleTerrainTypes.length > 0 
    ? legendItems.filter(item => visibleTerrainTypes.includes(item.terrain))
    : legendItems;

  if (visibleLegendItems.length === 0) {
    return null;
  }

  return (
    <Paper 
      elevation={4} 
      sx={{ 
        p: 3, 
        maxWidth: 320,
        backgroundColor: '#ffffff',
        backdropFilter: 'blur(8px)',
        border: '2px solid rgba(0, 0, 0, 0.2)',
        '& .MuiTooltip-tooltip': {
          backgroundColor: '#424242',
          color: '#ffffff',
          fontSize: '0.85rem'
        }
      }}
    >
      <Typography 
        variant="h6" 
        gutterBottom 
        sx={{ 
          fontWeight: 'bold', 
          mb: 2,
          color: '#212121',
          borderBottom: '2px solid',
          borderColor: '#1976d2',
          pb: 1
        }}
      >
        Map Legend
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {visibleLegendItems.map((item) => (
          <Tooltip key={item.terrain} title={item.description} arrow>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 1.5,
                borderRadius: 2,
                backgroundColor: '#f8f9fa',
                border: '1px solid rgba(0, 0, 0, 0.15)',
                '&:hover': {
                  backgroundColor: '#e9ecef',
                  cursor: 'help',
                  transform: 'translateY(-1px)',
                  boxShadow: 2
                },
                transition: 'all 0.2s ease-in-out'
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  backgroundColor: item.color,
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  border: '2px solid rgba(0, 0, 0, 0.3)',
                  boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.2)',
                  flexShrink: 0
                }}
              >
                {item.icon}
              </Box>
              <Typography 
                variant="body1" 
                sx={{ 
                  fontWeight: 600,
                  color: '#212121',
                  fontSize: '0.95rem'
                }}
              >
                {item.label}
              </Typography>
            </Box>
          </Tooltip>
        ))}
      </Box>
      
      {environmentType && (
        <Box sx={{ mt: 3, pt: 2, borderTop: '2px solid', borderColor: 'divider' }}>
          <Chip 
            label={`${environmentType.charAt(0).toUpperCase() + environmentType.slice(1)} Environment`}
            size="medium"
            variant="filled"
            color="primary"
            sx={{ 
              fontSize: '0.85rem',
              fontWeight: 600,
              '& .MuiChip-label': {
                px: 2,
                py: 0.5
              }
            }}
          />
        </Box>
      )}
    </Paper>
  );
};

export default MapLegend;