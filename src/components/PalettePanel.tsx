import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Stack,
  Tooltip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Card,
  CardMedia,
  Divider,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Upload as UploadIcon,
  Category as CategoryIcon,
  MoreVert as MoreVertIcon,
  Palette as PaletteIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { Palette, Sprite } from '../types/palette';

interface PalettePanelProps {
  palette: Palette | null;
  selectedSpriteId: string | null;
  onSpriteSelect: (spriteId: string | null) => void;
  onOpenUploadDialog: () => void;
  onCreateCategory: (name: string, color: string) => void;
  onDeleteCategory: (categoryId: string) => void;
  onMoveSprite: (spriteId: string, newCategoryId: string) => void;
  onDeleteSprite: (spriteId: string) => void;
  onRenameSprite: (spriteId: string, newName: string) => void;
}

export const PalettePanel: React.FC<PalettePanelProps> = ({
  palette,
  selectedSpriteId,
  onSpriteSelect,
  onOpenUploadDialog,
  onCreateCategory,
  onDeleteCategory,
  onMoveSprite,
  onDeleteSprite,
  onRenameSprite,
}) => {
  const [categoryMenuAnchor, setCategoryMenuAnchor] = useState<null | HTMLElement>(null);
  const [spriteMenuAnchor, setSpriteMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSprite, setSelectedSprite] = useState<Sprite | null>(null);
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#9e9e9e');
  const [renameSpriteOpen, setRenameSpriteOpen] = useState(false);
  const [newSpriteName, setNewSpriteName] = useState('');

  const handleCategoryMenuOpen = (event: React.MouseEvent<HTMLElement>, categoryId: string) => {
    event.stopPropagation();
    setCategoryMenuAnchor(event.currentTarget);
    setSelectedCategory(categoryId);
  };

  const handleSpriteMenuOpen = (event: React.MouseEvent<HTMLElement>, sprite: Sprite) => {
    event.stopPropagation();
    setSpriteMenuAnchor(event.currentTarget);
    setSelectedSprite(sprite);
  };

  const handleCreateCategory = () => {
    if (newCategoryName.trim()) {
      onCreateCategory(newCategoryName.trim(), newCategoryColor);
      setNewCategoryName('');
      setNewCategoryColor('#9e9e9e');
      setCreateCategoryOpen(false);
    }
  };

  const handleRenameSprite = () => {
    if (selectedSprite && newSpriteName.trim()) {
      onRenameSprite(selectedSprite.id, newSpriteName.trim());
      setRenameSpriteOpen(false);
      setNewSpriteName('');
    }
  };

  const handleDeleteCategory = () => {
    if (selectedCategory) {
      onDeleteCategory(selectedCategory);
      setCategoryMenuAnchor(null);
      setSelectedCategory(null);
    }
  };

  const handleMoveSprite = (newCategoryId: string) => {
    if (selectedSprite) {
      onMoveSprite(selectedSprite.id, newCategoryId);
      setSpriteMenuAnchor(null);
      setSelectedSprite(null);
    }
  };

  const handleDeleteSprite = () => {
    if (selectedSprite) {
      onDeleteSprite(selectedSprite.id);
      setSpriteMenuAnchor(null);
      setSelectedSprite(null);
    }
  };

  const openRenameDialog = () => {
    if (selectedSprite) {
      setNewSpriteName(selectedSprite.name);
      setRenameSpriteOpen(true);
      setSpriteMenuAnchor(null);
    }
  };

  // Group sprites by category
  const spritesByCategory = React.useMemo(() => {
    if (!palette) return new Map<string, Sprite[]>();
    
    const grouped = new Map<string, Sprite[]>();
    palette.sprites.forEach(sprite => {
      const category = sprite.category || 'general';
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(sprite);
    });
    
    return grouped;
  }, [palette]);

  // Empty state
  if (!palette || palette.sprites.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Paper
          variant="outlined"
          sx={{
            p: 4,
            textAlign: 'center',
            bgcolor: 'action.hover',
          }}
        >
          <PaletteIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No Sprites Yet
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Upload a spritesheet to get started with object placement
          </Typography>
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={onOpenUploadDialog}
            size="large"
          >
            Upload Spritesheet
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PaletteIcon /> Sprite Palette
          </Typography>
          <Stack direction="row" spacing={1}>
            <Tooltip title="Upload Spritesheet">
              <IconButton size="small" onClick={onOpenUploadDialog} color="primary">
                <UploadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Create Category">
              <IconButton size="small" onClick={() => setCreateCategoryOpen(true)} color="primary">
                <AddIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          {palette.sprites.length} sprites in {palette.categories.length} categories
        </Typography>
      </Box>

      {/* Categories */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {palette.categories
          .sort((a, b) => a.order - b.order)
          .map((category) => {
            const sprites = spritesByCategory.get(category.id) || [];
            
            return (
              <Accordion key={category.id} defaultExpanded>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    '& .MuiAccordionSummary-content': {
                      alignItems: 'center',
                    },
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
                    <CategoryIcon
                      fontSize="small"
                      sx={{ color: category.color || 'text.secondary' }}
                    />
                    <Typography variant="subtitle2">{category.name}</Typography>
                    <Chip label={sprites.length} size="small" />
                  </Stack>
                  <IconButton
                    size="small"
                    onClick={(e) => handleCategoryMenuOpen(e, category.id)}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </AccordionSummary>
                <AccordionDetails>
                  {sprites.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                      No sprites in this category
                    </Typography>
                  ) : (
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                        gap: 1,
                      }}
                    >
                      {sprites.map((sprite) => (
                        <Box key={sprite.id}>
                          <Card
                            sx={{
                              cursor: 'pointer',
                              position: 'relative',
                              border: selectedSpriteId === sprite.id ? 2 : 0,
                              borderColor: 'primary.main',
                              transition: 'all 0.2s',
                              '&:hover': {
                                transform: 'scale(1.05)',
                                boxShadow: 4,
                              },
                            }}
                            onClick={() => onSpriteSelect(sprite.id)}
                          >
                            <CardMedia
                              component="img"
                              image={sprite.imageData}
                              alt={sprite.name}
                              sx={{
                                imageRendering: 'pixelated',
                                bgcolor: 'action.hover',
                                aspectRatio: '1',
                                objectFit: 'contain',
                              }}
                            />
                            <IconButton
                              size="small"
                              sx={{
                                position: 'absolute',
                                top: 2,
                                right: 2,
                                bgcolor: 'background.paper',
                                '&:hover': { bgcolor: 'background.default' },
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSpriteMenuOpen(e, sprite);
                              }}
                            >
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </Card>
                        </Box>
                      ))}
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            );
          })}
      </Box>

      {/* Category Menu */}
      <Menu
        anchorEl={categoryMenuAnchor}
        open={Boolean(categoryMenuAnchor)}
        onClose={() => setCategoryMenuAnchor(null)}
      >
        <MenuItem onClick={handleDeleteCategory}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete Category
        </MenuItem>
      </Menu>

      {/* Sprite Menu */}
      <Menu
        anchorEl={spriteMenuAnchor}
        open={Boolean(spriteMenuAnchor)}
        onClose={() => setSpriteMenuAnchor(null)}
      >
        <MenuItem onClick={openRenameDialog}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Rename
        </MenuItem>
        <Divider />
        {palette?.categories.map((cat) => (
          <MenuItem key={cat.id} onClick={() => handleMoveSprite(cat.id)}>
            Move to {cat.name}
          </MenuItem>
        ))}
        <Divider />
        <MenuItem onClick={handleDeleteSprite} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Create Category Dialog */}
      <Dialog open={createCategoryOpen} onClose={() => setCreateCategoryOpen(false)}>
        <DialogTitle>Create New Category</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1, minWidth: 300 }}>
            <TextField
              label="Category Name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              fullWidth
              autoFocus
            />
            <TextField
              label="Color"
              type="color"
              value={newCategoryColor}
              onChange={(e) => setNewCategoryColor(e.target.value)}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateCategoryOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateCategory} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rename Sprite Dialog */}
      <Dialog open={renameSpriteOpen} onClose={() => setRenameSpriteOpen(false)}>
        <DialogTitle>Rename Sprite</DialogTitle>
        <DialogContent>
          <TextField
            label="Sprite Name"
            value={newSpriteName}
            onChange={(e) => setNewSpriteName(e.target.value)}
            fullWidth
            autoFocus
            sx={{ mt: 1, minWidth: 300 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameSpriteOpen(false)}>Cancel</Button>
          <Button onClick={handleRenameSprite} variant="contained">
            Rename
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
