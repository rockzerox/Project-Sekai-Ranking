import { RankingEntry } from '../types';

export const transformUserCardToPlayerInfo = (entry: RankingEntry) => {
  const userCard = entry.userCard;
  
  // If userCard is missing or empty, return undefined or a minimal structure
  if (!userCard || !Array.isArray(userCard) || userCard.length === 0) {
    return undefined;
  }

  // Map array indices to object properties based on user observation
  // [0]: cardId
  // [1]: level
  // [8]: special_training_status
  // [9]: default_image (image_type)
  
  return {
    card: {
      id: Number(userCard[0]),
      level: Number(userCard[1] || 0),
      master_rank: 0, // Not strictly provided in the snippet, defaulting to 0
      default_image: String(userCard[9] || 'original'),
      special_training_status: String(userCard[8] || ''),
    },
    profile: {
      id: Number(entry.userId),
      word: entry.userProfile?.word || '',
      twitter_id: entry.userProfile?.twitterId || '',
      image_type: entry.userProfile?.profileImageType || 'leader',
    }
  };
};
