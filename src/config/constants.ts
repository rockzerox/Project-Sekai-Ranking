
import { CharInfo, UnitInfo } from '../types';

export const API_BASE_URL = "/api";
export const MS_PER_DAY = 86400000;

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
    "26": { id: "26", name: "KAITO", color: "#3366CC", unit: "0" },
};

export const CHARACTER_MASTER = CHARACTERS;
