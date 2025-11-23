
export const WORLD_LINK_IDS = [112, 118, 124, 130, 137, 140, 163];

export const UNIT_COLORS: Record<string, string> = {
    "Leo/need": "#4455DD",
    "MORE MORE JUMP!": "#88DD44",
    "Vivid BAD SQUAD": "#EE1166",
    "Wonderlands × Showtime": "#FF9900",
    "25點,nightcord見": "#884499",
    "Virtual Singer": "#71717A",
    "混活": "#64748B"
};

export const UNIT_STYLES: Record<string, string> = {
    "Leo/need": "bg-[#4455DD] text-white border-transparent",
    "MORE MORE JUMP!": "bg-[#88DD44] text-white border-transparent",
    "Vivid BAD SQUAD": "bg-[#EE1166] text-white border-transparent",
    "Wonderlands × Showtime": "bg-[#FF9900] text-white border-transparent",
    "25點,nightcord見": "bg-[#884499] text-white border-transparent",
    "Virtual Singer": "bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-600 dark:border-slate-300",
    "混活": "bg-slate-500 text-white border-transparent"
};

export const UNIT_ORDER = [
    "Virtual Singer",
    "Leo/need",
    "MORE MORE JUMP!",
    "Vivid BAD SQUAD",
    "Wonderlands × Showtime",
    "25點,nightcord見",
    "混活"
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
    // 25-ji
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

export interface EventDetail {
    unit: string;
    type: 'marathon' | 'cheerful_carnival' | 'world_link';
    banner: string;
}

export const EVENT_DETAILS: Record<number, EventDetail> = {
    1: { unit: "Leo/need", type: "marathon", banner: "天馬咲希" },
    2: { unit: "25點,nightcord見", type: "marathon", banner: "朝比奈真冬" },
    3: { unit: "Wonderlands × Showtime", type: "marathon", banner: "神代類" },
    4: { unit: "混活", type: "marathon", banner: "鳳笑夢" },
    5: { unit: "MORE MORE JUMP!", type: "marathon", banner: "桃井愛莉" },
    6: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "白石杏" },
    7: { unit: "混活", type: "marathon", banner: "曉山瑞希" },
    8: { unit: "Wonderlands × Showtime", type: "marathon", banner: "草薙寧寧" },
    9: { unit: "混活", type: "marathon", banner: "初音未來" },
    10: { unit: "Leo/need", type: "marathon", banner: "望月穗波" },
    11: { unit: "MORE MORE JUMP!", type: "marathon", banner: "日野森雫" },
    12: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "青柳冬彌" },
    13: { unit: "混活", type: "marathon", banner: "日野森志步" },
    14: { unit: "25點,nightcord見", type: "marathon", banner: "東雲繪名" },
    15: { unit: "Wonderlands × Showtime", type: "marathon", banner: "鳳笑夢" },
    16: { unit: "混活", type: "marathon", banner: "天馬咲希" },
    17: { unit: "MORE MORE JUMP!", type: "marathon", banner: "花里實乃理" },
    18: { unit: "混活", type: "marathon", banner: "星乃一歌" },
    19: { unit: "25點,nightcord見", type: "marathon", banner: "曉山瑞希" },
    20: { unit: "Leo/need", type: "marathon", banner: "日野森志步" },
    21: { unit: "Vivid BAD SQUAD", type: "cheerful_carnival", banner: "東雲彰人" },
    22: { unit: "混活", type: "marathon", banner: "東雲繪名" },
    23: { unit: "MORE MORE JUMP!", type: "marathon", banner: "桐谷遙" },
    24: { unit: "混活", type: "cheerful_carnival", banner: "青柳冬彌" },
    25: { unit: "Wonderlands × Showtime", type: "marathon", banner: "天馬司" },
    26: { unit: "25點,nightcord見", type: "marathon", banner: "宵崎奏" },
    27: { unit: "Leo/need", type: "cheerful_carnival", banner: "天馬咲希" },
    28: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "小豆澤心羽" },
    29: { unit: "混活", type: "marathon", banner: "東雲彰人" },
    30: { unit: "混活", type: "cheerful_carnival", banner: "望月穗波" },
    31: { unit: "MORE MORE JUMP!", type: "marathon", banner: "桃井愛莉" },
    32: { unit: "Wonderlands × Showtime", type: "marathon", banner: "草薙寧寧" },
    33: { unit: "混活", type: "cheerful_carnival", banner: "日野森雫" },
    34: { unit: "Leo/need", type: "marathon", banner: "星乃一歌" },
    35: { unit: "25點,nightcord見", type: "marathon", banner: "朝比奈真冬" },
    36: { unit: "混活", type: "cheerful_carnival", banner: "花里實乃理" },
    37: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "白石杏" },
    38: { unit: "Wonderlands × Showtime", type: "marathon", banner: "神代類" },
    39: { unit: "25點,nightcord見", type: "cheerful_carnival", banner: "曉山瑞希" },
    40: { unit: "Leo/need", type: "marathon", banner: "望月穗波" },
    41: { unit: "混活", type: "marathon", banner: "小豆澤心羽" },
    42: { unit: "混活", type: "cheerful_carnival", banner: "朝比奈真冬" },
    43: { unit: "MORE MORE JUMP!", type: "marathon", banner: "花里實乃理" },
    44: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "青柳冬彌" },
    45: { unit: "混活", type: "cheerful_carnival", banner: "桐谷遙" },
    46: { unit: "Wonderlands × Showtime", type: "marathon", banner: "鳳笑夢" },
    47: { unit: "25點,nightcord見", type: "marathon", banner: "宵崎奏" },
    48: { unit: "混活", type: "cheerful_carnival", banner: "桃井愛莉" },
    49: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "小豆澤心羽" },
    50: { unit: "Leo/need", type: "marathon", banner: "日野森志步" },
    51: { unit: "混活", type: "cheerful_carnival", banner: "天馬司" },
    52: { unit: "MORE MORE JUMP!", type: "marathon", banner: "日野森雫" },
    53: { unit: "25點,nightcord見", type: "marathon", banner: "東雲繪名" },
    54: { unit: "Virtual Singer", type: "cheerful_carnival", banner: "初音未來" },
    55: { unit: "Wonderlands × Showtime", type: "marathon", banner: "天馬司" },
    56: { unit: "Leo/need", type: "marathon", banner: "星乃一歌" },
    57: { unit: "MORE MORE JUMP!", type: "cheerful_carnival", banner: "桐谷遙" },
    58: { unit: "混活", type: "marathon", banner: "神代類" },
    59: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "東雲彰人" },
    60: { unit: "混活", type: "cheerful_carnival", banner: "白石杏" },
    61: { unit: "25點,nightcord見", type: "marathon", banner: "朝比奈真冬" },
    62: { unit: "Wonderlands × Showtime", type: "marathon", banner: "草薙寧寧" },
    63: { unit: "混活", type: "cheerful_carnival", banner: "宵崎奏" },
    64: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "小豆澤心羽" },
    65: { unit: "Leo/need", type: "marathon", banner: "天馬咲希" },
    66: { unit: "混活", type: "cheerful_carnival", banner: "草薙寧寧" },
    67: { unit: "MORE MORE JUMP!", type: "marathon", banner: "桃井愛莉" },
    68: { unit: "25點,nightcord見", type: "marathon", banner: "曉山瑞希" },
    69: { unit: "Leo/need", type: "cheerful_carnival", banner: "日野森志步" },
    70: { unit: "混活", type: "marathon", banner: "東雲繪名" },
    71: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "小豆澤心羽" },
    72: { unit: "混活", type: "cheerful_carnival", banner: "朝比奈真冬" },
    73: { unit: "MORE MORE JUMP!", type: "marathon", banner: "花里實乃理" },
    74: { unit: "Wonderlands × Showtime", type: "marathon", banner: "神代類" },
    75: { unit: "混活", type: "cheerful_carnival", banner: "小豆澤心羽" },
    76: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "白石杏" },
    77: { unit: "25點,nightcord見", type: "marathon", banner: "東雲繪名" },
    78: { unit: "MORE MORE JUMP!", type: "cheerful_carnival", banner: "桐谷遙" },
    79: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "東雲彰人" },
    80: { unit: "混活", type: "marathon", banner: "日野森雫" },
    81: { unit: "混活", type: "cheerful_carnival", banner: "天馬司" },
    82: { unit: "Wonderlands × Showtime", type: "marathon", banner: "鳳笑夢" },
    83: { unit: "Leo/need", type: "marathon", banner: "望月穗波" },
    84: { unit: "混活", type: "cheerful_carnival", banner: "星乃一歌" },
    85: { unit: "MORE MORE JUMP!", type: "marathon", banner: "日野森雫" },
    86: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "小豆澤心羽" },
    87: { unit: "混活", type: "cheerful_carnival", banner: "青柳冬彌" },
    88: { unit: "Wonderlands × Showtime", type: "marathon", banner: "天馬司" },
    89: { unit: "25點,nightcord見", type: "marathon", banner: "宵崎奏" },
    90: { unit: "混活", type: "cheerful_carnival", banner: "日野森志步" },
    91: { unit: "Leo/need", type: "marathon", banner: "天馬咲希" },
    92: { unit: "MORE MORE JUMP!", type: "marathon", banner: "桃井愛莉" },
    93: { unit: "25點,nightcord見", type: "cheerful_carnival", banner: "曉山瑞希" },
    94: { unit: "混活", type: "marathon", banner: "桐谷遙" },
    95: { unit: "Wonderlands × Showtime", type: "marathon", banner: "草薙寧寧" },
    96: { unit: "混活", type: "cheerful_carnival", banner: "望月穗波" },
    97: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "白石杏" },
    98: { unit: "MORE MORE JUMP!", type: "marathon", banner: "花里實乃理" },
    99: { unit: "混活", type: "cheerful_carnival", banner: "神代類" },
    100: { unit: "25點,nightcord見", type: "marathon", banner: "朝比奈真冬" },
    101: { unit: "Leo/need", type: "marathon", banner: "星乃一歌" },
    102: { unit: "混活", type: "cheerful_carnival", banner: "桃井愛莉" },
    103: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "東雲彰人" },
    104: { unit: "Wonderlands × Showtime", type: "marathon", banner: "鳳笑夢" },
    105: { unit: "Virtual Singer", type: "cheerful_carnival", banner: "初音未來" },
    106: { unit: "混活", type: "marathon", banner: "天馬咲希" },
    107: { unit: "混活", type: "marathon", banner: "白石杏" },
    108: { unit: "混活", type: "cheerful_carnival", banner: "星乃一歌" },
    109: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "東雲彰人" },
    110: { unit: "Leo/need", type: "marathon", banner: "日野森志步" },
    111: { unit: "MORE MORE JUMP!", type: "cheerful_carnival", banner: "日野森雫" },
    112: { unit: "25點,nightcord見", type: "world_link", banner: "25點,nightcord見" },
    113: { unit: "Wonderlands × Showtime", type: "marathon", banner: "天馬司" },
    114: { unit: "混活", type: "marathon", banner: "草薙寧寧" },
    115: { unit: "混活", type: "marathon", banner: "花里實乃理" },
    116: { unit: "25點,nightcord見", type: "marathon", banner: "宵崎奏" },
    117: { unit: "混活", type: "marathon", banner: "曉山瑞希" },
    118: { unit: "Vivid BAD SQUAD", type: "world_link", banner: "Vivid BAD SQUAD" },
    119: { unit: "Wonderlands × Showtime", type: "marathon", banner: "神代類" },
    120: { unit: "混活", type: "marathon", banner: "小豆澤心羽" },
    121: { unit: "Leo/need", type: "marathon", banner: "望月穗波" },
    122: { unit: "MORE MORE JUMP!", type: "marathon", banner: "花里實乃理" },
    123: { unit: "混活", type: "marathon", banner: "宵崎奏" },
    124: { unit: "Wonderlands × Showtime", type: "world_link", banner: "Wonderlands × Showtime" },
    125: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "青柳冬彌" },
    126: { unit: "混活", type: "marathon", banner: "東雲彰人" },
    127: { unit: "25點,nightcord見", type: "marathon", banner: "東雲繪名" },
    128: { unit: "Leo/need", type: "marathon", banner: "天馬咲希" },
    129: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "白石杏" },
    130: { unit: "MORE MORE JUMP!", type: "world_link", banner: "MORE MORE JUMP!" },
    131: { unit: "Wonderlands × Showtime", type: "marathon", banner: "鳳笑夢" },
    132: { unit: "混活", type: "marathon", banner: "花里實乃理" },
    133: { unit: "MORE MORE JUMP!", type: "marathon", banner: "桐谷遙" },
    134: { unit: "25點,nightcord見", type: "marathon", banner: "朝比奈真冬" },
    135: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "東雲彰人" },
    136: { unit: "Wonderlands × Showtime", type: "marathon", banner: "天馬司" },
    137: { unit: "Leo/need", type: "world_link", banner: "Leo/need" },
    138: { unit: "MORE MORE JUMP!", type: "marathon", banner: "桃井愛莉" },
    139: { unit: "混活", type: "marathon", banner: "宵崎奏" },
    140: { unit: "Virtual Singer", type: "world_link", banner: "Virtual Singer" },
    141: { unit: "混活", type: "marathon", banner: "鳳笑夢" },
    142: { unit: "混活", type: "marathon", banner: "桐谷遙" },
    143: { unit: "Leo/need", type: "marathon", banner: "星乃一歌" },
    144: { unit: "混活", type: "marathon", banner: "草薙寧寧" },
    145: { unit: "25點,nightcord見", type: "marathon", banner: "曉山瑞希" },
    146: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "東雲彰人" },
    147: { unit: "Leo/need", type: "marathon", banner: "天馬咲希" },
    148: { unit: "混活", type: "marathon", banner: "日野森志步" },
    149: { unit: "Wonderlands × Showtime", type: "marathon", banner: "草薙寧寧" },
    150: { unit: "25點,nightcord見", type: "marathon", banner: "東雲繪名" },
    151: { unit: "MORE MORE JUMP!", type: "marathon", banner: "日野森雫" },
    152: { unit: "混活", type: "marathon", banner: "神代類" },
    153: { unit: "混活", type: "marathon", banner: "東雲彰人" },
    154: { unit: "Vivid BAD SQUAD", type: "marathon", banner: "青柳冬彌" },
    155: { unit: "混活", type: "marathon", banner: "宵崎奏" },
    156: { unit: "混活", type: "marathon", banner: "日野森雫" },
    157: { unit: "MORE MORE JUMP!", type: "marathon", banner: "桐谷遙" },
    158: { unit: "混活", type: "marathon", banner: "望月穗波" },
    159: { unit: "混活", type: "marathon", banner: "天馬咲希" },
    160: { unit: "混活", type: "marathon", banner: "天馬司" },
    161: { unit: "25點,nightcord見", type: "marathon", banner: "宵崎奏" },
    162: { unit: "Leo/need", type: "marathon", banner: "日野森志步" },
    163: { unit: "Vivid BAD SQUAD", type: "world_link", banner: "Vivid BAD SQUAD" },
    164: { unit: "Wonderlands × Showtime", type: "marathon", banner: "鳳笑夢" }
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
