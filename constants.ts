
export const WORLD_LINK_ROUND_1_IDS = [112, 118, 124, 130, 137, 140];
export const WORLD_LINK_ROUND_2_IDS = [163, 167, 170, 171, 176, 179];
export const WORLD_LINK_IDS = [...WORLD_LINK_ROUND_1_IDS, ...WORLD_LINK_ROUND_2_IDS];

// --- API Base URL Configuration ---
// 暫時恢復直連模式，保留 Proxy 檔案以備未來加上 User-Agent 需求時使用
export const API_BASE_URL = 'https://api.hisekai.org';

// --- 1. Unified Unit Configuration ---

interface UnitConfig {
    color: string;
    style: string;
    filename: string;
    abbr: string;
}

export const UNITS: Record<string, UnitConfig> = {
    "Leo/need": {
        color: "#4455DD",
        style: "bg-[#4455DD] text-white border-transparent",
        filename: "LN_logo",
        abbr: "L/n"
    },
    "MORE MORE JUMP!": {
        color: "#88DD44",
        style: "bg-[#88DD44] text-white border-transparent",
        filename: "MMJ_logo",
        abbr: "MMJ"
    },
    "Vivid BAD SQUAD": {
        color: "#EE1166",
        style: "bg-[#EE1166] text-white border-transparent",
        filename: "VBS_logo",
        abbr: "VBS"
    },
    "Wonderlands × Showtime": {
        color: "#FF9900",
        style: "bg-[#FF9900] text-white border-transparent",
        filename: "WS_logo",
        abbr: "WxS"
    },
    "25點，Nightcord見。": {
        color: "#884499",
        style: "bg-[#884499] text-white border-transparent",
        filename: "25_logo",
        abbr: "25時"
    },
    "Virtual Singer": {
        color: "#33CCBB", // Updated to Miku Teal for better visibility, was Grey
        style: "bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-600 dark:border-slate-300",
        filename: "VS_logo",
        abbr: "VS"
    },
    "Mix": {
        color: "#64748B",
        style: "bg-slate-500 text-white border-transparent",
        filename: "", 
        abbr: "Mix"
    }
};

export const UNIT_ORDER = [
    "Virtual Singer",
    "Leo/need",
    "MORE MORE JUMP!",
    "Vivid BAD SQUAD",
    "Wonderlands × Showtime",
    "25點，Nightcord見。",
    "Mix"
];

// --- 2. Unified Character Configuration ---

interface CharacterConfig {
    color: string;
    filename: string;
}

export const CHARACTERS: Record<string, CharacterConfig> = {
    "朝比奈真冬": { color: "#8888CC", filename: "Mafuyu" },
    "曉山瑞希":   { color: "#DDAACC", filename: "Mizuki" },
    "東雲繪名":   { color: "#CCAA88", filename: "Ena" },
    "宵崎奏":     { color: "#BB6688", filename: "Kanade" },
    "東雲彰人":   { color: "#FF7722", filename: "Akito" },
    "青柳冬彌":   { color: "#0077DD", filename: "Toya" },
    "白石杏":     { color: "#00BBDD", filename: "An" },
    "小豆澤心羽": { color: "#FF6699", filename: "Kohane" },
    "神代類":     { color: "#BB88EE", filename: "Rui" },
    "草薙寧寧":   { color: "#33DD99", filename: "Nene" },
    "鳳笑夢":     { color: "#FF66BB", filename: "Emu" },
    "天馬司":     { color: "#FFBB00", filename: "Tsukasa" },
    "桃井愛莉":   { color: "#FFAACC", filename: "Airi" },
    "桐谷遙":     { color: "#99CCFF", filename: "Haruka" },
    "日野森雫":   { color: "#99EEDD", filename: "Shizuku" },
    "花里實乃理": { color: "#FFCCAA", filename: "Minori" },
    "天馬咲希":   { color: "#FFDD44", filename: "Saki" },
    "望月穗波":   { color: "#EE6666", filename: "Honami" },
    "日野森志步": { color: "#BBDD22", filename: "Shiho" },
    "星乃一歌":   { color: "#33AAEE", filename: "Ichika" },
    "巡音流歌":   { color: "#FFBBCC", filename: "Luka" },
    "鏡音鈴":     { color: "#FFCC11", filename: "Rin" },
    "MEIKO":      { color: "#DD4444", filename: "Meiko" },
    "鏡音連":     { color: "#FFEE11", filename: "Len" },
    "KAITO":      { color: "#3366CC", filename: "Kaito" },
    "初音未來":   { color: "#33CCBB", filename: "Miku" }
};

export const BANNER_ORDER = [
    "星乃一歌", "天馬咲希", "望月穗波", "日野森志步",
    "花里實乃理", "桐谷遙", "桃井愛莉", "日野森雫",
    "小豆澤心羽", "白石杏", "東雲彰人", "青柳冬彌",
    "天馬司", "鳳笑夢", "草薙寧寧", "神代類",
    "宵崎奏", "朝比奈真冬", "東雲繪名", "曉山瑞希",
    "初音未來"
];

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

// New Image Constants
const BASE_IMAGE_URL = "https://raw.githubusercontent.com/rockzerox/Storage/refs/heads/main/Project-Sekai-Ranking";

export const getAssetUrl = (name: string | undefined, type: 'character' | 'unit' | 'event'): string | undefined => {
    if (!name) return undefined;

    if (type === 'event') {
        return `${BASE_IMAGE_URL}/event_logo/${name}.png`;
    }

    if (type === 'character') {
        const filename = CHARACTERS[name]?.filename;
        if (!filename) return undefined;
        return `${BASE_IMAGE_URL}/Chibi/${filename}.png`;
    } else if (type === 'unit') {
        const filename = UNITS[name]?.filename;
        if (!filename) return undefined;
        return `${BASE_IMAGE_URL}/logo/${filename}.png`;
    }

    return undefined;
};

export const calculateDisplayDuration = (startAt: string, aggregateAt: string): number => {
    try {
        const start = new Date(startAt).getTime();
        const end = new Date(aggregateAt).getTime();
        const diffTime = Math.abs(end - start);
        return Math.round(diffTime / (1000 * 60 * 60 * 24)); 
    } catch (e) {
        return 0;
    }
};

export const calculatePreciseDuration = (startAt: string, aggregateAt: string): number => {
    try {
        const start = new Date(startAt).getTime();
        const end = new Date(aggregateAt).getTime();
        const diffTime = Math.abs(end - start);
        return diffTime / (1000 * 60 * 60 * 24);
    } catch (e) {
        return 0;
    }
};

export const getEventStatus = (
    startAt: string, 
    aggregateAt: string, 
    closedAt: string, 
    rankingAnnounceAt: string
): 'active' | 'calculating' | 'ended' | 'future' | 'past' => {
    const now = new Date().getTime();
    const start = new Date(startAt).getTime();
    const aggregate = new Date(aggregateAt).getTime();
    const announce = new Date(rankingAnnounceAt).getTime();
    const closed = new Date(closedAt).getTime();

    if (now < start) return 'future';
    if (now >= start && now < aggregate) return 'active';
    if (now >= aggregate && now < announce) return 'calculating';
    if (now >= closed) return 'past'; 
    return 'ended'; // Between announce and closed
};
