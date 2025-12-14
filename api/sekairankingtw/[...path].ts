
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. 解析路徑參數
  // Vercel 的 Catch-all 路由 ([...path].ts) 會將路徑片段作為字串陣列傳入 req.query.path
  // 例如請求 /api/sekairankingtw/event/live/top100 -> path 為 ['event', 'live', 'top100']
  const { path } = req.query;

  if (!path || !Array.isArray(path)) {
    return res.status(400).json({ error: 'Invalid path parameters. Expected catch-all route.' });
  }

  // 2. 重組目標路徑
  const targetPath = path.join('/');
  
  // 3. 處理 Query Parameters (移除 Vercel 路由用的 'path' 參數，保留其他參數)
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
        'User-Agent': 'SekaiRankingTW/1.0.0 (contact: github.com/rockzerox)',
        'Content-Type': 'application/json',
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });

    // 5. 處理回應
    const data = await apiRes.text();

    res.status(apiRes.status);
    
    // 轉發 Content-Type
    const contentType = apiRes.headers.get('Content-Type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
    
    // 設定 CORS 與 快取 (非強制，但建議加入)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=59');

    res.send(data);
  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ error: 'Failed to fetch data from upstream API' });
  }
}
