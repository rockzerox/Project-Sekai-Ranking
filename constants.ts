
export const WORLD_LINK_IDS = [112, 118, 124, 130, 137, 140, 163];

export const UNIT_COLORS: Record<string, string> = {
    "Leo/need": "#4455DD",
    "MORE MORE JUMP!": "#88DD44",
    "Vivid BAD SQUAD": "#EE1166",
    "Wonderlands × Showtime": "#FF9900",
    "25點,Nightcord見": "#884499",
    "Virtual Singer": "#71717A",
    "Mix": "#64748B"
};

export const UNIT_STYLES: Record<string, string> = {
    "Leo/need": "bg-[#4455DD] text-white border-transparent",
    "MORE MORE JUMP!": "bg-[#88DD44] text-white border-transparent",
    "Vivid BAD SQUAD": "bg-[#EE1166] text-white border-transparent",
    "Wonderlands × Showtime": "bg-[#FF9900] text-white border-transparent",
    "25點,Nightcord見": "bg-[#884499] text-white border-transparent",
    "Virtual Singer": "bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-600 dark:border-slate-300",
    "Mix": "bg-slate-500 text-white border-transparent"
};

export const UNIT_ORDER = [
    "Virtual Singer",
    "Leo/need",
    "MORE MORE JUMP!",
    "Vivid BAD SQUAD",
    "Wonderlands × Showtime",
    "25點,Nightcord見",
    "Mix"
];

export const BANNER_ORDER = [
    // Leo/need
    "星乃一歌", "天馬咲希", "望月穗波", "日野森志步",
    // MORE MORE JUMP!
    "花里實乃理", "桐谷遙", "桃井愛莉", "日野森雫",
    // Vivid BAD SQUAD
    "小豆澤心羽", "白石杏", "東雲彰人", "青柳冬彌",
    // Wonderlands × Showtime
    "天馬司", "鳳笑夢", "草薙寧寧", "神代類",
    // 25點,Nightcord見
    "宵崎奏", "朝比奈真冬", "東雲繪名", "曉山瑞希",
    // VS
    "初音未來"
];

export const CHAR_INFO: Record<string, string> = {
    "朝比奈真冬": "#8888CC",
    "曉山瑞希": "#DDAACC",
    "東雲繪名": "#CCAA88",
    "宵崎奏": "#BB6688",
    "東雲彰人": "#FF7722",
    "青柳冬彌": "#0077DD",
    "白石杏": "#00BBDD",
    "小豆澤心羽": "#FF6699",
    "神代類": "#BB88EE",
    "草薙寧寧": "#33DD99",
    "鳳笑夢": "#FF66BB",
    "天馬司": "#FFBB00",
    "桃井愛莉": "#FFAACC",
    "桐谷遙": "#99CCFF",
    "日野森雫": "#99EEDD",
    "花里實乃理": "#FFCCAA",
    "天馬咲希": "#FFDD44",
    "望月穗波": "#EE6666",
    "日野森志步": "#BBDD22",
    "星乃一歌": "#33AAEE",
    "巡音流歌": "#FFBBCC",
    "鏡音鈴": "#FFCC11",
    "MEIKO": "#DD4444",
    "鏡音連": "#FFEE11",
    "KAITO": "#3366CC",
    "初音未來": "#33CCBB"
};

export const EVENT_CHAPTER_ORDER: Record<number, string[]> = {
    112: ["朝比奈真冬", "曉山瑞希", "東雲繪名", "宵崎奏"],
    118: ["東雲彰人", "青柳冬彌", "白石杏", "小豆澤心羽"],
    124: ["神代類", "草薙寧寧", "鳳笑夢", "天馬司"],
    130: ["桃井愛莉", "桐谷遙", "日野森雫", "花里實乃理"],
    137: ["天馬咲希", "望月穗波", "日野森志步", "星乃一歌"],
    140: ["巡音流歌", "鏡音鈴", "MEIKO", "鏡音連", "KAITO", "初音未來"]
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
    2: { unit: "25點,Nightcord見", type: "marathon", banner: "朝比奈真冬", storyType: "unit_event", cardType: "permanent" },
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
    14: { unit: "25點,Nightcord見", type: "marathon", banner: "東雲繪名", storyType: "unit_event", cardType: "permanent" },
    15: { unit: "Wonderlands × Showtime", type: "marathon", banner: "鳳笑夢", storyType: "unit_event", cardType: "limited" },
    16: { unit: "Mix", type: "marathon", banner: "天馬咲希", storyType: "mixed_event", cardType: "permanent" },
    17: { unit: "MORE MORE JUMP!", type: "marathon", banner: "花里實乃理", storyType: "unit_event", cardType: "permanent" },
    18: { unit: "Mix", type: "marathon", banner: "星乃一歌", storyType: "mixed_event", cardType: "permanent" },
    19: { unit: "25點,Nightcord見", type: "marathon", banner: "曉山瑞希", storyType: "unit_event", cardType: "permanent" },
    20: { unit: "Leo/need", type: "marathon", banner: "日野森志步", storyType: "unit_event", cardType: "permanent" },
    21: { unit: "Vivid BAD SQUAD", type: "cheerful_carnival", banner: "東雲彰人", storyType: "unit_event", cardType: "limited" },
    22: { unit: "Mix", type: "marathon", banner: "東雲繪名", storyType: "mixed_event", cardType: "permanent" },
    23: { unit: "MORE MORE JUMP!", type: "marathon", banner: "桐谷遙", storyType: "unit_event", cardType: "permanent" },
    24: { unit: "Mix", type: "cheerful_carnival", banner: "青柳冬彌", storyType: "mixed_event", cardType: "limited" },
    25: { unit: "Wonderlands × Showtime", type: "marathon", banner: "天馬司", storyType: "unit_event", cardType: "permanent" },
    26: { unit: "25點,Nightcord見", type: "marathon", banner: "宵崎奏", storyType: "unit_event", cardType: "permanent" },
    27: { unit: "Leo/need", type: "cheerful_carnival", banner: "天馬咲希", storyType: "unit_event", cardType: "permanent" },
    28: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "小豆澤心羽", storyType: "unit_event", cardType: "permanent" },
    29: { unit: "Mix", type: "marathon", banner: "東雲彰人", storyType: "mixed_event", cardType: "permanent" },
    30: { unit: "Mix", type: "cheerful_carnival", banner: "望月穗波", storyType: "mixed_event", cardType: "limited" },
    31: { unit: "MORE MORE JUMP!", type: "marathon", banner: "桃井愛莉", storyType: "unit_event", cardType: "permanent" },
    32: { unit: "Wonderlands × Showtime", type: "marathon", banner: "草薙寧寧", storyType: "unit_event", cardType: "permanent" },
    33: { unit: "Mix", type: "cheerful_carnival", banner: "日野森雫", storyType: "mixed_event", cardType: "limited" },
    34: { unit: "Leo/need", type: "marathon", banner: "星乃一歌", storyType: "unit_event", cardType: "permanent" },
    35: { unit: "25點,Nightcord見", type: "marathon", banner: "朝比奈真冬", storyType: "unit_event", cardType: "permanent" },
    36: { unit: "Mix", type: "cheerful_carnival", banner: "花里實乃理", storyType: "mixed_event", cardType: "limited" },
    37: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "白石杏", storyType: "unit_event", cardType: "permanent" },
    38: { unit: "Wonderlands × Showtime", type: "marathon", banner: "神代類", storyType: "unit_event", cardType: "permanent" },
    39: { unit: "25點,Nightcord見", type: "cheerful_carnival", banner: "曉山瑞希", storyType: "unit_event", cardType: "limited" },
    40: { unit: "Leo/need", type: "marathon", banner: "望月穗波", storyType: "unit_event", cardType: "permanent" },
    41: { unit: "Mix", type: "marathon", banner: "小豆澤心羽", storyType: "mixed_event", cardType: "permanent" },
    42: { unit: "Mix", type: "cheerful_carnival", banner: "朝比奈真冬", storyType: "mixed_event", cardType: "limited" },
    43: { unit: "MORE MORE JUMP!", type: "marathon", banner: "花里實乃理", storyType: "unit_event", cardType: "permanent" },
    44: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "青柳冬彌", storyType: "unit_event", cardType: "permanent" },
    45: { unit: "Mix", type: "cheerful_carnival", banner: "桐谷遙", storyType: "mixed_event", cardType: "limited" },
    46: { unit: "Wonderlands × Showtime", type: "marathon", banner: "鳳笑夢", storyType: "unit_event", cardType: "permanent" },
    47: { unit: "25點,Nightcord見", type: "marathon", banner: "宵崎奏", storyType: "unit_event", cardType: "permanent" },
    48: { unit: "Mix", type: "cheerful_carnival", banner: "桃井愛莉", storyType: "mixed_event", cardType: "limited" },
    49: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "小豆澤心羽", storyType: "unit_event", cardType: "permanent" },
    50: { unit: "Leo/need", type: "marathon", banner: "日野森志步", storyType: "unit_event", cardType: "permanent" },
    51: { unit: "Mix", type: "cheerful_carnival", banner: "天馬司", storyType: "mixed_event", cardType: "limited" },
    52: { unit: "MORE MORE JUMP!", type: "marathon", banner: "日野森雫", storyType: "unit_event", cardType: "permanent" },
    53: { unit: "25點,Nightcord見", type: "marathon", banner: "東雲繪名", storyType: "unit_event", cardType: "permanent" },
    54: { unit: "Virtual Singer", type: "cheerful_carnival", banner: "初音未來", storyType: "unit_event", cardType: "limited" },
    55: { unit: "Wonderlands × Showtime", type: "marathon", banner: "天馬司", storyType: "unit_event", cardType: "permanent" },
    56: { unit: "Leo/need", type: "marathon", banner: "星乃一歌", storyType: "unit_event", cardType: "permanent" },
    57: { unit: "MORE MORE JUMP!", type: "cheerful_carnival", banner: "桐谷遙", storyType: "unit_event", cardType: "limited" },
    58: { unit: "Mix", type: "marathon", banner: "神代類", storyType: "mixed_event", cardType: "permanent" },
    59: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "東雲彰人", storyType: "unit_event", cardType: "permanent" },
    60: { unit: "Mix", type: "cheerful_carnival", banner: "白石杏", storyType: "mixed_event", cardType: "limited" },
    61: { unit: "25點,Nightcord見", type: "marathon", banner: "朝比奈真冬", storyType: "unit_event", cardType: "permanent" },
    62: { unit: "Wonderlands × Showtime", type: "marathon", banner: "草薙寧寧", storyType: "unit_event", cardType: "permanent" },
    63: { unit: "Mix", type: "cheerful_carnival", banner: "宵崎奏", storyType: "mixed_event", cardType: "limited" },
    64: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "白石杏", storyType: "unit_event", cardType: "permanent" },
    65: { unit: "Leo/need", type: "marathon", banner: "天馬咲希", storyType: "unit_event", cardType: "permanent" },
    66: { unit: "Mix", type: "cheerful_carnival", banner: "草薙寧寧", storyType: "mixed_event", cardType: "limited" },
    67: { unit: "MORE MORE JUMP!", type: "marathon", banner: "桃井愛莉", storyType: "unit_event", cardType: "permanent" },
    68: { unit: "25點,Nightcord見", type: "marathon", banner: "曉山瑞希", storyType: "unit_event", cardType: "permanent" },
    69: { unit: "Leo/need", type: "cheerful_carnival", banner: "日野森志步", storyType: "unit_event", cardType: "limited" },
    70: { unit: "Mix", type: "marathon", banner: "東雲繪名", storyType: "mixed_event", cardType: "permanent" },
    71: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "青柳冬彌", storyType: "unit_event", cardType: "permanent" },
    72: { unit: "Mix", type: "cheerful_carnival", banner: "朝比奈真冬", storyType: "mixed_event", cardType: "limited" },
    73: { unit: "MORE MORE JUMP!", type: "marathon", banner: "花里實乃理", storyType: "unit_event", cardType: "permanent" },
    74: { unit: "Wonderlands × Showtime", type: "marathon", banner: "神代類", storyType: "unit_event", cardType: "permanent" },
    75: { unit: "Mix", type: "cheerful_carnival", banner: "小豆澤心羽", storyType: "mixed_event", cardType: "limited" },
    76: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "白石杏", storyType: "unit_event", cardType: "permanent" },
    77: { unit: "25點,Nightcord見", type: "marathon", banner: "東雲繪名", storyType: "unit_event", cardType: "permanent" },
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
    89: { unit: "25點,Nightcord見", type: "marathon", banner: "宵崎奏", storyType: "unit_event", cardType: "permanent" },
    90: { unit: "Mix", type: "cheerful_carnival", banner: "日野森志步", storyType: "mixed_event", cardType: "limited" },
    91: { unit: "Leo/need", type: "marathon", banner: "天馬咲希", storyType: "unit_event", cardType: "permanent" },
    92: { unit: "MORE MORE JUMP!", type: "marathon", banner: "桃井愛莉", storyType: "unit_event", cardType: "permanent" },
    93: { unit: "25點,Nightcord見見", type: "cheerful_carnival", banner: "曉山瑞希", storyType: "unit_event", cardType: "limited" },
    94: { unit: "Mix", type: "marathon", banner: "桐谷遙", storyType: "mixed_event", cardType: "permanent" },
    95: { unit: "Wonderlands × Showtime", type: "marathon", banner: "草薙寧寧", storyType: "unit_event", cardType: "permanent" },
    96: { unit: "Mix", type: "cheerful_carnival", banner: "望月穗波", storyType: "mixed_event", cardType: "limited" },
    97: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "白石杏", storyType: "unit_event", cardType: "permanent" },
    98: { unit: "MORE MORE JUMP!", type: "marathon", banner: "花里實乃理", storyType: "unit_event", cardType: "permanent" },
    99: { unit: "Mix", type: "cheerful_carnival", banner: "神代類", storyType: "mixed_event", cardType: "limited" },
    100: { unit: "25點,Nightcord見", type: "marathon", banner: "朝比奈真冬", storyType: "unit_event", cardType: "permanent" },
    101: { unit: "Leo/need", type: "marathon", banner: "星乃一歌", storyType: "unit_event", cardType: "permanent" },
    102: { unit: "Mix", type: "cheerful_carnival", banner: "桃井愛莉", storyType: "mixed_event", cardType: "limited" },
    103: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "小豆澤心羽", storyType: "unit_event", cardType: "permanent" },
    104: { unit: "Wonderlands × Showtime", type: "marathon", banner: "鳳笑夢", storyType: "unit_event", cardType: "permanent" },
    105: { unit: "Vitrual singer", type: "cheerful_carnival", banner: "初音未來", storyType: "unit_event", cardType: "limited" },
    106: { unit: "Mix", type: "marathon", banner: "天馬咲希", storyType: "mixed_event", cardType: "permanent" },
    107: { unit: "Mix", type: "marathon", banner: "白石杏", storyType: "mixed_event", cardType: "permanent" },
    108: { unit: "Mix", type: "cheerful_carnival", banner: "星乃一歌", storyType: "mixed_event", cardType: "limited" },
    109: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "東雲彰人", storyType: "unit_event", cardType: "permanent" },
    110: { unit: "Leo/need", type: "marathon", banner: "日野森志步", storyType: "unit_event", cardType: "permanent" },
    111: { unit: "MORE MORE JUMP!", type: "cheerful_carnival", banner: "日野森雫", storyType: "unit_event", cardType: "limited" },
    112: { unit: "25點,Nightcord見", type: "world_link", banner: "25點,Nightcord見", storyType: "world_link", cardType: "special_limited" },
    113: { unit: "Wonderlands × Showtime", type: "marathon", banner: "天馬司", storyType: "unit_event", cardType: "permanent" },
    114: { unit: "Mix", type: "marathon", banner: "草薙寧寧", storyType: "mixed_event", cardType: "limited" },
    115: { unit: "Mix", type: "marathon", banner: "花里實乃理", storyType: "mixed_event", cardType: "permanent" },
    116: { unit: "25點,Nightcord見", type: "marathon", banner: "宵崎奏", storyType: "unit_event", cardType: "permanent" },
    117: { unit: "Mix", type: "marathon", banner: "曉山瑞希", storyType: "mixed_event", cardType: "limited" },
    118: { unit: "Vivid BAD SQUAD", type: "world_link", banner: "Vivid BAD SQUAD", storyType: "world_link", cardType: "permanent" },
    119: { unit: "Wonderlands × Showtime", type: "marathon", banner: "神代類", storyType: "unit_event", cardType: "permanent" },
    120: { unit: "Mix", type: "marathon", banner: "小豆澤心羽", storyType: "mixed_event", cardType: "limited" },
    121: { unit: "Leo/need", type: "marathon", banner: "望月穗波", storyType: "unit_event", cardType: "permanent" },
    122: { unit: "MORE MORE JUMP!", type: "marathon", banner: "花里實乃理", storyType: "unit_event", cardType: "permanent" },
    123: { unit: "Mix", type: "marathon", banner: "宵崎奏", storyType: "mixed_event", cardType: "limited" },
    124: { unit: "Wonderlands × Showtime", type: "world_link", banner: "Wonderlands × Showtime", storyType: "world_link", cardType: "special_limited" },
    125: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "青柳冬彌", storyType: "unit_event", cardType: "permanent" },
    126: { unit: "Mix", type: "marathon", banner: "東雲彰人", storyType: "mixed_event", cardType: "limited" },
    127: { unit: "25點,Nightcord見", type: "marathon", banner: "東雲繪名", storyType: "unit_event", cardType: "permanent" },
    128: { unit: "Leo/need", type: "marathon", banner: "天馬咲希", storyType: "unit_event", cardType: "permanent" },
    129: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "白石杏", storyType: "unit_event", cardType: "limited" },
    130: { unit: "MORE MORE JUMP!", type: "world_link", banner: "MORE MORE JUMP!", storyType: "world_link", cardType: "special_limited" },
    131: { unit: "Wonderlands × Showtime", type: "marathon", banner: "鳳笑夢", storyType: "unit_event", cardType: "permanent" },
    132: { unit: "Mix", type: "marathon", banner: "花里實乃理", storyType: "mixed_event", cardType: "limited" },
    133: { unit: "MORE MORE JUMP!", type: "marathon", banner: "桐谷遙", storyType: "unit_event", cardType: "permanent" },
    134: { unit: "25點,Nightcord見", type: "marathon", banner: "朝比奈真冬", storyType: "unit_event", cardType: "permanent" },
    135: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "小豆澤心羽", storyType: "unit_event", cardType: "limited" },
    136: { unit: "Wonderlands × Showtime", type: "marathon", banner: "天馬司", storyType: "unit_event", cardType: "permanent" },
    137: { unit: "Leo/need", type: "world_link", banner: "Leo/need", storyType: "world_link", cardType: "special_limited" },
    138: { unit: "MORE MORE JUMP!", type: "marathon", banner: "桃井愛莉", storyType: "unit_event", cardType: "limited" },
    139: { unit: "Mix", type: "marathon", banner: "宵崎奏", storyType: "mixed_event", cardType: "permanent" },
    140: { unit: "Virtual Singer", type: "world_link", banner: "Virtual Singer", storyType: "world_link", cardType: "special_limited" },
    141: { unit: "Mix", type: "marathon", banner: "鳳笑夢", storyType: "mixed_event", cardType: "limited" },
    142: { unit: "Mix", type: "marathon", banner: "桐谷遙", storyType: "mixed_event", cardType: "permanent" },
    143: { unit: "Leo/need", type: "marathon", banner: "星乃一歌", storyType: "unit_event", cardType: "permanent" },
    144: { unit: "Mix", type: "marathon", banner: "草薙寧寧", storyType: "mixed_event", cardType: "limited" },
    145: { unit: "25點,Nightcord見", type: "marathon", banner: "曉山瑞希", storyType: "unit_event", cardType: "permanent" },
    146: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "東雲彰人", storyType: "unit_event", cardType: "permanent" },
    147: { unit: "Leo/need", type: "marathon", banner: "天馬咲希", storyType: "unit_event", cardType: "limited" },
    148: { unit: "Mix", type: "marathon", banner: "日野森志步", storyType: "mixed_event", cardType: "permanent" },
    149: { unit: "Wonderlands × Showtime", type: "marathon", banner: "草薙寧寧", storyType: "unit_event", cardType: "permanent" },
    150: { unit: "25點,Nightcord見", type: "marathon", banner: "東雲繪名", storyType: "unit_event", cardType: "limited" },
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
    161: { unit: "25點,Nightcord見", type: "marathon", banner: "宵崎奏", storyType: "unit_event", cardType: "permanent" },
    162: { unit: "Leo/need", type: "marathon", banner: "日野森志步", storyType: "unit_event", cardType: "limited" },
    163: { unit: "Vivid BAD SQUAD", type: "world_link", banner: "Vivid BAD SQUAD", storyType: "world_link", cardType: "special_limited" },
    164: { unit: "Wonderlands × Showtime", type: "marathon", banner: "鳳笑夢", storyType: "unit_event", cardType: "permanent" }
};

export const EVENT_UNIT_MAP: Record<number, string> = Object.fromEntries(
    Object.entries(EVENT_DETAILS).map(([k, v]) => [k, v.unit])
);

export const getEventColor = (eventId: number): string => {
    const details = EVENT_DETAILS[eventId];
    if (!details) return '';

    if (CHAR_INFO[details.banner]) {
        return CHAR_INFO[details.banner];
    }

    if (UNIT_COLORS[details.unit]) {
        return UNIT_COLORS[details.unit];
    }

    return '';
};

// New Image Constants
const BASE_IMAGE_URL = "https://raw.githubusercontent.com/rockzerox/Storage/refs/heads/main/Project-Sekai-Ranking";

export const CHARACTER_FILENAME_MAP: Record<string, string> = {
    "朝比奈真冬": "Mafuyu",
    "曉山瑞希": "Mizuki",
    "東雲繪名": "Ena",
    "宵崎奏": "Kanade",
    "東雲彰人": "Akito",
    "青柳冬彌": "Toya",
    "白石杏": "An",
    "小豆澤心羽": "Kohane",
    "神代類": "Rui",
    "草薙寧寧": "Nene",
    "鳳笑夢": "Emu",
    "天馬司": "Tsukasa",
    "桃井愛莉": "Airi",
    "桐谷遙": "Haruka",
    "日野森雫": "Shizuku",
    "花里實乃理": "Minori",
    "天馬咲希": "Saki",
    "望月穗波": "Honami",
    "日野森志步": "Shiho",
    "星乃一歌": "Ichika",
    "巡音流歌": "Luka",
    "鏡音鈴": "Rin",
    "MEIKO": "Meiko",
    "鏡音連": "Len",
    "KAITO": "Kaito",
    "初音未來": "Miku"
};

export const UNIT_FILENAME_MAP: Record<string, string> = {
    "Virtual Singer": "VS_logo",
    "Leo/need": "LN_logo",
    "MORE MORE JUMP!": "MMJ_logo",
    "Vivid BAD SQUAD": "VBS_logo",
    "Wonderlands × Showtime": "WS_logo",
    "25點,nightcord見": "25_logo"
};

export const getAssetUrl = (name: string, type: 'character' | 'unit' | 'event'): string | null => {
    if (type === 'event') {
        return `${BASE_IMAGE_URL}/event_logo/${name}.png`;
    }

    let filename = '';
    if (type === 'character') {
        filename = CHARACTER_FILENAME_MAP[name];
        if (!filename) return null;
        return `${BASE_IMAGE_URL}/Chibi/${filename}.png`;
    } else if (type === 'unit') {
        filename = UNIT_FILENAME_MAP[name];
        if (!filename) return null;
        return `${BASE_IMAGE_URL}/logo/${filename}.png`;
    }

    return null;
};

// Duration Helpers
export const calculateDisplayDuration = (startAt: string, aggregateAt: string): number => {
    const start = new Date(startAt);
    const agg = new Date(aggregateAt);
    const diffMs = Math.abs(agg.getTime() - start.getTime());
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    
    if (diffDays % 1 > 0.9) {
        return Math.ceil(diffDays);
    }
    return Math.floor(diffDays);
};

export const calculatePreciseDuration = (startAt: string, aggregateAt: string): number => {
    const start = new Date(startAt);
    const agg = new Date(aggregateAt);
    const diffMs = Math.abs(agg.getTime() - start.getTime());
    const totalHours = Math.round(diffMs / (1000 * 60 * 60)); 
    return totalHours / 24;
};

export const getEventStatus = (startAt: string, aggregateAt: string, closedAt: string, rankingAnnounceAt: string) => {
    const now = new Date();
    const start = new Date(startAt);
    const agg = new Date(aggregateAt);
    const closed = new Date(closedAt);
    const announce = new Date(rankingAnnounceAt);

    if (now < start) return 'future';
    if (now >= start && now <= agg) return 'active';
    if (now > agg && now < announce) return 'calculating';
    if (now >= announce && now <= closed) return 'ended';
    return 'past';
};
