// 基於資安考量與系統架構調整，此預處理腳本已移除。
// 玩家結構分析已完全移往客戶端 (Client-side) 計算。
export default async function handler(req: any, res: any) {
  res.status(410).json({ error: 'Endpoint Deprecated', message: 'This aggregation script has been removed for security reasons.' });
}
