/**
 * mobileTokens.ts — 手機版 Design Token 常數
 *
 * 原則：
 * - 所有值均從現有元件的 `sm:` Tailwind 前綴中提煉，不改變視覺輸出
 * - 語義命名（按 UI 角色，而非 Tailwind 原生尺寸）
 * - 作為「預設值」使用；特殊場景（如 WorldLink compact mode）保留 inline override
 *
 * 斷點守則：
 * - 手機端（<640px）：裸 class（左側）
 * - 桌面端（≥640px）：`sm:` 前綴（右側）
 */

export const MOBILE_CLASSES = {
  /**
   * 文字
   */
  text: {
    /** 頁面主標題，如 h2 */
    pageTitle: 'text-xl sm:text-3xl',
    /** 區段標題，如 CollapsibleSection header */
    sectionTitle: 'text-base sm:text-lg',
    /** 一般內文（偏大），如最後上線時間數值 */
    bodyLg: 'text-sm sm:text-base',
    /** 一般內文，如 Select、Pagination 按鈕 */
    body: 'text-xs sm:text-sm',
    /** 統計主數值（分數/日均），以品牌色呈現 */
    valueLg: 'text-base sm:text-lg',
    /** 說明文字 / 副標籤，如「總分」「日均」 */
    caption: 'text-[10px] sm:text-xs',
    /** 極小標註，如離線時間 "2h" */
    micro: 'text-[8px] sm:text-[9px]',
  },

  /**
   * 頭像 / 圓形圖示
   */
  avatar: {
    /** RankingItem 玩家頭像 */
    md: 'w-7 h-7 sm:w-10 sm:h-10',
    /** 在線綠點 / 存在點 */
    dot: 'w-2 h-2 sm:w-2.5 sm:h-2.5',
  },

  /**
   * 小圖示 (SVG icon)
   */
  icon: {
    /** 展開箭頭、一般操作圖示 */
    sm: 'w-4 h-4 sm:w-5 sm:h-5',
    /** 月亮等裝飾性小圖示 */
    xs: 'w-2.5 h-2.5 sm:w-3 sm:h-3',
  },

  /**
   * 內距 (Padding)
   */
  padding: {
    /** RankingItem 行內距 */
    item: 'p-1.5 sm:p-3',
    /** 展開詳情卡片內距 */
    card: 'p-3 sm:p-4',
  },

  /**
   * 版面尺寸 / 間距
   */
  layout: {
    /** 名次欄寬度 */
    rankW: 'w-8 sm:w-16',
    /** 頭像水平外距 */
    avatarMx: 'mx-1 sm:mx-3',
    /** 展開圖示左外距 */
    expandMl: 'ml-2 sm:ml-4',
    /** 統計區段最小寬度 */
    statsMinW: 'min-w-[4rem] sm:min-w-[7rem]',
    /** 月亮休息條寬度 */
    restBarW: 'w-14 sm:w-20',
    /** 月亮休息條高度 */
    restBarH: 'h-1 sm:h-1.5',
  },

  /**
   * 共用 UI 元件 (Select / Pagination 等)
   */
  select: {
    /** Select 下拉選單文字大小 */
    text: 'text-xs sm:text-sm',
  },

  /**
   * 篩選器元件 (EventFilterGroup / SortSelector)
   */
  filter: {
    /** Modal 內 label 說明文字 */
    label: 'text-[10px] sm:text-xs',
    /** 篩選器觸發按鈕文字 */
    button: 'text-xs sm:text-sm',
  },
} as const;

