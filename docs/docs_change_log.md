# Project Sekai Ranking Documentation Change Log

> **Document Name**: docs_change_log.md
> **Version**: v1.1.0
> **Date**: 2026-03-19

## [v1.1.0] - 2026-03-19
### 📝 Documentation & Standards
- **Guidelines**: Created `DOCUMENTATION_GUIDELINES.md` to establish global documentation constraints, metadata headers, structural templates, Mermaid diagram rules, and the "Archaeologist" tone.

### 🐛 Bug Fixes
- **Live Event Refresh Time**: Reverted the `lastUpdated` property in `useRankings.ts` to `new Date()` to correctly reflect the user's manual local fetch time.
- **Gap Countdown Timer**: Fixed the `EventHeaderCountdown` unmounting unexpectedly during event gaps by explicitly mapping Hisekai's `closed_at` API property in both the backend bridge and frontend state check.

## [v1.0.0] - 2024-05-23
### 🚀 Major Improvements (Unified Ranking API)
- **Backend**: Implemented `getUnifiedRankings` in `api/_lib/rankingsService.ts` to merge Top 100 and Border data into a single request.
- **Backend Routes**: Registered `/api/event/:id/rankings` and `/api/event/live/rankings` in `server.ts`.
- **Frontend Hook**: Refactored `useRankings.ts` to support unified data fetching and state synchronization, eliminating asynchronous race conditions during view transitions.
- **UI Components**: Updated `PastEventDetailView`, `LiveEventView`, `WorldLinkView`, and `ResourceEstimatorView` to utilize the new unified rankings API.
- **Charts**: Fixed `LineChart.tsx` and `ChartAnalysis.tsx` to handle rank-based filtering correctly (isolating Top 100 vs Highlights), resolving the "vertical line" and axis compression issues.

### 🏠 Documentation Structure
- Initialized documentation in `docs/` reflecting system architecture and individual page specifications.
- Added `unified_api_refactoring.md` for detailed migration technical specs.
