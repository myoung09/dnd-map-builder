import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import MapIcon from '@mui/icons-material/Map';
import PersonIcon from '@mui/icons-material/Person';
import PlaceIcon from '@mui/icons-material/Place';
import { CampaignParser, ParsedCampaignData } from '../utils/campaignParser';

export interface CampaignWizardProps {
  open: boolean;
  onClose: () => void;
  onGenerate: (parsedData: ParsedCampaignData) => void;
}

export const CampaignWizard: React.FC<CampaignWizardProps> = ({ open, onClose, onGenerate }) => {
  const [campaignText, setCampaignText] = useState('');
  const [parsedData, setParsedData] = useState<ParsedCampaignData | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleParse = () => {
    if (!campaignText.trim()) {
      setError('Please enter campaign text to parse');
      return;
    }

    setIsParsing(true);
    setError(null);

    try {
      // Simulate async parsing with timeout
      setTimeout(() => {
        const parsed = CampaignParser.parse(campaignText);
        setParsedData(parsed);
        setIsParsing(false);
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse campaign text');
      setIsParsing(false);
    }
  };

  const handleGenerate = () => {
    if (parsedData) {
      onGenerate(parsedData);
      handleClose();
    }
  };

  const handleClose = () => {
    setCampaignText('');
    setParsedData(null);
    setError(null);
    onClose();
  };

  const exampleCampaign = `# The Shadow of Blackwood Forest

The players begin their adventure in the peaceful village of Thornhaven, where the local innkeeper, Mara Greystone, requests their help. Strange creatures have been emerging from Blackwood Forest, attacking travelers on the road.

The party must journey into Blackwood Forest to investigate the source of these attacks. Deep within the woods, they discover the Ruins of Shadowkeep, an ancient fortress that has become corrupted by dark magic.

Inside Shadowkeep, the party faces the necromancer Valdis the Dark, who seeks to raise an army of undead. The final confrontation takes place in the Tower of Souls, where Valdis performs his ritual.

Key NPCs:
- Mara Greystone: Quest giver, innkeeper
- Valdis the Dark: Main antagonist, necromancer
- Elder Thornwood: Village leader, provides information`;

  const handleLoadExample = () => {
    setCampaignText(exampleCampaign);
    setParsedData(null);
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <AutoAwesomeIcon />
          <Typography variant="h6">Campaign Wizard</Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Box display="flex" flexDirection="column" gap={2}>
          {/* Campaign Text Input */}
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="subtitle2" color="text.secondary">
                Campaign Write-up
              </Typography>
              <Button size="small" onClick={handleLoadExample}>
                Load Example
              </Button>
            </Box>
            <TextField
              multiline
              rows={8}
              fullWidth
              value={campaignText}
              onChange={(e) => setCampaignText(e.target.value)}
              placeholder="Paste your campaign write-up here... Include locations, NPCs, plot points, and terrain descriptions."
              variant="outlined"
              disabled={isParsing}
            />
          </Box>

          {/* Parse Button */}
          <Button
            variant="contained"
            color="primary"
            onClick={handleParse}
            disabled={isParsing || !campaignText.trim()}
            startIcon={isParsing ? <CircularProgress size={20} /> : <AutoAwesomeIcon />}
          >
            {isParsing ? 'Parsing...' : 'Parse Campaign'}
          </Button>

          {/* Error Message */}
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Parsed Results */}
          {parsedData && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Parsed Results
              </Typography>

              {/* Campaign Info */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <MapIcon fontSize="small" />
                    <Typography>Campaign Information</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box>
                    <Typography variant="subtitle2" color="primary">
                      {parsedData.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mt={1}>
                      {parsedData.description}
                    </Typography>
                  </Box>
                </AccordionDetails>
              </Accordion>

              {/* Points of Interest */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <PlaceIcon fontSize="small" />
                    <Typography>Points of Interest ({parsedData.pois.length})</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <List dense>
                    {parsedData.pois.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        No POIs detected. Try including location names in your campaign text.
                      </Typography>
                    ) : (
                      parsedData.pois.map((poi, idx) => (
                        <React.Fragment key={idx}>
                          <ListItem>
                            <ListItemText
                              primary={
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Typography variant="body1">{poi.name}</Typography>
                                  <Chip label={poi.type} size="small" color="primary" variant="outlined" />
                                  <Chip label={poi.category} size="small" variant="outlined" />
                                </Box>
                              }
                              secondary={poi.description}
                            />
                          </ListItem>
                          {idx < parsedData.pois.length - 1 && <Divider />}
                        </React.Fragment>
                      ))
                    )}
                  </List>
                </AccordionDetails>
              </Accordion>

              {/* NPCs */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <PersonIcon fontSize="small" />
                    <Typography>NPCs ({parsedData.npcs.length})</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <List dense>
                    {parsedData.npcs.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        No NPCs detected.
                      </Typography>
                    ) : (
                      parsedData.npcs.map((npc, idx) => (
                        <React.Fragment key={idx}>
                          <ListItem>
                            <ListItemText
                              primary={
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Typography variant="body1">{npc.name}</Typography>
                                  <Chip label={npc.role} size="small" color="secondary" variant="outlined" />
                                  <Chip 
                                    label={`${Math.round(npc.confidence * 100)}%`} 
                                    size="small" 
                                    variant="outlined"
                                  />
                                </Box>
                              }
                              secondary={npc.description}
                            />
                          </ListItem>
                          {idx < parsedData.npcs.length - 1 && <Divider />}
                        </React.Fragment>
                      ))
                    )}
                  </List>
                </AccordionDetails>
              </Accordion>

              {/* Terrain Keywords */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Terrain Analysis</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {parsedData.terrainKeywords.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        No terrain keywords detected.
                      </Typography>
                    ) : (
                      parsedData.terrainKeywords.map((match, idx) => (
                        <Chip
                          key={idx}
                          label={`${match.terrain} (${match.count})`}
                          color="primary"
                          variant="outlined"
                        />
                      ))
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>

              {/* Plot Points */}
              {parsedData.plotPoints.length > 0 && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Plot Points ({parsedData.plotPoints.length})</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      {parsedData.plotPoints.map((plot, idx) => (
                        <React.Fragment key={idx}>
                          <ListItem>
                            <ListItemText
                              primary={plot.title}
                              secondary={plot.description}
                            />
                          </ListItem>
                          {idx < parsedData.plotPoints.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleGenerate}
          disabled={!parsedData || parsedData.pois.length === 0}
          startIcon={<MapIcon />}
        >
          Generate Workspace
        </Button>
      </DialogActions>
    </Dialog>
  );
};
