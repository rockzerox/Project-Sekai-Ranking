# 📄 元件規格說明書 - EventHeaderCountdown

**撰寫日期**: 2026-04-03
**版本號**: 1.1.0

**文件代號**: `COMPONENT_EVENT_HEADER_COUNTDOWN`
**對應檔案**: `src/components/ui/EventHeaderCountdown.tsx`
**主要用途**: 顯示距離活動結算的倒數計時，支援兩種渲染模式（標準帶框版 / 裸文字版）。

---

## 1. Props 介面

```typescript
interface EventHeaderCountdownProps {
    targetDate: string;    // ISO 8601 格式的目標時間
    className?: string;    // 附加 CSS class（append 模式）
    bare?: boolean;        // true = 裸文字模式（無外框/背景/padding）
}
```

---

## 2. 渲染模式

### 2.1 標準模式 (`bare = false`，預設)

```
┌─────────────────────────────────────┐
│  03日:10時:42分:17秒                │  ← bg-slate-100 + border
└─────────────────────────────────────┘
```

```html
<div class="inline-block font-mono text-sm sm:text-base font-bold
            text-slate-500 dark:text-slate-400
            bg-slate-100 dark:bg-slate-800
            px-2 py-1 rounded border border-slate-300 dark:border-slate-600
            {className}">
    {timeLeft}
</div>
```

**適用場景**: 桌面端 Header、獨立倒數顯示區塊。

### 2.2 裸文字模式 (`bare = true`)

```
03日:10時:42分:17秒                   ← 純文字，無外框
```

```html
<span class="font-mono font-bold text-slate-500 dark:text-slate-400 {className}">
    {timeLeft}
</span>
```

**適用場景**: 手機端緊湊 Header 第二行（與更新時間同行顯示）。

---

## 3. 計時邏輯

*   使用 `useEffect` + `setInterval(1000ms)` 每秒更新。
*   格式：`DD日:HH時:MM分:SS秒`（零填充至兩位）。
*   若 `distance <= 0`，固定顯示 `00日:00時:00分:00秒`。
*   元件卸載時 `clearInterval` 防止記憶體洩漏。

---

## 4. 使用範例

```tsx
// 桌面端 Header（標準帶框）
<EventHeaderCountdown targetDate={countdownTarget} />

// 手機端緊湊排（裸文字，與更新時間同行）
<EventHeaderCountdown targetDate={countdownTarget} bare className="text-[10px]" />
```

---

## 5. 版本歷史

| 版本 | 日期 | 變更 |
|---|---|---|
| 1.0.0 | 2026-03-19 | 初始版本，標準帶框模式 |
| 1.1.0 | 2026-04-03 | 新增 `bare` prop，支援裸文字渲染模式，用於手機端緊湊 Header |
