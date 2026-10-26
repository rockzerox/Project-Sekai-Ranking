import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ 缺少 SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const eventDetailPath = path.resolve(__dirname, '../../src/data/eventDetail.json');
const eventDetails = JSON.parse(fs.readFileSync(eventDetailPath, 'utf8'));

export const parseUnitId = (rawUnit: any, fallback: number | null = null): number | null => {
  if (rawUnit !== undefined && rawUnit !== null && rawUnit !== '-' && rawUnit !== '') {
    const num = Number(rawUnit);
    return isNaN(num) ? fallback : num;
  }
  return fallback;
};

export const parseFourStarCards = (rawCards: any, fallback: string[] | null = null): string[] | null => {
  if (typeof rawCards === 'string' && rawCards.trim() !== '' && rawCards !== '-') {
    return rawCards.split(',').map((s: string) => s.trim()).filter(Boolean);
  }
  if (rawCards === '-') return null;
  return fallback;
};

export const parseBanner = (rawBanner: any, fallback: string | null = null): string | null => {
  if (rawBanner !== undefined && rawBanner !== null && rawBanner !== '') {
    return String(rawBanner);
  }
  return fallback;
};

async function syncEventMetadata() {
  console.log('⏳ 開始同步活動元數據 (eventDetail.json -> Supabase events 表)...');
  
  // 處理所有在 eventDetail.json 中定義的活動
  const targetIds = Object.keys(eventDetails)
    .map(Number)
    .sort((a, b) => a - b);

  console.log(`查找到 ${targetIds.length} 個待同步活動 (全量活動)`);

  let successCount = 0;
  let failCount = 0;

  // 每次批次處理 10 筆，兼顧並發速度與資料庫連線負載
  const CHUNK_SIZE = 10;
  for (let i = 0; i < targetIds.length; i += CHUNK_SIZE) {
    const chunk = targetIds.slice(i, i + CHUNK_SIZE);
    
    await Promise.all(chunk.map(async (id) => {
      const detail = eventDetails[String(id)];
      
      const updateData = {
        unit_id: parseUnitId(detail.unit, null),
        banner: parseBanner(detail.banner, null),
        four_star_cards: parseFourStarCards(detail['4starcard'], null),
        event_type: detail.type || null,
        story_type: detail.storyType || null,
        card_type: detail.cardType || null,
        tag: detail.tag || null
      };

      const { error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error(`❌ 活動 ${id} 更新失敗:`, error.message);
        failCount++;
      } else {
        successCount++;
      }
    }));

    if ((i + CHUNK_SIZE) % 50 === 0 || i + CHUNK_SIZE >= targetIds.length) {
      console.log(`進度: ${Math.min(i + CHUNK_SIZE, targetIds.length)}/${targetIds.length}`);
    }
  }

  console.log(`\n✨ 同步完成！成功: ${successCount} 筆，失敗: ${failCount} 筆。`);
}

syncEventMetadata().catch(err => {
  console.error('💥 發生致命錯誤:', err);
  process.exit(1);
});
