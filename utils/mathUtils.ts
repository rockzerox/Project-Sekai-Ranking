
/**
 * 統計工具函式庫
 */

// 計算平均數
export const calculateMean = (numbers: number[]): number => {
    if (numbers.length === 0) return 0;
    const sum = numbers.reduce((acc, val) => acc + val, 0);
    return Math.round(sum / numbers.length);
};

// 計算中位數
export const calculateMedian = (numbers: number[]): number => {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 
        ? sorted[mid] 
        : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
};

// 計算標準差
export const calculateStdDev = (numbers: number[]): number => {
    if (numbers.length === 0) return 0;
    const mean = numbers.reduce((acc, val) => acc + val, 0) / numbers.length;
    const squareDiffs = numbers.map(value => Math.pow(value - mean, 2));
    const avgSquareDiff = squareDiffs.reduce((acc, val) => acc + val, 0) / numbers.length;
    return Math.round(Math.sqrt(avgSquareDiff));
};

// 計算最大值
export const calculateMax = (numbers: number[]): number => {
    if (numbers.length === 0) return 0;
    return Math.max(...numbers);
};

// 計算最小值
export const calculateMin = (numbers: number[]): number => {
    if (numbers.length === 0) return 0;
    return Math.min(...numbers);
};

// 分數格式化為中文億萬（一般顯示用，包含「約」）
export const formatScoreToChinese = (score: number): string => {
    if (score >= 100000000) {
        const yi = Math.floor(score / 100000000);
        const wan = Math.floor((score % 100000000) / 10000);
        return `約 ${yi} 億 ${wan.toLocaleString()} 萬`;
    } else if (score >= 10000) {
        const wan = Math.floor(score / 10000);
        return `約 ${wan.toLocaleString()} 萬`;
    }
    return score.toLocaleString();
};

// 圖表專用分數格式化（不含「約」，支援億/萬單位）
export const formatScoreForChart = (score: number): string => {
    if (score >= 100000000) {
        const yi = Math.floor(score / 100000000);
        const wan = Math.floor((score % 100000000) / 10000);
        return wan > 0 ? `${yi}億${wan}萬` : `${yi}億`;
    } else if (score >= 10000) {
        const wan = Math.floor(score / 10000);
        return `${wan}萬`;
    }
    return Math.round(score).toLocaleString();
};
