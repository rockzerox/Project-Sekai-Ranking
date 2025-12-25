import { createClient } from '@vercel/edge-config';
import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Edge Config Key 淨化對照表 (與聚合器同步)
 */
const UNIT_KEY_MAP: Record<string, string> = {
  "Leo/need": "leo_need",
  "MORE MORE JUMP!": "more_more_jump",
  "Vivid BAD SQUAD": "vivid_bad_squad",
  "Wonderlands × Showtime": "wonderlands_showtime",
  "25點，Nightcord見。": "25ji",
  "Virtual Singer": "virtual_singer",
  "Mix": "mix"
};

/**
 * 取得符合 Vercel 規範的安全 Key
 */
function getSafeUnitKey(unitName: string): string {
  return UNIT_KEY_MAP[unitName] || unitName.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
}

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
      // 讀取時同樣進行 Key 淨化映射
      const safeId = getSafeUnitKey(id as string);
      key = `structure_unit_${safeId}`;
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