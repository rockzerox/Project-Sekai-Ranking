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

async function syncEventMetadata() {
  console.log('⏳ 開始同步活動元數據 (JSON -> Supabase)...');
  
  // 篩選 ID >= 165 的活動
  const targetIds = Object.keys(eventDetails)
    .map(Number)
    .filter(id => id >= 165)
    .sort((a, b) => a - b);

  console.log(`查找到 ${targetIds.length} 個待同步活動 (ID >= 165)`);

  for (const id of targetIds) {
    const detail = eventDetails[String(id)];
    
    // 映射欄位
    const updateData = {
      unit_id: detail.unit ? parseInt(detail.unit) : null,
      event_type: detail.type || null,
      story_type: detail.storyType || null,
      card_type: detail.cardType || null,
      banner: detail.banner || null,
      tag: detail.tag || null
    };

    const { error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error(`❌ 活動 ${id} 更新失敗:`, error.message);
    } else {
      console.log(`✅ 活動 ${id} 元數據更新成功`);
    }
  }

  console.log('✨ 同步完成！');
}

syncEventMetadata().catch(err => {
  console.error('💥 發生致命錯誤:', err);
  process.exit(1);
});
