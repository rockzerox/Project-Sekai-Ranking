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

/**
 * 計算單條 U(K) 曲線
 * @param eventIds 需要計算的活動 ID 列表
 * @param scoreMap 原始分數數據映射
 */
function calculateUKCurve(eventIds: string[], scoreMap: Record<string, EventScore>) {
  const N = eventIds.length;
  if (N === 0) return null;

  // 建立 100 個 Set，分別存放前 K 名內出現過的所有玩家 ID
  const sets: Set<string>[] = Array.from({ length: 100 }, () => new Set());

  for (const id of eventIds) {
    const event = scoreMap[id];
    if (!event || !event.data) continue;

    for (const entry of event.data) {
      const r = entry.rank;
      if (r >= 1 && r <= 100) {
        // 玩家出現在名次 r，代表他在所有 k >= r 的 Set 中都屬於「出現過的人」
        for (let k = r; k <= 100; k++) {
          sets[k - 1].add(entry.userId);
        }
      }
    }
  }

  // 轉換為數據點 [{k, u}]
  return sets.map((s, index) => {
    const k = index + 1;
    const uniqueCount = s.size;
    const totalSlots = N * k;
    const u = (uniqueCount / totalSlots) * 100;
    return { k, u: parseFloat(u.toFixed(2)) };
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 安全檢查：驗證是否有 Vercel Token 與 Edge Config
  const VERCEL_TOKEN = process.env.VERCEL_API_TOKEN;
  const CONFIG_ID = process.env.EDGE_CONFIG_ID_CUSTOM;

  if (!VERCEL_TOKEN || !CONFIG_ID) {
    return res.status(500).json({ error: 'Missing Vercel credentials in environment variables.' });
  }

  try {
    // 1. 讀取數據源 (Blob) - 使用標準 fetch 直接讀取公開連結
    const blobUrl = 'https://kilyz3e8atuyf098.public.blob.vercel-storage.com/event_score/event_score.json';
    const scoreRes = await fetch(blobUrl);
    if (!scoreRes.ok) throw new Error('Failed to fetch event_score.json from Blob.');
    const scoreMap: Record<string, EventScore> = await scoreRes.json();

    // 2. 讀取活動詳細設定
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['host'];
    const detailRes = await fetch(`${protocol}://${host}/eventDetail.json`);
    const eventDetails: Record<string, EventDetail> = await detailRes.json();

    // 3. 分組索引
    const groups = {
      global: [] as string[],
      units: {} as Record<string, string[]>,
      chars: {} as Record<string, string[]>
    };

    Object.entries(eventDetails).forEach(([id, detail]) => {
      // 排除 World Link
      if (detail.storyType === 'world_link') return;
      if (!scoreMap[id]) return;

      // Global
      groups.global.push(id);

      // Units
      if (!groups.units[detail.unit]) groups.units[detail.unit] = [];
      groups.units[detail.unit].push(id);

      // Characters (1-20, 箱活 only)
      if (detail.storyType === 'unit_event') {
        const charId = detail.banner;
        const charIdNum = parseInt(charId);
        if (charIdNum >= 1 && charIdNum <= 20) {
          if (!groups.chars[charId]) groups.chars[charId] = [];
          groups.chars[charId].push(id);
        }
      }
    });

    // 4. 循環計算所有曲線
    const cachePayload: any[] = [];
    const updatedAt = new Date().toISOString();

    // A. Global
    const globalData = calculateUKCurve(groups.global, scoreMap);
    if (globalData) {
      cachePayload.push({
        operation: 'upsert',
        key: 'structure_global',
        value: { name: '整體遊戲', eventCount: groups.global.length, data: globalData, updatedAt }
      });
    }

    // B. Units
    for (const [unitName, ids] of Object.entries(groups.units)) {
      const data = calculateUKCurve(ids, scoreMap);
      if (data) {
        cachePayload.push({
          operation: 'upsert',
          key: `structure_unit_${unitName}`,
          value: { name: unitName, eventCount: ids.length, data, updatedAt }
        });
      }
    }

    // C. Characters
    for (const [charId, ids] of Object.entries(groups.chars)) {
      const data = calculateUKCurve(ids, scoreMap);
      if (data) {
        cachePayload.push({
          operation: 'upsert',
          key: `structure_char_${charId}`,
          value: { charId, eventCount: ids.length, data, updatedAt }
        });
      }
    }

    // 5. 批量更新 Edge Config (使用 Vercel REST API)
    const edgeConfigUpdateRes = await fetch(
      `https://api.vercel.com/v1/edge-config/${CONFIG_ID}/items`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${VERCEL_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: cachePayload }),
      }
    );

    if (!edgeConfigUpdateRes.ok) {
      const errText = await edgeConfigUpdateRes.text();
      throw new Error(`Edge Config Update Failed: ${errText}`);
    }

    res.status(200).json({
      success: true,
      message: 'Ranking structure synchronized successfully.',
      curvesGenerated: cachePayload.length,
      updatedAt
    });

  } catch (error: any) {
    console.error('Aggregator Error:', error);
    res.status(500).json({ error: error.message });
  }
}