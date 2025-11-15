import {
  CampaignStory,
  StoryAnalysis,
  SuggestedPOI,
  DetectedNPC,
  PlotPoint,
  POIType,
  POICategory,
  CampaignTheme,
  CampaignGenre,
  PlayerLevel,
  CampaignSetting
} from '../types/campaign';

export class CampaignStoryAnalyzer {
  private static instance: CampaignStoryAnalyzer;

  static getInstance(): CampaignStoryAnalyzer {
    if (!CampaignStoryAnalyzer.instance) {
      CampaignStoryAnalyzer.instance = new CampaignStoryAnalyzer();
    }
    return CampaignStoryAnalyzer.instance;
  }

  // Analyze campaign story text and extract suggestions
  async analyzeStory(storyText: string, title?: string): Promise<StoryAnalysis> {
    const text = storyText.toLowerCase();
    const sentences = this.splitIntoSentences(storyText);
    
    return {
      suggestedPOIs: this.extractPOIs(text, sentences),
      identifiedThemes: this.identifyThemes(text),
      estimatedComplexity: this.estimateComplexity(text, sentences),
      recommendedPlayerLevel: this.recommendPlayerLevel(text),
      suggestedGenres: this.identifyGenres(text),
      detectedNPCs: this.extractNPCs(text, sentences),
      plotPoints: this.extractPlotPoints(sentences),
      warnings: this.generateWarnings(text, sentences),
      suggestions: this.generateSuggestions(text, sentences)
    };
  }

  // Extract potential Points of Interest from the story
  private extractPOIs(text: string, sentences: string[]): SuggestedPOI[] {
    const pois: SuggestedPOI[] = [];
    
    // Location keywords and their associated POI types
    const locationPatterns = [
      // Dungeons and Underground
      { pattern: /\b(dungeon|cave|cavern|underground|crypt|tomb|catacomb|basement|cellar)\b/g, type: 'dungeon' as POIType, category: 'main_quest' as POICategory },
      { pattern: /\b(mine|quarry|pit|abyss|chasm)\b/g, type: 'cave' as POIType, category: 'exploration' as POICategory },
      
      // Settlements
      { pattern: /\b(town|city|village|settlement|hamlet|metropolis)\b/g, type: 'town' as POIType, category: 'hub' as POICategory },
      { pattern: /\b(tavern|inn|pub|alehouse)\b/g, type: 'building' as POIType, category: 'social_encounter' as POICategory },
      { pattern: /\b(shop|store|market|bazaar|emporium)\b/g, type: 'building' as POIType, category: 'shop' as POICategory },
      { pattern: /\b(temple|shrine|church|cathedral|monastery)\b/g, type: 'building' as POIType, category: 'side_quest' as POICategory },
      
      // Wilderness
      { pattern: /\b(forest|woods|jungle|grove|thicket)\b/g, type: 'forest' as POIType, category: 'exploration' as POICategory },
      { pattern: /\b(mountain|peak|hill|cliff|ridge)\b/g, type: 'mountain' as POIType, category: 'exploration' as POICategory },
      { pattern: /\b(swamp|marsh|bog|wetland|mire)\b/g, type: 'swamp' as POIType, category: 'exploration' as POICategory },
      { pattern: /\b(desert|dunes|wasteland|badlands)\b/g, type: 'desert' as POIType, category: 'exploration' as POICategory },
      { pattern: /\b(coast|shore|beach|harbor|port)\b/g, type: 'coast' as POIType, category: 'exploration' as POICategory },
      
      // Structures
      { pattern: /\b(castle|fortress|keep|stronghold|citadel)\b/g, type: 'fortress' as POIType, category: 'main_quest' as POICategory },
      { pattern: /\b(tower|spire|observatory|lighthouse)\b/g, type: 'building' as POIType, category: 'puzzle' as POICategory },
      { pattern: /\b(ruins|remnant|ancient|old|abandoned)\b/g, type: 'ruins' as POIType, category: 'exploration' as POICategory },
      { pattern: /\b(bridge|crossing|ford|pass)\b/g, type: 'wilderness' as POIType, category: 'social_encounter' as POICategory },
      
      // Special locations
      { pattern: /\b(laboratory|workshop|forge|smithy)\b/g, type: 'building' as POIType, category: 'side_quest' as POICategory },
      { pattern: /\b(library|archive|repository|study)\b/g, type: 'building' as POIType, category: 'information' as POICategory },
      { pattern: /\b(prison|jail|cell|dungeon|oubliette)\b/g, type: 'dungeon' as POIType, category: 'main_quest' as POICategory },
      { pattern: /\b(ship|vessel|boat|fleet)\b/g, type: 'ship' as POIType, category: 'exploration' as POICategory },
    ];

    locationPatterns.forEach(({ pattern, type, category }) => {
      const matches = this.getAllMatches(text, pattern);
      matches.forEach(match => {
        const matchIndex = match.index!;
        const sentence = this.findSentenceContaining(sentences, match[0], matchIndex);
        
        if (sentence) {
          const poi: SuggestedPOI = {
            name: this.generatePOIName(match[0], sentence),
            type,
            category,
            description: sentence.trim(),
            confidence: this.calculateConfidence(match[0], sentence),
            reasoning: `Detected location keyword "${match[0]}" in context`,
            extractedFromText: sentence
          };
          
          // Avoid duplicates
          if (!pois.some(p => p.name === poi.name && p.type === poi.type)) {
            pois.push(poi);
          }
        }
      });
    });

    // Look for boss encounters
    const bossPatterns = /\b(boss|villain|antagonist|enemy|dragon|demon|lich|necromancer|warlord)\b/g;
    const bossMatches = this.getAllMatches(text, bossPatterns);
    bossMatches.forEach(match => {
      const sentence = this.findSentenceContaining(sentences, match[0], match.index!);
      if (sentence) {
        pois.push({
          name: `${this.capitalizeFirst(match[0])} Lair`,
          type: 'dungeon',
          category: 'boss_fight',
          description: sentence.trim(),
          confidence: 0.7,
          reasoning: `Detected boss encounter keyword "${match[0]}"`,
          extractedFromText: sentence
        });
      }
    });

    // Sort by confidence and take top results
    return pois
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 15); // Limit to reasonable number
  }

  // Extract NPCs from the story
  private extractNPCs(text: string, sentences: string[]): DetectedNPC[] {
    const npcs: DetectedNPC[] = [];
    
    // NPC role patterns
    const npcPatterns = [
      { pattern: /\b(king|queen|lord|lady|duke|duchess|baron|baroness|ruler|monarch)\b/g, role: 'ruler' as const, importance: 'major' as const },
      { pattern: /\b(merchant|trader|shopkeeper|vendor|seller)\b/g, role: 'merchant' as const, importance: 'minor' as const },
      { pattern: /\b(wizard|mage|sorcerer|warlock|sage|scholar)\b/g, role: 'quest_giver' as const, importance: 'major' as const },
      { pattern: /\b(guard|knight|soldier|warrior|paladin|fighter)\b/g, role: 'ally' as const, importance: 'minor' as const },
      { pattern: /\b(thief|assassin|bandit|criminal|rogue)\b/g, role: 'enemy' as const, importance: 'minor' as const },
      { pattern: /\b(priest|cleric|monk|acolyte|chaplain)\b/g, role: 'quest_giver' as const, importance: 'minor' as const },
      { pattern: /\b(villain|antagonist|enemy|boss|dark lord|evil)\b/g, role: 'enemy' as const, importance: 'major' as const },
    ];

    npcPatterns.forEach(({ pattern, role, importance }) => {
      const matches = this.getAllMatches(text, pattern);
      matches.forEach(match => {
        const sentence = this.findSentenceContaining(sentences, match[0], match.index!);
        if (sentence) {
          const npc: DetectedNPC = {
            name: this.generateNPCName(match[0]),
            role,
            description: sentence.trim(),
            importance,
            confidence: 0.6,
            extractedFromText: sentence
          };
          
          if (!npcs.some(n => n.name === npc.name)) {
            npcs.push(npc);
          }
        }
      });
    });

    return npcs.slice(0, 10); // Limit to reasonable number
  }

  // Extract main plot points
  private extractPlotPoints(sentences: string[]): PlotPoint[] {
    const plotPoints: PlotPoint[] = [];
    
    // Look for sentences that indicate plot progression
    const plotIndicators = [
      /\b(must|need|have to|should|required)\b.*\b(find|discover|retrieve|obtain|defeat|stop)\b/i,
      /\b(quest|mission|task|objective|goal)\b/i,
      /\b(journey|travel|go to|venture|head to)\b/i,
      /\b(before|after|then|next|finally|ultimately)\b/i
    ];

    sentences.forEach((sentence, index) => {
      plotIndicators.forEach(pattern => {
        if (pattern.test(sentence)) {
          plotPoints.push({
            id: `plot-${index}`,
            title: this.extractPlotTitle(sentence),
            description: sentence.trim(),
            order: index,
            associatedPOIs: [], // Will be populated later
            importance: this.determinePlotImportance(sentence)
          });
        }
      });
    });

    return plotPoints.slice(0, 8); // Limit to main plot points
  }

  // Identify campaign themes from text
  private identifyThemes(text: string): CampaignTheme[] {
    const themes: CampaignTheme[] = [];
    
    const themeKeywords = {
      heroic_fantasy: ['hero', 'heroic', 'noble', 'quest', 'adventure', 'good vs evil'],
      dark_fantasy: ['dark', 'evil', 'corruption', 'undead', 'demon', 'horror'],
      gothic_horror: ['vampire', 'werewolf', 'curse', 'haunted', 'ghost', 'monster'],
      high_magic: ['magic', 'wizard', 'spell', 'arcane', 'magical', 'enchant'],
      low_magic: ['mundane', 'realistic', 'grounded', 'medieval', 'historical'],
      political_intrigue: ['politics', 'court', 'nobility', 'conspiracy', 'intrigue'],
      exploration: ['explore', 'discover', 'unknown', 'wilderness', 'frontier'],
      mystery: ['mystery', 'secret', 'hidden', 'investigate', 'clue'],
      war: ['war', 'battle', 'conflict', 'army', 'siege', 'military'],
      survival: ['survive', 'harsh', 'dangerous', 'wilderness', 'elements']
    };

    Object.entries(themeKeywords).forEach(([theme, keywords]) => {
      const matches = keywords.filter(keyword => text.includes(keyword)).length;
      if (matches >= 2) {
        themes.push(theme as CampaignTheme);
      }
    });

    return themes.length > 0 ? themes : ['heroic_fantasy']; // Default theme
  }

  // Identify campaign genres
  private identifyGenres(text: string): CampaignGenre[] {
    const genres: CampaignGenre[] = [];
    
    const genreKeywords = {
      dungeon_crawl: ['dungeon', 'cave', 'underground', 'explore', 'rooms'],
      sandbox: ['open', 'choice', 'freedom', 'explore', 'decide'],
      mystery: ['mystery', 'investigate', 'clue', 'solve', 'puzzle'],
      social: ['negotiate', 'convince', 'diplomacy', 'talk', 'persuade'],
      combat_heavy: ['fight', 'battle', 'combat', 'war', 'enemy', 'defeat']
    };

    Object.entries(genreKeywords).forEach(([genre, keywords]) => {
      const matches = keywords.filter(keyword => text.includes(keyword)).length;
      if (matches >= 1) {
        genres.push(genre as CampaignGenre);
      }
    });

    return genres.length > 0 ? genres : ['dungeon_crawl']; // Default genre
  }

  // Estimate campaign complexity
  private estimateComplexity(text: string, sentences: string[]): 'simple' | 'moderate' | 'complex' | 'epic' {
    const wordCount = text.split(/\s+/).length;
    const sentenceCount = sentences.length;
    const locationCount = (text.match(/\b(town|city|village|dungeon|castle|forest|mountain)\b/g) || []).length;
    
    if (wordCount < 200 && sentenceCount < 10 && locationCount < 5) {
      return 'simple';
    } else if (wordCount < 500 && sentenceCount < 20 && locationCount < 10) {
      return 'moderate';
    } else if (wordCount < 1000 && sentenceCount < 40 && locationCount < 20) {
      return 'complex';
    } else {
      return 'epic';
    }
  }

  // Recommend player level based on content
  private recommendPlayerLevel(text: string): PlayerLevel {
    const advancedKeywords = ['epic', 'legendary', 'ancient', 'planar', 'deity', 'artifact'];
    const beginnerKeywords = ['simple', 'basic', 'first', 'learning', 'tutorial'];
    
    const advancedCount = advancedKeywords.filter(keyword => text.includes(keyword)).length;
    const beginnerCount = beginnerKeywords.filter(keyword => text.includes(keyword)).length;
    
    if (beginnerCount > advancedCount) return 'beginner';
    if (advancedCount > 2) return 'advanced';
    return 'intermediate';
  }

  // Generate warnings about potential issues
  private generateWarnings(text: string, sentences: string[]): string[] {
    const warnings: string[] = [];
    
    if (text.length < 100) {
      warnings.push('Story description is quite short. Consider adding more details for better map generation.');
    }
    
    const locationCount = (text.match(/\b(town|city|village|dungeon|castle)\b/g) || []).length;
    if (locationCount > 20) {
      warnings.push('Large number of locations detected. This may result in a very long campaign.');
    }
    
    if (locationCount === 0) {
      warnings.push('No clear locations detected. Maps may be generic without specific context.');
    }
    
    return warnings;
  }

  // Generate helpful suggestions
  private generateSuggestions(text: string, sentences: string[]): string[] {
    const suggestions: string[] = [];
    
    if (!text.includes('npc') && !text.includes('character')) {
      suggestions.push('Consider mentioning key NPCs or characters to make locations more interesting.');
    }
    
    if (!text.includes('treasure') && !text.includes('reward')) {
      suggestions.push('Adding treasure or reward information can enhance dungeon generation.');
    }
    
    if (sentences.length < 5) {
      suggestions.push('More detailed story descriptions will result in richer, more contextual maps.');
    }
    
    return suggestions;
  }

  // Helper methods
  private splitIntoSentences(text: string): string[] {
    return text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  }

  private findSentenceContaining(sentences: string[], keyword: string, matchIndex: number): string | null {
    // Find the sentence that contains this keyword match
    let charCount = 0;
    for (const sentence of sentences) {
      if (charCount <= matchIndex && matchIndex < charCount + sentence.length) {
        return sentence;
      }
      charCount += sentence.length + 1; // +1 for the delimiter
    }
    return null;
  }

  private generatePOIName(keyword: string, context: string): string {
    const adjectives = ['Ancient', 'Forgotten', 'Hidden', 'Mysterious', 'Dark', 'Sacred', 'Lost', 'Haunted'];
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const capitalizedKeyword = this.capitalizeFirst(keyword);
    
    // Try to extract a proper name from context
    const nameMatch = context.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/);
    if (nameMatch && !['The', 'A', 'An'].includes(nameMatch[1])) {
      return `${nameMatch[1]} ${capitalizedKeyword}`;
    }
    
    return `${adjective} ${capitalizedKeyword}`;
  }

  private generateNPCName(role: string): string {
    const names = ['Aldric', 'Brenna', 'Cedric', 'Diana', 'Edwin', 'Fiona', 'Gareth', 'Helena'];
    const titles = {
      'king': 'King',
      'queen': 'Queen',
      'lord': 'Lord',
      'merchant': 'Merchant',
      'wizard': 'Sage',
      'priest': 'Father',
      'guard': 'Captain'
    };
    
    const name = names[Math.floor(Math.random() * names.length)];
    const title = titles[role as keyof typeof titles] || this.capitalizeFirst(role);
    
    return `${title} ${name}`;
  }

  private extractPlotTitle(sentence: string): string {
    // Extract the main action/objective from the sentence
    const actionMatch = sentence.match(/\b(find|discover|retrieve|obtain|defeat|stop|rescue|deliver)\s+([^.!?]*)/i);
    if (actionMatch) {
      return this.capitalizeFirst(actionMatch[0].trim());
    }
    
    // Fall back to first few words
    const words = sentence.trim().split(/\s+/).slice(0, 5);
    return this.capitalizeFirst(words.join(' '));
  }

  private determinePlotImportance(sentence: string): 'major' | 'minor' | 'subplot' {
    const majorKeywords = ['must', 'required', 'essential', 'critical', 'main', 'primary'];
    const minorKeywords = ['can', 'might', 'optional', 'side', 'additional'];
    
    const lowerSentence = sentence.toLowerCase();
    
    if (majorKeywords.some(keyword => lowerSentence.includes(keyword))) {
      return 'major';
    } else if (minorKeywords.some(keyword => lowerSentence.includes(keyword))) {
      return 'minor';
    } else {
      return 'subplot';
    }
  }

  private calculateConfidence(keyword: string, context: string): number {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence for specific contexts
    if (context.includes('located') || context.includes('situated')) confidence += 0.2;
    if (context.includes('ancient') || context.includes('old')) confidence += 0.1;
    if (context.includes('hidden') || context.includes('secret')) confidence += 0.1;
    if (context.match(/\b(go to|travel to|visit|enter)\b/)) confidence += 0.2;
    
    // Decrease confidence for vague contexts
    if (context.length < 20) confidence -= 0.2;
    if (context.includes('maybe') || context.includes('perhaps')) confidence -= 0.1;
    
    return Math.max(0.1, Math.min(1.0, confidence));
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private getAllMatches(text: string, regex: RegExp): RegExpExecArray[] {
    const matches: RegExpExecArray[] = [];
    let match;
    const globalRegex = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g');
    
    while ((match = globalRegex.exec(text)) !== null) {
      matches.push(match);
    }
    
    return matches;
  }
}

export const campaignStoryAnalyzer = CampaignStoryAnalyzer.getInstance();
export default campaignStoryAnalyzer;