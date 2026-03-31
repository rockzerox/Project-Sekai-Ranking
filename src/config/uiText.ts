
export const UI_TEXT = {
  common: {
    siteName: "PJSK TW Observatory",
    subTitle: "Database",
    unofficialLabel: "非官方粉絲製作網站",
    dataBy: "Data by",
    stats: {
      max: "最高分紀錄",
      mean: "平均分數",
      median: "中位數",
      min: "最低分紀錄",
      stdDev: "標準差",
      count: "統計期數"
    },
    filter: {
      button: "篩選條件",
      apply: "套用",
      clearAll: "清除全部",
      noFilter: "無篩選條件",
      activeFilters: "目前篩選："
    }
  },
  sidebar: {
    categories: {
      ranking: "查榜 SEKAI",
      analysis: "分析 SEKAI",
      character: "推角 SEKAI",
      player: "玩家 SEKAI",
      tools: "工具 SEKAI",
    },
    items: {
      live: "現時活動",
      past: "歷代活動",
      distribution: "活動分布概況",
      comparison: "活動比較分析",
      analysis: "活動榜線排名",
      trend: "活動榜線趨勢",
      worldLink: "World Link 分析",
      unitAnalysis: "團推分析",
      characterAnalysis: "推角分析",
      playerAnalysis: "活躍玩家分析",
      playerStructure: "玩家排名結構",
      playerProfile: "玩家狀態查詢",
      resourceEstimator: "預估資源計算機",
      mySekaiMining: "MySekai 採集計算機",
      eventSongs: "活動曲目",
    },
    actions: {
      toggleTheme: "切換主題",
      collapseMenu: "收合選單",
    }
  },
  home: {
    title: "PJSK TW Observatory",
    description: "提供 Project Sekai 台服最完整的排名數據查詢、歷代活動存檔以及多維度的數據分析工具。",
    features: {
      live: { title: "現時活動", desc: "查看目前正在進行中的活動即時排名、分數預測及時速分析。" },
      past: { title: "歷代活動", desc: "瀏覽 Project Sekai 台服過往所有活動的榜單紀錄與詳細資訊。" },
      distribution: { title: "活動分布概況", desc: "檢視活動時間分布，呈現角色/團體的活動密集度與空窗期。" },
      comparison: { title: "活動比較分析", desc: "選擇任兩期過往活動，透過圖表比較分數線趨勢與競爭激烈程度。" },
      analysis: { title: "活動榜線排名", desc: "查詢歷代活動在特定排名的最高分紀錄排行。" },
      trend: { title: "活動榜線趨勢", desc: "以折線圖觀察歷代活動特定排名分數隨期數變化的趨勢。" },
      worldLink: { title: "World Link 分析", desc: "World Link 特殊活動類型的綜合分析，包含各角色章節排名。" },
      unitAnalysis: { title: "團推分析", desc: "以團體角度整合統計數據，分析歷代活動的熱度與參與度。" },
      characterAnalysis: { title: "推角分析", desc: "以角色視角整合統計數據，分析 Banner 活動的熱度分佈。" },
      playerAnalysis: { title: "活躍玩家分析", desc: "分析歷代活動中的活躍玩家，查看上榜次數最多的玩家排行。" },
      playerStructure: { title: "玩家排名結構", desc: "利用前百名玩家不重複率，分析整體、各團體與角色的名次流動與排名固化情形。" },
      playerProfile: { title: "玩家狀態查詢", desc: "查詢該玩家的詳細資料、綜合力組成與歌曲通關狀況。" },
      resourceEstimator: { title: "預估資源計算機", desc: "依據過往活動分數預估未來活動所需的大補充罐數。" },
      mySekaiMining: { title: "MySekai 採集計算機", desc: "提供透過 MySekai 採集機制及社群經驗公式計算獲得活動 Pt。" },
      eventSongs: { title: "活動曲目", desc: "提供各期活動書下曲與官方MV連結。" },
    }
  },
  pastEvents: {
    title: "歷代活動 (Past Events)",
    totalCountPrefix: "目前收錄",
    totalCountSuffix: "個已結束活動數據，點擊可查看詳細榜單。",
    searchPlaceholder: "搜尋活動名稱...",
    filterAll: "全部 (All)",
    sortLabel: { id: "依照期數", duration: "依照天數" },
    status: { live: "進行中", aggregating: "結算中", upcoming: "尚未開始" },
    labels: { banner: "Banner:", back: "返回列表 (Back)" },
    noData: { title: "找不到符合條件的活動", desc: "請嘗試變更搜尋關鍵字或篩選條件" }
  },
  eventComparison: {
    title: "活動比較分析 (Event Comparison)",
    description: "選擇兩期活動，比較其分數線分佈與競爭強度",
    selectLabelA: "活動 A (Base)",
    selectLabelB: "活動 B (Compare)",
    btnCompare: "開始比較",
    btnAnalyzing: "分析中...",
    errorSameEvent: "請選擇兩個不同的活動進行比較",
    errorLoad: "載入比較資料時發生錯誤。",
    quickFilter: "快速搜尋:",
    chart: {
        yLabel: "分數 (Score)",
        steepness: "競爭陡峭度 (Steepness)",
        avgScore: "平均分數 (Avg Score)",
        analysis: {
            similar: "兩者趨勢與分數分佈相近。",
            leadA: "分數大幅領先，且排名前段斷層極大 (高度競爭)。",
            leadB: "分數大幅領先，且排名前段斷層極大 (高度競爭)。",
            highA: "整體分數較高，需準備更多資源。",
            highB: "整體分數較高，需準備更多資源。",
            gapA: "排名分數落差較大，前段名次固化嚴重。",
            gapB: "排名分數落差較大，前段名次固化嚴重。"
        }
    }
  },
  rankTrend: {
    title: "活動榜線趨勢 (Rank Trend)",
    description: "觀察特定範圍內的排名分數變化趨勢",
    rangeMode: { all: "🌐 全部", year: "📅 年份", id: "🔢 期數" },
    allDataWarning: "顯示所有已結束活動資料 (載入時間較長)",
    fallbackNotice: "年數據不足，已自動顯示最近 20 期資料。",
    fetchError: "無法載入活動列表，請重新整理頁面。",
    loading: "載入數據中...",
    rankBase: "排名基準:",
    filterLabel: "篩選:",
    showAuxLine: "顯示輔助線",
    stats: { avg: "平均", median: "中位" },
    noData: { title: "找不到符合篩選條件的活動", desc: "在選定範圍內，沒有活動符合您設定的過濾條件。" },
    ready: { title: "準備就緒", desc: "請選擇模式以觀察分數趨勢" }
  },
  eventDistribution: {
    title: "活動分布概況",
    description: "分析角色與團體的活動密集度與空窗期。",
    filterType: "類型篩選",
    types: { all: "ALL", unit: "箱活", mixed: "混活", wl: "WL" },
    viewMode: {
        title: "整體概況 (All)",
        total: "總計:",
        unit: "箱活",
        mixed: "混活",
        wl: "WL",
        charUnit: "個人箱",
        charMixed: "個人混"
    },
    intervals: {
        unit: "箱活間隔",
        mixed: "混活間隔"
    },
    labels: {
        total: "總期數",
        date: "Date",
        jumpTo: "Jump to:",
        char: "角色",
        unit: "團體"
    }
  },
  resourceEstimator: {
    title: "預估資源計算機 (Resource Estimator)",
    description: "參考歷史數據，透過體力倍率換算精確估計衝榜所需的 Live Bonus 飲料數量。",
    step1: {
        title: "1. 參考過往活動",
        filterUnit: "快速篩選團體",
        selectEvent: "選擇參考期數",
        selectRank: "參考名次",
        baseScore: "基準分數線",
        duration: "活動時長",
        loading: "讀取數據中..."
    },
    step2: {
        title: "2. 設定目標活動",
        selectTarget: "衝榜目標活動",
        estDuration: "預估活動時長:",
        estRemaining: "活動剩餘時長:",
        note: "* 系統已根據兩期活動的天數比率 (x) 自動校正目標分。",
        placeholder: "請選取目標活動以換算天數",
        liveLabel: " [進行中]"
    },
    step3: {
        title: "3. 自身條件與計畫",
        ptLabel: "單場參考分數 (pt)",
        ptHelp: "這是您個人目前打一場的平均得分（請依當下使用的體力填寫）。系統將依此倍率逆推出您的「基礎分」。",
        currentScoreLabel: "目前自身分數 (Current PT)",
        currentScoreHelp: "輸入您目前在該活動已獲得的分數，系統將計算剩餘所需資源。",
        planEnergy: "計畫衝榜使用體力",
        estSingle: "換算單場預計:",
        warning: "⚠️ 注意：單場基礎分換算後偏高，請確認數值準確性。"
    },
    result: {
        targetLabel: "目標校正 (Targeting)",
        adjScore: "校正後目標分數",
        remainingScore: "剩餘需衝刺分數",
        totalGames: "預計總遊玩場數",
        efficiencyLabel: "能源與效率 (Efficiency)",
        totalEnergy: "總消耗能源需求",
        naturalRecovery: "自然回體抵扣",
        estResource: "預估所需資源",
        cans: "罐",
        itemName: "Live Bonus 飲料（大）",
        disclaimer: "* 數值僅供策略參考，衝榜末期常有劇烈變動，建議額外準備 15% 以上的安全邊際。",
        readyTitle: "準備就緒，等待設定",
        readyDesc: "完成上方三個步驟的基準設定與計畫，系統將為您生成專屬衝榜資源報告。",
        reachedTitle: "🎉 目標已達成！",
        reachedDesc: "您目前的分數已經超過預估的目標分數線。"
    },
    globalWarning: "注意：計算結果未包含「等級提升」、「觀看廣告」贈送的體力與「MySekai」的活動P，實際所需Live Bonus可能會更少。"
  },
  playerProfile: {
    title: "玩家狀態查詢 (Player Profile)",
    description: "查詢該玩家的詳細資料、綜合力組成與歌曲通關狀況。",
    inputPlaceholder: "輸入玩家 ID",
    btnSearch: "查詢玩家",
    errorFormat: "ID 格式錯誤",
    errorFetch: "取得資料失敗",
    sectionGlory: "前百榮耀里程碑",
    gloryPlaceholder: "Top 100 歷史戰果",
    btnScan: "掃描全期數",
    processing: "資料讀取中...",
    noRecord: "尚無紀錄",
    tableHeaders: {
        event: "期數",
        score: "分數",
        rank: "第 {rank} 名"
    },
    sectionChars: "角色等級",
    sectionMusic: "歌曲通關數據 (Music Clear)"
  },
  playerStructure: {
    title: "玩家排名結構 (Player Structure)",
    description: "觀察前一百名內排名生態曲線，剖析各角色與整體遊戲玩家排名流動趨勢。",
    chartTitle: "排名生態曲線 (Ranking Ecological Curve)",
    chartNote: "* 數據統計已自動排除 World Link 活動以維持分析的一致性",
    filter: {
      label: "對象篩選 (單選)",
      modes: { banner: "箱活主打", fourStar: "四星登場" }
    },
    guide: {
      basicTitle: "換血率基礎定義",
      trendTitle: "排名生態趨勢解讀",
      nextPage: "下一頁 (Next Page)",
      nextPageDesc: "深入探討排名趨勢與行為分析",
      backToBasic: "返回基礎定義",
      formulaLabel: "換血率計算定義：",
      highTurnover: { title: "高換血率：生態系活躍", desc: "數值較高代表該區間在不同期數間「新面孔」極多。意味著新進衝榜者容易進入該階層，玩家層次的流動性非常健康，競爭門檻較低。" },
      lowTurnover: { title: "低換血率：階級高度固化", desc: "數值偏低代表該名次長期被特定玩家佔據。形成了一道難以跨越的資源與技術門檻，生態系呈現「滯後」或「死水」狀態。" },
      posTrend: { title: "正趨勢 (+)：生態擴張", desc: "名次越往後，新玩家湧入速度越快。代表該角色的「大眾參與度」隨著名次放寬而顯著提升。" },
      zeroTrend: { title: "零趨勢 (≈0)：結構穩定", desc: "各區間換血率持平，代表競爭模式固定。無論名次先後，參與競爭的人員比例都沒有顯著變化。" },
      negTrend: { title: "負趨勢 (-)：規模萎縮", desc: "代表即使排名放寬，新玩家增加的速度仍趕不上名次擴張。顯示該角色主要由極少數特定玩家群在反覆角逐。" },
      pivotPoint: { title: "趨勢反轉點 (Pivot Point)", desc: "趨勢正負交替處即為「行為分水嶺」，代表玩家競爭行為從該名次開始發生本質性的轉變。" }
    }
  },
  eventSongs: {
    title: "活動曲目及MV",
    description: "提供各期活動書下曲與官方MV連結",
    filters: {
      unit: "團體 (Unit)",
      banner: "Banner 角色",
      lyricist: "作詞 (Lyricist)",
      composer: "作曲 (Composer)",
      arranger: "編曲 (Arranger)",
      reset: "重置條件",
      allUnits: "所有團體",
      allChars: "所有角色",
    },
    table: {
      eventId: "活動ID",
      eventName: "活動名稱",
      unit: "團體",
      banner: "Banner",
      songName: "曲名",
      lyricist: "作詞",
      composer: "作曲",
      arranger: "編曲",
      mv2d: "2D MV",
      mv3d: "3D MV",
      watch: "觀看",
      none: "-",
    },
    noData: "找不到符合條件的曲目",
  },
  mySekaiMining: {
    title: "MySekai 採集計算機",
    description: "提供透過 MySekai 採集機制及社群經驗公式計算獲得活動 Pt。",
    globalSettings: {
        teamPower: "隊伍綜合力",
        eventBonus: "活動加成 (%)",
        basePt: "基礎分 (Base Pt)",
        tier: "階層 (Tier)"
    },
    tools: {
        normal: "普通的 (Normal)",
        good: "還不錯的 (Good)",
        best: "最強的 (Best)",
        chainsaw: "電鋸/電鑽 (Chainsaw)"
    },
    forward: {
        title: "採集收益預估",
        items: {
            flower: { name: "花朵/棉花/音符/工具箱/音樂盒/紙飛機", costLabel: "0.2" },
            sparkle: { name: "掉落物/木桶", costLabel: "0.5" },
            tree: { name: "各種樹木/各種礦石", costLabel: "1.0" }
        },
        headers: {
            item: "項目",
            qty: "數量",
            score: "小計"
        },
        summary: {
            totalPt: "總獲得 Pt",
            totalEnergy: "總消耗體力"
        }
    },
    reverse: {
        title: "目標衝分規劃",
        inputLabel: "目標 Pt (Target Pt)",
        strategyLabel: "計算策略 (Strategy)",
        strategies: {
            standard: "標準完整採集 (Standard - Mix)",
            partial: "分段採集 (Partial - Hit & Run)",
            singleTool: "單一工具速刷 (Single Tool - Full Clear)"
        },
        strategyInfo: {
            standard: "ℹ️ 說明：計算最節省體力的組合。優先採集完整的樹/礦石，不足的部分去採集花朵。",
            partial: "⚡ 操作：為了在有限時間內獲得最高分，請對每棵樹/礦石「只打前 2 下」就立刻換下一個，不要把它打完。",
            singleTool: "🛠️ 操作：為省去換工具的麻煩，請全程使用同一把「最強的 or 電鋸/電鑽」至採集完成。"
        },
        resultTotal: "預估消耗",
        resultCombo: "採集建議",
        comboTemplate: "約需 {tree} 棵樹/顆礦石 + {flower} 朵花/個工具箱"
    }
  },
  rankAnalysis: {
    title: "活動榜線排名 (Rank Ranking)",
    description: "分析歷代及現時活動中各個排名的最高分紀錄",
    modes: { total: "總分", daily: "日均" }
  },
  playerAnalysis: {
    title: "活躍玩家分析 (Active Player Analysis)",
    descriptionPrefix: "統計範圍：共",
    descriptionSuffix: "期活動 (含 World Link)",
    processing: "正在分析歷代榜單...",
    tableTop100: { title: "🏆 Top 100", subtitle: "累計進入前百名次數最多的玩家" },
    tableSpecific: { title: "🎯 指定排名常客", subtitlePrefix: "累計獲得 \"第", subtitleSuffix: "名\" 次數最多的玩家" }
  },
  unitAnalysis: {
    title: "團推分析 (Unit Analysis)",
    description: "以團體視角整合歷代數據，分析活動分數趨勢與玩家參與分佈。",
    summary: {
      prefix: "在共",
      middle1: "期",
      middle2: "活動中，共",
      middle3: "名玩家曾進入前百名，",
      suffix: "前百名不同玩家比例為"
    },
    topRecords: "歷代最高分數紀錄"
  },
  characterAnalysis: {
    title: "推角分析 (Character Analytics)",
    description: "以角色視角整合統計數據，分析 Banner 活動的熱度分佈與玩家參與分佈。",
    summary: {
      wl: {
        prefix: "在 WL 活動時，於",
        middle1: "總分為全角色第",
        middle2: "名，日均分為全角色第",
        suffix: "名。"
      },
      normal: {
        prefix: "在共",
        middle1: "期",
        middle2: "活動中，共",
        middle3: "名玩家曾進入前百名，前百名內不同玩家比例為",
        middle4: "截至",
        middle5: "期為止，不計FES及合作聯動，共有",
        suffix: "張四星卡。"
      }
    },
    noData: "該角色未曾擔任過此類 Banner"
  },
  worldLink: {
    title: "World Link 綜合分析 (Aggregated Analysis)",
    description: "彙整所有 World Link 期數，比較各角色分數排行",
    chartTitle: "圖表分析",
    modes: { activity: "活躍度", global: "全域顯示" }
  },
  maintenance: {
    title: "功能重新設計中",
    description: "我們正在為此功能開發全新的數據指標與更視覺化的呈現方式，以提供更精準、更有價值的「推し分析」體驗。請期待我們之後的更新！",
    comingSoon: "COMING SOON",
  }
} as const;
