// 此預聚合數據查詢介面已移除。
export default async function handler(req: any, res: any) {
  res.status(410).json({ error: 'Endpoint Deprecated' });
}
