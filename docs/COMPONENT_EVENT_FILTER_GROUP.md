# 🧩 組件規格說明書 - 活動篩選器群組 (EventFilterGroup)

**文件代號**: `COMPONENT_EVENT_FILTER_GROUP`
**檔案路徑**: `src/components/ui/EventFilterGroup.tsx`
**主要用途**: 提供統一且可複用的活動屬性篩選介面，支援多種篩選條件（團體、活動類型、劇情類型、卡面屬性、四星角色）。

---

## 1. 功能概述 (Feature Overview)

`EventFilterGroup` 是一個高度模組化的篩選器組件，廣泛應用於「過往活動」、「活動比較分析」、「活動分佈統計」等頁面。它允許使用者透過直覺的按鈕與下拉選單，快速過濾出符合特定條件的活動清單。

### 1.1 核心功能
*   **多維度篩選**: 支援 5 種不同的篩選維度：
    *   `unit`: 團體 (L/N, MMJ, VBS, WxS, N25, VS, 混合)
    *   `type`: 活動類型 (Marathon, Cheerful Carnival)
    *   `storyType`: 劇情類型 (箱活, 混活)
    *   `cardType`: 卡面屬性 (Cute, Cool, Pure, Happy, Mysterious)
    *   `fourStar`: 四星角色 (特定角色)
*   **雙模式支援 (Mode)**:
    *   `inclusive` (包容模式): 預設模式，當選擇了特定條件時，只要活動**包含**該條件即符合（例如：選擇「星乃一歌」，只要一歌有出四星卡就算符合）。
    *   `exclusive` (互斥模式): 嚴格模式，通常用於「活動比較分析」頁面，確保篩選出的活動完全符合單一條件。
*   **響應式與緊湊佈局 (Compact)**:
    *   支援 `compact={true}` 屬性。開啟時，篩選器會收合為一個「篩選條件」按鈕，點擊後彈出浮動選單 (Popover) 顯示完整的篩選選項，大幅節省畫面空間。

### 1.2 互動機制
*   **狀態提升 (Lifting State Up)**: 組件本身不保留篩選結果，而是透過 `filters` (目前狀態) 與 `onFilterChange` (狀態更新函式) 將使用者的選擇回傳給父組件處理。
*   **即時反饋**: 選擇任何條件後，按鈕與選單會立即更新視覺狀態（高亮顯示已選條件），並觸發父組件的資料重新過濾。
*   **重置功能**: 每個維度都包含「全部 (All)」選項，方便使用者隨時清除單一維度的篩選限制。

---

## 2. 技術實作 (Technical Implementation)

### 2.1 屬性介面 (Props Interface)
```typescript
interface EventFilterGroupProps {
    filters: EventFilterState;
    onFilterChange: (newFilters: EventFilterState) => void;
    mode?: 'inclusive' | 'exclusive';
    compact?: boolean;
    containerClassName?: string;
}
```

### 2.2 狀態與資料來源
*   依賴 `src/config/constants.ts` 中的常數資料：
    *   `UNIT_MASTER`: 團體清單與顏色。
    *   `EVENT_TYPES`: 活動類型清單。
    *   `CARD_TYPES`: 卡面屬性清單。
    *   `CHARACTERS`: 角色清單與顏色。
*   使用 `useState` 管理 `compact` 模式下的彈出視窗開關狀態 (`isOpen`)。
*   使用 `useRef` 與 `useEffect` 實作「點擊外部關閉 (Click Outside)」邏輯。

---

## 3. UI/UX 排版設計 (UI Layout)

### 3.1 標準模式 (Standard Mode)
*   將所有篩選條件並排顯示於畫面上。
*   使用按鈕群組 (Button Groups) 呈現「團體」與「活動類型」，提供快速點擊體驗。
*   使用下拉選單 (Select) 呈現「劇情類型」、「卡面屬性」與「四星角色」，避免佔用過多空間。
*   已選中的按鈕會套用對應的代表色（例如：選擇 L/N 會顯示藍色背景），未選中則為灰色。

### 3.2 緊湊模式 (Compact Mode)
*   **觸發按鈕**: 顯示一個帶有漏斗圖示的「篩選條件」按鈕。若有啟用任何篩選條件，按鈕會顯示高亮顏色 (Cyan) 並提示已套用篩選。
*   **彈出視窗 (Popover)**: 
    *   點擊按鈕後，在按鈕下方彈出包含所有篩選選項的面板。
    *   面板具有陰影 (`shadow-xl`) 與邊框，並支援暗色模式 (`dark:bg-slate-800`)。
    *   在手機版上，面板寬度會自動適應螢幕 (`w-[calc(100vw-2rem)]`)，確保不會超出畫面邊界。

---

## 4. 模組依賴 (Module Dependencies)

*   `src/types.ts` (引用 `EventFilterState`)
*   `src/config/constants.ts` (引用各項常數與字典)
*   `src/utils/gameUtils.ts` (引用 `getAssetUrl` 獲取圖示)
*   `lucide-react` (引用 `Filter` 圖示)
