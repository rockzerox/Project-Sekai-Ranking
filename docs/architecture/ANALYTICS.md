# Vercel Analytics

本專案使用 [Vercel Analytics](https://vercel.com/analytics) 來收集訪客資料，以了解使用者行為並優化應用程式。

## 實作方式

已安裝 `@vercel/analytics` 套件，並在 `src/index.tsx` 的根元件中加入 `<Analytics />` 元件。

```tsx
import { Analytics } from '@vercel/analytics/react';

// ...
root.render(
  <React.StrictMode>
    <App />
    <Analytics />
  </React.StrictMode>
);
```

不需要額外的設定，資料會自動回報至 Vercel。
