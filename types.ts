
// The internal representation used by components, which we will map the API response to.
export interface User {
  id: string;
  username: string;
  display_name: string;
  avatar: string;
  supporter_tier: number;
}

interface StatDetail {
  count: number;
  speed: number;
  average: number;
}

export interface RankEntry {
  rank: number;
  score: number;
  user: User;
  lastPlayedAt: string;
  stats: {
    last1h: StatDetail;
    last3h: StatDetail;
    last24h: StatDetail;
  };
}

export type SortOption =
  | 'score'
  | 'lastPlayedAt'
  | 'last1h_count'
  | 'last1h_speed'
  | 'last1h_average'
  | 'last3h_count'
  | 'last3h_speed'
  | 'last3h_average'
  | 'last24h_count'
  | 'last24h_speed'
  | 'last24h_average';

export type ChartType = 'bar' | 'line';


// --- New types for the actual API response from api.hisekai.org ---

interface LastPlayerCard {
  id: number;
}

interface LastPlayerProfile {
  id: number | string;
}

interface LastPlayerInfo {
  card: LastPlayerCard;
  profile: LastPlayerProfile;
}

interface Stats {
  count: number;
  speed: number;
  average: number;
}

// Represents an entry in the top_100_player_rankings array
export interface HisekaiRankEntry {
  rank: number;
  name: string;
  score: number;
  last_played_at: string;
  last_1h_stats: Stats;
  last_3h_stats: Stats;
  last_24h_stats: Stats;
  last_player_info: LastPlayerInfo;
}

// Represents the root of the API response
export interface HisekaiApiResponse {
  id: number;
  name: string;
  start_at: string;
  closed_at: string;
  top_100_player_rankings: HisekaiRankEntry[];
}

export interface MusicDifficultyStats {
  musicDifficultyType: 'easy' | 'normal' | 'hard' | 'expert' | 'master' | 'append';
  liveClear: number;
  fullCombo: number;
  allPerfect: number;
}

// Represents the user profile response
export interface UserProfileResponse {
  user: {
    rank: number;
    userId: number | string; // Updated to allow string for BigInt handling
    name: string;
  };
  totalPower: {
    totalPower: number;
  };
  userMusicDifficultyClearCount: MusicDifficultyStats[];
}

// Represents a past event summary
export interface EventSummary {
  id: number;
  name: string;
  start_at: string;
  closed_at: string;
  aggregate_at: string;
  ranking_announce_at: string;
}

// --- Past Event Detail Types ---

export interface PastEventUserCard {
  cardId: number;
  defaultImage: string;
  level: number;
  masterRank: number;
  specialTrainingStatus: string;
}

export interface WorldBloomChapterRankingEntry {
    rank: number;
    score: number;
    name: string;
    userId: number | string;
}

export interface WorldBloomChapter {
    eventId: number;
    gameCharacterId: number;
    rankings: WorldBloomChapterRankingEntry[];
}

export interface PastEventRankEntry {
  rank: number;
  name: string;
  score: number;
  userId: number | string; // Will be string after sanitation
  userCard: PastEventUserCard;
}

export interface PastEventApiResponse {
  isEventAggregate: boolean;
  rankings: PastEventRankEntry[];
  userWorldBloomChapterRankings?: WorldBloomChapter[]; // For World Link events (Top 100)
}

// For World Link Border structure
export interface WorldBloomChapterBorder {
    eventId: number;
    gameCharacterId: number;
    borderRankings: PastEventRankEntry[]; // Key is borderRankings here
    isWorldBloomChapterAggregate: boolean;
}

export interface PastEventBorderApiResponse {
  borderRankings: PastEventRankEntry[]; // Standard events
  userWorldBloomChapterRankings?: WorldBloomChapter[]; // Legacy/Alternate check
  userWorldBloomChapterRankingBorders?: WorldBloomChapterBorder[]; // Specific field for World Link Borders
}

// --- Border (Highlights) Types ---

export interface BorderPlayerRanking {
  rank: number;
  name: string;
  score: number;
  last_player_info: {
    card: {
      id: number;
      level: number;
      master_rank: number;
      default_image: string;
      special_training_status: string;
    };
    profile: {
      id: number | string; // Handle large int
      word: string;
      twitter_id: string;
      image_type: string;
    }
  }
}

export interface HisekaiBorderApiResponse {
  id: number;
  name: string;
  border_player_rankings: BorderPlayerRanking[];
}
