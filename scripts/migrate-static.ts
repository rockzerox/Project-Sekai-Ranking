// scripts/migrate-static.ts
import { sb } from './_client';

const UNITS = [
    { id: 0, name: 'Virtual Singer', color: '#33CCBB', abbr: 'VS', url_key: 'VS' },
    { id: 1, name: 'Leo/need', color: '#4455DD', abbr: 'LN', url_key: 'LN' },
    { id: 2, name: 'MORE MORE JUMP!', color: '#88DD44', abbr: 'MMJ', url_key: 'MMJ' },
    { id: 3, name: 'Vivid BAD SQUAD', color: '#EE1166', abbr: 'VBS', url_key: 'VBS' },
    { id: 4, name: 'Wonderlands × Showtime', color: '#FF9900', abbr: 'WS', url_key: 'WS' },
    { id: 5, name: '25點，Nightcord見。', color: '#884499', abbr: '25', url_key: '25' },
];

const CHARACTERS = [
    { id: 1, name: '星乃一歌', color: '#33AAEE', unit_id: 1 },
    { id: 2, name: '天馬咲希', color: '#FFDD44', unit_id: 1 },
    { id: 3, name: '望月穗波', color: '#EE6666', unit_id: 1 },
    { id: 4, name: '日野森志步', color: '#BBDD22', unit_id: 1 },
    { id: 5, name: '花里實乃理', color: '#FFCCAA', unit_id: 2 },
    { id: 6, name: '桐谷遙', color: '#99CCFF', unit_id: 2 },
    { id: 7, name: '桃井愛莉', color: '#FFAACC', unit_id: 2 },
    { id: 8, name: '日野森雫', color: '#99EEDD', unit_id: 2 },
    { id: 9, name: '小豆澤心羽', color: '#FF6699', unit_id: 3 },
    { id: 10, name: '白石杏', color: '#00BBDD', unit_id: 3 },
    { id: 11, name: '東雲彰人', color: '#FF7722', unit_id: 3 },
    { id: 12, name: '青柳冬彌', color: '#0077DD', unit_id: 3 },
    { id: 13, name: '天馬司', color: '#FFBB00', unit_id: 4 },
    { id: 14, name: '鳳笑夢', color: '#FF66BB', unit_id: 4 },
    { id: 15, name: '草薙寧寧', color: '#33DD99', unit_id: 4 },
    { id: 16, name: '神代類', color: '#BB88EE', unit_id: 4 },
    { id: 17, name: '宵崎奏', color: '#BB6688', unit_id: 5 },
    { id: 18, name: '朝比奈真冬', color: '#8888CC', unit_id: 5 },
    { id: 19, name: '東雲繪名', color: '#CCAA88', unit_id: 5 },
    { id: 20, name: '曉山瑞希', color: '#DDAACC', unit_id: 5 },
    { id: 21, name: '初音未來', color: '#33CCBB', unit_id: 0 },
    { id: 22, name: '鏡音鈴', color: '#FFCC11', unit_id: 0 },
    { id: 23, name: '鏡音連', color: '#FFEE11', unit_id: 0 },
    { id: 24, name: '巡音流歌', color: '#FFBBCC', unit_id: 0 },
    { id: 25, name: 'MEIKO', color: '#DD4444', unit_id: 0 },
    { id: 26, name: 'KAITO', color: '#3366CC', unit_id: 0 },
];

async function run() {
    const { error: e1 } = await sb.from('units').upsert(UNITS, { onConflict: 'id' });
    if (e1) throw e1;
    console.log('✅ units done');

    const { error: e2 } = await sb.from('characters').upsert(CHARACTERS, { onConflict: 'id' });
    if (e2) throw e2;
    console.log('✅ characters done');
}

run().catch(console.error);
