export interface CharInfo {
    id: string;
    name: string;
    color: string;
    unit: string;
}

export interface UnitInfo {
    name: string;
    color: string;
    abbr: string;
    style: string;
    urlKey: string; 
}

export const API_BASE_URL = "https://api.hisekai.org";

export const UNITS: Record<string, UnitInfo> = {
    "1": { name: "Leo/need", color: "#4455DD", abbr: "LN", style: "bg-blue-600 text-white", urlKey: "LN" },
    "2": { name: "MORE MORE JUMP!", color: "#88DD44", abbr: "MMJ", style: "bg-green-500 text-white", urlKey: "MMJ" },
    "3": { name: "Vivid BAD SQUAD", color: "#EE1166", abbr: "VBS", style: "bg-pink-600 text-white", urlKey: "VBS" },
    "4": { name: "Wonderlands × Showtime", color: "#FF9900", abbr: "WS", style: "bg-orange-500 text-white", urlKey: "WS" },
    "5": { name: "25點，Nightcord見。", color: "#884499", abbr: "25", style: "bg-purple-700 text-white", urlKey: "25" },
    "0": { name: "Virtual Singer", color: "#33CCBB", abbr: "VS", style: "bg-teal-400 text-white", urlKey: "VS" },
    "99": { name: "Mix", color: "#94a3b8", abbr: "Mix", style: "bg-slate-500 text-white", urlKey: "" }
};

export const UNIT_MASTER = UNITS;
export const UNIT_ORDER = ["1", "2", "3", "4", "5", "0", "99"];

export const CHARACTERS: Record<string, CharInfo> = {
    "1": { id: "1", name: "星乃一歌", color: "#33AAEE", unit: "1" },
    "2": { id: "2", name: "天馬咲希", color: "#FFDD44", unit: "1" },
    "3": { id: "3", name: "望月穗波", color: "#EE6666", unit: "1" },
    "4": { id: "4", name: "日野森志步", color: "#BBDD22", unit: "1" },
    "5": { id: "5", name: "花里實乃理", color: "#FFCCAA", unit: "2" },
    "6": { id: "6", name: "桐谷遙", color: "#99CCFF", unit: "2" },
    "7": { id: "7", name: "桃井愛莉", color: "#FFAACC", unit: "2" },
    "8": { id: "8", name: "日野森雫", color: "#99EEDD", unit: "2" },
    "9": { id: "9", name: "小豆澤心羽", color: "#FF6699", unit: "3" },
    "10": { id: "10", name: "白石杏", color: "#00BBDD", unit: "3" },
    "11": { id: "11", name: "東雲彰人", color: "#FF7722", unit: "3" },
    "12": { id: "12", name: "青柳冬彌", color: "#0077DD", unit: "3" },
    "13": { id: "13", name: "天馬司", color: "#FFBB00", unit: "4" },
    "14": { id: "14", name: "鳳笑夢", color: "#FF66BB", unit: "4" },
    "15": { id: "15", name: "草薙寧寧", color: "#33DD99", unit: "4" },
    "16": { id: "16", name: "神代類", color: "#BB88EE", unit: "4" },
    "17": { id: "17", name: "宵崎奏", color: "#BB6688", unit: "5" },
    "18": { id: "18", name: "朝比奈真冬", color: "#8888CC", unit: "5" },
    "19": { id: "19", name: "東雲繪名", color: "#CCAA88", unit: "5" },
    "20": { id: "20", name: "曉山瑞希", color: "#DDAACC", unit: "5" },
    "21": { id: "21", name: "初音未來", color: "#33CCBB", unit: "0" },
    "22": { id: "22", name: "鏡音鈴", color: "#FFCC11", unit: "0" },
    "23": { id: "23", name: "鏡音連", color: "#FFEE11", unit: "0" },
    "24": { id: "24", name: "巡音流歌", color: "#FFBBCC", unit: "0" },
    "25": { id: "25", name: "MEIKO", color: "#DD4444", unit: "0" },
    "26": { id: "26", name: "KAITO", color: "#3366CC", unit: "0" }
};

export const CHARACTER_MASTER = CHARACTERS;

export const getChar = (idOrName: string): CharInfo | undefined => {
    if (CHARACTERS[idOrName]) return CHARACTERS[idOrName];
    return Object.values(CHARACTERS).find(c => c.name === idOrName);
};

export const getUnit = (idOrName: string): UnitInfo | undefined => {
    if (UNITS[idOrName]) return UNITS[idOrName];
    return Object.values(UNITS).find(u => u.name === idOrName);
};

export const calculatePreciseDuration = (start: string, aggregate: string): number => {
    const s = new Date(start).getTime();
    const a = new Date(aggregate).getTime();
    return Math.max(0.01, (a - s) / 86400000);
};

export const calculateDisplayDuration = (start: string, aggregate: string): number => {
    return Math.ceil(calculatePreciseDuration(start, aggregate));
};

export const getEventStatus = (start: string, aggregate: string, closed: string, announce: string): string => {
    const now = Date.now();
    const s = new Date(start).getTime();
    const a = new Date(aggregate).getTime();
    const an = new Date(announce).getTime();
    if (now < s) return 'upcoming';
    if (now < a) return 'live';
    if (now < an) return 'aggregating';
    return 'past';
};

export const getUnitOptions = (allLabel: string | null = '團體') => {
    const options = UNIT_ORDER.filter(id => id !== "99").map(id => ({ value: id, label: UNIT_MASTER[id].name }));
    return allLabel ? [{ value: 'all', label: allLabel }, ...options] : options;
};

export const getBannerOptions = (allLabel: string | null = 'Banner') => {
    const options = Object.values(CHARACTER_MASTER).slice(0, 26).map(char => ({ 
        value: char.id, 
        label: char.name,
        style: { color: char.color }
    }));
    return allLabel ? [{ value: 'all', label: allLabel }, ...options] : options;
};

export const getFourStarOptions = (allLabel: string | null = '四星') => {
    const options = Object.values(CHARACTER_MASTER).slice(0, 26).map(char => ({ 
        value: char.id, 
        label: char.name,
        style: { color: char.color }
    }));
    return allLabel ? [{ value: 'all', label: allLabel }, ...options] : options;
};

export const getEventTypeOptions = (allLabel: string | null = '活動類型') => {
    const options = [{ value: 'marathon', label: '馬拉松' }, { value: 'cheerful_carnival', label: '歡樂嘉年華' }, { value: 'world_link', label: 'World Link' }];
    return allLabel ? [{ value: 'all', label: allLabel }, ...options] : options;
};

export const getStoryTypeOptions = (allLabel: string | null = '劇情') => {
    const options = [{ value: 'unit_event', label: '箱活' }, { value: 'mixed_event', label: '混活' }, { value: 'world_link', label: 'World Link' }];
    return allLabel ? [{ value: 'all', label: allLabel }, ...options] : options;
};

export const getCardTypeOptions = (allLabel: string | null = '卡池類型') => {
    const options = [{ value: 'permanent', label: '常駐' }, { value: 'limited', label: '限定' }, { value: 'special_limited', label: '特殊限定' }];
    return allLabel ? [{ value: 'all', label: allLabel }, ...options] : options;
};

const BASE_IMAGE_URL = "https://raw.githubusercontent.com/rockzerox/Storage/refs/heads/main/Project-Sekai-Ranking";

export const getAssetUrl = (
    idOrName: string | undefined, 
    type: 'character' | 'character_full' | 'character_q' | 'unit' | 'unit_full' | 'event'
): string | undefined => {
    if (!idOrName) return undefined;
    if (type === 'event') return `${BASE_IMAGE_URL}/event_logo/${idOrName}.png`;
    if (type.startsWith('character')) {
        let filename = idOrName;
        if (!idOrName.includes('-')) {
            const char = getChar(idOrName);
            if (!char) return undefined;
            filename = char.id;
        }
        if (type === 'character_full') return `${BASE_IMAGE_URL}/Chra/${filename}.webp`;
        if (type === 'character_q') return `${BASE_IMAGE_URL}/Q/${filename}.webp`;
        return `${BASE_IMAGE_URL}/Chibi/${filename}.png`;
    } 
    if (type.startsWith('unit')) {
        const unit = getUnit(idOrName);
        if (!unit || !unit.urlKey) return undefined;
        const suffix = type === 'unit_full' ? 'full_logo' : 'logo';
        return `${BASE_IMAGE_URL}/logo/${unit.urlKey}_${suffix}.png`;
    }
    return undefined;
};