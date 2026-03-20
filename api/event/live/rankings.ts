import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUnifiedRankings, getLiveRankings, getBorderRankings } from '../../_lib/rankingsService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { type = 'unified' } = req.query;
  
  // 配合 Hisekai 建議：即時活動排名不使用快取以確保精確性 (未來視情況可重新啟用下行)
  // res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  try {
    if (type === 'top100') {
        const data = await getLiveRankings();
        return res.status(200).send(data);
    }
    if (type === 'border') {
        const data = await getBorderRankings("live", true);
        return res.status(200).send(data);
    }
    
    const data = await getUnifiedRankings("live", true);
    return res.status(200).send(data);
  } catch (error) {
    console.error("Failed to fetch live rankings via serverless:", error);
    return res.status(500).json({ error: "Failed to fetch rankings" });
  }
}
