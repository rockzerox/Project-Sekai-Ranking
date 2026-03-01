# 活動曲目及MV (Event Songs and MVs) 頁面規格書

## 1. 功能概述
「活動曲目及MV」頁面位於「工具 SEKAI」分類下，主要提供 Project Sekai 台服各期活動的關聯歌曲資訊。
使用者可以透過此頁面查詢各期活動的書下曲（或相關曲目），並以沉浸式的輪播介面瀏覽歌曲詳情、試聽片段及觀看 MV。

## 2. 資料依賴與處理
此頁面整合了多個資料來源：
*   **`src/data/song.json`**: 提供核心的歌曲資訊，包含 `songId`, `title`, `lyricist`, `composer`, `arranger`, `mv2d`, `mv3d`, `publishedAt`, `duration`, `bpm` 等。
*   **`src/data/eventDetail.json`**: 透過 `eventId` 關聯，取得該活動的所屬團體 (`unit`) 與 Banner 角色 (`banner`)。
*   **API `/event/list`**: 取得活動名稱與時間資訊。

## 3. UI/UX 排版與設計
*   **主題色**: 採用深色系 (Slate/Cyan) 風格，營造沉浸式體驗。
*   **頁面標頭**: 顯示大標題「活動曲目及MV」與說明文字。
*   **篩選與排序區塊**: 
    *   使用 `EventFilterGroup` 組件，提供團體、角色、屬性、類型等篩選條件。
    *   提供排序功能，支援依據上線時間、BPM、時長、Note數等進行排序。
*   **主要展示區**: 使用 3D 輪播 (Carousel) 組件 `SongCarousel` 展示歌曲卡片。

## 4. 篩選器與排序功能
提供多維度的篩選與排序功能：
1.  **團體 (Unit)**: 篩選特定團體的歌曲。
2.  **角色 (Character)**: 篩選特定角色參與的歌曲。
3.  **屬性 (Attribute)**: 篩選特定屬性（如 Cute, Cool 等）的歌曲。
4.  **類型 (Type)**: 篩選歌曲類型（如書下曲、翻唱曲等）。

**排序功能**:
*   支援多種排序依據：上線時間 (預設)、BPM、時長、Note數 (Easy/Normal/Hard/Expert/Master)。
*   支援升冪 (ASC) 與降冪 (DESC) 切換。

## 5. 歌曲卡片設計
輪播中的歌曲卡片 (`SongCard`) 包含以下資訊：
1.  **封面圖片**: 顯示歌曲封面，支援點擊翻轉查看詳細資訊。
2.  **基本資訊**: 歌名、團體 Icon、屬性 Icon。
3.  **詳細資訊 (翻轉後)**:
    *   作詞、作曲、編曲者。
4.  **互動按鈕**:
    *   **2D MV / 3D MV**: 點擊開啟 YouTube 連結。

## 6. 互動設計
*   **輪播導航**:
    *   **桌機版**: 顯示左右箭頭按鈕，支援鍵盤左右鍵切換。
    *   **手機版**: 隱藏箭頭按鈕，支援左右滑動 (Swipe) 手勢切換，提供更自然的觸控體驗。
*   **響應式設計**: 卡片大小與版面配置會根據螢幕寬度自動調整。

## 7. 相關檔案
*   `src/components/pages/EventSongsView.tsx`: 頁面主組件。
*   `src/components/ui/SongCarousel.tsx`: 輪播組件。
*   `src/components/ui/SongCard.tsx`: 歌曲卡片組件。
*   `src/components/ui/EventFilterGroup.tsx`: 篩選器組件。
