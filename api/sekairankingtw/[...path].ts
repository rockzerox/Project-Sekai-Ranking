
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. 解析路徑參數
  // 例如請求 /api/sekairankingtw/event/live/top100 -> path 為 ['event', 'live', 'top100']
  const { path } = req.query;

  if (!path || !Array.isArray(path)) {
    return res.status(400).json({ error: 'Invalid path' });
  }

  // 2. 重組目標路徑
  const targetPath = path.join('/');
  
  // 3. 處理 Query Parameters (移除 Vercel 路由用的 'path' 參數)
  const queryParams = new URLSearchParams();
  Object.keys(req.query).forEach((key) => {
    if (key !== 'path') {
      const value = req.query[key];
      if (Array.isArray(value)) {
        value.forEach(v => queryParams.append(key, v));
      } else {
        queryParams.append(key, value as string);
      }
    }
  });

  const queryString = queryParams.toString();
  const targetUrl = `https://api.hisekai.org/${targetPath}${queryString ? `?${queryString}` : ''}`;

  try {
    // 4. 向原始 API 發起請求
    const apiRes = await fetch(targetUrl, {
      method: req.method,
      headers: {
        // 設定符合規範的 User-Agent
        'User-Agent': 'SekaiRankingTW/1.0.0 (contact: github.com/rockzerox)',
        'Content-Type': 'application/json',
        // 未來若需 API Key，可在此處加入: 'Authorization': process.env.API_KEY
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });

    // 5. 處理回應
    const data = await apiRes.text();

    // 轉發原始狀態碼
    res.status(apiRes.status);
    
    // 設定回傳 Header
    res.setHeader('Content-Type', apiRes.headers.get('Content-Type') || 'application/json');
    // 允許跨域 (雖然同源 Proxy 通常不需要，但保留以防萬一)
    res.setHeader('Access-Control-Allow-Origin', '*');

    res.send(data);
  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ error: 'Failed to fetch data from upstream API' });
  }
}
