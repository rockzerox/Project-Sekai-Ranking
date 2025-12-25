import type { VercelRequest, VercelResponse } from '@vercel/node';

// 定義數據結構
interface RankingEntry {
  rank: number;
  userId: string;
}

interface EventScore {
  eventId: string;
  data: RankingEntry[];
}

interface EventDetail {
  unit: string;
  storyType: string;
  banner: string;
}

const UNIT_KEY_MAP: Record<string, string> = {
  "Leo/need": "leo_need",
  "MORE MORE JUMP!": "more_more_jump",
  "Vivid BAD SQUAD": "vivid_bad_squad",
  "Wonderlands × Showtime": "wonderlands_showtime",
  "25點，Nightcord見。": "25ji"
};

function getSafeUnitKey(unitName: string): string | null {
  return UNIT_KEY_MAP[unitName] || null;
}

function calculateUKCurve(eventIds: string[], scoreMap: Record<string, EventScore>): number[] | null {
  const N = eventIds.length;
  if (N === 0) return null;

  const sets: Set<string>[] = Array.from({ length: 100 }, () => new Set());

  for (const id of eventIds) {
    const event = scoreMap[id];
    if (!event || !event.data) continue;

    for (const entry of event.data) {
      const r = entry.rank;
      if (r >= 1 && r <= 100) {
        for (let k = r; k <= 100; k++) {
          sets[k - 1].add(entry.userId);
        }
      }
    }
  }

  return sets.map((s, index) => {
    const k = index + 1;
    const u = (s.size / (N * k)) * 100;
    return parseFloat(u.toFixed(2));
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const VERCEL_TOKEN = process.env.VERCEL_API_TOKEN;
  const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
  const EDGE_CONFIG_STORE_ID = 'ecfg_z4ancf0ixtfwwjnv2anmwd136h0x';

  if (!VERCEL_TOKEN || !EDGE_CONFIG_STORE_ID) {
    return res.status(500).json({ error: 'Missing Vercel credentials.' });
  }

  try {
    const blobUrl = 'https://kilyz3e8atuyf098.public.blob.vercel-storage.com/event_score/event_score.json';
    const scoreRes = await fetch(blobUrl);
    if (!scoreRes.ok) throw new Error('Data source unavailable.');
    
    const scoreText = await scoreRes.text();
    if (!scoreText) throw new Error('Data source is empty.');
    const scoreMap: Record<string, EventScore> = JSON.parse(scoreText);
    const sourceEventCount = Object.keys(scoreMap).length;

    // 檢查現有緩存狀態
    const currentConfigRes = await fetch(
      `https://api.vercel.com/v1/edge-config/${EDGE_CONFIG_STORE_ID}/item/structure_global`,
      { headers: { 'Authorization': `Bearer ${VERCEL_TOKEN}` } }
    );
    
    if (currentConfigRes.ok) {
        const configText = await currentConfigRes.text();
        if (configText) {
            const currentGlobal: any = JSON.parse(configText);
            if (currentGlobal && currentGlobal.eventCount === sourceEventCount) {
                return res.status(200).json({ success: true, message: 'Up to date.' });
            }
        }
    }

    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['host'];
    const detailRes = await fetch(`${protocol}://${host}/eventDetail.json`);
    const eventDetails: Record<string, EventDetail> = await detailRes.json();

    const groups = {
      global: [] as string[],
      units: {} as Record<string, string[]>,
      chars: {} as Record<string, string[]>
    };

    Object.entries(eventDetails).forEach(([id, detail]) => {
      if (detail.storyType === 'world_link' || !scoreMap[id]) return;

      // Global 現在包含所有非 WL 活動
      groups.global.push(id);

      // 單位分組 (排除 VS 與 Mix)
      if (detail.unit !== "Virtual Singer" && detail.unit !== "Mix") {
        if (!groups.units[detail.unit]) groups.units[detail.unit] = [];
        groups.units[detail.unit].push(id);
      }

      // 角色分組
      if (detail.storyType === 'unit_event') {
        const charId = detail.banner;
        if (parseInt(charId) >= 1 && parseInt(charId) <= 20) {
          if (!groups.chars[charId]) groups.chars[charId] = [];
          groups.chars[charId].push(id);
        }
      }
    });

    const updatedAt = new Date().toISOString();
    const edgeConfigItems: any[] = [];
    const charDataStore: Record<string, any> = {};

    const globalData = calculateUKCurve(groups.global, scoreMap);
    if (globalData) {
      edgeConfigItems.push({
        operation: 'upsert', key: 'structure_global',
        value: { name: '整體遊戲', eventCount: groups.global.length, data: globalData, updatedAt }
      });
    }

    for (const [unitName, ids] of Object.entries(groups.units)) {
      const safeKey = getSafeUnitKey(unitName);
      if (!safeKey) continue;
      const data = calculateUKCurve(ids, scoreMap);
      if (data) {
        edgeConfigItems.push({
          operation: 'upsert', key: `structure_unit_${safeKey}`,
          value: { name: unitName, eventCount: ids.length, data, updatedAt }
        });
      }
    }

    for (const [charId, ids] of Object.entries(groups.chars)) {
      const data = calculateUKCurve(ids, scoreMap);
      if (data) {
        charDataStore[charId] = { charId, eventCount: ids.length, data, updatedAt };
      }
    }

    // 執行寫入 1: Blob 並獲取連結
    let blobPublicUrl = '';
    if (BLOB_TOKEN && Object.keys(charDataStore).length > 0) {
      const blobUploadRes = await fetch(`https://api.vercel.com/v1/blob/structure_chars.json`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${BLOB_TOKEN}`, 'x-api-version': '6' },
        body: JSON.stringify(charDataStore)
      });
      const blobResult = await blobUploadRes.json();
      blobPublicUrl = blobResult.url; // 擷取隨機生成的 URL
    }

    // 執行寫入 2: Edge Config (包含最新的 Blob URL 指針)
    if (blobPublicUrl) {
      edgeConfigItems.push({
        operation: 'upsert', key: 'structure_char_url',
        value: blobPublicUrl
      });
    }

    await fetch(`https://api.vercel.com/v1/edge-config/${EDGE_CONFIG_STORE_ID}/items`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${VERCEL_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: edgeConfigItems }),
    });

    res.status(200).json({ success: true, updatedAt });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}