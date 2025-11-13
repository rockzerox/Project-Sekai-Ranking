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
  id: number;
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