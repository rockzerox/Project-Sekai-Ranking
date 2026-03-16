const HISEKAI_API_BASE = process.env.HISEKAI_API_BASE || 'https://api.hisekai.org/tw';

export const getPlayerProfile = async (userId: string) => {
  try {
    const response = await fetch(`${HISEKAI_API_BASE}/user/${userId}/profile`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.text();
  } catch (error) {
    console.error(`Error fetching player profile for ${userId}:`, error);
    throw error;
  }
};

export const getSongsData = async () => {
  try {
    const response = await fetch(`${HISEKAI_API_BASE}/song/list`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.text();
  } catch (error) {
    console.error('Error fetching songs data:', error);
    throw error;
  }
};
