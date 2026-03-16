import type { VercelRequest, VercelResponse } from '@vercel/node';
import { recomputeAllPlayerStats } from '../../lib/statsService';
import { syncEvents } from '../../lib/eventsService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 嚴格安全檢查：必須帶有正確的 CRON_SECRET
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // 步驟零：同步 events 表
    await syncEvents();

    // 步驟一：重新計算玩家統計
    await recomputeAllPlayerStats();
    return res.status(200).json({ message: 'Stats and events updated successfully' });
  } catch (error) {
    console.error('Cron job failed:', error);
    return res.status(500).json({ error: 'Failed to update stats' });
  }
}
