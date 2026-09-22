# LAC HUB — Phase 14 · Game Info detail split

## Scope
- Based on the Phase 13 full ZIP. The existing company console, database, bot, auth, routes, and five Game Info menus are unchanged.
- The independently opened Game Info detail panel now has two visually distinct regions: a fixed visual title area and a two-column actual-data area. Field labels, field values, and company scoping remain source-backed.
- The inline Game Info under company management keeps its old rendering.
- Render one small neutral presentation chip per existing `필요 재료` entry only when the original source uses the existing ` · ` separator; there are no fictitious materials, counts, item artwork, or new action buttons.
- Existing Phase 12/13 mutually conflicting standalone-detail style blocks were removed and consolidated in `src/styles/game-center.css`. The five obsolete standalone style files are still on disk for history, but none are imported.

## Overflow policy
- Normal-sized records render without a detail-panel scrollbar on tested 1600×900/1280×800 desktop previews.
- Very long source fields, dense records, short viewports, and mobile layouts retain a scroll/fallback so real data cannot be silently clipped. Full no-scroll for arbitrarily long records cannot be guaranteed without hiding data.
- No production Discord/real-DB or Vite build verification was possible in the local environment; confirm after deployment.
