/**
 * Hisekai API 請求工具
 * 處理 BigInt 精度問題與大型回應限制。
 */

const BIGINT_REGEX = /"([^"]+)"\s*:\s*(-?\d{15,})(?=[,}\s])/g;
const MAX_RESPONSE_SIZE = 10 * 1024 * 1024; // 10MB，防止 ReDoS 與記憶體溢位

export const HISEKAI = process.env.HISEKAI_API_BASE || 'https://api.hisekai.org/tw';

export async function fetchHisekai<T = any>(path: string): Promise<T> {
  const url = path.startsWith('http') ? path : `${HISEKAI}${path}`;
  const res = await fetch(url);
  
  if (!res.ok) {
    throw new Error(`hisekai API 請求失敗 (${res.status}): ${url}`);
  }
  
  const text = await res.text();
  
  if (text.length > MAX_RESPONSE_SIZE) {
    throw new Error('hisekai API 回應過大，已攔截。');
  }
  
  // 處理 BigInt：將長數字轉為字串
  const sanitized = text.replace(BIGINT_REGEX, '"$1": "$2"');
  return JSON.parse(sanitized);
}
