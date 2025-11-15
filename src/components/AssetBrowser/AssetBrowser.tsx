import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Card,
  CardMedia,
  CardContent,
  Typography,
  IconButton,
  Button,
  TextField,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Menu,
  MenuItem,
  Drawer,
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Folder as FolderIcon,
  Image as ImageIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { AssetReference, ObjectType } from '../../types/map';

// Asset categories for organization
export enum AssetCategory {
  TOKENS = 'tokens',
  FURNITURE = 'furniture',
  DECORATIONS = 'decorations',
  CREATURES = 'creatures',
  TERRAIN_TEXTURES = 'terrain_textures',
  EFFECTS = 'effects',
  CUSTOM = 'custom'
}

interface Asset extends AssetReference {
  category: AssetCategory;
  tags: string[];
  size?: { width: number; height: number };
  preview?: string; // Base64 preview image
  isCustom?: boolean;
}

interface AssetBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onAssetSelect: (asset: Asset) => void;
  selectedObjectType?: ObjectType;
}

const DEFAULT_ASSETS: Asset[] = [
  // Tokens
  {
    id: 'token-human-warrior',
    name: 'Human Warrior',
    type: 'sprite',
    category: AssetCategory.TOKENS,
    tags: ['human', 'warrior', 'fighter'],
    preview: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzAiIGZpbGw9IiM0Yjc2ODgiLz4KPHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHg9IjEyIiB5PSIxMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjZmZmZmZmIj4KPHA+VG9rZW48L3A+Cjwvc3ZnPgo8L3N2Zz4=',
  },
  {
    id: 'token-elf-mage',
    name: 'Elf Mage',
    type: 'sprite',
    category: AssetCategory.TOKENS,
    tags: ['elf', 'mage', 'wizard', 'spellcaster'],
    preview: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzAiIGZpbGw9IiM2YjQ2YzciLz4KPHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHg9IjEyIiB5PSIxMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjZmZmZmZmIj4KPHA+TWFnZTwvcD4KPC9zdmc+Cjwvc3ZnPg==',
  },
  // Furniture
  {
    id: 'furniture-table-wooden',
    name: 'Wooden Table',
    type: 'sprite',
    category: AssetCategory.FURNITURE,
    tags: ['table', 'wooden', 'furniture'],
    size: { width: 2, height: 1 },
    preview: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCA2NCAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjMyIiBmaWxsPSIjOGI0NTEzIiBzdHJva2U9IiM2NTMzMGQiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4=',
  },
  {
    id: 'furniture-chair-wooden',
    name: 'Wooden Chair',
    type: 'sprite',
    category: AssetCategory.FURNITURE,
    tags: ['chair', 'wooden', 'furniture', 'seating'],
    size: { width: 1, height: 1 },
    preview: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiBmaWxsPSIjYTk2MDMwIiBzdHJva2U9IiM4YjQ1MTMiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4=',
  },
  // Decorations
  {
    id: 'decoration-torch',
    name: 'Wall Torch',
    type: 'sprite',
    category: AssetCategory.DECORATIONS,
    tags: ['torch', 'light', 'fire', 'wall'],
    size: { width: 1, height: 1 },
    preview: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTQiIGZpbGw9IiNmZjk4MDAiLz4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iOCIgZmlsbD0iI2ZmZTY1YyIvPgo8L3N2Zz4=',
  },
  // Creatures
  {
    id: 'creature-goblin',
    name: 'Goblin',
    type: 'sprite',
    category: AssetCategory.CREATURES,
    tags: ['goblin', 'enemy', 'small', 'creature'],
    size: { width: 1, height: 1 },
    preview: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTQiIGZpbGw9IiM3Mzg4NGIiLz4KPHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHg9IjYiIHk9IjYiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2ZmZmZmZiI+CjxwPkc8L3A+Cjwvc3ZnPgo8L3N2Zz4=',
  },
];

const AssetBrowser: React.FC<AssetBrowserProps> = ({
  isOpen,
  onClose,
  onAssetSelect,
  selectedObjectType
}) => {
  const [assets, setAssets] = useState<Asset[]>(DEFAULT_ASSETS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    asset: Asset;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter assets based on search and category
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = (asset.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (asset.tags || []).some(tag => (tag || '').toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !selectedCategory || asset.category === selectedCategory;
    const matchesObjectType = !selectedObjectType || 
                             (selectedObjectType === ObjectType.FURNITURE && asset.category === AssetCategory.FURNITURE) ||
                             (selectedObjectType === ObjectType.DECORATION && asset.category === AssetCategory.DECORATIONS) ||
                             (selectedObjectType === ObjectType.CREATURE && asset.category === AssetCategory.CREATURES);
    
    return matchesSearch && matchesCategory && matchesObjectType;
  });

  // Group assets by category
  const assetsByCategory = filteredAssets.reduce((acc, asset) => {
    if (!acc[asset.category]) {
      acc[asset.category] = [];
    }
    acc[asset.category].push(asset);
    return acc;
  }, {} as Record<AssetCategory, Asset[]>);

  const handleAssetClick = (asset: Asset) => {
    onAssetSelect(asset);
  };

  const handleAssetRightClick = (event: React.MouseEvent, asset: Asset) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX - 2,
      mouseY: event.clientY - 4,
      asset
    });
  };

  const handleContextMenuClose = () => {
    setContextMenu(null);
  };

  const handleDeleteAsset = (assetId: string) => {
    setAssets(prev => prev.filter(asset => asset.id !== assetId));
    handleContextMenuClose();
  };

  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          const newAsset: Asset = {
            id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: (file.name || 'asset').replace(/\.[^/.]+$/, ''), // Remove file extension
            type: 'sprite',
            category: AssetCategory.CUSTOM,
            tags: ['custom', 'uploaded'],
            preview: dataUrl,
            data: dataUrl,
            isCustom: true
          };
          setAssets(prev => [...prev, newAsset]);
        };
        reader.readAsDataURL(file);
      }
    });
  }, []);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const getCategoryIcon = (category: AssetCategory) => {
    switch (category) {
      case AssetCategory.TOKENS:
        return <ImageIcon />;
      case AssetCategory.FURNITURE:
        return <FolderIcon />;
      case AssetCategory.DECORATIONS:
        return <ImageIcon />;
      case AssetCategory.CREATURES:
        return <ImageIcon />;
      default:
        return <FolderIcon />;
    }
  };

  const getCategoryDisplayName = (category: AssetCategory) => {
    const categoryStr = category || 'other';
    return categoryStr.charAt(0).toUpperCase() + categoryStr.slice(1).replace('_', ' ');
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={isOpen}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: 400,
            backgroundColor: 'background.paper',
          }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Asset Library</Typography>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Search and Filter */}
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              sx={{ mb: 1 }}
            />
            
            {/* Category Filter Chips */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              <Chip
                label="All"
                size="small"
                variant={selectedCategory === null ? 'filled' : 'outlined'}
                onClick={() => setSelectedCategory(null)}
              />
              {Object.values(AssetCategory).map(category => (
                <Chip
                  key={category}
                  label={getCategoryDisplayName(category)}
                  size="small"
                  variant={selectedCategory === category ? 'filled' : 'outlined'}
                  onClick={() => setSelectedCategory(category === selectedCategory ? null : category)}
                />
              ))}
            </Box>
          </Box>

          {/* Asset Grid */}
          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            {Object.entries(assetsByCategory).map(([category, categoryAssets]) => (
              <Accordion key={category} defaultExpanded sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getCategoryIcon(category as AssetCategory)}
                    <Typography variant="subtitle2">
                      {getCategoryDisplayName(category as AssetCategory)} ({categoryAssets.length})
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                    {categoryAssets.map(asset => (
                      <Card
                        key={asset.id}
                        sx={{
                          cursor: 'pointer',
                          '&:hover': {
                            boxShadow: 2,
                            transform: 'translateY(-1px)'
                          },
                          transition: 'all 0.2s'
                        }}
                        onClick={() => handleAssetClick(asset)}
                        onContextMenu={(e) => handleAssetRightClick(e, asset)}
                      >
                        <CardMedia
                          component="div"
                          sx={{
                            height: 80,
                            backgroundImage: `url(${asset.preview})`,
                            backgroundSize: 'contain',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'center',
                            backgroundColor: 'grey.100'
                          }}
                        />
                        <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                          <Typography
                            variant="caption"
                            component="div"
                            sx={{
                              fontSize: '0.7rem',
                              lineHeight: 1.2,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {asset.name}
                          </Typography>
                          {asset.size && (
                            <Typography variant="caption" color="text.secondary">
                              {asset.size.width}×{asset.size.height}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}

            {filteredAssets.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                <Typography>No assets found</Typography>
                <Typography variant="body2">Try adjusting your search or filters</Typography>
              </Box>
            )}
          </Box>

          {/* Upload Button */}
          <Box sx={{ mt: 2 }}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<UploadIcon />}
              onClick={handleUploadClick}
            >
              Upload Asset
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => handleFileUpload(e.target.files)}
      />

      {/* Context Menu */}
      <Menu
        open={contextMenu !== null}
        onClose={handleContextMenuClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={handleContextMenuClose}>
          <EditIcon sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        {contextMenu?.asset.isCustom && (
          <MenuItem onClick={() => handleDeleteAsset(contextMenu.asset.id)}>
            <DeleteIcon sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

export default AssetBrowser;