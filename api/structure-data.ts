
import { createClient } from '@vercel/edge-config';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { type, id } = req.query;
  
  // 檢查環境變數
  const connectionString = process.env.EDGE_CONFIG;
  if (!connectionString) {
    return res.status(500).json({ error: 'Edge Config connection string not configured.' });
  }

  try {
    const edgeConfig = createClient(connectionString);
    let key = 'structure_global';

    if (type === 'unit' && id) {
      key = `structure_unit_${id}`;
    } else if (type === 'char' && id) {
      key = `structure_char_${id}`;
    }

    const data = await edgeConfig.get(key);

    if (!data) {
      return res.status(404).json({ error: 'Data not found for the requested criteria.' });
    }

    // 設定快取以優化讀取效能
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Edge Config Read Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
