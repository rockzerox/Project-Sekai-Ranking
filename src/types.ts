export type SortOption = 
  | 'score' 
  | 'dailyAvg' 
  | 'lastPlayedAt' 
  | 'captain'
  | 'last1h_count' | 'last1h_score' | 'last1h_speed' | 'last1h_average'
  | 'last3h_count' | 'last3h_score' | 'last3h_speed' | 'last3h_average'
  | 'last24h_count' | 'last24h_score' | 'last24h_speed' | 'last24h_average';

export interface EventSummary {
  id: number;
  name: string;
  unit_id?: number | null;
  start_at: string;
  aggregate_at: string;
  closed_at: string;
  ranking_announce_at: string;
  banner?: number | null;
  event_type?: string | null;
  story_type?: string | null;
  four_star_cards?: (number|string)[] | null;
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
  last_player_info?: {
    card?: {
      id: number;
      level: number;
      master_rank: number;
      default_image: string;
      special_training_status: string;
    };
    profile?: {
      id: number;
      word: string;
      twitter_id: string;
      image_type: string;
    };
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
  userChallengeLiveSoloStages?: {
    characterId: number;
    challengeLiveStageId: number;
    rank: number;
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
  top_100_player_rankings: RankingEntry[];
  userWorldBloomChapterRankings?: WorldBloomChapter[];
}

export interface HisekaiBorderApiResponse {
  border_player_rankings: RankingEntry[];
  userWorldBloomChapterRankingBorders?: WorldBloomChapterBorder[];
}

export interface RankingEntry {
  isOwn: boolean;
  name: string;
  rank: number;
  score: number;
  userCard: (number | string | null)[];
  userCheerfulCarnival: unknown;
  userHonorMissions: unknown[];
  userId: number;
  userPlayerFrames: unknown[];
  userProfile: {
    profileImageType: string;
    twitterId: string;
    userId: number;
    word: string;
  };
  userProfileHonors: unknown[];
}

export interface PastEventApiResponse {
  id: number;
  name: string;
  start_at: string;
  aggregate_at: string;
  top_100_player_rankings: RankingEntry[];
  rankings?: RankingEntry[];
  userWorldBloomChapterRankings?: WorldBloomChapter[];
}

export interface PastEventBorderApiResponse {
  border_player_rankings: RankingEntry[];
  userWorldBloomChapterRankingBorders?: WorldBloomChapterBorder[];
}

export interface WorldBloomChapter {
  gameCharacterId: number;
  rankings: RankingEntry[];
}

export interface WorldBloomChapterBorder {
  gameCharacterId: number;
  borderRankings: RankingEntry[];
}

/** Hisekai API 新格式：Live WL 章節 (world_link_top_100_rankings / world_link_border_rankings) */
export interface WorldLinkChapterLive {
  id: number;          // e.g. 16301 (event 163, chapter 01)
  event: number;       // e.g. 163
  character: number;   // e.g. 12 (青柳冬彌)
  start_at: string;    // ISO8601
  closed_at: string;   // ISO8601
  aggregate_at: string;// ISO8601
  player_rankings?: RankingEntry[];  // T100 用
  player_borders?: RankingEntry[];   // Border 用
}

export interface UnifiedRankingsResponse {
  id: number;
  name?: string;
  aggregate_at?: string;
  rankings: RankingEntry[];
  borders?: RankingEntry[];
  chapters?: WorldBloomChapter[];
  userWorldBloomChapterRankings?: WorldBloomChapter[];
  userWorldBloomChapterRankingBorders?: WorldBloomChapterBorder[];
}

export type ViewType = 'home' | 'live' | 'past' | 'distribution' | 'comparison' | 'analysis' | 'trend' | 'worldLink' | 'unitAnalysis' | 'characterAnalysis' | 'playerAnalysis' | 'playerStructure' | 'resourceEstimator' | 'playerProfile' | 'mySekaiMining' | 'eventSongs';
export interface EventDetail {
    unit: string;
    type: 'marathon' | 'cheerful_carnival' | 'world_link';
    banner: string;
    storyType: 'unit_event' | 'mixed_event' | 'world_link';
    cardType: 'permanent' | 'limited' | 'special_limited';
    "4starcard"?: string;
    tag?: string;
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
    color?: string;
  } | null;
  event2: {
    name: string;
    data: SimpleRankData[];
    duration: number;
    id: number;
    color?: string;
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
export interface CharInfo {
    id: string;
    name: string;
    color: string;
    unit: string;
}

export interface UnitInfo {
    name: string;
    color: string;
    abbr: string;
    style: string;
    urlKey: string; 
}

export interface CardData {
  characterId: number;
  cardRarityType: string;
  attr: string;
  assetbundleName: string;
}

export interface CardsMap {
  [key: string]: CardData;
}

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  note: string | null;
}
