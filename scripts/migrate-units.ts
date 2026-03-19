
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

async function run() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ 錯誤：找不到 SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY 環境變數。');
    process.exit(1);
  }

  console.log('正在嘗試連線至 Supabase...');
  const sb = createClient(supabaseUrl, supabaseServiceKey);

  const UNITS = [
    { id: 0, name: 'Virtual Singer',         color: '#33CCBB', abbr: 'VS',  url_key: 'VS'  },
    { id: 1, name: 'Leo/need',               color: '#4455DD', abbr: 'LN',  url_key: 'LN'  },
    { id: 2, name: 'MORE MORE JUMP!',         color: '#88DD44', abbr: 'MMJ', url_key: 'MMJ' },
    { id: 3, name: 'Vivid BAD SQUAD',         color: '#EE1166', abbr: 'VBS', url_key: 'VBS' },
    { id: 4, name: 'Wonderlands × Showtime', color: '#FF9900', abbr: 'WS',  url_key: 'WS'  },
    { id: 5, name: '25點，Nightcord見。',     color: '#884499', abbr: '25',  url_key: '25'  },
  ];

  try {
    console.log('正在執行 Upsert 操作...');
    const { data, error } = await sb.from('units').upsert(UNITS, { onConflict: 'id' });
    
    if (error) {
      console.error('❌ Supabase 錯誤：', error.message);
      if (error.message.includes('relation "public.units" does not exist')) {
        console.error('💡 提示：請先在 Supabase SQL Editor 執行建表 SQL。');
      }
      process.exit(1);
    }

    console.log('✅ units 遷移完成！');
    console.log('資料：', data);
  } catch (err) {
    console.error('❌ 執行過程中發生非預期錯誤：', err);
    process.exit(1);
  }
}

run();
