import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { createClient } from '@supabase/supabase-js';
import { getEventsList, getEventById } from "./api/_lib/eventsService.ts";
import { getLiveRankings, getPastRankings, getBorderRankings, getUnifiedRankings } from "./api/_lib/rankingsService.ts";
import { getPlayerProfile, getSongsData } from "./api/_lib/dataService.ts";

// 初始化 Supabase 客戶端 (後端專用)
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey || '');

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes
  // app.use((req, res, next) => {
  //   console.log(`Received request: ${req.method} ${req.url}`);
  //   next();
  // });

  // Events API
  app.get("/api/event/list", async (req, res) => {
    try {
      const events = await getEventsList();
      res.type('json').send(events);
    } catch {
      res.status(500).json({ error: "Failed to fetch events list" });
    }
  });
  app.get("/api/event/:id", async (req, res) => {
    try {
      const event = await getEventById(Number(req.params.id));
      res.type('json').send(event);
    } catch {
      res.status(500).json({ error: `Failed to fetch event ${req.params.id}` });
    }
  });

  // Rankings API
  app.get("/api/event/live/top100", async (_req, res) => {
    try {
      const rankings = await getLiveRankings();
      res.type('json').send(rankings);
    } catch {
      res.status(500).json({ error: "Failed to fetch live rankings" });
    }
  });
  app.get("/api/event/:id/top100", async (req, res) => {
    try {
      const rankings = await getPastRankings(req.params.id);
      res.type('json').send(rankings);
    } catch {
      res.status(500).json({ error: `Failed to fetch past rankings for event ${req.params.id}` });
    }
  });
  app.get("/api/event/live/border", async (_req, res) => {
    try {
      const rankings = await getBorderRankings("live", true);
      res.type('json').send(rankings);
    } catch {
      res.status(500).json({ error: "Failed to fetch live border rankings" });
    }
  });
  app.get("/api/event/:id/border", async (req, res) => {
    try {
      const rankings = await getBorderRankings(req.params.id, false);
      res.type('json').send(rankings);
    } catch {
      res.status(500).json({ error: `Failed to fetch border rankings for event ${req.params.id}` });
    }
  });

  app.get("/api/event/live/rankings", async (_req, res) => {
    try {
      const rankings = await getUnifiedRankings("live", true);
      res.type('json').send(rankings);
    } catch {
      res.status(500).json({ error: "Failed to fetch unified live rankings" });
    }
  });

  app.get("/api/event/:id/rankings", async (req, res) => {
    try {
      const rankings = await getUnifiedRankings(req.params.id, false);
      res.type('json').send(rankings);
    } catch {
      res.status(500).json({ error: `Failed to fetch unified rankings for event ${req.params.id}` });
    }
  });

  // Data API
  app.get("/api/user/:id/profile", async (req, res) => {
    try {
      const profile = await getPlayerProfile(req.params.id);
      res.type('json').send(profile);
    } catch {
      res.status(500).json({ error: `Failed to fetch player profile for ${req.params.id}` });
    }
  });
  app.get("/api/user/:id/stats", async (req, res) => {
    try {
      const { getPlayerStats } = await import('./api/_lib/statsService.ts');
      const stats = await getPlayerStats(req.params.id);
      res.type('json').send(stats);
    } catch {
      res.status(500).json({ error: `Failed to fetch player stats for ${req.params.id}` });
    }
  });
  app.get("/api/stats/top-players", async (req, res) => {
    try {
      const { dimension_type = 'all', dimension_id = 0 } = req.query;
      
      // 1. 全量載入該維度所有人
      let allStats: any[] = [];
      let from = 0;
      let hasMore = true;
      while (hasMore) {
        const { data: statsChunk, error: countErr } = await supabase
          .from('player_activity_stats')
          .select('user_id, top100_count, specific_rank_counts')
          .eq('dimension_type', dimension_type.toString())
          .eq('dimension_id', Number(dimension_id))
          .range(from, from + 999);
        
        if (countErr) {
          console.error("Supabase top-players query error:", countErr);
          throw countErr;
        }
        allStats = [...allStats, ...(statsChunk || [])];
        if (!statsChunk || statsChunk.length < 1000) {
          hasMore = false;
        } else {
          from += 1000;
        }
      }

      // Metadata (總計資訊)
      const metadata = {
        totalTop100: allStats.filter(s => s.top100_count > 0).length,
        rankCounts: {} as Record<number, number>
      };
      for (let i = 1; i <= 10; i++) {
        metadata.rankCounts[i] = allStats.filter(s => (s.specific_rank_counts?.[i] || 0) > 0).length;
      }

      // 2. 在記憶體中精準切片 (Slicing)
      const topFrequent100 = [...allStats]
        .sort((a, b) => b.top100_count - a.top100_count)
        .slice(0, 15);

      const specificRanks: Record<number, any[]> = {};
      for (let i = 1; i <= 10; i++) {
        specificRanks[i] = [...allStats]
          .filter(s => (s.specific_rank_counts?.[i] || 0) > 0)
          .sort((a, b) => {
             const countA = a.specific_rank_counts?.[i] || 0;
             const countB = b.specific_rank_counts?.[i] || 0;
             if (countA !== countB) return countB - countA;
             return b.top100_count - a.top100_count; // Tie-breaker
          })
          .slice(0, 15);
      }

      // 3. 收集所有需要補齊細節的 user_id
      const uniqueUserIds = new Set<string>();
      topFrequent100.forEach(s => uniqueUserIds.add(s.user_id));
      Object.values(specificRanks).forEach(list => list.forEach(s => uniqueUserIds.add(s.user_id)));
      const userIdsArray = Array.from(uniqueUserIds);

      // 4. 二次精準查詢 (Batch IN)
      let nameMap = new Map<string, string>();
      let unitCountsMap: Record<string, Record<string, number>> = {};
      userIdsArray.forEach(id => unitCountsMap[id] = {});

      if (userIdsArray.length > 0) {
        // [A] 取得暱稱
        const { data: usersData } = await supabase
          .from('players')
          .select('user_id, user_name')
          .in('user_id', userIdsArray);
        if (usersData) {
          usersData.forEach(u => nameMap.set(u.user_id, u.user_name));
        }

        // [B] 取得團體徽章次數 (dimension_type = 'unit_id')
        const { data: unitStats } = await supabase
          .from('player_activity_stats')
          .select('user_id, dimension_id, top100_count')
          .eq('dimension_type', 'unit_id')
          .in('user_id', userIdsArray);
        if (unitStats) {
          unitStats.forEach(st => {
             unitCountsMap[st.user_id][st.dimension_id.toString()] = st.top100_count;
          });
        }
      }

      // 5. 組裝 JSON
      const formatPlayer = (p: any) => ({
        user_id: p.user_id,
        top100_count: p.top100_count,
        specific_rank_counts: p.specific_rank_counts,
        players: { user_name: nameMap.get(p.user_id) || 'Unknown' }, // 保持與舊版相同介面結構以便前端解構
        unitCounts: unitCountsMap[p.user_id] || {}
      });

      const formattedTop100 = topFrequent100.map(formatPlayer);
      const formattedSpecific: Record<number, any[]> = {};
      for (let i = 1; i <= 10; i++) {
        formattedSpecific[i] = specificRanks[i].map(formatPlayer);
      }

      res.type('json').send({ 
        data: {
          topFrequent100: formattedTop100,
          topFrequentSpecific: formattedSpecific
        }, 
        metadata 
      });
    } catch (e: any) {
      console.error("Express top-players endpoint failed:", e);
      res.status(500).json({ error: e.message || "Failed to fetch top players stats" });
    }
  });
  app.get("/api/stats/border-stats", async (req, res) => {
    try {
      const { getBorderStats } = await import('./api/_lib/statsService.ts');
      const stats = await getBorderStats();
      res.type('json').send(stats);
    } catch (error) {
      console.error("Error in /api/stats/border-stats:", error);
      res.status(500).json({ error: "Failed to fetch border stats" });
    }
  });
  app.get("/api/song/list", async (_req, res) => {
    try {
      const songs = await getSongsData();
      res.type('json').send(songs);
    } catch {
      res.status(500).json({ error: "Failed to fetch songs data" });
    }
  });
  
  // ... 其他 API 保持不變

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.use((req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "127.0.0.1", () => {
    console.log(`Server running on http://127.0.0.1:${PORT}`);
  });
}

startServer();
