import { v4 as uuidv4 } from 'uuid';
import { Position } from '../../types/map';
import { MapGenerationOptions } from '../mapGenerationService';
import { getHouseConfig } from '../../config';
import { MapTerrainType, HouseSubtype } from '../../types/enums';
import { GeneratedRoom } from './types';

// BSP Tree structures for dungeon generation
export class BSPTree {
  leaf: BSPContainer;
  lchild?: BSPTree;
  rchild?: BSPTree;

  constructor(leaf: BSPContainer) {
    this.leaf = leaf;
  }

  getLeafs(): BSPContainer[] {
    if (!this.lchild && !this.rchild) {
      return [this.leaf];
    }
    const leftLeafs = this.lchild ? this.lchild.getLeafs() : [];
    const rightLeafs = this.rchild ? this.rchild.getLeafs() : [];
    return [...leftLeafs, ...rightLeafs];
  }

  getLevel(level: number, queue: BSPTree[] = []): BSPTree[] {
    if (level === 1) {
      queue.push(this);
    } else {
      if (this.lchild) this.lchild.getLevel(level - 1, queue);
      if (this.rchild) this.rchild.getLevel(level - 1, queue);
    }
    return queue;
  }
}

export class BSPContainer {
  x: number;
  y: number;
  w: number;
  h: number;
  center: Position;
  room?: GeneratedRoom;

  constructor(x: number, y: number, w: number, h: number) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.center = {
      x: this.x + this.w / 2,
      y: this.y + this.h / 2
    };
  }
}

/**
 * BSP (Binary Space Partitioning) Algorithm for procedural room generation
 * Used for houses, dungeons, and other structured layouts
 */
export class BspAlgorithm {
  private seed: number = Math.random();

  constructor(seed?: number) {
    if (seed !== undefined) {
      this.seed = seed;
    }
  }

  setSeed(seed: number) {
    this.seed = seed;
  }

  private random(): number {
    // Simple seeded random number generator
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  /**
   * Generate rooms using BSP algorithm
   */
  generateRooms(options: MapGenerationOptions): GeneratedRoom[] {
    const { terrainType, subtype, story } = options;
    
    // Create modified options based on terrain configuration
    let modifiedOptions = { ...options };
    
    // Override room generation parameters with house configuration if applicable
    if (terrainType === MapTerrainType.HOUSE && subtype && story) {
      const houseConfig = getHouseConfig(subtype as HouseSubtype);
      if (houseConfig && houseConfig.stories) {
        const storyConfig = houseConfig.stories.find((s: any) => s.story === story);
        if (storyConfig) {
          modifiedOptions = {
            ...options,
            // Use user's numberOfRooms if provided, otherwise use config default
            numberOfRooms: options.numberOfRooms || storyConfig.numberOfRooms,
            minRoomSize: storyConfig.minRoomSize,
            maxRoomSize: storyConfig.maxRoomSize,
            // Use config's map dimensions if available
            width: storyConfig.mapWidth || options.width,
            height: storyConfig.mapHeight || options.height
          };
        }
      }
    }
    
    const { numberOfRooms, width, height } = modifiedOptions;
    
    // Calculate BSP iterations needed
    const iterations = this.calculateBSPIterations(numberOfRooms);
    
    // For Wizard Tower, constrain the BSP container to fit within the main tower circle
    let containerX = 2;
    let containerY = 2;
    let containerW = width - 4;
    let containerH = height - 4;
    
    if (terrainType === MapTerrainType.HOUSE && subtype === HouseSubtype.WIZARD_TOWER) {
      // Main tower is 35% of map size, centered
      const mainTowerRadius = Math.min(width, height) * 0.35;
      const centerX = width / 2;
      const centerY = height / 2;
      
      // Inscribe a square within the circle (use ~70% of diameter to ensure rooms fit)
      const inscribedSquareSize = mainTowerRadius * 2 * 0.7;
      containerX = Math.floor(centerX - inscribedSquareSize / 2);
      containerY = Math.floor(centerY - inscribedSquareSize / 2);
      containerW = Math.floor(inscribedSquareSize);
      containerH = Math.floor(inscribedSquareSize);
    }
    
    // Create BSP tree with hybrid splitting (stops early for exact room count)
    const mainContainer = new BSPContainer(containerX, containerY, containerW, containerH);
    const tree = this.splitContainerHybrid(mainContainer, iterations, numberOfRooms);
    
    // Get leaf containers and create rooms
    let leafs = tree.getLeafs();
    
    // IMPORTANT: Trim or add leafs to match exact room count
    if (leafs.length > numberOfRooms) {
      // Too many rooms - randomly remove some
      while (leafs.length > numberOfRooms) {
        const removeIndex = Math.floor(this.random() * leafs.length);
        leafs.splice(removeIndex, 1);
      }
    } else if (leafs.length < numberOfRooms) {
      // Too few rooms - split the largest containers
      while (leafs.length < numberOfRooms) {
        // Find the largest leaf
        let largestIndex = 0;
        let largestArea = leafs[0].w * leafs[0].h;
        
        for (let i = 1; i < leafs.length; i++) {
          const area = leafs[i].w * leafs[i].h;
          if (area > largestArea) {
            largestArea = area;
            largestIndex = i;
          }
        }
        
        // Split the largest container
        const containerToSplit = leafs[largestIndex];
        const [r1, r2] = this.randomSplitContainer(containerToSplit);
        
        if (r1 && r2) {
          // Replace the container with its two children
          leafs.splice(largestIndex, 1);
          leafs.push(r1, r2);
        } else {
          // Can't split anymore - stop
          break;
        }
      }
    }
    
    const rooms: GeneratedRoom[] = [];
    
    for (const container of leafs) {
      const room = this.createRoomInContainer(container, modifiedOptions);
      container.room = room;
      rooms.push(room);
    }
    
    return rooms;
  }

  /**
   * Calculate BSP iterations needed for target room count
   */
  private calculateBSPIterations(targetRooms: number): number {
    // For hybrid approach, use slightly higher iterations to allow flexibility
    const baseIterations = Math.ceil(Math.log2(targetRooms));
    return Math.max(3, Math.min(baseIterations + 1, 7)); // Clamp 3-7
  }

  /**
   * Hybrid BSP splitting - stops splitting when we have enough rooms
   */
  private splitContainerHybrid(
    container: BSPContainer, 
    maxIter: number, 
    targetRooms: number, 
    currentDepth: number = 0,
    roomsSoFar: number = 1
  ): BSPTree {
    const tree = new BSPTree(container);
    
    // Stop conditions:
    // 1. Reached max iterations
    // 2. Container too small to split further
    // 3. We have enough rooms (with some buffer for variety)
    const shouldStop = 
      currentDepth >= maxIter ||
      container.w < 8 || container.h < 8 ||
      (roomsSoFar >= targetRooms && this.random() < 0.6);
    
    if (shouldStop) {
      return tree; // Leaf node
    }
    
    // Split the container
    const [r1, r2] = this.randomSplitContainer(container);
    
    if (!r1 || !r2) {
      return tree; // Failed to split, return as leaf
    }
    
    // Recursively split children
    const estimatedLeft = Math.ceil(targetRooms / 2);
    const estimatedRight = targetRooms - estimatedLeft;
    
    tree.lchild = this.splitContainerHybrid(r1, maxIter, estimatedLeft, currentDepth + 1, roomsSoFar);
    tree.rchild = this.splitContainerHybrid(r2, maxIter, estimatedRight, currentDepth + 1, roomsSoFar + 1);
    
    return tree;
  }

  /**
   * Split a container randomly (vertical or horizontal) with ratio filtering
   */
  private randomSplitContainer(container: BSPContainer): [BSPContainer | null, BSPContainer | null] {
    const MIN_SIZE = 6;
    const W_RATIO = 0.4; // Minimum width/height ratio
    const H_RATIO = 0.4; // Minimum height/width ratio
    
    let r1: BSPContainer | null = null;
    let r2: BSPContainer | null = null;
    
    // Try up to 5 times to get a good split
    for (let attempt = 0; attempt < 5; attempt++) {
      const splitVertical = this.random() < 0.5;
      
      if (splitVertical && container.w >= MIN_SIZE * 2) {
        // Vertical split
        const splitPoint = Math.floor(container.w * (0.3 + this.random() * 0.4)); // 30-70%
        
        r1 = new BSPContainer(container.x, container.y, splitPoint, container.h);
        r2 = new BSPContainer(container.x + splitPoint, container.y, container.w - splitPoint, container.h);
        
        // Check ratios
        const r1Ratio = r1.w / r1.h;
        const r2Ratio = r2.w / r2.h;
        
        if (r1Ratio >= W_RATIO && r2Ratio >= W_RATIO) {
          return [r1, r2]; // Good split!
        }
      } else if (!splitVertical && container.h >= MIN_SIZE * 2) {
        // Horizontal split
        const splitPoint = Math.floor(container.h * (0.3 + this.random() * 0.4)); // 30-70%
        
        r1 = new BSPContainer(container.x, container.y, container.w, splitPoint);
        r2 = new BSPContainer(container.x, container.y + splitPoint, container.w, container.h - splitPoint);
        
        // Check ratios
        const r1Ratio = r1.h / r1.w;
        const r2Ratio = r2.h / r2.w;
        
        if (r1Ratio >= H_RATIO && r2Ratio >= H_RATIO) {
          return [r1, r2]; // Good split!
        }
      }
    }
    
    // Failed to find good split
    return [null, null];
  }

  /**
   * Create a room within a BSP container with configurable padding
   */
  private createRoomInContainer(container: BSPContainer, options: MapGenerationOptions): GeneratedRoom {
    // Determine minimum room spacing and padding from configuration
    let minSpacing = 2; // Default: 2 grid cells between rooms (acts as padding)
    let roomPadding = 0.0; // Default: no interior padding
    
    if (options.terrainType === MapTerrainType.HOUSE && options.subtype && options.story) {
      const houseConfig = getHouseConfig(options.subtype as HouseSubtype);
      if (houseConfig && houseConfig.stories) {
        const storyConfig = houseConfig.stories.find((s: any) => s.story === options.story);
        if (storyConfig) {
          if (storyConfig.minRoomSpacing !== undefined) {
            minSpacing = storyConfig.minRoomSpacing;
          } else if (houseConfig.minRoomSpacing !== undefined) {
            minSpacing = houseConfig.minRoomSpacing;
          }
          if (storyConfig.roomPadding !== undefined) {
            roomPadding = storyConfig.roomPadding;
          }
        }
      }
    }
    
    // Create padding based on minimum spacing (deterministic: exactly minSpacing cells)
    const paddingLeft = minSpacing;
    const paddingTop = minSpacing;
    const paddingRight = minSpacing;
    const paddingBottom = minSpacing;
    
    const roomX = container.x + paddingLeft;
    const roomY = container.y + paddingTop;
    const roomW = Math.max(3, container.w - paddingLeft - paddingRight);
    const roomH = Math.max(3, container.h - paddingTop - paddingBottom);
    
    // Determine room type based on terrain
    let roomType = 'room';
    if (options.terrainType === MapTerrainType.HOUSE) {
      const houseRooms = ['bedroom', 'kitchen', 'living_room', 'study', 'bathroom', 'storage'];
      roomType = houseRooms[Math.floor(this.random() * houseRooms.length)];
    }
    
    // Determine room shape based on house configuration
    let roomShape: 'rectangle' | 'circle' = 'rectangle';
    if (options.terrainType === MapTerrainType.HOUSE && options.subtype) {
      const houseConfig = getHouseConfig(options.subtype as HouseSubtype);
      if (houseConfig && houseConfig.roomShape === 'circle') {
        roomShape = 'circle';
      }
    }
    
    return {
      id: uuidv4(),
      type: roomType,
      shape: { type: roomShape },
      position: { x: roomX, y: roomY },
      size: { width: roomW, height: roomH },
      doors: this.generateRoomDoors({ x: roomX, y: roomY }, { width: roomW, height: roomH }),
      padding: roomPadding
    };
  }

  /**
   * Generate door positions for a room
   */
  private generateRoomDoors(position: Position, size: { width: number; height: number }): Position[] {
    const doors: Position[] = [];
    const numDoors = 1 + Math.floor(this.random() * 2); // 1-2 doors per room
    
    for (let i = 0; i < numDoors; i++) {
      const side = Math.floor(this.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
      
      let doorX, doorY;
      switch (side) {
        case 0: // Top
          doorX = Math.floor(position.x + this.random() * size.width);
          doorY = position.y;
          break;
        case 1: // Right
          doorX = position.x + size.width;
          doorY = Math.floor(position.y + this.random() * size.height);
          break;
        case 2: // Bottom
          doorX = Math.floor(position.x + this.random() * size.width);
          doorY = position.y + size.height;
          break;
        default: // Left
          doorX = position.x;
          doorY = Math.floor(position.y + this.random() * size.height);
      }
      
      doors.push({ x: doorX, y: doorY });
    }
    
    return doors;
  }
}
