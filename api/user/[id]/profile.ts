import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withFallback } from '../../_lib/withFallback';

const HISEKAI_API_BASE = process.env.HISEKAI_API_BASE || 'https://api.hisekai.org/tw';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  return withFallback(
    res,
    `profile-${id}`,
    // ① 主要來源：Supabase (通常個人資料不存 DB，或僅存基本資訊)
    async () => null,
    // ② 備援來源：Hisekai API
    async () => {
      const response = await fetch(`${HISEKAI_API_BASE}/user/${id}/profile`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const text = await response.text();
      // 使用與前端一致的 Regex 將大數字轉為引號字串，防止 Node.js 解析時精度丟失
      const BIGINT_REGEX = /"([^"]+)"\s*:\s*(-?\d{15,})(?=[,}\s])/g;
      const sanitized = text.replace(BIGINT_REGEX, '"$1": "$2"');
      
      return JSON.parse(sanitized);
    }
  );
}
