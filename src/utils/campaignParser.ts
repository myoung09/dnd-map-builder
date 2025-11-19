import { PointOfInterest, POIType, POICategory, StoryRelevance, DetectedNPC, PlotPoint } from '../types/campaign';
import { TerrainType } from '../types/generator';

export interface ParsedCampaignData {
  title: string;
  description: string;
  pois: Partial<PointOfInterest>[];
  npcs: DetectedNPC[];
  mapDescriptions: MapDescription[];
  plotPoints: PlotPoint[];
  terrainKeywords: TerrainKeywordMatch[];
  notes: string[];
}

export interface MapDescription {
  name: string;
  description: string;
  terrainType: TerrainType;
  extractedText: string;
  confidence: number;
}

export interface TerrainKeywordMatch {
  terrain: TerrainType;
  keywords: string[];
  count: number;
}

// Keyword dictionaries for parsing
const TERRAIN_KEYWORDS: Record<TerrainType, string[]> = {
  [TerrainType.Dungeon]: [
    'dungeon', 'crypt', 'tomb', 'vault', 'prison', 'labyrinth', 'maze',
    'chamber', 'corridor', 'passage', 'underground', 'catacomb', 'cellar'
  ],
  [TerrainType.Cave]: [
    'cave', 'cavern', 'grotto', 'hollow', 'den', 'lair', 'tunnel',
    'underground', 'subterranean', 'rocky', 'stalactite', 'stalagmite'
  ],
  [TerrainType.Forest]: [
    'forest', 'woods', 'grove', 'woodland', 'trees', 'jungle', 'thicket',
    'glade', 'clearing', 'canopy', 'undergrowth', 'wilderness'
  ],
  [TerrainType.House]: [
    'house', 'building', 'tavern', 'inn', 'shop', 'cottage', 'manor',
    'mansion', 'dwelling', 'residence', 'home', 'structure', 'temple', 'church'
  ]
};

const POI_TYPE_KEYWORDS: Record<POIType, string[]> = {
  dungeon: ['dungeon', 'underground prison', 'jail', 'oubliette'],
  town: ['town', 'settlement', 'hamlet'],
  city: ['city', 'metropolis', 'capital'],
  village: ['village', 'hamlet', 'settlement'],
  wilderness: ['wilderness', 'wild', 'untamed', 'frontier'],
  building: ['building', 'structure', 'edifice', 'hall'],
  ruins: ['ruins', 'ruined', 'destroyed', 'abandoned', 'crumbling'],
  cave: ['cave', 'cavern', 'grotto'],
  forest: ['forest', 'woods', 'jungle'],
  mountain: ['mountain', 'peak', 'summit', 'highlands'],
  swamp: ['swamp', 'marsh', 'bog', 'wetland', 'mire'],
  desert: ['desert', 'wasteland', 'dunes', 'badlands'],
  coast: ['coast', 'shore', 'beach', 'seaside', 'harbor', 'port'],
  underground: ['underground', 'beneath', 'below', 'subterranean'],
  planar: ['plane', 'dimension', 'realm', 'otherworldly'],
  ship: ['ship', 'vessel', 'boat', 'galleon', 'frigate'],
  fortress: ['fortress', 'fort', 'stronghold', 'citadel', 'keep', 'castle']
};

const POI_CATEGORY_KEYWORDS: Record<POICategory, string[]> = {
  starting_location: ['start', 'begin', 'opening', 'first', 'initial'],
  hub: ['hub', 'central', 'main', 'base', 'headquarters'],
  main_quest: ['main', 'primary', 'important', 'crucial', 'key', 'essential'],
  side_quest: ['side', 'optional', 'additional', 'extra'],
  social_encounter: ['meet', 'talk', 'negotiate', 'diplomacy', 'conversation'],
  combat_encounter: ['fight', 'battle', 'combat', 'ambush', 'attack', 'enemy'],
  puzzle: ['puzzle', 'riddle', 'mystery', 'solve', 'decipher'],
  exploration: ['explore', 'discover', 'search', 'investigate'],
  boss_fight: ['boss', 'final', 'ultimate', 'powerful', 'legendary'],
  finale: ['finale', 'climax', 'ending', 'conclusion', 'final'],
  rest_area: ['rest', 'camp', 'safe', 'inn', 'refuge', 'sanctuary'],
  shop: ['shop', 'merchant', 'store', 'market', 'vendor', 'buy', 'sell'],
  information: ['learn', 'information', 'knowledge', 'clue', 'hint', 'research']
};

const NPC_ROLE_KEYWORDS = {
  ally: ['ally', 'friend', 'helper', 'supporter', 'companion'],
  enemy: ['enemy', 'foe', 'villain', 'antagonist', 'hostile', 'evil'],
  neutral: ['neutral', 'bystander', 'observer', 'citizen'],
  quest_giver: ['quest', 'task', 'mission', 'job', 'ask', 'requests'],
  merchant: ['merchant', 'trader', 'vendor', 'shopkeeper', 'sells'],
  ruler: ['king', 'queen', 'ruler', 'lord', 'lady', 'noble', 'baron', 'duke']
};

export class CampaignParser {
  
  /**
   * Main parsing method - extracts all campaign elements from text
   */
  static parse(campaignText: string): ParsedCampaignData {
    const lines = campaignText.split('\n').map(line => line.trim()).filter(line => line);
    
    return {
      title: this.extractTitle(campaignText),
      description: this.extractDescription(lines),
      pois: this.extractPOIs(campaignText),
      npcs: this.extractNPCs(campaignText),
      mapDescriptions: this.extractMapDescriptions(campaignText),
      plotPoints: this.extractPlotPoints(campaignText),
      terrainKeywords: this.analyzeTerrainKeywords(campaignText),
      notes: this.extractNotes(lines)
    };
  }

  /**
   * Extract campaign title (first line or heading)
   */
  private static extractTitle(text: string): string {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length === 0) return 'Untitled Campaign';
    
    // Check for markdown heading
    const headingMatch = lines[0].match(/^#+\s+(.+)$/);
    if (headingMatch) return headingMatch[1];
    
    // Use first non-empty line
    return lines[0].substring(0, 100);
  }

  /**
   * Extract campaign description (first paragraph or section)
   */
  private static extractDescription(lines: string[]): string {
    if (lines.length < 2) return '';
    
    // Skip title, collect next paragraph
    let description = '';
    for (let i = 1; i < Math.min(lines.length, 10); i++) {
      if (lines[i].startsWith('#')) break;
      description += lines[i] + ' ';
    }
    
    return description.trim().substring(0, 500);
  }

  /**
   * Extract Points of Interest from text
   */
  private static extractPOIs(text: string): Partial<PointOfInterest>[] {
    const pois: Partial<PointOfInterest>[] = [];
    const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s);
    
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      const lowerSentence = sentence.toLowerCase();
      
      // Look for location patterns
      const locationPatterns = [
        /(?:the|a|an)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})\s+(?:cave|forest|dungeon|temple|tower|castle|ruins|village|town|city|building)/i,
        /([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})\s+is\s+(?:a|an|the)\s+\w+\s+(?:location|place|area)/i,
        /travel to\s+(?:the\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})/i,
        /arrive at\s+(?:the\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})/i,
      ];
      
      for (const pattern of locationPatterns) {
        const match = sentence.match(pattern);
        if (match) {
          const name = match[1];
          const type = this.inferPOIType(sentence);
          const category = this.inferPOICategory(sentence);
          
          // Check if already added
          if (!pois.some(p => p.name === name)) {
            pois.push({
              id: `poi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name,
              type,
              category,
              description: sentence,
              storyRelevance: this.inferStoryRelevance(sentence),
              order: pois.length,
              isOptional: lowerSentence.includes('optional') || lowerSentence.includes('side'),
              estimatedPlayTime: 60,
              difficultyRating: 5
            });
          }
        }
      }
    }
    
    return pois;
  }

  /**
   * Infer POI type from context
   */
  private static inferPOIType(text: string): POIType {
    const lowerText = text.toLowerCase();
    
    for (const [type, keywords] of Object.entries(POI_TYPE_KEYWORDS)) {
      if (keywords.some(kw => lowerText.includes(kw))) {
        return type as POIType;
      }
    }
    
    return 'dungeon'; // default
  }

  /**
   * Infer POI category from context
   */
  private static inferPOICategory(text: string): POICategory {
    const lowerText = text.toLowerCase();
    
    for (const [category, keywords] of Object.entries(POI_CATEGORY_KEYWORDS)) {
      if (keywords.some(kw => lowerText.includes(kw))) {
        return category as POICategory;
      }
    }
    
    return 'exploration'; // default
  }

  /**
   * Infer story relevance from context
   */
  private static inferStoryRelevance(text: string): StoryRelevance {
    const lowerText = text.toLowerCase();
    
    if (lowerText.match(/\b(critical|essential|must|required|vital)\b/)) {
      return 'critical';
    }
    if (lowerText.match(/\b(important|key|main|primary)\b/)) {
      return 'important';
    }
    if (lowerText.match(/\b(optional|side|extra|additional)\b/)) {
      return 'optional';
    }
    
    return 'flavor';
  }

  /**
   * Extract NPCs from text
   */
  private static extractNPCs(text: string): DetectedNPC[] {
    const npcs: DetectedNPC[] = [];
    const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s);
    
    // Look for proper nouns that might be NPCs
    const properNouns = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g) || [];
    const uniqueNames = Array.from(new Set(properNouns)).filter(name => 
      name.length > 2 && !name.match(/^(The|A|An|In|On|At|To|From)$/)
    );
    
    for (const name of uniqueNames) {
      // Find context around this name
      const context = sentences.find(s => s.includes(name)) || '';
      const lowerContext = context.toLowerCase();
      
      // Determine role
      let role: DetectedNPC['role'] = 'neutral';
      let roleConfidence = 0.3;
      
      for (const [roleType, keywords] of Object.entries(NPC_ROLE_KEYWORDS)) {
        const matchCount = keywords.filter(kw => lowerContext.includes(kw)).length;
        if (matchCount > 0 && matchCount / keywords.length > roleConfidence) {
          role = roleType as DetectedNPC['role'];
          roleConfidence = matchCount / keywords.length;
        }
      }
      
      // Determine importance
      const importance: DetectedNPC['importance'] = 
        lowerContext.match(/\b(leader|king|queen|main|primary)\b/) ? 'major' :
        lowerContext.match(/\b(minor|small|brief)\b/) ? 'minor' : 'background';
      
      npcs.push({
        name,
        role,
        description: context.substring(0, 200),
        importance,
        confidence: Math.min(roleConfidence + 0.4, 0.9),
        extractedFromText: context
      });
    }
    
    return npcs;
  }

  /**
   * Extract map descriptions
   */
  private static extractMapDescriptions(text: string): MapDescription[] {
    const descriptions: MapDescription[] = [];
    const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s);
    
    for (const sentence of sentences) {
      // Look for explicit map mentions
      if (sentence.toLowerCase().match(/\b(map|area|region|location)\b/)) {
        const terrain = this.inferTerrainType(sentence);
        const name = this.extractLocationName(sentence);
        
        if (name) {
          descriptions.push({
            name,
            description: sentence,
            terrainType: terrain,
            extractedText: sentence,
            confidence: 0.7
          });
        }
      }
    }
    
    return descriptions;
  }

  /**
   * Extract location name from sentence
   */
  private static extractLocationName(sentence: string): string {
    const match = sentence.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/);
    return match ? match[1] : '';
  }

  /**
   * Infer terrain type from text
   */
  private static inferTerrainType(text: string): TerrainType {
    const lowerText = text.toLowerCase();
    
    for (const [terrain, keywords] of Object.entries(TERRAIN_KEYWORDS)) {
      if (keywords.some(kw => lowerText.includes(kw))) {
        return terrain as TerrainType;
      }
    }
    
    return TerrainType.Dungeon; // default
  }

  /**
   * Extract plot points
   */
  private static extractPlotPoints(text: string): PlotPoint[] {
    const plotPoints: PlotPoint[] = [];
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
    
    for (let i = 0; i < paragraphs.length; i++) {
      const para = paragraphs[i].trim();
      const firstSentence = para.split(/[.!?]/)[0];
      
      // Look for numbered sections or quest markers
      if (para.match(/^\d+\.|\*\*|##|Act \d+|Chapter \d+/i)) {
        plotPoints.push({
          id: `plot_${i}`,
          title: firstSentence.substring(0, 100),
          description: para.substring(0, 300),
          order: i,
          associatedPOIs: [],
          importance: i < 3 ? 'major' : 'minor'
        });
      }
    }
    
    return plotPoints;
  }

  /**
   * Analyze terrain keyword frequency
   */
  private static analyzeTerrainKeywords(text: string): TerrainKeywordMatch[] {
    const lowerText = text.toLowerCase();
    const matches: TerrainKeywordMatch[] = [];
    
    for (const [terrain, keywords] of Object.entries(TERRAIN_KEYWORDS)) {
      const foundKeywords = keywords.filter(kw => lowerText.includes(kw));
      const count = foundKeywords.length;
      
      if (count > 0) {
        matches.push({
          terrain: terrain as TerrainType,
          keywords: foundKeywords,
          count
        });
      }
    }
    
    return matches.sort((a, b) => b.count - a.count);
  }

  /**
   * Extract general notes (lines that don't fit other categories)
   */
  private static extractNotes(lines: string[]): string[] {
    return lines
      .filter(line => 
        line.length > 20 && 
        line.length < 200 &&
        !line.startsWith('#') &&
        !line.match(/^\d+\./)
      )
      .slice(0, 10); // Limit to 10 notes
  }
}
