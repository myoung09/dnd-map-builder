import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Slider,
  FormControlLabel,
  Switch,
  Paper,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Map as MapIcon,
  Group as GroupIcon,
  Security as SecurityIcon,
  AttachMoney as TreasureIcon,
  Star as StarIcon
} from '@mui/icons-material';
import {
  PointOfInterest,
  POIType,
  POICategory,
  StoryRelevance,
  MapRequirements,
  EncounterInfo,
  MapFeature,
  LightingCondition
} from '../../types/campaign';

interface POIManagerProps {
  pointsOfInterest: PointOfInterest[];
  onPOIsChanged: (pois: PointOfInterest[]) => void;
  onAddPOI: () => void;
}

interface POIEditorProps {
  poi: PointOfInterest | null;
  open: boolean;
  onClose: () => void;
  onSave: (poi: PointOfInterest) => void;
}

const POIEditor: React.FC<POIEditorProps> = ({ poi, open, onClose, onSave }) => {
  const [editedPOI, setEditedPOI] = useState<PointOfInterest | null>(poi);

  React.useEffect(() => {
    if (poi) {
      setEditedPOI({ ...poi });
    } else {
      // Create new POI template
      setEditedPOI({
        id: `poi-${Date.now()}`,
        name: '',
        type: 'dungeon',
        category: 'main_quest',
        description: '',
        storyRelevance: 'important',
        mapRequirements: {
          dimensions: { width: 30, height: 30 },
          requiredFeatures: [],
          terrainTypes: { floor: 70, wall: 20, door: 5, water: 5 },
          lightingConditions: 'dim',
          entryPoints: [{ id: 'entry1', type: 'door', position: 'south', description: 'Main entrance' }],
          exitPoints: [{ id: 'exit1', type: 'door', position: 'north', description: 'Exit door', isHidden: false }]
        },
        connections: [],
        npcs: [],
        encounters: [],
        treasures: [],
        secrets: [],
        atmosphericDetails: {
          ambiance: '',
          sounds: [],
          smells: [],
          visualDetails: [],
          mood: 'neutral',
          temperature: 'comfortable'
        },
        estimatedPlayTime: 60,
        difficultyRating: 5,
        order: 0,
        isOptional: false
      });
    }
  }, [poi]);

  const handleSave = () => {
    if (editedPOI) {
      onSave(editedPOI);
      onClose();
    }
  };

  const updatePOI = (updates: Partial<PointOfInterest>) => {
    if (editedPOI) {
      setEditedPOI({ ...editedPOI, ...updates });
    }
  };

  const updateMapRequirements = (updates: Partial<MapRequirements>) => {
    if (editedPOI) {
      setEditedPOI({
        ...editedPOI,
        mapRequirements: { ...editedPOI.mapRequirements, ...updates }
      });
    }
  };

  const addMapFeature = () => {
    if (editedPOI) {
      const newFeature: MapFeature = {
        type: 'altar',
        description: 'New feature',
        importance: 'optional',
        position: 'anywhere'
      };
      updateMapRequirements({
        requiredFeatures: [...editedPOI.mapRequirements.requiredFeatures, newFeature]
      });
    }
  };

  const addEncounter = () => {
    if (editedPOI) {
      const newEncounter: EncounterInfo = {
        id: `encounter-${Date.now()}`,
        type: 'combat',
        difficulty: 'medium',
        description: 'New encounter'
      };
      updatePOI({ encounters: [...editedPOI.encounters, newEncounter] });
    }
  };

  if (!editedPOI) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        {poi ? 'Edit Point of Interest' : 'Add Point of Interest'}
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
          
          {/* Basic Information */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Basic Information</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Name"
                    fullWidth
                    value={editedPOI.name}
                    onChange={(e) => updatePOI({ name: e.target.value })}
                    placeholder="The Ancient Tomb"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <FormControl fullWidth>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={editedPOI.type}
                      label="Type"
                      onChange={(e) => updatePOI({ type: e.target.value as POIType })}
                    >
                      <MenuItem value="dungeon">Dungeon</MenuItem>
                      <MenuItem value="town">Town</MenuItem>
                      <MenuItem value="city">City</MenuItem>
                      <MenuItem value="village">Village</MenuItem>
                      <MenuItem value="wilderness">Wilderness</MenuItem>
                      <MenuItem value="building">Building</MenuItem>
                      <MenuItem value="ruins">Ruins</MenuItem>
                      <MenuItem value="cave">Cave</MenuItem>
                      <MenuItem value="forest">Forest</MenuItem>
                      <MenuItem value="mountain">Mountain</MenuItem>
                      <MenuItem value="fortress">Fortress</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={editedPOI.category}
                      label="Category"
                      onChange={(e) => updatePOI({ category: e.target.value as POICategory })}
                    >
                      <MenuItem value="starting_location">Starting Location</MenuItem>
                      <MenuItem value="hub">Hub</MenuItem>
                      <MenuItem value="main_quest">Main Quest</MenuItem>
                      <MenuItem value="side_quest">Side Quest</MenuItem>
                      <MenuItem value="boss_fight">Boss Fight</MenuItem>
                      <MenuItem value="social_encounter">Social Encounter</MenuItem>
                      <MenuItem value="exploration">Exploration</MenuItem>
                      <MenuItem value="shop">Shop</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Description"
                    fullWidth
                    multiline
                    rows={3}
                    value={editedPOI.description}
                    onChange={(e) => updatePOI({ description: e.target.value })}
                    placeholder="A detailed description of this location and its significance to the story..."
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Map Requirements */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Map Requirements</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6, md: 3 }}>
                  <TextField
                    label="Width"
                    type="number"
                    value={editedPOI.mapRequirements.dimensions.width}
                    onChange={(e) => updateMapRequirements({
                      dimensions: { 
                        ...editedPOI.mapRequirements.dimensions, 
                        width: parseInt(e.target.value) || 30 
                      }
                    })}
                  />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <TextField
                    label="Height"
                    type="number"
                    value={editedPOI.mapRequirements.dimensions.height}
                    onChange={(e) => updateMapRequirements({
                      dimensions: { 
                        ...editedPOI.mapRequirements.dimensions, 
                        height: parseInt(e.target.value) || 30 
                      }
                    })}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Lighting</InputLabel>
                    <Select
                      value={editedPOI.mapRequirements.lightingConditions}
                      label="Lighting"
                      onChange={(e) => updateMapRequirements({ 
                        lightingConditions: e.target.value as LightingCondition 
                      })}
                    >
                      <MenuItem value="bright">Bright</MenuItem>
                      <MenuItem value="dim">Dim</MenuItem>
                      <MenuItem value="dark">Dark</MenuItem>
                      <MenuItem value="magical">Magical</MenuItem>
                      <MenuItem value="flickering">Flickering</MenuItem>
                      <MenuItem value="natural">Natural</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {/* Map Features */}
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="subtitle1">Required Features</Typography>
                  <Button size="small" onClick={addMapFeature} startIcon={<AddIcon />}>
                    Add Feature
                  </Button>
                </Box>
                <List dense>
                  {editedPOI.mapRequirements.requiredFeatures.map((feature, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={feature.type}
                        secondary={feature.description}
                      />
                      <ListItemSecondaryAction>
                        <IconButton size="small">
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Box>
            </CardContent>
          </Card>

          {/* Encounters */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Typography variant="h6">Encounters</Typography>
                <Button size="small" onClick={addEncounter} startIcon={<AddIcon />}>
                  Add Encounter
                </Button>
              </Box>
              <List dense>
                {editedPOI.encounters.map((encounter, index) => (
                  <ListItem key={encounter.id}>
                    <ListItemText
                      primary={`${encounter.type} - ${encounter.difficulty}`}
                      secondary={encounter.description}
                    />
                    <ListItemSecondaryAction>
                      <IconButton size="small">
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Settings</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography gutterBottom>Story Relevance</Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={editedPOI.storyRelevance}
                      onChange={(e) => updatePOI({ storyRelevance: e.target.value as StoryRelevance })}
                    >
                      <MenuItem value="critical">Critical</MenuItem>
                      <MenuItem value="important">Important</MenuItem>
                      <MenuItem value="optional">Optional</MenuItem>
                      <MenuItem value="flavor">Flavor</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography gutterBottom>Estimated Play Time (minutes)</Typography>
                  <Slider
                    value={editedPOI.estimatedPlayTime}
                    onChange={(_, value) => updatePOI({ estimatedPlayTime: value as number })}
                    min={15}
                    max={240}
                    step={15}
                    valueLabelDisplay="auto"
                    marks={[
                      { value: 30, label: '30m' },
                      { value: 60, label: '1h' },
                      { value: 120, label: '2h' }
                    ]}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography gutterBottom>Difficulty (1-10)</Typography>
                  <Slider
                    value={editedPOI.difficultyRating}
                    onChange={(_, value) => updatePOI({ difficultyRating: value as number })}
                    min={1}
                    max={10}
                    step={1}
                    valueLabelDisplay="auto"
                    marks
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={editedPOI.isOptional}
                        onChange={(e) => updatePOI({ isOptional: e.target.checked })}
                      />
                    }
                    label="This location is optional"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={!editedPOI.name}>
          Save POI
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const POIManager: React.FC<POIManagerProps> = ({ pointsOfInterest, onPOIsChanged, onAddPOI }) => {
  const [selectedPOI, setSelectedPOI] = useState<PointOfInterest | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'order' | 'name' | 'type' | 'relevance'>('order');

  const handleEditPOI = useCallback((poi: PointOfInterest) => {
    setSelectedPOI(poi);
    setEditorOpen(true);
  }, []);

  const handleAddPOI = useCallback(() => {
    setSelectedPOI(null);
    setEditorOpen(true);
  }, []);

  const handleSavePOI = useCallback((poi: PointOfInterest) => {
    const existingIndex = pointsOfInterest.findIndex(p => p.id === poi.id);
    if (existingIndex >= 0) {
      // Update existing
      const updated = [...pointsOfInterest];
      updated[existingIndex] = poi;
      onPOIsChanged(updated);
    } else {
      // Add new
      onPOIsChanged([...pointsOfInterest, poi]);
    }
  }, [pointsOfInterest, onPOIsChanged]);

  const handleDeletePOI = useCallback((poiId: string) => {
    onPOIsChanged(pointsOfInterest.filter(poi => poi.id !== poiId));
  }, [pointsOfInterest, onPOIsChanged]);

  const sortedPOIs = [...pointsOfInterest].sort((a, b) => {
    switch (sortBy) {
      case 'order': return a.order - b.order;
      case 'name': return a.name.localeCompare(b.name);
      case 'type': return a.type.localeCompare(b.type);
      case 'relevance': {
        const relevanceOrder = { critical: 0, important: 1, optional: 2, flavor: 3 };
        return relevanceOrder[a.storyRelevance] - relevanceOrder[b.storyRelevance];
      }
      default: return 0;
    }
  });

  const getCategoryIcon = (category: POICategory) => {
    switch (category) {
      case 'boss_fight': return <SecurityIcon color="error" />;
      case 'shop': return <TreasureIcon color="primary" />;
      case 'social_encounter': return <GroupIcon color="secondary" />;
      case 'starting_location': return <StarIcon color="warning" />;
      default: return <MapIcon />;
    }
  };

  const getCategoryColor = (category: POICategory): string => {
    const colors: Record<POICategory, string> = {
      starting_location: '#ff9800',
      main_quest: '#f44336',
      boss_fight: '#9c27b0',
      side_quest: '#2196f3',
      social_encounter: '#4caf50',
      exploration: '#795548',
      shop: '#ffeb3b',
      hub: '#607d8b',
      combat_encounter: '#e91e63',
      puzzle: '#673ab7',
      finale: '#d32f2f',
      rest_area: '#8bc34a',
      information: '#00bcd4'
    };
    return colors[category] || '#9e9e9e';
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Points of Interest ({pointsOfInterest.length})
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Sort by</InputLabel>
            <Select
              value={sortBy}
              label="Sort by"
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            >
              <MenuItem value="order">Order</MenuItem>
              <MenuItem value="name">Name</MenuItem>
              <MenuItem value="type">Type</MenuItem>
              <MenuItem value="relevance">Relevance</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddPOI}
          >
            Add POI
          </Button>
        </Box>
      </Box>

      {/* POI List */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {sortedPOIs.map((poi) => (
          <Card key={poi.id} variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                {/* Icon */}
                <Box sx={{ pt: 0.5 }}>
                  {getCategoryIcon(poi.category)}
                </Box>

                {/* Content */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="h6" noWrap>
                      {poi.name || 'Unnamed POI'}
                    </Typography>
                    <Chip
                      label={poi.category.replace('_', ' ')}
                      size="small"
                      sx={{ 
                        bgcolor: getCategoryColor(poi.category),
                        color: 'white',
                        textTransform: 'capitalize'
                      }}
                    />
                    <Chip
                      label={poi.storyRelevance}
                      size="small"
                      variant="outlined"
                    />
                    {poi.isOptional && (
                      <Chip label="Optional" size="small" variant="outlined" />
                    )}
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {poi.description || 'No description provided'}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Typography variant="caption" color="text.secondary">
                      Type: {poi.type}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Size: {poi.mapRequirements.dimensions.width}×{poi.mapRequirements.dimensions.height}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Difficulty: {poi.difficultyRating}/10
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Duration: {poi.estimatedPlayTime}min
                    </Typography>
                    {poi.encounters.length > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        Encounters: {poi.encounters.length}
                      </Typography>
                    )}
                  </Box>
                </Box>

                {/* Actions */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <IconButton size="small" onClick={() => handleEditPOI(poi)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDeletePOI(poi.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}

        {pointsOfInterest.length === 0 && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Points of Interest Added
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Add locations that need maps for your campaign. These will be automatically generated based on your descriptions.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddPOI}
            >
              Add First POI
            </Button>
          </Paper>
        )}
      </Box>

      {/* POI Editor Dialog */}
      <POIEditor
        poi={selectedPOI}
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={handleSavePOI}
      />
    </Box>
  );
};

export default POIManager;