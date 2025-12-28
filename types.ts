export type SortOption = 
  | 'score' 
  | 'dailyAvg' 
  | 'lastPlayedAt' 
  | 'last1h_count' | 'last1h_score' | 'last1h_speed' | 'last1h_average'
  | 'last3h_count' | 'last3h_score' | 'last3h_speed' | 'last3h_average'
  | 'last24h_count' | 'last24h_score' | 'last24h_speed' | 'last24h_average';

export interface EventSummary {
  id: number;
  name: string;
  start_at: string;
  aggregate_at: string;
  closed_at: string;
  ranking_announce_at: string;
}

export interface StatGroup {
  count: number;
  score: number;
  speed: number;
  average: number;
}

export interface RankEntry {
  rank: number;
  score: number;
  lastPlayedAt: string;
  stats: {
    last1h: StatGroup;
    last3h: StatGroup;
    last24h: StatGroup;
  };
  user: {
    id: string;
    username: string;
    display_name: string;
    avatar: string;
    supporter_tier: number;
  };
}

export interface UserProfileResponse {
  user: {
    userId: string;
    name: string;
    rank: number;
  };
  totalPower: {
    totalPower: number;
    basicCardTotalPower: number;
    areaItemBonus: number;
    characterRankBonus: number;
    honorBonus: number;
    mysekaiFixtureGameCharacterPerformanceBonus: number;
    mysekaiGateLevelBonus: number;
  };
  userCharacters?: {
    characterId: number;
    characterRank: number;
  }[];
  userMusicDifficultyClearCount?: {
    musicDifficultyType: string;
    liveClear: number;
    fullCombo: number;
    allPerfect: number;
  }[];
}

export interface HisekaiApiResponse {
  id: number;
  name: string;
  start_at: string;
  aggregate_at: string;
  ranking_announce_at: string;
  top_100_player_rankings: any[];
}

export interface HisekaiBorderApiResponse {
  border_player_rankings: any[];
}

export interface PastEventApiResponse {
  id: number;
  name: string;
  start_at: string;
  aggregate_at: string;
  rankings: any[];
  userWorldBloomChapterRankings?: WorldBloomChapter[];
}

export interface PastEventBorderApiResponse {
  borderRankings: any[];
  userWorldBloomChapterRankingBorders?: WorldBloomChapterBorder[];
}

export interface WorldBloomChapter {
  gameCharacterId: number;
  rankings: any[];
}

export interface WorldBloomChapterBorder {
  gameCharacterId: number;
  borderRankings: any[];
}

// --- Config Types ---
export interface EventDetail {
    unit: string;
    type: 'marathon' | 'cheerful_carnival' | 'world_link';
    banner: string;
    storyType: 'unit_event' | 'mixed_event' | 'world_link';
    cardType: 'permanent' | 'limited' | 'special_limited';
    "4starcard"?: string;
}

export interface WorldLinkInfo {
    round: number;
    chorder: string[];
    chDavg: number;
    isfinal: boolean;
}

// --- Analysis Types ---
/**
 * Fix: Added SimpleRankData interface for event comparison.
 */
export interface SimpleRankData {
  rank: number;
  score: number;
}

/**
 * Fix: Added ComparisonResult interface for event comparison.
 */
export interface ComparisonResult {
  event1: {
    name: string;
    data: SimpleRankData[];
    duration: number;
    id: number;
  } | null;
  event2: {
    name: string;
    data: SimpleRankData[];
    duration: number;
    id: number;
  } | null;
}

/**
 * Fix: Added CalculationResult interface for resource estimation.
 */
export interface CalculationResult {
    refDuration: number;
    targetDuration: number;
    adjustedTargetScore: number;
    estimatedPtPerGame: number;
    gamesNeeded: number;
    totalEnergyNeeded: number;
    naturalRecovery: number;
    finalPotions: number;
    isWarning: boolean;
}