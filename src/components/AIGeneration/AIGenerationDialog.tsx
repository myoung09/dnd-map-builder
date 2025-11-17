import React, { useState } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Slider,
  FormControlLabel,
  Switch,
  LinearProgress,
  Alert,
  Chip,
  Paper
} from '@mui/material';
import { 
  AutoAwesome, 
  Close, 
  Settings,
  Lightbulb,
  Home,
  Park,
  Terrain,
  LocationCity,
  Castle
} from '@mui/icons-material';
import { DnDMap } from '../../types/map';
import { AIGenerationOptions, AIGenerationResult, aiMapGenerationService } from '../../services/aiGenerationService';
import { AI_GENERATION } from '../../utils/constants';
import { 
  MapTerrainType, 
  HouseSubtype, 
  HouseStory, 
  mapGenerationService, 
  MapGenerationOptions 
} from '../../services/mapGenerationService';

interface AIGenerationDialogProps {
  open: boolean;
  onClose: () => void;
  onMapGenerated: (map: DnDMap) => void;
}

interface GenerationState {
  isGenerating: boolean;
  progress: number;
  error: string | null;
  result: AIGenerationResult | null;
}

interface MapTypeOption {
  value: MapTerrainType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const MAP_TYPE_OPTIONS: MapTypeOption[] = [
  {
    value: MapTerrainType.HOUSE,
    label: 'House/Building',
    description: 'Interior rooms with furniture',
    icon: <Home />
  },
  {
    value: MapTerrainType.FOREST,
    label: 'Forest/Wilderness',
    description: 'Natural clearings and trails',
    icon: <Park />
  },
  {
    value: MapTerrainType.CAVE,
    label: 'Cave/Underground',
    description: 'Caverns and tunnels',
    icon: <Terrain />
  },
  {
    value: MapTerrainType.TOWN,
    label: 'Town/City',
    description: 'Streets and buildings',
    icon: <LocationCity />
  },
  {
    value: MapTerrainType.DUNGEON,
    label: 'Dungeon',
    description: 'Chambers and corridors',
    icon: <Castle />
  }
];

const EXAMPLE_PROMPTS = [
  "A small tavern with wooden tables, a bar counter, and a fireplace in the corner",
  "An underground dungeon with 3-4 connected rooms, corridors, and a treasure chamber",
  "A forest clearing with a small pond, some large rocks, and a dirt path running through it",
  "A temple interior with stone columns, an altar, and ceremonial braziers",
  "A city street with buildings, market stalls, and a fountain in the center"
];

export const AIGenerationDialog: React.FC<AIGenerationDialogProps> = ({
  open,
  onClose,
  onMapGenerated
}) => {
  const [prompt, setPrompt] = useState('');
  const [mapType, setMapType] = useState<MapTerrainType>(MapTerrainType.DUNGEON);
  const [houseSubtype, setHouseSubtype] = useState<HouseSubtype>(HouseSubtype.COTTAGE);
  const [houseStory, setHouseStory] = useState<HouseStory>(HouseStory.STORY_1);
  const [numberOfRooms, setNumberOfRooms] = useState<number>(5);
  const [options, setOptions] = useState<AIGenerationOptions>({
    mapSize: { width: 30, height: 30 },
    style: 'custom',
    complexity: 'moderate',
    includeObjects: true,
    seed: undefined
  });
  
  const [generation, setGeneration] = useState<GenerationState>({
    isGenerating: false,
    progress: 0,
    error: null,
    result: null
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const availableStyles = aiMapGenerationService.getAvailableStyles();

  // Helper to get max room count for current house config
  const getMaxRoomCount = (): number => {
    if (mapType !== MapTerrainType.HOUSE) {
      return 20; // Default max for non-house types
    }
    
    const config = mapGenerationService['houseConfigs'].get(houseSubtype);
    if (!config) return 10;
    
    const storyConfig = config.stories.find(s => s.story === houseStory);
    return storyConfig ? storyConfig.numberOfRooms : 10;
  };

  // Helper to get available stories for current house subtype
  const getAvailableStories = (): HouseStory[] => {
    if (mapType !== MapTerrainType.HOUSE) return [];
    
    const config = mapGenerationService['houseConfigs'].get(houseSubtype);
    if (!config) return [HouseStory.STORY_1];
    
    return config.stories.map(s => s.story);
  };

  // Helper to get display name for house story
  const getStoryDisplayName = (story: HouseStory): string => {
    switch (story) {
      case HouseStory.BASEMENT: return 'Basement';
      case HouseStory.STORY_1: return 'First Floor';
      case HouseStory.STORY_2: return 'Second Floor';
      case HouseStory.STORY_3: return 'Third Floor';
      default: return story;
    }
  };

  // Helper to get display name for house subtype
  const getHouseSubtypeDisplayName = (subtype: HouseSubtype): string => {
    switch (subtype) {
      case HouseSubtype.COTTAGE: return 'Cottage';
      case HouseSubtype.MANOR: return 'Manor';
      case HouseSubtype.INN: return 'Inn/Tavern';
      case HouseSubtype.CASTLE: return 'Castle';
      case HouseSubtype.WIZARD_TOWER: return 'Wizard Tower';
      default: return subtype;
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      // If no prompt, use quick procedural generation
      handleQuickGenerate();
      return;
    }

    setGeneration({
      isGenerating: true,
      progress: 0,
      error: null,
      result: null
    });

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setGeneration(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90)
        }));
      }, 200);

      const result = await aiMapGenerationService.generateMap(prompt, options);
      
      clearInterval(progressInterval);
      
      setGeneration({
        isGenerating: false,
        progress: 100,
        error: result.success ? null : result.message,
        result
      });

      if (result.success && result.map) {
        // Auto-close dialog and pass map to parent after a brief delay
        setTimeout(() => {
          onMapGenerated(result.map!);
          handleClose();
        }, 1500);
      }
    } catch (error) {
      setGeneration({
        isGenerating: false,
        progress: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        result: null
      });
    }
  };

  const handleQuickGenerate = () => {
    try {
      setGeneration({
        isGenerating: true,
        progress: 50,
        error: null,
        result: null
      });

      // Use procedural generation service
      const mapOptions: MapGenerationOptions = {
        width: options.mapSize.width,
        height: options.mapSize.height,
        terrainType: mapType,
        subtype: mapType === MapTerrainType.HOUSE ? houseSubtype : undefined,
        story: mapType === MapTerrainType.HOUSE ? houseStory : undefined,
        numberOfRooms: numberOfRooms,
        minRoomSize: 3,
        maxRoomSize: options.complexity === 'simple' ? 6 : options.complexity === 'moderate' ? 8 : 12,
        organicFactor: mapType === MapTerrainType.CAVE || mapType === MapTerrainType.FOREST ? 0.7 : 0.3,
        objectDensity: options.includeObjects ? 0.6 : 0.2
      };

      const generatedMap = mapGenerationService.generateLayeredMap(mapOptions);

      setGeneration({
        isGenerating: false,
        progress: 100,
        error: null,
        result: {
          success: true,
          message: 'Map generated successfully',
          map: generatedMap
        }
      });

      // Auto-close and pass map
      setTimeout(() => {
        onMapGenerated(generatedMap);
        handleClose();
      }, 1000);
    } catch (error) {
      setGeneration({
        isGenerating: false,
        progress: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        result: null
      });
    }
  };

  const handleClose = () => {
    if (!generation.isGenerating) {
      setPrompt('');
      setGeneration({
        isGenerating: false,
        progress: 0,
        error: null,
        result: null
      });
      onClose();
    }
  };

  const handleExamplePrompt = (examplePrompt: string) => {
    setPrompt(examplePrompt);
    setGeneration(prev => ({ ...prev, error: null }));
  };

  const isConfigured = aiMapGenerationService.isConfigured();

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: 500 }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AutoAwesome color="primary" />
        AI Map Generator
        <Box sx={{ flexGrow: 1 }} />
        <Button
          onClick={handleClose}
          disabled={generation.isGenerating}
          sx={{ minWidth: 0, p: 1 }}
        >
          <Close />
        </Button>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: 2 }}>
          {/* Configuration Warning */}
          {!isConfigured && (
            <Alert severity="info">
              This demo uses mock AI generation. To use real AI generation, configure your OpenAI API key in the settings.
            </Alert>
          )}

          {/* Map Type Selection */}
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Castle fontSize="small" />
              Select Map Type
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Choose the type of map you want to generate
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 1, mt: 2 }}>
              {MAP_TYPE_OPTIONS.map((option) => (
                <Paper
                  key={option.value}
                  elevation={mapType === option.value ? 3 : 1}
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    border: mapType === option.value ? 2 : 1,
                    borderColor: mapType === option.value ? 'primary.main' : 'divider',
                    transition: 'all 0.2s',
                    '&:hover': {
                      elevation: 3,
                      borderColor: 'primary.light'
                    }
                  }}
                  onClick={() => {
                    setMapType(option.value);
                    setGeneration(prev => ({ ...prev, error: null }));
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ color: mapType === option.value ? 'primary.main' : 'text.secondary' }}>
                      {option.icon}
                    </Box>
                    <Typography variant="subtitle2" align="center">
                      {option.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" align="center">
                      {option.description}
                    </Typography>
                  </Box>
                </Paper>
              ))}
            </Box>
          </Box>

          {/* House Subtype and Story Selection (only for HOUSE terrain) */}
          {mapType === MapTerrainType.HOUSE && (
            <Box>
              <Typography variant="h6" gutterBottom>
                House Configuration
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>House Type</InputLabel>
                  <Select
                    value={houseSubtype}
                    label="House Type"
                    onChange={(e) => {
                      const newSubtype = e.target.value as HouseSubtype;
                      setHouseSubtype(newSubtype);
                      // Reset to first available story when changing house type
                      const config = mapGenerationService['houseConfigs'].get(newSubtype);
                      if (config && config.stories.length > 0) {
                        const newStory = config.stories[0].story;
                        setHouseStory(newStory);
                        setNumberOfRooms(config.stories[0].numberOfRooms);
                      }
                      setGeneration(prev => ({ ...prev, error: null }));
                    }}
                    disabled={generation.isGenerating}
                  >
                    {Object.values(HouseSubtype).map((subtype) => (
                      <MenuItem key={subtype} value={subtype}>
                        {getHouseSubtypeDisplayName(subtype)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Floor/Story</InputLabel>
                  <Select
                    value={houseStory}
                    label="Floor/Story"
                    onChange={(e) => {
                      const newStory = e.target.value as HouseStory;
                      setHouseStory(newStory);
                      // Reset room count to max for this story
                      const config = mapGenerationService['houseConfigs'].get(houseSubtype);
                      if (config) {
                        const storyConfig = config.stories.find(s => s.story === newStory);
                        if (storyConfig) {
                          setNumberOfRooms(storyConfig.numberOfRooms);
                        }
                      }
                      setGeneration(prev => ({ ...prev, error: null }));
                    }}
                    disabled={generation.isGenerating}
                  >
                    {getAvailableStories().map((story) => (
                      <MenuItem key={story} value={story}>
                        {getStoryDisplayName(story)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <FormControl fullWidth>
                <InputLabel>Number of Rooms</InputLabel>
                <Select
                  value={numberOfRooms}
                  label="Number of Rooms"
                  onChange={(e) => {
                    setNumberOfRooms(e.target.value as number);
                    setGeneration(prev => ({ ...prev, error: null }));
                  }}
                  disabled={generation.isGenerating}
                >
                  {Array.from({ length: getMaxRoomCount() }, (_, i) => i + 1).map((count) => (
                    <MenuItem key={count} value={count}>
                      {count} {count === 1 ? 'Room' : 'Rooms'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}

          {/* General Room Count (for non-house terrains) */}
          {mapType !== MapTerrainType.HOUSE && (
            <Box>
              <FormControl fullWidth>
                <InputLabel>Number of Rooms</InputLabel>
                <Select
                  value={numberOfRooms}
                  label="Number of Rooms"
                  onChange={(e) => {
                    setNumberOfRooms(e.target.value as number);
                    setGeneration(prev => ({ ...prev, error: null }));
                  }}
                  disabled={generation.isGenerating}
                >
                  {Array.from({ length: 20 }, (_, i) => i + 1).map((count) => (
                    <MenuItem key={count} value={count}>
                      {count} {count === 1 ? 'Room' : 'Rooms'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}

          {/* Main Prompt Input */}
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Lightbulb fontSize="small" />
              Describe Your Map
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                setGeneration(prev => ({ ...prev, error: null }));
              }}
              placeholder="Optional: Describe specific features... (e.g., 'A cozy tavern with wooden furniture and a stone fireplace'). Leave empty for quick generation."
              disabled={generation.isGenerating}
              inputProps={{
                maxLength: AI_GENERATION.MAX_PROMPT_LENGTH
              }}
              helperText={prompt.trim() ? `${prompt.length}/${AI_GENERATION.MAX_PROMPT_LENGTH} characters - Will use AI generation` : 'Leave empty for quick procedural generation based on map type'}
            />
          </Box>

          {/* Example Prompts */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Quick Examples:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {EXAMPLE_PROMPTS.map((example, index) => (
                <Chip
                  key={index}
                  label={example.slice(0, 40) + (example.length > 40 ? '...' : '')}
                  size="small"
                  variant="outlined"
                  onClick={() => handleExamplePrompt(example)}
                  disabled={generation.isGenerating}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
          </Box>

          {/* Basic Options */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Generation Options
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Map Style</InputLabel>
                  <Select
                    value={options.style}
                    label="Map Style"
                    onChange={(e) => setOptions(prev => ({ ...prev, style: e.target.value as any }))}
                    disabled={generation.isGenerating}
                  >
                    {availableStyles.map(style => (
                      <MenuItem key={style.value} value={style.value}>
                        <Box>
                          <Typography variant="body2">{style.label}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {style.description}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Complexity</InputLabel>
                  <Select
                    value={options.complexity}
                    label="Complexity"
                    onChange={(e) => setOptions(prev => ({ ...prev, complexity: e.target.value as any }))}
                    disabled={generation.isGenerating}
                  >
                    <MenuItem value="simple">Simple - Basic layout</MenuItem>
                    <MenuItem value="moderate">Moderate - Balanced detail</MenuItem>
                    <MenuItem value="complex">Complex - Detailed layout</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography gutterBottom>Map Width: {options.mapSize.width}</Typography>
                  <Slider
                    value={options.mapSize.width}
                    onChange={(_, value) => setOptions(prev => ({ 
                      ...prev, 
                      mapSize: { ...prev.mapSize, width: value as number }
                    }))}
                    min={10}
                    max={50}
                    disabled={generation.isGenerating}
                    marks={[
                      { value: 10, label: '10' },
                      { value: 30, label: '30' },
                      { value: 50, label: '50' }
                    ]}
                  />
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography gutterBottom>Map Height: {options.mapSize.height}</Typography>
                  <Slider
                    value={options.mapSize.height}
                    onChange={(_, value) => setOptions(prev => ({ 
                      ...prev, 
                      mapSize: { ...prev.mapSize, height: value as number }
                    }))}
                    min={10}
                    max={50}
                    disabled={generation.isGenerating}
                    marks={[
                      { value: 10, label: '10' },
                      { value: 30, label: '30' },
                      { value: 50, label: '50' }
                    ]}
                  />
                </Box>
              </Box>
            </Box>

            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={options.includeObjects}
                    onChange={(e) => setOptions(prev => ({ ...prev, includeObjects: e.target.checked }))}
                    disabled={generation.isGenerating}
                  />
                }
                label="Include Objects (furniture, decorations, etc.)"
              />
            </Box>
          </Paper>

          {/* Advanced Options */}
          <Box>
            <Button
              startIcon={<Settings />}
              onClick={() => setShowAdvanced(!showAdvanced)}
              disabled={generation.isGenerating}
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced Options
            </Button>
            
            {showAdvanced && (
              <Paper sx={{ mt: 2, p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Advanced Settings
                </Typography>
                <TextField
                  fullWidth
                  label="Seed (for reproducible results)"
                  value={options.seed || ''}
                  onChange={(e) => setOptions(prev => ({ ...prev, seed: e.target.value || undefined }))}
                  placeholder="Leave empty for random generation"
                  disabled={generation.isGenerating}
                  helperText="Enter the same seed to regenerate identical maps"
                />
              </Paper>
            )}
          </Box>

          {/* Progress and Results */}
          {generation.isGenerating && (
            <Box>
              <Typography variant="body2" gutterBottom>
                Generating your map...
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={generation.progress}
                sx={{ mb: 1 }}
              />
              <Typography variant="caption" color="text.secondary">
                {generation.progress < 30 ? 'Analyzing prompt...' : 
                 generation.progress < 60 ? 'Designing layout...' :
                 generation.progress < 90 ? 'Adding details...' : 'Finalizing map...'}
              </Typography>
            </Box>
          )}

          {generation.error && (
            <Alert severity="error">
              {generation.error}
            </Alert>
          )}

          {generation.result?.success && (
            <Alert severity="success">
              Map generated successfully! Loading into editor...
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button 
          onClick={handleClose}
          disabled={generation.isGenerating}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleGenerate}
          disabled={generation.isGenerating}
          startIcon={generation.isGenerating ? undefined : <AutoAwesome />}
        >
          {generation.isGenerating ? 'Generating...' : prompt.trim() ? 'Generate with AI' : 'Quick Generate'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};