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
  Stepper,
  Step,
  StepLabel,
  Paper,
  Alert,
  LinearProgress,
  Chip,
  FormControlLabel,
  Switch
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  AutoAwesome as MagicIcon,
  PlayArrow as GenerateIcon,
  Settings as SettingsIcon,
  Book as StoryIcon,
  LocationOn as POIIcon
} from '@mui/icons-material';
import { CampaignStoryAnalyzer } from '../../services/campaignStoryAnalyzer';
import { campaignMapGenerator } from '../../services/campaignMapGenerator';
import POIManager from './POIManager';
import {
  SimpleCampaignStory,
  PointOfInterest,
  SuggestedPOI,
  DetectedNPC,
  CampaignSettings
} from '../../types/campaign';
import { Workspace } from '../../types/workspace';

interface CampaignBuilderDialogProps {
  open: boolean;
  onClose: () => void;
  onCampaignGenerated: (workspace: Workspace | null) => void;
}

const CampaignBuilderDialog: React.FC<CampaignBuilderDialogProps> = ({
  open,
  onClose,
  onCampaignGenerated
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [campaignStory, setCampaignStory] = useState<SimpleCampaignStory>({
    title: '',
    description: '',
    theme: '',
    playerCount: 4,
    estimatedSessions: 5,
    difficultyLevel: 5,
    tags: []
  });
  const [storyText, setStoryText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<{
    suggestedPOIs: SuggestedPOI[];
    detectedNPCs: DetectedNPC[];
    identifiedThemes: string[];
    estimatedComplexity: string;
  } | null>(null);
  const [pointsOfInterest, setPointsOfInterest] = useState<PointOfInterest[]>([]);
  const [campaignSettings, setCampaignSettings] = useState<CampaignSettings>({
    autoGenerateMaps: true,
    includeRandomEncounters: true,
    detailLevel: 'medium',
    mapStyle: 'dungeon',
    generateNPCPortraits: false,
    createHandouts: true
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const steps = [
    'Story Input',
    'POI Management',
    'Settings',
    'Generation'
  ];

  const handleStoryAnalysis = useCallback(async () => {
    if (!storyText.trim()) return;

    setIsAnalyzing(true);
    try {
      const analyzer = new CampaignStoryAnalyzer();
      const results = await analyzer.analyzeStory(storyText);
      
      // Convert StoryAnalysis to expected format
      const analysisResults = {
        suggestedPOIs: results.suggestedPOIs,
        detectedNPCs: results.detectedNPCs,
        identifiedThemes: results.identifiedThemes.map(theme => theme.toString()),
        estimatedComplexity: results.estimatedComplexity
      };
      setAnalysisResults(analysisResults);
      
      // Convert suggested POIs to full POIs
      const convertedPOIs: PointOfInterest[] = results.suggestedPOIs.map((suggestedPOI, index) => ({
        id: `poi-${Date.now()}-${index}`,
        name: suggestedPOI.name || 'Unnamed POI',
        type: suggestedPOI.type || 'dungeon',
        category: suggestedPOI.category || 'main_quest',
        description: suggestedPOI.description || 'No description available',
        storyRelevance: 'important', // Default value since importance doesn't exist
        mapRequirements: {
          dimensions: { width: 30, height: 30 }, // Default dimensions
          requiredFeatures: [], // Empty for now since keyFeatures doesn't exist
          terrainTypes: { floor: 60, wall: 25, door: 10, water: 5 },
          lightingConditions: 'dim',
          entryPoints: [{ 
            id: 'entry1', 
            type: 'door', 
            position: 'south', 
            description: 'Main entrance' 
          }],
          exitPoints: [{ 
            id: 'exit1', 
            type: 'door', 
            position: 'north', 
            description: 'Exit', 
            isHidden: false 
          }]
        },
        connections: [],
        npcs: results.detectedNPCs.filter(npc => 
          (npc.name || '').toLowerCase().includes((suggestedPOI.name || '').toLowerCase())
        ).map(npc => npc.name || 'Unknown NPC'),
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
        difficultyRating: 5, // Default difficulty
        order: index,
        isOptional: false // Default to not optional
      }));

      setPointsOfInterest(convertedPOIs);
      
      // Update campaign story with analysis
      setCampaignStory(prev => ({
        ...prev,
        theme: results.identifiedThemes.join(', '),
        tags: results.identifiedThemes
      }));

    } catch (error) {
      console.error('Story analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [storyText]);

  const handleNext = () => {
    if (activeStep === 0 && !analysisResults) {
      handleStoryAnalysis();
      return;
    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      const result = await campaignMapGenerator.generateCampaignMaps({
        story: campaignStory,
        pointsOfInterest,
        settings: campaignSettings,
        workspaceName: campaignStory.title || 'New Campaign'
      });
      
      console.log('Campaign generation result:', result);
      console.log('Workspace structure:', result.workspace);
      
      if (result.workspace) {
        onCampaignGenerated(result.workspace);
        onClose();
      } else {
        setGenerationError('No workspace was created during generation');
      }
    } catch (error) {
      console.error('Failed to generate campaign:', error);
      setGenerationError(error instanceof Error ? error.message : 'Failed to generate campaign');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setActiveStep(0);
    setCampaignStory({
      title: '',
      description: '',
      theme: '',
      playerCount: 4,
      estimatedSessions: 5,
      difficultyLevel: 5,
      tags: []
    });
    setStoryText('');
    setAnalysisResults(null);
    setPointsOfInterest([]);
  };

  const canProceed = () => {
    switch (activeStep) {
      case 0: return storyText.trim().length > 0;
      case 1: return pointsOfInterest.length > 0;
      case 2: return campaignStory.title.trim().length > 0;
      case 3: return true;
      default: return false;
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Alert severity="info" icon={<StoryIcon />}>
              Paste your campaign story, adventure outline, or session notes. The AI will analyze the text 
              and suggest locations that need maps.
            </Alert>
            
            <TextField
              label="Campaign Story"
              multiline
              rows={12}
              fullWidth
              value={storyText}
              onChange={(e) => setStoryText(e.target.value)}
              placeholder="Enter your campaign story here... Include locations, dungeons, cities, and important places that will need maps."
              variant="outlined"
            />

            {isAnalyzing && (
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Analyzing story...
                </Typography>
                <LinearProgress />
              </Box>
            )}

            {analysisResults && (
              <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="h6" gutterBottom>Analysis Results</Typography>
                <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
                  <Box flex="1 1 200px">
                    <Typography variant="subtitle2">Suggested POIs</Typography>
                    <Typography variant="h4" color="primary">
                      {analysisResults.suggestedPOIs.length}
                    </Typography>
                  </Box>
                  <Box flex="1 1 200px">
                    <Typography variant="subtitle2">NPCs Found</Typography>
                    <Typography variant="h4" color="secondary">
                      {analysisResults.detectedNPCs.length}
                    </Typography>
                  </Box>
                  <Box flex="1 1 200px">
                    <Typography variant="subtitle2">Complexity</Typography>
                    <Typography variant="h4" color="warning.main">
                      {analysisResults.estimatedComplexity}
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Themes</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {analysisResults.identifiedThemes.map((theme, index) => (
                      <Chip key={index} label={theme} size="small" />
                    ))}
                  </Box>
                </Box>
              </Paper>
            )}
          </Box>
        );

      case 1:
        return (
          <Box>
            <Alert severity="success" icon={<POIIcon />} sx={{ mb: 2 }}>
              Review and customize the suggested locations. Add, edit, or remove points of interest as needed.
            </Alert>
            <POIManager
              pointsOfInterest={pointsOfInterest}
              onPOIsChanged={setPointsOfInterest}
              onAddPOI={() => {}}
            />
          </Box>
        );

      case 2:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Alert severity="warning" icon={<SettingsIcon />}>
              Configure your campaign settings and generation preferences.
            </Alert>
            
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Campaign Details</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Campaign Title"
                    fullWidth
                    value={campaignStory.title}
                    onChange={(e) => setCampaignStory(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="The Lost Mines of Phandelver"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Player Count"
                    type="number"
                    value={campaignStory.playerCount}
                    onChange={(e) => setCampaignStory(prev => ({ 
                      ...prev, 
                      playerCount: parseInt(e.target.value) || 4 
                    }))}
                    inputProps={{ min: 1, max: 8 }}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Campaign Description"
                    multiline
                    rows={3}
                    fullWidth
                    value={campaignStory.description}
                    onChange={(e) => setCampaignStory(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the campaign..."
                  />
                </Grid>
              </Grid>
            </Paper>

            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Generation Settings</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={campaignSettings.autoGenerateMaps}
                        onChange={(e) => setCampaignSettings(prev => ({
                          ...prev,
                          autoGenerateMaps: e.target.checked
                        }))}
                      />
                    }
                    label="Automatically generate maps for all POIs"
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={campaignSettings.includeRandomEncounters}
                        onChange={(e) => setCampaignSettings(prev => ({
                          ...prev,
                          includeRandomEncounters: e.target.checked
                        }))}
                      />
                    }
                    label="Include random encounters and events"
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={campaignSettings.createHandouts}
                        onChange={(e) => setCampaignSettings(prev => ({
                          ...prev,
                          createHandouts: e.target.checked
                        }))}
                      />
                    }
                    label="Create player handouts and summaries"
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Generation Seed (Optional)"
                    fullWidth
                    value={campaignSettings.generationSeed || ''}
                    onChange={(e) => setCampaignSettings(prev => ({
                      ...prev,
                      generationSeed: e.target.value || undefined
                    }))}
                    placeholder="Enter a seed for reproducible map generation (e.g., 'MyAwesomeCampaign123')"
                    helperText="Using the same seed will generate identical maps each time. Leave empty for random generation."
                  />
                </Grid>
              </Grid>
            </Paper>
          </Box>
        );

      case 3:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <MagicIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Ready to Generate Campaign
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Your campaign "{campaignStory.title}" with {pointsOfInterest.length} locations is ready for generation.
            </Typography>
            
            <Paper sx={{ p: 2, mb: 3, textAlign: 'left', maxWidth: 400, mx: 'auto' }}>
              <Typography variant="subtitle2" gutterBottom>Generation Summary:</Typography>
              <Typography variant="body2">• {pointsOfInterest.length} maps will be created</Typography>
              <Typography variant="body2">• Estimated time: {Math.ceil(pointsOfInterest.length * 2)} minutes</Typography>
              <Typography variant="body2">• Maps will be added to a new workspace</Typography>
              {campaignSettings.createHandouts && (
                <Typography variant="body2">• Player handouts will be generated</Typography>
              )}
            </Paper>

            <Alert severity="success" sx={{ mb: 3 }}>
              Click "Generate Campaign" to start the automated map creation process. 
              You can monitor progress and make adjustments during generation.
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '90vh', maxHeight: '900px' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MagicIcon color="primary" />
          <Typography variant="h6">Campaign Builder</Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ flex: 1, overflow: 'auto', mt: 2 }}>
          {renderStepContent()}
        </Box>

        {generationError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {generationError}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 1 }}>
        <Button onClick={handleReset} disabled={activeStep === 0}>
          Reset
        </Button>
        <Box sx={{ flex: '1 1 auto' }} />
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
        >
          Back
        </Button>
        {activeStep < steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!canProceed()}
            startIcon={isAnalyzing ? undefined : <StoryIcon />}
          >
            {activeStep === 0 ? (isAnalyzing ? 'Analyzing...' : 'Analyze Story') : 'Next'}
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleGenerate}
            disabled={!canProceed() || isGenerating}
            startIcon={isGenerating ? undefined : <GenerateIcon />}
            color="primary"
          >
            {isGenerating ? 'Generating Campaign...' : 'Generate Campaign'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CampaignBuilderDialog;