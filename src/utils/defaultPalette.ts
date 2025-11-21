/**
 * Default sprite palette data for 32Rogues sprite pack
 * All sprites are 32x32 pixels
 * This serves as the foundation for the object palette system
 */

import { Palette, Sprite, SpriteCategory, Spritesheet } from '../types/palette';

/**
 * Sprite categories based on the 32Rogues pack
 */
export const DEFAULT_SPRITE_CATEGORIES: SpriteCategory[] = [
  { id: 'characters', name: 'Characters', color: '#2196f3', order: 0 },
  { id: 'monsters', name: 'Monsters', color: '#f44336', order: 1 },
  { id: 'animals', name: 'Animals', color: '#4caf50', order: 2 },
  { id: 'weapons', name: 'Weapons', color: '#ff9800', order: 3 },
  { id: 'armor', name: 'Armor & Equipment', color: '#795548', order: 4 },
  { id: 'items', name: 'Items & Consumables', color: '#9c27b0', order: 5 },
  { id: 'magic', name: 'Magic Items', color: '#3f51b5', order: 6 },
  { id: 'environment', name: 'Environment', color: '#009688', order: 7 },
];

/**
 * Character sprites (rogues.png)
 * Source: rogues.txt descriptions
 */
export const CHARACTER_SPRITES: Partial<Sprite>[] = [
  // Row 1: Dwarves, Elves, Rangers
  { name: 'Dwarf', category: 'characters', tags: ['dwarf', 'melee', 'player'] },
  { name: 'Elf', category: 'characters', tags: ['elf', 'player'] },
  { name: 'Ranger', category: 'characters', tags: ['ranger', 'bow', 'player'] },
  { name: 'Rogue', category: 'characters', tags: ['rogue', 'stealth', 'player'] },
  { name: 'Bandit', category: 'characters', tags: ['bandit', 'enemy', 'human'] },
  
  // Row 2: Knights and Fighters
  { name: 'Knight', category: 'characters', tags: ['knight', 'heavy armor', 'player'] },
  { name: 'Male Fighter', category: 'characters', tags: ['fighter', 'melee', 'player'] },
  { name: 'Female Knight', category: 'characters', tags: ['knight', 'female', 'player'] },
  { name: 'Female Knight (Helmetless)', category: 'characters', tags: ['knight', 'female', 'player'] },
  { name: 'Shield Knight', category: 'characters', tags: ['knight', 'shield', 'player'] },
  
  // Row 3: Religious Classes
  { name: 'Monk', category: 'characters', tags: ['monk', 'unarmed', 'player'] },
  { name: 'Priest', category: 'characters', tags: ['priest', 'healer', 'player'] },
  { name: 'Female War Cleric', category: 'characters', tags: ['cleric', 'female', 'player'] },
  { name: 'Male War Cleric', category: 'characters', tags: ['cleric', 'male', 'player'] },
  { name: 'Templar', category: 'characters', tags: ['templar', 'holy', 'player'] },
  { name: 'Schema Monk', category: 'characters', tags: ['monk', 'religious', 'player'] },
  { name: 'Elder Schema Monk', category: 'characters', tags: ['monk', 'elder', 'player'] },
  
  // Row 4: Barbarians and Warriors
  { name: 'Male Barbarian', category: 'characters', tags: ['barbarian', 'melee', 'player'] },
  { name: 'Male Winter Barbarian', category: 'characters', tags: ['barbarian', 'winter', 'player'] },
  { name: 'Female Winter Barbarian', category: 'characters', tags: ['barbarian', 'female', 'winter', 'player'] },
  { name: 'Swordsman', category: 'characters', tags: ['swordsman', 'melee', 'player'] },
  { name: 'Fencer', category: 'characters', tags: ['fencer', 'rapier', 'player'] },
  { name: 'Female Barbarian', category: 'characters', tags: ['barbarian', 'female', 'player'] },
  
  // Row 5: Magical Classes
  { name: 'Female Wizard', category: 'characters', tags: ['wizard', 'female', 'magic', 'player'] },
  { name: 'Male Wizard', category: 'characters', tags: ['wizard', 'male', 'magic', 'player'] },
  { name: 'Druid', category: 'characters', tags: ['druid', 'nature', 'magic', 'player'] },
  { name: 'Desert Sage', category: 'characters', tags: ['sage', 'magic', 'player'] },
  { name: 'Dwarf Mage', category: 'characters', tags: ['mage', 'dwarf', 'magic', 'player'] },
  { name: 'Warlock', category: 'characters', tags: ['warlock', 'dark magic', 'player'] },
  
  // Row 6: NPCs - Workers
  { name: 'Farmer (Wheat Thresher)', category: 'characters', tags: ['farmer', 'npc', 'worker'] },
  { name: 'Farmer (Scythe)', category: 'characters', tags: ['farmer', 'npc', 'worker'] },
  { name: 'Farmer (Pitchfork)', category: 'characters', tags: ['farmer', 'npc', 'worker'] },
  { name: 'Baker', category: 'characters', tags: ['baker', 'npc', 'worker'] },
  { name: 'Blacksmith', category: 'characters', tags: ['blacksmith', 'npc', 'worker'] },
  { name: 'Scholar', category: 'characters', tags: ['scholar', 'npc', 'worker'] },
  
  // Row 7: NPCs - Peasants
  { name: 'Peasant (Coalburner)', category: 'characters', tags: ['peasant', 'npc'] },
  { name: 'Peasant', category: 'characters', tags: ['peasant', 'npc'] },
  { name: 'Shopkeeper', category: 'characters', tags: ['shopkeeper', 'npc', 'merchant'] },
  { name: 'Elderly Woman', category: 'characters', tags: ['elderly', 'female', 'npc'] },
  { name: 'Elderly Man', category: 'characters', tags: ['elderly', 'male', 'npc'] },
];

/**
 * Monster sprites (monsters.png)
 * Source: monsters.txt descriptions
 */
export const MONSTER_SPRITES: Partial<Sprite>[] = [
  // Row 1: Orcs and Goblins
  { name: 'Orc', category: 'monsters', tags: ['orc', 'melee', 'humanoid'] },
  { name: 'Orc Wizard', category: 'monsters', tags: ['orc', 'wizard', 'magic', 'humanoid'] },
  { name: 'Goblin', category: 'monsters', tags: ['goblin', 'small', 'humanoid'] },
  { name: 'Orc Blademaster', category: 'monsters', tags: ['orc', 'elite', 'melee', 'humanoid'] },
  { name: 'Orc Warchief', category: 'monsters', tags: ['orc', 'boss', 'humanoid'] },
  { name: 'Goblin Archer', category: 'monsters', tags: ['goblin', 'ranged', 'humanoid'] },
  { name: 'Goblin Mage', category: 'monsters', tags: ['goblin', 'magic', 'humanoid'] },
  { name: 'Goblin Brute', category: 'monsters', tags: ['goblin', 'melee', 'humanoid'] },
  
  // Row 2: Giants
  { name: 'Ettin', category: 'monsters', tags: ['giant', 'two-headed', 'large'] },
  { name: 'Two Headed Ettin', category: 'monsters', tags: ['giant', 'two-headed', 'large'] },
  { name: 'Troll', category: 'monsters', tags: ['troll', 'regeneration', 'large'] },
  
  // Row 3: Slimes
  { name: 'Small Slime', category: 'monsters', tags: ['slime', 'ooze', 'small'] },
  { name: 'Big Slime', category: 'monsters', tags: ['slime', 'ooze', 'large'] },
  { name: 'Slimebody', category: 'monsters', tags: ['slime', 'ooze'] },
  { name: 'Merged Slimebodies', category: 'monsters', tags: ['slime', 'ooze', 'large'] },
  
  // Row 4: Evil Humanoids
  { name: 'Faceless Monk', category: 'monsters', tags: ['monk', 'evil', 'humanoid'] },
  { name: 'Unholy Cardinal', category: 'monsters', tags: ['cleric', 'evil', 'humanoid'] },
  
  // Row 5: Undead
  { name: 'Skeleton', category: 'monsters', tags: ['skeleton', 'undead', 'melee'] },
  { name: 'Skeleton Archer', category: 'monsters', tags: ['skeleton', 'undead', 'ranged'] },
  { name: 'Lich', category: 'monsters', tags: ['lich', 'undead', 'magic', 'boss'] },
  { name: 'Death Knight', category: 'monsters', tags: ['death knight', 'undead', 'elite'] },
  { name: 'Zombie', category: 'monsters', tags: ['zombie', 'undead'] },
  { name: 'Ghoul', category: 'monsters', tags: ['ghoul', 'undead'] },
  
  // Row 6: Spirits
  { name: 'Banshee', category: 'monsters', tags: ['banshee', 'undead', 'spirit'] },
  { name: 'Reaper', category: 'monsters', tags: ['reaper', 'undead', 'death'] },
  { name: 'Wraith', category: 'monsters', tags: ['wraith', 'undead', 'spirit'] },
  { name: 'Cultist', category: 'monsters', tags: ['cultist', 'evil', 'humanoid'] },
  { name: 'Hag', category: 'monsters', tags: ['hag', 'witch', 'magic'] },
  
  // Row 7: Giant Monsters
  { name: 'Giant Centipede', category: 'monsters', tags: ['centipede', 'insect', 'large'] },
  { name: 'Lampreymander', category: 'monsters', tags: ['aberration', 'aquatic'] },
  { name: 'Giant Earthworm', category: 'monsters', tags: ['worm', 'large'] },
  { name: 'Manticore', category: 'monsters', tags: ['manticore', 'flying', 'large'] },
  { name: 'Giant Ant', category: 'monsters', tags: ['ant', 'insect', 'large'] },
  { name: 'Lycanthrope', category: 'monsters', tags: ['lycanthrope', 'werewolf', 'humanoid'] },
  { name: 'Giant Bat', category: 'monsters', tags: ['bat', 'flying', 'large'] },
  { name: 'Lesser Giant Ant', category: 'monsters', tags: ['ant', 'insect'] },
  { name: 'Giant Spider', category: 'monsters', tags: ['spider', 'large', 'web'] },
  { name: 'Lesser Giant Spider', category: 'monsters', tags: ['spider', 'web'] },
  { name: 'Warg', category: 'monsters', tags: ['warg', 'wolf', 'mount'] },
  { name: 'Giant Rat', category: 'monsters', tags: ['rat', 'large'] },
  
  // Row 8: Mythical Creatures
  { name: 'Dryad', category: 'monsters', tags: ['dryad', 'fey', 'nature'] },
  { name: 'Wendigo', category: 'monsters', tags: ['wendigo', 'cursed', 'large'] },
  { name: 'Rock Golem', category: 'monsters', tags: ['golem', 'construct', 'earth'] },
  { name: 'Centaur', category: 'monsters', tags: ['centaur', 'nature'] },
  { name: 'Naga', category: 'monsters', tags: ['naga', 'serpent', 'magic'] },
  { name: 'Forest Spirit', category: 'monsters', tags: ['spirit', 'fey', 'nature'] },
  { name: 'Satyr', category: 'monsters', tags: ['satyr', 'fey', 'nature'] },
  { name: 'Minotaur', category: 'monsters', tags: ['minotaur', 'large', 'melee'] },
  { name: 'Harpy', category: 'monsters', tags: ['harpy', 'flying'] },
  { name: 'Gorgon', category: 'monsters', tags: ['gorgon', 'medusa', 'petrify'] },
  
  // Row 9: Dragons and Reptiles
  { name: 'Lizardfolk', category: 'monsters', tags: ['lizardfolk', 'reptile', 'humanoid'] },
  { name: 'Drake', category: 'monsters', tags: ['drake', 'dragon', 'flying'] },
  { name: 'Dragon', category: 'monsters', tags: ['dragon', 'boss', 'flying', 'large'] },
  { name: 'Cockatrice', category: 'monsters', tags: ['cockatrice', 'petrify', 'flying'] },
  { name: 'Basilisk', category: 'monsters', tags: ['basilisk', 'petrify', 'reptile'] },
  
  // Row 10: Kobolds
  { name: 'Small Kobold', category: 'monsters', tags: ['kobold', 'small', 'canine'] },
  { name: 'Kobold', category: 'monsters', tags: ['kobold', 'canine'] },
  
  // Row 11: Fungi
  { name: 'Small Myconid', category: 'monsters', tags: ['myconid', 'fungus', 'small'] },
  { name: 'Large Myconid', category: 'monsters', tags: ['myconid', 'fungus', 'large'] },
  
  // Row 12: Celestial and Infernal
  { name: 'Angel', category: 'monsters', tags: ['angel', 'celestial', 'holy', 'flying'] },
  { name: 'Imp', category: 'monsters', tags: ['imp', 'devil', 'infernal', 'small'] },
  
  // Row 13: Aberrations
  { name: 'Small Writhing Mass', category: 'monsters', tags: ['aberration', 'horror', 'small'] },
  { name: 'Large Writhing Mass', category: 'monsters', tags: ['aberration', 'horror', 'large'] },
  { name: 'Writhing Humanoid', category: 'monsters', tags: ['aberration', 'horror', 'humanoid'] },
];

/**
 * Animal sprites (animals.png)
 * Source: animals.txt descriptions
 */
export const ANIMAL_SPRITES: Partial<Sprite>[] = [
  // Bears
  { name: 'Grizzly Bear', category: 'animals', tags: ['bear', 'large', 'mammal'] },
  { name: 'Black Bear', category: 'animals', tags: ['bear', 'large', 'mammal'] },
  { name: 'Polar Bear', category: 'animals', tags: ['bear', 'large', 'arctic', 'mammal'] },
  { name: 'Panda', category: 'animals', tags: ['bear', 'large', 'mammal'] },
  
  // Primates
  { name: 'Chimpanzee', category: 'animals', tags: ['primate', 'mammal'] },
  { name: 'Gorilla', category: 'animals', tags: ['primate', 'large', 'mammal'] },
  { name: 'Orangutan', category: 'animals', tags: ['primate', 'mammal'] },
  { name: 'Aye Aye', category: 'animals', tags: ['primate', 'small', 'mammal'] },
  { name: 'Gibbon', category: 'animals', tags: ['primate', 'mammal'] },
  { name: 'Mandrill', category: 'animals', tags: ['primate', 'mammal'] },
  { name: 'Capuchin', category: 'animals', tags: ['primate', 'small', 'mammal'] },
  { name: 'Langur', category: 'animals', tags: ['primate', 'mammal'] },
  
  // Felines
  { name: 'Cat', category: 'animals', tags: ['feline', 'small', 'pet', 'mammal'] },
  { name: 'Bobcat', category: 'animals', tags: ['feline', 'wild', 'mammal'] },
  { name: 'Cougar', category: 'animals', tags: ['feline', 'large', 'mammal'] },
  { name: 'Cheetah', category: 'animals', tags: ['feline', 'fast', 'mammal'] },
  { name: 'Lynx', category: 'animals', tags: ['feline', 'mammal'] },
  { name: 'Ocelot', category: 'animals', tags: ['feline', 'mammal'] },
  { name: 'Male Lion', category: 'animals', tags: ['lion', 'feline', 'large', 'mammal'] },
  { name: 'Female Lion', category: 'animals', tags: ['lion', 'feline', 'large', 'mammal'] },
  
  // Canines
  { name: 'Dog', category: 'animals', tags: ['canine', 'pet', 'mammal'] },
  { name: 'Puppy', category: 'animals', tags: ['canine', 'small', 'pet', 'mammal'] },
  { name: 'Hyena', category: 'animals', tags: ['canine', 'wild', 'mammal'] },
  { name: 'Fox', category: 'animals', tags: ['canine', 'wild', 'mammal'] },
  { name: 'Jackal', category: 'animals', tags: ['canine', 'wild', 'mammal'] },
  { name: 'Coyote', category: 'animals', tags: ['canine', 'wild', 'mammal'] },
  { name: 'Wolf', category: 'animals', tags: ['wolf', 'canine', 'wild', 'mammal'] },
  
  // Rodents and Small Mammals
  { name: 'Capybara', category: 'animals', tags: ['rodent', 'large', 'mammal'] },
  { name: 'Beaver', category: 'animals', tags: ['rodent', 'aquatic', 'mammal'] },
  { name: 'Mink', category: 'animals', tags: ['mammal', 'small'] },
  { name: 'Mongoose', category: 'animals', tags: ['mammal', 'small'] },
  { name: 'Marmot', category: 'animals', tags: ['rodent', 'mammal'] },
  { name: 'Groundhog', category: 'animals', tags: ['rodent', 'mammal'] },
  { name: 'Chinchilla', category: 'animals', tags: ['rodent', 'small', 'mammal'] },
  { name: 'Echidna', category: 'animals', tags: ['mammal', 'spiny'] },
  { name: 'Aardvark', category: 'animals', tags: ['mammal'] },
  { name: 'Armadillo', category: 'animals', tags: ['mammal', 'armored'] },
  { name: 'Badger', category: 'animals', tags: ['mammal'] },
  { name: 'Honey Badger', category: 'animals', tags: ['mammal', 'aggressive'] },
  { name: 'Coati', category: 'animals', tags: ['mammal'] },
  { name: 'Opossum', category: 'animals', tags: ['mammal'] },
  { name: 'Rabbit', category: 'animals', tags: ['rodent', 'small', 'mammal'] },
  { name: 'Hare', category: 'animals', tags: ['rodent', 'fast', 'mammal'] },
  { name: 'Rat', category: 'animals', tags: ['rodent', 'small', 'pest', 'mammal'] },
  
  // Reptiles
  { name: 'Snake', category: 'animals', tags: ['snake', 'reptile'] },
  { name: 'Cobra', category: 'animals', tags: ['snake', 'venomous', 'reptile'] },
  { name: 'King Snake', category: 'animals', tags: ['snake', 'reptile'] },
  { name: 'Black Mamba', category: 'animals', tags: ['snake', 'venomous', 'reptile'] },
  { name: 'Alligator', category: 'animals', tags: ['reptile', 'large', 'aquatic'] },
  { name: 'Monitor Lizard', category: 'animals', tags: ['lizard', 'large', 'reptile'] },
  { name: 'Iguana', category: 'animals', tags: ['lizard', 'reptile'] },
  { name: 'Tortoise', category: 'animals', tags: ['turtle', 'reptile'] },
  { name: 'Snapping Turtle', category: 'animals', tags: ['turtle', 'aquatic', 'reptile'] },
  { name: 'Alligator Snapping Turtle', category: 'animals', tags: ['turtle', 'large', 'aquatic', 'reptile'] },
  
  // Livestock
  { name: 'Cow', category: 'animals', tags: ['livestock', 'large', 'mammal'] },
  { name: 'Horse', category: 'animals', tags: ['horse', 'mount', 'large', 'mammal'] },
  { name: 'Donkey', category: 'animals', tags: ['mount', 'mammal'] },
  { name: 'Mule', category: 'animals', tags: ['mount', 'mammal'] },
  { name: 'Alpaca', category: 'animals', tags: ['livestock', 'mammal'] },
  { name: 'Llama', category: 'animals', tags: ['livestock', 'mammal'] },
  { name: 'Pig', category: 'animals', tags: ['livestock', 'mammal'] },
  { name: 'Boar', category: 'animals', tags: ['wild', 'aggressive', 'mammal'] },
  { name: 'Camel', category: 'animals', tags: ['mount', 'desert', 'large', 'mammal'] },
  { name: 'Reindeer', category: 'animals', tags: ['mount', 'arctic', 'mammal'] },
  { name: 'Water Buffalo', category: 'animals', tags: ['livestock', 'large', 'mammal'] },
  { name: 'Yak', category: 'animals', tags: ['livestock', 'mountain', 'mammal'] },
  
  // Birds
  { name: 'Seagull', category: 'animals', tags: ['bird', 'flying', 'coastal'] },
  { name: 'Barn Owl', category: 'animals', tags: ['owl', 'bird', 'flying', 'nocturnal'] },
  { name: 'Common Buzzard', category: 'animals', tags: ['bird', 'flying', 'predator'] },
  { name: 'Kangaroo', category: 'animals', tags: ['marsupial', 'mammal'] },
  { name: 'Koala', category: 'animals', tags: ['marsupial', 'mammal'] },
  { name: 'Penguin', category: 'animals', tags: ['bird', 'aquatic', 'arctic'] },
  { name: 'Little Penguin', category: 'animals', tags: ['bird', 'small', 'aquatic'] },
  { name: 'Cassowary', category: 'animals', tags: ['bird', 'large', 'flightless'] },
  { name: 'Emu', category: 'animals', tags: ['bird', 'large', 'flightless'] },
  { name: 'Chicken', category: 'animals', tags: ['bird', 'livestock'] },
  { name: 'Rooster', category: 'animals', tags: ['bird', 'livestock'] },
  { name: 'Mallard Duck', category: 'animals', tags: ['duck', 'bird', 'aquatic'] },
  { name: 'Swan', category: 'animals', tags: ['bird', 'aquatic', 'large'] },
  { name: 'Turkey', category: 'animals', tags: ['bird', 'livestock'] },
  { name: 'Guineafowl', category: 'animals', tags: ['bird', 'livestock'] },
  { name: 'Peacock', category: 'animals', tags: ['bird', 'decorative'] },
  
  // Goats and Sheep
  { name: 'Goat', category: 'animals', tags: ['livestock', 'mammal'] },
  { name: 'Mountain Goat', category: 'animals', tags: ['wild', 'mountain', 'mammal'] },
  { name: 'Ibex', category: 'animals', tags: ['wild', 'mountain', 'mammal'] },
  { name: 'Ram', category: 'animals', tags: ['sheep', 'livestock', 'mammal'] },
  { name: 'Ewe', category: 'animals', tags: ['sheep', 'livestock', 'mammal'] },
];

/**
 * Weapon sprites (items.png - weapons section)
 * Source: items.txt descriptions
 */
export const WEAPON_SPRITES: Partial<Sprite>[] = [
  // Daggers and Short Swords
  { name: 'Dagger', category: 'weapons', tags: ['dagger', 'light', 'finesse'] },
  { name: 'Short Sword', category: 'weapons', tags: ['sword', 'light', 'finesse'] },
  { name: 'Short Sword 2', category: 'weapons', tags: ['sword', 'light', 'finesse'] },
  { name: 'Long Sword', category: 'weapons', tags: ['sword', 'versatile'] },
  { name: 'Bastard Sword', category: 'weapons', tags: ['sword', 'versatile', 'heavy'] },
  { name: 'Zweihander', category: 'weapons', tags: ['sword', 'two-handed', 'heavy'] },
  { name: 'Sanguine Dagger', category: 'weapons', tags: ['dagger', 'magic', 'cursed'] },
  { name: 'Magic Dagger', category: 'weapons', tags: ['dagger', 'magic', 'enchanted'] },
  { name: 'Crystal Sword', category: 'weapons', tags: ['sword', 'magic', 'crystal'] },
  { name: 'Evil Sword', category: 'weapons', tags: ['sword', 'cursed', 'dark'] },
  { name: 'Flame Sword', category: 'weapons', tags: ['sword', 'fire', 'magic'] },
  
  // Broad Swords
  { name: 'Wide Short Sword', category: 'weapons', tags: ['sword', 'heavy'] },
  { name: 'Wide Long Sword', category: 'weapons', tags: ['sword', 'heavy', 'versatile'] },
  { name: 'Rapier', category: 'weapons', tags: ['sword', 'finesse', 'piercing'] },
  { name: 'Long Rapier', category: 'weapons', tags: ['sword', 'finesse', 'reach'] },
  { name: 'Flamberge', category: 'weapons', tags: ['sword', 'two-handed', 'heavy'] },
  { name: 'Large Flamberge', category: 'weapons', tags: ['sword', 'two-handed', 'heavy'] },
  { name: 'Great Sword', category: 'weapons', tags: ['sword', 'two-handed', 'heavy'] },
  
  // Curved Swords
  { name: 'Shotel', category: 'weapons', tags: ['sword', 'curved', 'exotic'] },
  { name: 'Scimitar', category: 'weapons', tags: ['sword', 'curved', 'finesse'] },
  { name: 'Large Scimitar', category: 'weapons', tags: ['sword', 'curved', 'heavy'] },
  { name: 'Great Scimitar', category: 'weapons', tags: ['sword', 'curved', 'two-handed'] },
  { name: 'Kukri', category: 'weapons', tags: ['sword', 'curved', 'light'] },
  
  // Axes
  { name: 'Hand Axe', category: 'weapons', tags: ['axe', 'light', 'thrown'] },
  { name: 'Battle Axe', category: 'weapons', tags: ['axe', 'versatile'] },
  { name: 'Halberd', category: 'weapons', tags: ['polearm', 'two-handed', 'reach'] },
  { name: 'Great Axe', category: 'weapons', tags: ['axe', 'two-handed', 'heavy'] },
  { name: 'Giant Axe', category: 'weapons', tags: ['axe', 'two-handed', 'heavy', 'large'] },
  { name: 'Hatchet', category: 'weapons', tags: ['axe', 'light', 'tool'] },
  { name: "Woodcutter's Axe", category: 'weapons', tags: ['axe', 'tool'] },
  
  // Hammers
  { name: 'Blacksmith Hammer', category: 'weapons', tags: ['hammer', 'tool', 'light'] },
  { name: 'Short Warhammer', category: 'weapons', tags: ['hammer', 'versatile'] },
  { name: 'Long Warhammer', category: 'weapons', tags: ['hammer', 'two-handed'] },
  { name: 'Hammer', category: 'weapons', tags: ['hammer', 'versatile'] },
  { name: 'Great Hammer', category: 'weapons', tags: ['hammer', 'two-handed', 'heavy'] },
  
  // Maces
  { name: 'Mace 1', category: 'weapons', tags: ['mace', 'bludgeoning'] },
  { name: 'Mace 2', category: 'weapons', tags: ['mace', 'bludgeoning'] },
  { name: 'Great Mace', category: 'weapons', tags: ['mace', 'two-handed', 'heavy'] },
  { name: 'Spiked Bat', category: 'weapons', tags: ['club', 'bludgeoning', 'piercing'] },
  
  // Spears
  { name: 'Spear', category: 'weapons', tags: ['spear', 'versatile', 'thrown', 'reach'] },
  { name: 'Short Spear', category: 'weapons', tags: ['spear', 'thrown'] },
  { name: 'Pitchfork', category: 'weapons', tags: ['spear', 'tool', 'improvised'] },
  { name: 'Trident', category: 'weapons', tags: ['spear', 'versatile', 'thrown'] },
  { name: 'Magic Spear', category: 'weapons', tags: ['spear', 'magic', 'enchanted'] },
  
  // Flails
  { name: 'Flail 1', category: 'weapons', tags: ['flail', 'bludgeoning'] },
  { name: 'Flail 2', category: 'weapons', tags: ['flail', 'bludgeoning', 'heavy'] },
  { name: 'Flail 3', category: 'weapons', tags: ['flail', 'two-handed', 'heavy'] },
  
  // Clubs
  { name: 'Club', category: 'weapons', tags: ['club', 'light', 'bludgeoning'] },
  { name: 'Spiked Club', category: 'weapons', tags: ['club', 'bludgeoning', 'piercing'] },
  { name: 'Great Club', category: 'weapons', tags: ['club', 'two-handed', 'heavy'] },
  { name: 'Club with Nails', category: 'weapons', tags: ['club', 'bludgeoning', 'piercing'] },
  
  // Ranged Weapons
  { name: 'Crossbow', category: 'weapons', tags: ['crossbow', 'ranged', 'loading'] },
  { name: 'Short Bow', category: 'weapons', tags: ['bow', 'ranged'] },
  { name: 'Long Bow', category: 'weapons', tags: ['bow', 'ranged', 'two-handed'] },
  { name: 'Long Bow 2', category: 'weapons', tags: ['bow', 'ranged', 'two-handed'] },
  { name: 'Large Crossbow', category: 'weapons', tags: ['crossbow', 'ranged', 'heavy', 'loading'] },
  
  // Staves
  { name: 'Crystal Staff', category: 'weapons', tags: ['staff', 'magic', 'crystal'] },
  { name: 'Holy Staff', category: 'weapons', tags: ['staff', 'magic', 'holy'] },
  { name: 'Druid Staff', category: 'weapons', tags: ['staff', 'magic', 'nature'] },
  { name: 'Blue Staff', category: 'weapons', tags: ['staff', 'magic'] },
  { name: 'Golden Staff', category: 'weapons', tags: ['staff', 'magic', 'holy'] },
  { name: 'Red Crystal Staff', category: 'weapons', tags: ['staff', 'magic', 'crystal', 'fire'] },
  { name: 'Flame Staff', category: 'weapons', tags: ['staff', 'magic', 'fire'] },
  { name: 'Blue Crystal Staff', category: 'weapons', tags: ['staff', 'magic', 'crystal', 'ice'] },
  { name: 'Cross Staff', category: 'weapons', tags: ['staff', 'magic', 'holy'] },
  { name: "Saint's Staff", category: 'weapons', tags: ['staff', 'magic', 'holy', 'legendary'] },
];

/**
 * Armor and equipment sprites (items.png - armor section)
 * Source: items.txt descriptions
 */
export const ARMOR_SPRITES: Partial<Sprite>[] = [
  // Shields
  { name: 'Buckler', category: 'armor', tags: ['shield', 'light'] },
  { name: 'Kite Shield', category: 'armor', tags: ['shield', 'heavy'] },
  { name: 'Cross Shield', category: 'armor', tags: ['shield', 'heavy', 'holy'] },
  { name: 'Dark Shield', category: 'armor', tags: ['shield', 'heavy', 'cursed'] },
  { name: 'Round Shield', category: 'armor', tags: ['shield', 'medium'] },
  { name: 'Buckler 2', category: 'armor', tags: ['shield', 'light'] },
  { name: 'Large Shield', category: 'armor', tags: ['shield', 'heavy', 'tower'] },
  
  // Body Armor
  { name: 'Cloth Armor', category: 'armor', tags: ['armor', 'light', 'cloth'] },
  { name: 'Leather Armor', category: 'armor', tags: ['armor', 'light', 'leather'] },
  { name: 'Robe', category: 'armor', tags: ['armor', 'cloth', 'magic'] },
  { name: 'Chain Mail', category: 'armor', tags: ['armor', 'medium', 'metal'] },
  { name: 'Scale Mail', category: 'armor', tags: ['armor', 'medium', 'metal'] },
  { name: 'Chest Plate', category: 'armor', tags: ['armor', 'heavy', 'metal', 'plate'] },
  
  // Gloves
  { name: 'Cloth Gloves', category: 'armor', tags: ['gloves', 'light'] },
  { name: 'Leather Gloves', category: 'armor', tags: ['gloves', 'light'] },
  { name: 'Blue Cloth Gloves', category: 'armor', tags: ['gloves', 'light', 'magic'] },
  { name: 'Gauntlets', category: 'armor', tags: ['gloves', 'heavy', 'metal'] },
  
  // Boots
  { name: 'Shoes', category: 'armor', tags: ['boots', 'light'] },
  { name: 'Leather Boots', category: 'armor', tags: ['boots', 'medium'] },
  { name: 'High Blue Boots', category: 'armor', tags: ['boots', 'medium', 'magic'] },
  { name: 'Greaves', category: 'armor', tags: ['boots', 'heavy', 'metal'] },
  
  // Helms
  { name: 'Cloth Hood', category: 'armor', tags: ['helm', 'light', 'cloth'] },
  { name: 'Leather Helm', category: 'armor', tags: ['helm', 'light', 'leather'] },
  { name: 'Wide-Brimmed Hat', category: 'armor', tags: ['helm', 'light', 'hat'] },
  { name: 'Chain Mail Coif', category: 'armor', tags: ['helm', 'medium', 'metal'] },
  { name: 'Helm', category: 'armor', tags: ['helm', 'heavy', 'metal'] },
  { name: 'Helm with Chain Mail', category: 'armor', tags: ['helm', 'heavy', 'metal'] },
  { name: 'Plate Helm 1', category: 'armor', tags: ['helm', 'heavy', 'metal', 'plate'] },
  { name: 'Plate Helm 2', category: 'armor', tags: ['helm', 'heavy', 'metal', 'plate'] },
];

/**
 * Magic items - jewelry and accessories (items.png)
 * Source: items.txt descriptions
 */
export const MAGIC_ITEM_SPRITES: Partial<Sprite>[] = [
  // Pendants
  { name: 'Red Pendant', category: 'magic', tags: ['pendant', 'jewelry', 'magic'] },
  { name: 'Metal Pendant', category: 'magic', tags: ['pendant', 'jewelry'] },
  { name: 'Crystal Pendant', category: 'magic', tags: ['pendant', 'jewelry', 'magic', 'crystal'] },
  { name: 'Disc Pendant', category: 'magic', tags: ['pendant', 'jewelry'] },
  { name: 'Cross Pendant', category: 'magic', tags: ['pendant', 'jewelry', 'holy'] },
  { name: 'Stone Pendant', category: 'magic', tags: ['pendant', 'jewelry', 'magic'] },
  { name: 'Ankh', category: 'magic', tags: ['pendant', 'jewelry', 'holy', 'egyptian'] },
  
  // Rings - Set 1
  { name: 'Gold Emerald Ring', category: 'magic', tags: ['ring', 'jewelry', 'magic', 'precious'] },
  { name: 'Gold Band Ring', category: 'magic', tags: ['ring', 'jewelry'] },
  { name: 'Green Signet Ring', category: 'magic', tags: ['ring', 'jewelry', 'signet'] },
  { name: 'Ruby Ring', category: 'magic', tags: ['ring', 'jewelry', 'magic', 'precious'] },
  { name: 'Sapphire Ring', category: 'magic', tags: ['ring', 'jewelry', 'magic', 'precious'] },
  { name: 'Onyx Ring', category: 'magic', tags: ['ring', 'jewelry', 'magic', 'dark'] },
  
  // Rings - Set 2
  { name: 'Gold Signet Ring', category: 'magic', tags: ['ring', 'jewelry', 'signet', 'noble'] },
  { name: 'Silver Signet Ring', category: 'magic', tags: ['ring', 'jewelry', 'signet'] },
  { name: 'Jade Ring', category: 'magic', tags: ['ring', 'jewelry', 'magic'] },
  { name: 'Silver Signet Ring 2', category: 'magic', tags: ['ring', 'jewelry', 'signet'] },
  { name: 'Twisted Gold Ring', category: 'magic', tags: ['ring', 'jewelry', 'magic'] },
  { name: 'Twisted Metal Ring', category: 'magic', tags: ['ring', 'jewelry', 'magic'] },
];

/**
 * Consumable items (items.png - consumables section)
 * Source: items.txt descriptions
 */
export const ITEM_SPRITES: Partial<Sprite>[] = [
  // Potions - Set 1
  { name: 'Purple Potion', category: 'items', tags: ['potion', 'consumable', 'magic'] },
  { name: 'Red Potion', category: 'items', tags: ['potion', 'consumable', 'healing'] },
  { name: 'Brown Vial', category: 'items', tags: ['potion', 'consumable', 'vial'] },
  { name: 'Large Dark Potion', category: 'items', tags: ['potion', 'consumable', 'magic'] },
  { name: 'Green Potion', category: 'items', tags: ['potion', 'consumable', 'poison'] },
  
  // Potions - Set 2
  { name: 'Black Potion', category: 'items', tags: ['potion', 'consumable', 'cursed'] },
  { name: 'Bright Green Potion', category: 'items', tags: ['potion', 'consumable', 'poison'] },
  { name: 'Pink Vial', category: 'items', tags: ['potion', 'consumable', 'vial'] },
  { name: 'Blue Potion', category: 'items', tags: ['potion', 'consumable', 'mana'] },
  { name: 'Orange Potion', category: 'items', tags: ['potion', 'consumable', 'buff'] },
  
  // Books and Scrolls
  { name: 'Scroll', category: 'items', tags: ['scroll', 'magic', 'consumable'] },
  { name: 'Book', category: 'items', tags: ['book', 'knowledge'] },
  { name: 'Red Book', category: 'items', tags: ['book', 'magic', 'knowledge'] },
  { name: 'Dark Tome', category: 'items', tags: ['tome', 'magic', 'dark', 'knowledge'] },
  { name: 'Tome', category: 'items', tags: ['tome', 'magic', 'knowledge'] },
  { name: 'Tome 2', category: 'items', tags: ['tome', 'magic', 'knowledge'] },
  { name: 'Scroll 2', category: 'items', tags: ['scroll', 'magic', 'consumable'] },
  { name: 'Page', category: 'items', tags: ['scroll', 'paper', 'consumable'] },
  
  // Keys
  { name: 'Gold Key', category: 'items', tags: ['key', 'treasure', 'tool'] },
  { name: 'Ornate Key', category: 'items', tags: ['key', 'decorative', 'tool'] },
  { name: 'Metal Key', category: 'items', tags: ['key', 'tool'] },
  { name: 'Primitive Key', category: 'items', tags: ['key', 'simple', 'tool'] },
  
  // Ammunition
  { name: 'Arrow', category: 'items', tags: ['ammunition', 'arrow', 'ranged'] },
  { name: 'Arrows', category: 'items', tags: ['ammunition', 'arrow', 'ranged', 'bundle'] },
  { name: 'Bolt', category: 'items', tags: ['ammunition', 'bolt', 'ranged'] },
  { name: 'Bolts', category: 'items', tags: ['ammunition', 'bolt', 'ranged', 'bundle'] },
  
  // Currency
  { name: 'Coin', category: 'items', tags: ['coin', 'currency', 'treasure'] },
  { name: 'Small Stacks of Coins', category: 'items', tags: ['coin', 'currency', 'treasure'] },
  { name: 'Large Stacks of Coins', category: 'items', tags: ['coin', 'currency', 'treasure'] },
  { name: 'Coin Purse', category: 'items', tags: ['coin', 'currency', 'treasure', 'container'] },
  
  // Food and Drink
  { name: 'Cheese', category: 'items', tags: ['food', 'consumable'] },
  { name: 'Bread', category: 'items', tags: ['food', 'consumable'] },
  { name: 'Apple', category: 'items', tags: ['food', 'consumable', 'fruit'] },
  { name: 'Bottle of Beer', category: 'items', tags: ['drink', 'consumable', 'alcohol'] },
  { name: 'Bottle of Water', category: 'items', tags: ['drink', 'consumable'] },
];

/**
 * Environment/animated tiles (animated-tiles.png)
 * Source: animated-tiles.txt descriptions
 */
export const ENVIRONMENT_SPRITES: Partial<Sprite>[] = [
  // Light sources - unlit
  { name: 'Brazier (Unlit)', category: 'environment', tags: ['brazier', 'light source', 'unlit'] },
  { name: 'Brazier (Lit)', category: 'environment', tags: ['brazier', 'light source', 'lit', 'fire'] },
  { name: 'Fire Pit (Unlit)', category: 'environment', tags: ['fire pit', 'light source', 'unlit'] },
  { name: 'Fire Pit (Lit)', category: 'environment', tags: ['fire pit', 'light source', 'lit', 'fire'] },
  { name: 'Torch (Unlit)', category: 'environment', tags: ['torch', 'light source', 'unlit'] },
  { name: 'Torch (Lit)', category: 'environment', tags: ['torch', 'light source', 'lit', 'fire'] },
  { name: 'Lamp (Unlit)', category: 'environment', tags: ['lamp', 'light source', 'unlit'] },
  { name: 'Lamp (Lit)', category: 'environment', tags: ['lamp', 'light source', 'lit'] },
  
  // Fire and effects
  { name: 'Fire', category: 'environment', tags: ['fire', 'effect', 'animated'] },
  { name: 'Small Fire', category: 'environment', tags: ['fire', 'effect', 'animated', 'small'] },
  { name: 'Water Waves', category: 'environment', tags: ['water', 'effect', 'animated'] },
  { name: 'Poison Bubbles', category: 'environment', tags: ['poison', 'effect', 'animated', 'hazard'] },
];

/**
 * Generate sprite data with calculated positions
 * Assumes sprites are laid out in a grid from left to right, top to bottom
 */
function generateSprites(
  partialSprites: Partial<Sprite>[],
  sheetWidth: number,
  sheetHeight: number,
  spriteSize: number = 32,
  sheetId: string = ''
): Sprite[] {
  const columns = Math.floor(sheetWidth / spriteSize);
  
  return partialSprites.map((partial, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    
    return {
      id: `${sheetId}_${index}`,
      name: partial.name || `Unnamed Sprite ${index}`,
      x: col * spriteSize,
      y: row * spriteSize,
      width: spriteSize,
      height: spriteSize,
      imageData: '', // Will be filled when actual images are loaded
      category: partial.category || 'general',
      tags: partial.tags || [],
      sheetId, // Track which sheet this sprite belongs to
    } as Sprite;
  });
}

/**
 * Create a default palette with all sprite definitions
 * Note: imageData fields will need to be populated with actual sprite sheet images
 */
export function createDefaultPalette(): Palette {
  // Sprite sheet dimensions (you'll need to provide actual dimensions from the PNG files)
  // These are estimates based on typical sprite sheet layouts
  const rogueSpriteSheet: Spritesheet = {
    id: 'rogues',
    name: 'Character Sprites',
    imageData: '', // To be filled with actual base64 data
    spriteWidth: 32,
    spriteHeight: 32,
    columns: 8, // Estimated
    rows: 8, // Estimated
    totalSprites: CHARACTER_SPRITES.length,
    uploadedAt: new Date(),
  };

  const monsterSpriteSheet: Spritesheet = {
    id: 'monsters',
    name: 'Monster Sprites',
    imageData: '',
    spriteWidth: 32,
    spriteHeight: 32,
    columns: 10,
    rows: 15,
    totalSprites: MONSTER_SPRITES.length,
    uploadedAt: new Date(),
  };

  const animalSpriteSheet: Spritesheet = {
    id: 'animals',
    name: 'Animal Sprites',
    imageData: '',
    spriteWidth: 32,
    spriteHeight: 32,
    columns: 8,
    rows: 20,
    totalSprites: ANIMAL_SPRITES.length,
    uploadedAt: new Date(),
  };

  const itemsSpriteSheet: Spritesheet = {
    id: 'items',
    name: 'Items and Equipment',
    imageData: '',
    spriteWidth: 32,
    spriteHeight: 32,
    columns: 12,
    rows: 30,
    totalSprites: [...WEAPON_SPRITES, ...ARMOR_SPRITES, ...MAGIC_ITEM_SPRITES, ...ITEM_SPRITES].length,
    uploadedAt: new Date(),
  };

  const envSpriteSheet: Spritesheet = {
    id: 'animated-tiles',
    name: 'Environment Objects',
    imageData: '',
    spriteWidth: 32,
    spriteHeight: 32,
    columns: 12,
    rows: 3,
    totalSprites: ENVIRONMENT_SPRITES.length,
    uploadedAt: new Date(),
  };

  // Generate complete sprite objects with positions
  const characterSprites = generateSprites(CHARACTER_SPRITES, 256, 256, 32, 'rogues');
  const monsterSprites = generateSprites(MONSTER_SPRITES, 320, 480, 32, 'monsters');
  const animalSprites = generateSprites(ANIMAL_SPRITES, 256, 640, 32, 'animals');
  const weaponSprites = generateSprites(WEAPON_SPRITES, 384, 400, 32, 'items');
  const armorSprites = generateSprites(ARMOR_SPRITES, 384, 200, 32, 'items');
  const magicSprites = generateSprites(MAGIC_ITEM_SPRITES, 384, 100, 32, 'items');
  const itemSprites = generateSprites(ITEM_SPRITES, 384, 200, 32, 'items');
  const envSprites = generateSprites(ENVIRONMENT_SPRITES, 384, 96, 32, 'animated-tiles');

  return {
    id: 'default-32rogues',
    name: '32Rogues Default Palette',
    spritesheets: [
      rogueSpriteSheet,
      monsterSpriteSheet,
      animalSpriteSheet,
      itemsSpriteSheet,
      envSpriteSheet,
    ],
    sprites: [
      ...characterSprites,
      ...monsterSprites,
      ...animalSprites,
      ...weaponSprites,
      ...armorSprites,
      ...magicSprites,
      ...itemSprites,
      ...envSprites,
    ],
    categories: DEFAULT_SPRITE_CATEGORIES,
    createdAt: new Date(),
    modifiedAt: new Date(),
  };
}

/**
 * Get sprites by category
 */
export function getSpritesByCategory(palette: Palette, categoryId: string): Sprite[] {
  return palette.sprites.filter(sprite => sprite.category === categoryId);
}

/**
 * Search sprites by name or tags
 */
export function searchSprites(palette: Palette, query: string): Sprite[] {
  const lowerQuery = query.toLowerCase();
  return palette.sprites.filter(sprite =>
    sprite.name.toLowerCase().includes(lowerQuery) ||
    sprite.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}
