export interface Player {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  speed: number;
  jumpPower: number;
  grounded: boolean;
  facing: number; // 1 = right, -1 = left
  isBlinking: boolean;
  blinkTimer: number;
  squishX: number;
  squishY: number;
}

export interface Bubble {
  id: number;
  x: number;
  y: number;
  r: number;
  vy: number;
  vx: number;
  life: number;
  maxLife: number;
  wobblePhase: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

export interface Firefly {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  hue: number;
  pulseSpeed: number;
}

export interface RoomCoord {
  x: number;
  y: number;
}

export interface PushBlock {
  id: number;
  roomKey: string;
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  grounded: boolean;
}

export type WeatherType = 'CALM' | 'WATER_DROPLETS' | 'GLOWING_DUST' | 'FIREFLY_SWARM';

export interface WeatherParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface Creature {
  id: string;
  name: string;
  englishName: string;
  roomKey: string;
  x: number;
  y: number;
  w: number;
  h: number;
  avatar: string;
  color: string;
  glowColor: string;
  habitat: string;
  lore: string;
  behaviorDesc: string;
}

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'EXPLORATION' | 'TECHNIQUE' | 'PUZZLE' | 'MASTERY';
}

export interface UnlockedAchievement {
  id: string;
  unlockedAt: number;
}

export type TileType = 
  | 0 // Empty air
  | 1 // Solid mossy stone
  | 2 // Bioluminescent vines (decorative/background)
  | 3 // Red switch gate (solid until switch active)
  | 4 // Floor pressure plate / switch
  | 5 // Mystical egg
  | 6 // Water pool surface
  | 7 // Ancient shrine / win altar
  | 8 // Brittle / Destructible cracked wall (脆弱石壁)
  | 9 // Save Telephone Booth / Totem (電話亭記錄點)
  | 10 // Pressure-Sensitive Platform (重力感應石臺：需推動巨石壓制)
  | 11 // Hidden Pathway Stone Barrier (機關石柱：感應平臺受壓時下沉開通)
;

export interface SaveGameData {
  version: number;
  savedAt: number;
  player: {
    x: number;
    y: number;
    facing: number;
  };
  currentRoom: {
    x: number;
    y: number;
  };
  mapData: Record<string, TileType[][]>;
  blocks: PushBlock[];
  switchPressed: boolean;
  pressurePlatformActive: boolean;
  eggsCollected: number;
  discoveredCreatures: string[];
  unlockedAchievements: string[];
  visitedRooms: string[];
  timerSeconds: number;
  isCompleted: boolean;
}

export interface GameStats {
  eggsCollected: number;
  totalEggs: number;
  discoveredCreatures: string[];
  totalCreatures: number;
  unlockedAchievements: string[];
  totalAchievements: number;
  currentWeather: WeatherType;
  switchPressed: boolean;
  pressurePlatformActive: boolean;
  visitedRooms: Set<string>;
  startTime: number;
  elapsedSeconds: number;
  isCompleted: boolean;
  completedTime: number | null;
}
