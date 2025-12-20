export const WORLD_LINK_ROUND_1_IDS = [112, 118, 124, 130, 137, 140];
export const WORLD_LINK_ROUND_2_IDS = [163, 167, 170, 171, 176, 179];
export const WORLD_LINK_IDS = [...WORLD_LINK_ROUND_1_IDS, ...WORLD_LINK_ROUND_2_IDS];

export const API_BASE_URL = 'https://api.hisekai.org';

// --- 1. Unified Unit Configuration (ID & Name Map) ---

interface UnitInfo {
    id: string;
    name: string;
    color: string;
    style: string;
    filename: string;
    abbr: string;
}

export const UNIT_MASTER: Record<string, UnitInfo> = {
    "Virtual Singer": {
        id: "0",
        name: "Virtual Singer",
        color: "#33CCBB",
        style: "bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-600 dark:border-slate-300",
        filename: "VS_logo",
        abbr: "VS"
    },
    "Leo/need": {
        id: "1",
        name: "Leo/need",
        color: "#4455DD",
        style: "bg-[#4455DD] text-white border-transparent",
        filename: "LN_logo",
        abbr: "L/n"
    },
    "MORE MORE JUMP!": {
        id: "2",
        name: "MORE MORE JUMP!",
        color: "#88DD44",
        style: "bg-[#88DD44] text-white border-transparent",
        filename: "MMJ_logo",
        abbr: "MMJ"
    },
    "Vivid BAD SQUAD": {
        id: "3",
        name: "Vivid BAD SQUAD",
        color: "#EE1166",
        style: "bg-[#EE1166] text-white border-transparent",
        filename: "VBS_logo",
        abbr: "VBS"
    },
    "Wonderlands × Showtime": {
        id: "4",
        name: "Wonderlands × Showtime",
        color: "#FF9900",
        style: "bg-[#FF9900] text-white border-transparent",
        filename: "WS_logo",
        abbr: "WxS"
    },
    "25點，Nightcord見。": {
        id: "5",
        name: "25點，Nightcord見。",
        color: "#884499",
        style: "bg-[#884499] text-white border-transparent",
        filename: "25_logo",
        abbr: "25時"
    },
    "Mix": {
        id: "99",
        name: "Mix",
        color: "#64748B",
        style: "bg-slate-500 text-white border-transparent",
        filename: "", 
        abbr: "Mix"
    }
};

// Fix: Export UNITS as an alias of UNIT_MASTER for component imports
export const UNITS = UNIT_MASTER;

export const UNIT_ORDER = [
    "Virtual Singer",
    "Leo/need",
    "MORE MORE JUMP!",
    "Vivid BAD SQUAD",
    "Wonderlands × Showtime",
    "25點，Nightcord見。",
    "Mix"
];

// --- 2. Unified Character Configuration (ID-centric) ---

interface CharInfo {
    id: string;
    name: string;
    color: string;
    filename: string;
}

export const CHARACTER_MASTER: Record<string, CharInfo> = {
    "1": { id: "1", name: "星乃一歌", color: "#33AAEE", filename: "Ichika" },
    "2": { id: "2", name: "天馬咲希", color: "#FFDD44", filename: "Saki" },
    "3": { id: "3", name: "望月穗波", color: "#EE6666", filename: "Honami" },
    "4": { id: "4", name: "日野森志步", color: "#BBDD22", filename: "Shiho" },
    "5": { id: "5", name: "花里實乃理", color: "#FFCCAA", filename: "Minori" },
    "6": { id: "6", name: "桐谷遙", color: "#99CCFF", filename: "Haruka" },
    "7": { id: "7", name: "桃井愛莉", color: "#FFAACC", filename: "Airi" },
    "8": { id: "8", name: "日野森雫", color: "#99EEDD", filename: "Shizuku" },
    "9": { id: "9", name: "小豆澤心羽", color: "#FF6699", filename: "Kohane" },
    "10": { id: "10", name: "白石杏", color: "#00BBDD", filename: "An" },
    "11": { id: "11", name: "東雲彰人", color: "#FF7722", filename: "Akito" },
    "12": { id: "12", name: "青柳冬彌", color: "#0077DD", filename: "Toya" },
    "13": { id: "13", name: "天馬司", color: "#FFBB00", filename: "Tsukasa" },
    "14": { id: "14", name: "鳳笑夢", color: "#FF66BB", filename: "Emu" },
    "15": { id: "15", name: "草薙寧寧", color: "#33DD99", filename: "Nene" },
    "16": { id: "16", name: "神代類", color: "#BB88EE", filename: "Rui" },
    "17": { id: "17", name: "宵崎奏", color: "#BB6688", filename: "Kanade" },
    "18": { id: "18", name: "朝比奈真冬", color: "#8888CC", filename: "Mafuyu" },
    "19": { id: "19", name: "東雲繪名", color: "#CCAA88", filename: "Ena" },
    "20": { id: "20", name: "曉山瑞希", color: "#DDAACC", filename: "Mizuki" },
    "21": { id: "21", name: "初音未來", color: "#33CCBB", filename: "Miku" },
    "22": { id: "22", name: "鏡音鈴", color: "#FFCC11", filename: "Rin" },
    "23": { id: "23", name: "鏡音連", color: "#FFEE11", filename: "Len" },
    "24": { id: "24", name: "巡音流歌", color: "#FFBBCC", filename: "Luka" },
    "25": { id: "25", name: "MEIKO", color: "#DD4444", filename: "Meiko" },
    "26": { id: "26", name: "KAITO", color: "#3366CC", filename: "Kaito" }
};

// Fix: Export CHARACTERS as a name-keyed version of CHARACTER_MASTER for component imports
export const CHARACTERS: Record<string, CharInfo> = Object.fromEntries(
    Object.values(CHARACTER_MASTER).map(c => [c.name, c])
);

// 輔助函式：根據 ID 或名稱取得角色資訊
export const getChar = (idOrName: string) => {
    if (CHARACTER_MASTER[idOrName]) return CHARACTER_MASTER[idOrName];
    return Object.values(CHARACTER_MASTER).find(c => c.name === idOrName);
};

// 輔助函式：根據名稱取得團體資訊
export const getUnit = (name: string) => UNIT_MASTER[name];

// --- 3. Step 2: Option Generators for UI Components ---

export const getUnitOptions = (allLabel: string | null = '所有團體 (All Units)') => {
    const options = UNIT_ORDER.map(u => ({ value: u, label: u }));
    return allLabel ? [{ value: 'all', label: allLabel }, ...options] : options;
};

export const getBannerOptions = (allLabel: string | null = '所有 Banner') => {
    const options = Object.values(CHARACTER_MASTER).slice(0, 21).map(char => ({ 
        value: char.id, 
        label: char.name,
        style: { color: char.color }
    }));
    return allLabel ? [{ value: 'all', label: allLabel }, ...options] : options;
};

export const getEventTypeOptions = (allLabel: string | null = '所有類型 (All Types)') => {
    const options = [
        { value: 'marathon', label: '馬拉松' },
        { value: 'cheerful_carnival', label: '歡樂嘉年華' },
        { value: 'world_link', label: 'World Link' }
    ];
    return allLabel ? [{ value: 'all', label: allLabel }, ...options] : options;
};

export const getStoryTypeOptions = (allLabel: string | null = '所有劇情 (All Stories)') => {
    const options = [
        { value: 'unit_event', label: '箱活' },
        { value: 'mixed_event', label: '混活' },
        { value: 'world_link', label: 'World Link' }
    ];
    return allLabel ? [{ value: 'all', label: allLabel }, ...options] : options;
};

export const getCardTypeOptions = (allLabel: string | null = '所有卡面 (All Cards)') => {
    const options = [
        { value: 'permanent', label: '常駐' },
        { value: 'limited', label: '限定' },
        { value: 'special_limited', label: '特殊限定' }
    ];
    return allLabel ? [{ value: 'all', label: allLabel }, ...options] : options;
};

export const BANNER_ORDER = Object.values(CHARACTER_MASTER).slice(0, 21).map(c => c.name);

export const EVENT_CHAPTER_ORDER: Record<number, string[]> = {
    112: ["朝比奈真冬", "曉山瑞希", "東雲繪名", "宵崎奏"],
    118: ["東雲彰人", "青柳冬彌", "白石杏", "小豆澤心羽"],
    124: ["神代類", "草薙寧寧", "鳳笑夢", "天馬司"],
    130: ["桃井愛莉", "桐谷遙", "日野森雫", "花里實乃理"],
    137: ["天馬咲希", "望月穗波", "日野森志步", "星乃一歌"],
    140: ["巡音流歌", "鏡音鈴", "MEIKO", "鏡音連", "KAITO", "初音未來"],
    163: ["青柳冬彌", "東雲彰人", "小豆澤心羽", "白石杏"]
};

export const EVENT_CHAR_MAP: Record<number, Record<number, string>> = {
  112: { 18: '朝比奈真冬', 20: '曉山瑞希', 19: '東雲繪名', 17: '宵崎奏' },
  118: { 11: '東雲彰人', 12: '青柳冬彌', 10: '白石杏', 9: '小豆澤心羽' },
  124: { 16: '神代類', 15: '草薙寧寧', 14: '鳳笑夢', 13: '天馬司' },
  130: { 7: '桃井愛莉', 6: '桐谷遙', 8: '日野森雫', 5: '花里實乃理' },
  137: { 2: '天馬咲希', 3: '望月穗波', 4: '日野森志步', 1: '星乃一歌' },
  140: { 24: '巡音流歌', 22: '鏡音鈴', 25: 'MEIKO', 23: '鏡音連', 26: 'KAITO', 21: '初音未來' },
  163: { 9: '小豆澤心羽', 10: '白石杏', 11: '東雲彰人', 12: '青柳冬彌' }
};

const BASE_IMAGE_URL = "https://raw.githubusercontent.com/rockzerox/Storage/refs/heads/main/Project-Sekai-Ranking";

export const getAssetUrl = (idOrName: string | undefined, type: 'character' | 'unit' | 'event'): string | undefined => {
    if (!idOrName) return undefined;
    if (type === 'event') return `${BASE_IMAGE_URL}/event_logo/${idOrName}.png`;

    if (type === 'character') {
        const char = getChar(idOrName);
        if (!char) return undefined;
        return `${BASE_IMAGE_URL}/Chibi/${char.filename}.png`;
    } else if (type === 'unit') {
        const unit = getUnit(idOrName);
        if (!unit || !unit.filename) return undefined;
        return `${BASE_IMAGE_URL}/logo/${unit.filename}.png`;
    }
    return undefined;
};

export const calculateDisplayDuration = (startAt: string, aggregateAt: string): number => {
    try {
        const start = new Date(startAt).getTime();
        const end = new Date(aggregateAt).getTime();
        return Math.round(Math.abs(end - start) / (1000 * 60 * 60 * 24)); 
    } catch (e) { return 0; }
};

export const calculatePreciseDuration = (startAt: string, aggregateAt: string): number => {
    try {
        const start = new Date(startAt).getTime();
        const end = new Date(aggregateAt).getTime();
        return Math.abs(end - start) / (1000 * 60 * 60 * 24);
    } catch (e) { return 0; }
};

export const getEventStatus = (startAt: string, aggregateAt: string, closedAt: string, rankingAnnounceAt: string): 'active' | 'calculating' | 'ended' | 'future' | 'past' => {
    const now = new Date().getTime();
    const start = new Date(startAt).getTime();
    const aggregate = new Date(aggregateAt).getTime();
    const closed = new Date(closedAt).getTime();
    if (now < start) return 'future';
    if (now >= start && now < aggregate) return 'active';
    if (now >= aggregate && now < closed) return 'calculating';
    if (now >= closed) return 'past'; 
    return 'ended';
};