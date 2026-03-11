import { Request, Response } from 'express';

// 此預聚合數據查詢介面已移除。
export default async function handler(req: Request, res: Response) {
  res.status(410).json({ error: 'Endpoint Deprecated' });
}
