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
  Lightbulb 
} from '@mui/icons-material';
import { DnDMap } from '../../types/map';
import { AIGenerationOptions, AIGenerationResult, aiMapGenerationService } from '../../services/aiGenerationService';
import { AI_GENERATION } from '../../utils/constants';

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

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setGeneration(prev => ({ ...prev, error: 'Please enter a description for your map' }));
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
              placeholder="Describe the map you want to create... (e.g., 'A cozy tavern with wooden furniture and a stone fireplace')"
              disabled={generation.isGenerating}
              inputProps={{
                maxLength: AI_GENERATION.MAX_PROMPT_LENGTH
              }}
              helperText={`${prompt.length}/${AI_GENERATION.MAX_PROMPT_LENGTH} characters`}
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
          disabled={generation.isGenerating || !prompt.trim()}
          startIcon={generation.isGenerating ? undefined : <AutoAwesome />}
        >
          {generation.isGenerating ? 'Generating...' : 'Generate Map'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};