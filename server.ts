import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from '@supabase/supabase-js';
import { getEventsList, getEventById } from "./src/services/eventsService";
import { getLiveRankings, getPastRankings, getBorderRankings } from "./src/services/rankingsService";
import { getPlayerProfile, getSongsData } from "./src/services/dataService";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
    } catch (error) {
      console.error("Error in /api/event/list:", error);
      res.status(500).json({ error: "Failed to fetch events list" });
    }
  });
  app.get("/api/event/:id", async (req, res) => {
    try {
      const event = await getEventById(req.params.id);
      res.type('json').send(event);
    } catch (error) {
      res.status(500).json({ error: `Failed to fetch event ${req.params.id}` });
    }
  });

  // Rankings API
  app.get("/api/event/live/top100", async (req, res) => {
    try {
      const rankings = await getLiveRankings();
      res.type('json').send(rankings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch live rankings" });
    }
  });
  app.get("/api/event/:id/top100", async (req, res) => {
    try {
      const rankings = await getPastRankings(req.params.id);
      res.type('json').send(rankings);
    } catch (error) {
      res.status(500).json({ error: `Failed to fetch past rankings for event ${req.params.id}` });
    }
  });
  app.get("/api/event/live/border", async (req, res) => {
    try {
      const rankings = await getBorderRankings("live", true);
      res.type('json').send(rankings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch live border rankings" });
    }
  });
  app.get("/api/event/:id/border", async (req, res) => {
    try {
      const rankings = await getBorderRankings(req.params.id, false);
      res.type('json').send(rankings);
    } catch (error) {
      res.status(500).json({ error: `Failed to fetch border rankings for event ${req.params.id}` });
    }
  });

  // Data API
  app.get("/api/user/:id/profile", async (req, res) => {
    try {
      const profile = await getPlayerProfile(req.params.id);
      res.type('json').send(profile);
    } catch (error) {
      res.status(500).json({ error: `Failed to fetch player profile for ${req.params.id}` });
    }
  });
  app.get("/api/user/:id/stats", async (req, res) => {
    try {
      const { getPlayerStats } = await import('./src/services/statsService');
      const stats = await getPlayerStats(req.params.id);
      res.type('json').send(stats);
    } catch (error) {
      res.status(500).json({ error: `Failed to fetch player stats for ${req.params.id}` });
    }
  });
  app.get("/api/stats/top-players", async (req, res) => {
    try {
      const unit_id = req.query.unit_id || 0;
      const limit = req.query.limit || 50;
      
      const { data, error } = await supabase
        .from('player_activity_stats')
        .select(`
          user_id,
          top100_count,
          specific_rank_counts,
          players!inner (
            user_name
          )
        `)
        .eq('unit_id', Number(unit_id))
        .order('top100_count', { ascending: false })
        .limit(Number(limit));

      if (error) throw error;
      res.type('json').send(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch top players stats" });
    }
  });
  app.get("/api/stats/border-stats", async (req, res) => {
    try {
      const { getBorderStats } = await import('./src/services/statsService');
      const stats = await getBorderStats();
      res.type('json').send(stats);
    } catch (error) {
      console.error("Error in /api/stats/border-stats:", error);
      res.status(500).json({ error: "Failed to fetch border stats" });
    }
  });
  app.get("/api/song/list", async (req, res) => {
    try {
      const songs = await getSongsData();
      res.type('json').send(songs);
    } catch (error) {
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
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
