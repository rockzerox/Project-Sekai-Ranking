
export const WORLD_LINK_ROUND_1_IDS = [112, 118, 124, 130, 137, 140];
export const WORLD_LINK_ROUND_2_IDS = [163, 167, 170, 171, 176, 179];
export const WORLD_LINK_IDS = [...WORLD_LINK_ROUND_1_IDS, ...WORLD_LINK_ROUND_2_IDS];

// --- API Base URL Configuration ---
// 自動偵測環境：
// 1. 如果網址包含 'vercel.app' (正式部署)，使用 Proxy 路徑 '/api/sekairankingtw'
// 2. 否則 (本機開發或預覽環境)，使用直連 'https://api.hisekai.org'
const isVercelDeployment = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
export const API_BASE_URL = isVercelDeployment 
    ? '/api/sekairankingtw' 
    : 'https://api.hisekai.org';

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

export interface EventDetail {
    unit: string;
    type: 'marathon' | 'cheerful_carnival' | 'world_link';
    banner: string;
    storyType: 'unit_event' | 'mixed_event' | 'world_link';
    cardType: 'permanent' | 'limited' | 'special_limited';
}

export const EVENT_DETAILS: Record<number, EventDetail> = {
    1: { unit: "Leo/need", type: "marathon", banner: "天馬咲希", storyType: "unit_event", cardType: "permanent" },
    2: { unit: "25點，Nightcord見。", type: "marathon", banner: "朝比奈真冬", storyType: "unit_event", cardType: "permanent" },
    3: { unit: "Wonderlands × Showtime", type: "marathon", banner: "神代類", storyType: "unit_event", cardType: "permanent" },
    4: { unit: "Mix", type: "marathon", banner: "鳳笑夢", storyType: "mixed_event", cardType: "permanent" },
    5: { unit: "MORE MORE JUMP!", type: "marathon", banner: "桃井愛莉", storyType: "unit_event", cardType: "permanent" },
    6: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "白石杏", storyType: "unit_event", cardType: "permanent" },
    7: { unit: "Mix", type: "marathon", banner: "曉山瑞希", storyType: "mixed_event", cardType: "permanent" },
    8: { unit: "Wonderlands × Showtime", type: "marathon", banner: "草薙寧寧", storyType: "unit_event", cardType: "permanent" },
    9: { unit: "Mix", type: "marathon", banner: "初音未來", storyType: "mixed_event", cardType: "permanent" },
    10: { unit: "Leo/need", type: "marathon", banner: "望月穗波", storyType: "unit_event", cardType: "permanent" },
    11: { unit: "MORE MORE JUMP!", type: "marathon", banner: "日野森雫", storyType: "unit_event", cardType: "permanent" },
    12: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "青柳冬彌", storyType: "unit_event", cardType: "permanent" },
    13: { unit: "Mix", type: "marathon", banner: "日野森志步", storyType: "mixed_event", cardType: "permanent" },
    14: { unit: "25點，Nightcord見。", type: "marathon", banner: "東雲繪名", storyType: "unit_event", cardType: "permanent" },
    15: { unit: "Wonderlands × Showtime", type: "marathon", banner: "鳳笑夢", storyType: "unit_event", cardType: "limited" },
    16: { unit: "Mix", type: "marathon", banner: "天馬咲希", storyType: "mixed_event", cardType: "permanent" },
    17: { unit: "MORE MORE JUMP!", type: "marathon", banner: "花里實乃理", storyType: "unit_event", cardType: "permanent" },
    18: { unit: "Mix", type: "marathon", banner: "星乃一歌", storyType: "mixed_event", cardType: "permanent" },
    19: { unit: "25點，Nightcord見。", type: "marathon", banner: "曉山瑞希", storyType: "unit_event", cardType: "permanent" },
    20: { unit: "Leo/need", type: "marathon", banner: "日野森志步", storyType: "unit_event", cardType: "permanent" },
    21: { unit: "Vivid BAD SQUAD", type: "cheerful_carnival", banner: "東雲彰人", storyType: "unit_event", cardType: "limited" },
    22: { unit: "Mix", type: "marathon", banner: "東雲繪名", storyType: "mixed_event", cardType: "permanent" },
    23: { unit: "MORE MORE JUMP!", type: "marathon", banner: "桐谷遙", storyType: "unit_event", cardType: "permanent" },
    24: { unit: "Mix", type: "cheerful_carnival", banner: "青柳冬彌", storyType: "mixed_event", cardType: "limited" },
    25: { unit: "Wonderlands × Showtime", type: "marathon", banner: "天馬司", storyType: "unit_event", cardType: "permanent" },
    26: { unit: "25點，Nightcord見。", type: "marathon", banner: "宵崎奏", storyType: "unit_event", cardType: "permanent" },
    27: { unit: "Leo/need", type: "cheerful_carnival", banner: "天馬咲希", storyType: "unit_event", cardType: "permanent" },
    28: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "小豆澤心羽", storyType: "unit_event", cardType: "permanent" },
    29: { unit: "Mix", type: "marathon", banner: "東雲彰人", storyType: "mixed_event", cardType: "permanent" },
    30: { unit: "Mix", type: "cheerful_carnival", banner: "望月穗波", storyType: "mixed_event", cardType: "limited" },
    31: { unit: "MORE MORE JUMP!", type: "marathon", banner: "桃井愛莉", storyType: "unit_event", cardType: "permanent" },
    32: { unit: "Wonderlands × Showtime", type: "marathon", banner: "草薙寧寧", storyType: "unit_event", cardType: "permanent" },
    33: { unit: "Mix", type: "cheerful_carnival", banner: "日野森雫", storyType: "mixed_event", cardType: "limited" },
    34: { unit: "Leo/need", type: "marathon", banner: "星乃一歌", storyType: "unit_event", cardType: "permanent" },
    35: { unit: "25點，Nightcord見。", type: "marathon", banner: "朝比奈真冬", storyType: "unit_event", cardType: "permanent" },
    36: { unit: "Mix", type: "cheerful_carnival", banner: "花里實乃理", storyType: "mixed_event", cardType: "limited" },
    37: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "白石杏", storyType: "unit_event", cardType: "permanent" },
    38: { unit: "Wonderlands × Showtime", type: "marathon", banner: "神代類", storyType: "unit_event", cardType: "permanent" },
    39: { unit: "25點，Nightcord見。", type: "cheerful_carnival", banner: "曉山瑞希", storyType: "unit_event", cardType: "limited" },
    40: { unit: "Leo/need", type: "marathon", banner: "望月穗波", storyType: "unit_event", cardType: "permanent" },
    41: { unit: "Mix", type: "marathon", banner: "小豆澤心羽", storyType: "mixed_event", cardType: "permanent" },
    42: { unit: "Mix", type: "cheerful_carnival", banner: "朝比奈真冬", storyType: "mixed_event", cardType: "limited" },
    43: { unit: "MORE MORE JUMP!", type: "marathon", banner: "花里實乃理", storyType: "unit_event", cardType: "permanent" },
    44: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "青柳冬彌", storyType: "unit_event", cardType: "permanent" },
    45: { unit: "Mix", type: "cheerful_carnival", banner: "桐谷遙", storyType: "mixed_event", cardType: "limited" },
    46: { unit: "Wonderlands × Showtime", type: "marathon", banner: "鳳笑夢", storyType: "unit_event", cardType: "permanent" },
    47: { unit: "25點，Nightcord見。", type: "marathon", banner: "宵崎奏", storyType: "unit_event", cardType: "permanent" },
    48: { unit: "Mix", type: "cheerful_carnival", banner: "桃井愛莉", storyType: "mixed_event", cardType: "limited" },
    49: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "小豆澤心羽", storyType: "unit_event", cardType: "permanent" },
    50: { unit: "Leo/need", type: "marathon", banner: "日野森志步", storyType: "unit_event", cardType: "permanent" },
    51: { unit: "Mix", type: "cheerful_carnival", banner: "天馬司", storyType: "mixed_event", cardType: "limited" },
    52: { unit: "MORE MORE JUMP!", type: "marathon", banner: "日野森雫", storyType: "unit_event", cardType: "permanent" },
    53: { unit: "25點，Nightcord見。", type: "marathon", banner: "東雲繪名", storyType: "unit_event", cardType: "permanent" },
    54: { unit: "Virtual Singer", type: "cheerful_carnival", banner: "初音未來", storyType: "unit_event", cardType: "limited" },
    55: { unit: "Wonderlands × Showtime", type: "marathon", banner: "天馬司", storyType: "unit_event", cardType: "permanent" },
    56: { unit: "Leo/need", type: "marathon", banner: "星乃一歌", storyType: "unit_event", cardType: "permanent" },
    57: { unit: "MORE MORE JUMP!", type: "cheerful_carnival", banner: "桐谷遙", storyType: "unit_event", cardType: "limited" },
    58: { unit: "Mix", type: "marathon", banner: "神代類", storyType: "mixed_event", cardType: "permanent" },
    59: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "東雲彰人", storyType: "unit_event", cardType: "permanent" },
    60: { unit: "Mix", type: "cheerful_carnival", banner: "白石杏", storyType: "mixed_event", cardType: "limited" },
    61: { unit: "25點，Nightcord見。", type: "marathon", banner: "朝比奈真冬", storyType: "unit_event", cardType: "permanent" },
    62: { unit: "Wonderlands × Showtime", type: "marathon", banner: "草薙寧寧", storyType: "unit_event", cardType: "permanent" },
    63: { unit: "Mix", type: "cheerful_carnival", banner: "宵崎奏", storyType: "mixed_event", cardType: "limited" },
    64: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "白石杏", storyType: "unit_event", cardType: "permanent" },
    65: { unit: "Leo/need", type: "marathon", banner: "天馬咲希", storyType: "unit_event", cardType: "permanent" },
    66: { unit: "Mix", type: "cheerful_carnival", banner: "草薙寧寧", storyType: "mixed_event", cardType: "limited" },
    67: { unit: "MORE MORE JUMP!", type: "marathon", banner: "桃井愛莉", storyType: "unit_event", cardType: "permanent" },
    68: { unit: "25點，Nightcord見。", type: "marathon", banner: "曉山瑞希", storyType: "unit_event", cardType: "permanent" },
    69: { unit: "Leo/need", type: "cheerful_carnival", banner: "日野森志步", storyType: "unit_event", cardType: "limited" },
    70: { unit: "Mix", type: "marathon", banner: "東雲繪名", storyType: "mixed_event", cardType: "permanent" },
    71: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "青柳冬彌", storyType: "unit_event", cardType: "permanent" },
    72: { unit: "Mix", type: "cheerful_carnival", banner: "朝比奈真冬", storyType: "mixed_event", cardType: "limited" },
    73: { unit: "MORE MORE JUMP!", type: "marathon", banner: "花里實乃理", storyType: "unit_event", cardType: "permanent" },
    74: { unit: "Wonderlands × Showtime", type: "marathon", banner: "神代類", storyType: "unit_event", cardType: "permanent" },
    75: { unit: "Mix", type: "cheerful_carnival", banner: "小豆澤心羽", storyType: "mixed_event", cardType: "limited" },
    76: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "白石杏", storyType: "unit_event", cardType: "permanent" },
    77: { unit: "25點，Nightcord見。", type: "marathon", banner: "東雲繪名", storyType: "unit_event", cardType: "permanent" },
    78: { unit: "MORE MORE JUMP!", type: "cheerful_carnival", banner: "桐谷遙", storyType: "unit_event", cardType: "limited" },
    79: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "東雲彰人", storyType: "unit_event", cardType: "permanent" },
    80: { unit: "Mix", type: "marathon", banner: "日野森雫", storyType: "mixed_event", cardType: "permanent" },
    81: { unit: "Mix", type: "cheerful_carnival", banner: "天馬司", storyType: "mixed_event", cardType: "limited" },
    82: { unit: "Wonderlands × Showtime", type: "marathon", banner: "鳳笑夢", storyType: "unit_event", cardType: "permanent" },
    83: { unit: "Leo/need", type: "marathon", banner: "望月穗波", storyType: "unit_event", cardType: "permanent" },
    84: { unit: "Mix", type: "cheerful_carnival", banner: "星乃一歌", storyType: "mixed_event", cardType: "limited" },
    85: { unit: "MORE MORE JUMP!", type: "marathon", banner: "日野森雫", storyType: "unit_event", cardType: "permanent" },
    86: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "小豆澤心羽", storyType: "unit_event", cardType: "permanent" },
    87: { unit: "Mix", type: "cheerful_carnival", banner: "青柳冬彌", storyType: "mixed_event", cardType: "limited" },
    88: { unit: "Wonderlands × Showtime", type: "marathon", banner: "天馬司", storyType: "unit_event", cardType: "permanent" },
    89: { unit: "25點，Nightcord見。", type: "marathon", banner: "宵崎奏", storyType: "unit_event", cardType: "permanent" },
    90: { unit: "Mix", type: "cheerful_carnival", banner: "日野森志步", storyType: "mixed_event", cardType: "limited" },
    91: { unit: "Leo/need", type: "marathon", banner: "天馬咲希", storyType: "unit_event", cardType: "permanent" },
    92: { unit: "MORE MORE JUMP!", type: "marathon", banner: "桃井愛莉", storyType: "unit_event", cardType: "permanent" },
    93: { unit: "25點，Nightcord見。", type: "cheerful_carnival", banner: "曉山瑞希", storyType: "unit_event", cardType: "limited" },
    94: { unit: "Mix", type: "marathon", banner: "桐谷遙", storyType: "mixed_event", cardType: "permanent" },
    95: { unit: "Wonderlands × Showtime", type: "marathon", banner: "草薙寧寧", storyType: "unit_event", cardType: "permanent" },
    96: { unit: "Mix", type: "cheerful_carnival", banner: "望月穗波", storyType: "mixed_event", cardType: "limited" },
    97: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "白石杏", storyType: "unit_event", cardType: "permanent" },
    98: { unit: "MORE MORE JUMP!", type: "marathon", banner: "花里實乃理", storyType: "unit_event", cardType: "permanent" },
    99: { unit: "Mix", type: "cheerful_carnival", banner: "神代類", storyType: "mixed_event", cardType: "limited" },
    100: { unit: "25點，Nightcord見。", type: "marathon", banner: "朝比奈真冬", storyType: "unit_event", cardType: "permanent" },
    101: { unit: "Leo/need", type: "marathon", banner: "星乃一歌", storyType: "unit_event", cardType: "permanent" },
    102: { unit: "Mix", type: "cheerful_carnival", banner: "桃井愛莉", storyType: "mixed_event", cardType: "limited" },
    103: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "小豆澤心羽", storyType: "unit_event", cardType: "permanent" },
    104: { unit: "Wonderlands × Showtime", type: "marathon", banner: "鳳笑夢", storyType: "unit_event", cardType: "permanent" },
    105: { unit: "Virtual Singer", type: "cheerful_carnival", banner: "初音未來", storyType: "unit_event", cardType: "limited" },
    106: { unit: "Mix", type: "marathon", banner: "天馬咲希", storyType: "mixed_event", cardType: "permanent" },
    107: { unit: "Mix", type: "marathon", banner: "白石杏", storyType: "mixed_event", cardType: "permanent" },
    108: { unit: "Mix", type: "cheerful_carnival", banner: "星乃一歌", storyType: "mixed_event", cardType: "limited" },
    109: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "東雲彰人", storyType: "unit_event", cardType: "permanent" },
    110: { unit: "Leo/need", type: "marathon", banner: "日野森志步", storyType: "unit_event", cardType: "permanent" },
    111: { unit: "MORE MORE JUMP!", type: "cheerful_carnival", banner: "日野森雫", storyType: "unit_event", cardType: "limited" },
    112: { unit: "25點，Nightcord見。", type: "world_link", banner: "25點，Nightcord見。", storyType: "world_link", cardType: "special_limited" },
    113: { unit: "Wonderlands × Showtime", type: "marathon", banner: "天馬司", storyType: "unit_event", cardType: "permanent" },
    114: { unit: "Mix", type: "marathon", banner: "草薙寧寧", storyType: "mixed_event", cardType: "limited" },
    115: { unit: "Mix", type: "marathon", banner: "花里實乃理", storyType: "mixed_event", cardType: "permanent" },
    116: { unit: "25點，Nightcord見。", type: "marathon", banner: "宵崎奏", storyType: "unit_event", cardType: "permanent" },
    117: { unit: "Mix", type: "marathon", banner: "曉山瑞希", storyType: "mixed_event", cardType: "limited" },
    118: { unit: "Vivid BAD SQUAD", type: "world_link", banner: "Vivid BAD SQUAD", storyType: "world_link", cardType: "special_limited" },
    119: { unit: "Wonderlands × Showtime", type: "marathon", banner: "神代類", storyType: "unit_event", cardType: "permanent" },
    120: { unit: "Mix", type: "marathon", banner: "小豆澤心羽", storyType: "mixed_event", cardType: "limited" },
    121: { unit: "Leo/need", type: "marathon", banner: "望月穗波", storyType: "unit_event", cardType: "permanent" },
    122: { unit: "MORE MORE JUMP!", type: "marathon", banner: "花里實乃理", storyType: "unit_event", cardType: "permanent" },
    123: { unit: "Mix", type: "marathon", banner: "宵崎奏", storyType: "mixed_event", cardType: "limited" },
    124: { unit: "Wonderlands × Showtime", type: "world_link", banner: "Wonderlands × Showtime", storyType: "world_link", cardType: "special_limited" },
    125: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "青柳冬彌", storyType: "unit_event", cardType: "permanent" },
    126: { unit: "Mix", type: "marathon", banner: "東雲彰人", storyType: "mixed_event", cardType: "limited" },
    127: { unit: "25點，Nightcord見。", type: "marathon", banner: "東雲繪名", storyType: "unit_event", cardType: "permanent" },
    128: { unit: "Leo/need", type: "marathon", banner: "天馬咲希", storyType: "unit_event", cardType: "permanent" },
    129: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "白石杏", storyType: "unit_event", cardType: "limited" },
    130: { unit: "MORE MORE JUMP!", type: "world_link", banner: "MORE MORE JUMP!", storyType: "world_link", cardType: "special_limited" },
    131: { unit: "Wonderlands × Showtime", type: "marathon", banner: "鳳笑夢", storyType: "unit_event", cardType: "permanent" },
    132: { unit: "Mix", type: "marathon", banner: "花里實乃理", storyType: "mixed_event", cardType: "limited" },
    133: { unit: "MORE MORE JUMP!", type: "marathon", banner: "桐谷遙", storyType: "unit_event", cardType: "permanent" },
    134: { unit: "25點，Nightcord見。", type: "marathon", banner: "朝比奈真冬", storyType: "unit_event", cardType: "permanent" },
    135: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "小豆澤心羽", storyType: "unit_event", cardType: "limited" },
    136: { unit: "Wonderlands × Showtime", type: "marathon", banner: "天馬司", storyType: "unit_event", cardType: "permanent" },
    137: { unit: "Leo/need", type: "world_link", banner: "Leo/need", storyType: "world_link", cardType: "special_limited" },
    138: { unit: "MORE MORE JUMP!", type: "marathon", banner: "桃井愛莉", storyType: "unit_event", cardType: "limited" },
    139: { unit: "Mix", type: "marathon", banner: "青柳冬彌", storyType: "mixed_event", cardType: "permanent" },
    140: { unit: "Virtual Singer", type: "world_link", banner: "Virtual Singer", storyType: "world_link", cardType: "special_limited" },
    141: { unit: "Mix", type: "marathon", banner: "鳳笑夢", storyType: "mixed_event", cardType: "limited" },
    142: { unit: "Mix", type: "marathon", banner: "桐谷遙", storyType: "mixed_event", cardType: "permanent" },
    143: { unit: "Leo/need", type: "marathon", banner: "星乃一歌", storyType: "unit_event", cardType: "permanent" },
    144: { unit: "Mix", type: "marathon", banner: "草薙寧寧", storyType: "mixed_event", cardType: "limited" },
    145: { unit: "25點，Nightcord見。", type: "marathon", banner: "曉山瑞希", storyType: "unit_event", cardType: "permanent" },
    146: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "東雲彰人", storyType: "unit_event", cardType: "permanent" },
    147: { unit: "Leo/need", type: "marathon", banner: "天馬咲希", storyType: "unit_event", cardType: "limited" },
    148: { unit: "Mix", type: "marathon", banner: "日野森志步", storyType: "mixed_event", cardType: "permanent" },
    149: { unit: "Wonderlands × Showtime", type: "marathon", banner: "草薙寧寧", storyType: "unit_event", cardType: "permanent" },
    150: { unit: "25點，Nightcord見。", type: "marathon", banner: "東雲繪名", storyType: "unit_event", cardType: "limited" },
    151: { unit: "MORE MORE JUMP!", type: "marathon", banner: "日野森雫", storyType: "unit_event", cardType: "permanent" },
    152: { unit: "Mix", type: "marathon", banner: "神代類", storyType: "mixed_event", cardType: "permanent" },
    153: { unit: "Mix", type: "marathon", banner: "東雲彰人", storyType: "mixed_event", cardType: "limited" },
    154: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "青柳冬彌", storyType: "unit_event", cardType: "permanent" },
    155: { unit: "Mix", type: "marathon", banner: "宵崎奏", storyType: "mixed_event", cardType: "permanent" },
    156: { unit: "Mix", type: "marathon", banner: "日野森雫", storyType: "mixed_event", cardType: "limited" },
    157: { unit: "MORE MORE JUMP!", type: "marathon", banner: "桐谷遙", storyType: "unit_event", cardType: "permanent" },
    158: { unit: "Mix", type: "marathon", banner: "望月穗波", storyType: "mixed_event", cardType: "permanent" },
    159: { unit: "Mix", type: "marathon", banner: "天馬咲希", storyType: "mixed_event", cardType: "limited" },
    160: { unit: "Mix", type: "marathon", banner: "天馬司", storyType: "mixed_event", cardType: "permanent" },
    161: { unit: "25點，Nightcord見。", type: "marathon", banner: "宵崎奏", storyType: "unit_event", cardType: "permanent" },
    162: { unit: "Leo/need", type: "marathon", banner: "日野森志步", storyType: "unit_event", cardType: "limited" },
    163: { unit: "Vivid BAD SQUAD", type: "world_link", banner: "Vivid BAD SQUAD", storyType: "world_link", cardType: "special_limited" },
    164: { unit: "Wonderlands × Showtime", type: "marathon", banner: "鳳笑夢", storyType: "unit_event", cardType: "permanent" }
};

export const getEventColor = (eventId: number): string | undefined => {
    const details = EVENT_DETAILS[eventId];
    if (!details) return undefined;

    // 1. Try to get the Banner Character's color (Primary for ALL event types)
    if (details.banner && CHARACTERS[details.banner]) {
        return CHARACTERS[details.banner].color;
    }

    // 2. Standard Unit Color (Fallback if banner is not a single character, e.g., WL or Group Banner)
    if (details.unit && UNITS[details.unit]) {
        return UNITS[details.unit].color;
    }
    
    // 3. Fallback for World Link if not captured by unit
    if (details.type === 'world_link') {
        return '#33CCBB'; 
    }
    
    return undefined;
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
