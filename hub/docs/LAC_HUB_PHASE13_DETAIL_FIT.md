# LAC HUB · Game Info detail-fit (Phase 13)

- Based on Phase 12 full ZIP. Replaced only src/ui/infoPage.js and src/styles/game-center.css; added this note and a regression check.
- Standalone Game Info only. Existing data, DB functions, API calls, permissions, menu behavior, company-embedded Game Info remain unchanged.
- Detail presentation counts existing nonempty DB fields and adapts the layout: sparse/regular = 2 columns; dense/extended = 3 columns.
- Common desktop selections show all values in a single detail panel without an inner scrollbar. Hero artwork fills unused space; no placeholder or manufactured game data.
- Longer notes/records and shorter viewports may still require the inner scrollbar so genuine data is never silently clipped. Mobile/short viewports preserve responsive scrolling.
- Existing database-driven label/value fields are displayed as supplied; the images are atmospheric, not actual item images.
