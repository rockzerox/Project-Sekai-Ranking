# 🧩 組件規格說明書 - 世界選單互動首頁 (Sekai Home View)

**撰寫日期**: 2026-06-27
**版本號**: 1.0.0

**文件代號**: `COMPONENT_SEKAI_HOME_VIEW`
**對應視圖**: `src/components/pages/SekaiHomeView.tsx`
**主要用途**: 提供高度沉浸式的 3D 橢圓形軌道世界球 Carousel 選單介面。結合五大 SEKAI 背景圓窗遮罩、浮動水晶碎片背景、鋼鐵人 HUD 懸浮全息說明面板與角色頭像 inline 行功能次選單，呈現高度還原遊戲風格的非官方首頁。

---

## 1. 功能概述 (Feature Overview)

本組件是專案互動式 UI/UX 的核心展現，跳脫傳統平面的卡片列表，透過仿照《世界計畫》遊戲內世界切換的 3D 卡牌式水晶球公轉軌道，將專案的五大主要功能區域（查榜、分析、角色、玩家、工具）化為五顆浮空世界球。

### 1.1 核心功能
*   **3D 橢圓形軌道輪播 (3D Elliptical Carousel)**:
    *   利用正弦/餘弦三角函數與選中索引 `activeIndex` 計算 3D 橢圓位置，參數設為橫向半徑 A = `680` (左右跨度 1360px) 與縱向半徑 B = `130` (高低深度 260px)。
    *   根據 Z 軸深度因子 (`depthFactor`) 動態遞減後方球體的大小 (Scale `0.72 ~ 1.0`) 與透明度 (Opacity `0.45 ~ 1.0`)，營造極強的立體空間深度。
*   **世界球圓窗遮罩與主題發光 (Orb Circular Crop & Glow)**:
    *   將五大團體世界圖片（`LNsekai.png`、`MMJsekai.png`、`VBSsekai.png`、`WSsekai.png`、`25sekai.png`）承載於圓形遮罩 (`rounded-full overflow-hidden`)。
    *   中央選中世界球擁有專屬代表色發光 Coating Overlay 與外發光脈衝動畫（Pulse Glow）；滑鼠懸停時球體會平滑放大（Hover Scale-115），互動感極佳。
*   **次選單加寬頭像 Inline 按鈕 (Submenu Inline Avatar Buttons)**:
    *   當選中某個功能球時，左右兩側會浮現對應的子功能按鈕。按鈕尺寸加寬為 **`w-56 h-14`**，排版為 `justify-between px-4`，以 Icon + 文字 + 頭像一行呈現。
    *   加上了 **`whitespace-nowrap`、`min-w-0` 與 `truncate`**，確保中文功能名稱在任何解析度下絕不換行。
    *   右側動態渲染該功能推薦代表角色的圓形小頭像 (**`w-8 h-8`**)，完美結合 IP 角色元素。
*   **全息 HUD 說明面板 (Holographic HUD Information Panel)**:
    *   懸停在子功能按鈕時，按鈕側邊會滑出高科技鋼鐵人全息面板 (`AnimatePresence` 寬度拉伸動效，尺寸 `320px * 110px`)。
    *   大氣的字體大小（大標題 `text-xs md:text-sm`，詳細簡介 `text-[11px] md:text-xs`），折角細線採用對應角色代表色，科技感爆棚。
*   **晶瑩霓虹水晶碎角 (Floating Shards)**:
    *   隨機生成 15 個 Sekai 幾何三角形碎片並給予漂浮與自轉動畫。
    *   在深色模式下套用 **`mixBlendMode: 'screen'`**，並使用濾鏡 **`drop-shadow(0 0 10px)`** 給予單位配色微光，消除突兀感並營造夢幻的水晶折射光暈。
*   **網站標題完全同步 (Classic Title Synchronization)**:
    *   網站頂部標題完全與經典舊版首頁保持一致（`text-3xl md:text-4xl`），並於左右兩側重新加上帶有 `bg-cyan-500/10` 圓形包裹、hover 時會自轉的經典音符圖標 (`TrophyIcon` 實際為八分音符元件)。

---

## 2. 介面定義 (Props Interface)

```typescript
interface Feature {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    charColor: string;
    charId?: string; // 角色 ID，用於獲取 Chibi 圓形小頭像
}

interface FeatureSection {
    category: string;
    color: string;
    features: Feature[];
}

interface SekaiHomeViewProps {
    setCurrentView: (view: ViewType) => void;
    sections: FeatureSection[];
    setViewStyle: (style: 'sekai' | 'classic') => void;
}
```

---

## 3. 模組依賴 (Module Dependencies)

*   **動畫庫**: `framer-motion` (提供世界球切換、懸浮全息 HUD 出現的平滑補間動畫)
*   **內部工具**: `../../utils/gameUtils.ts`
    *   `getAssetUrl(charId, 'character')`: 動態抓取對應角色的 Chibi 圓形頭像 CDN。
    *   `getChar`: 配合獲取角色詳細資訊。
*   **配置與語系**: `../../config/uiText.ts` (獲取 `UI_TEXT` 頂部及免責聲明文字)
*   **圖標元件**: `../../components/icons/TrophyIcon.tsx` (提供頂部對齊經典首頁的音符 Logo)

---

## 4. 引用位置 (Usage Locations)

此組件目前僅供以下視圖作為首頁首選互動風格調用：
1.  **`HomeView.tsx`**: 作為首頁主 wrapper。預設 `viewStyle === 'sekai'` 時渲染 `SekaiHomeView`。右上角切換至經典風格時，則降級為常規卡片佈局。
