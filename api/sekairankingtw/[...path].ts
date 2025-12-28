// 此 Proxy 目前未啟用。
// 為了避免 404 造成的前端解析崩潰，回傳一個明確的 JSON 錯誤，而非 Vercel 預設 HTML。
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.status(503).json({ 
        error: 'Proxy Under Maintenance', 
        message: '目前的數據請求已改為直接連接原始 API。請更新您的常數設定。' 
    });
}