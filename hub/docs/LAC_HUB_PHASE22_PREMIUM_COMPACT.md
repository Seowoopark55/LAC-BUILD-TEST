# Phase22 — scalable icons, refined badges, compact support layout
Base: Phase21 full. Only `src/ui/hubBoard.js`, `src/styles/hub-board.css`, and `src/styles/hub-home.css` are changed.
- Buttons, tabs, badges and glyphs are real text, CSS and inlined semantic SVG: never export an image-generation sheet containing inconsistent lettering as actual controls.
- Support tabs are smaller; help column, notice and list panels are more compact. At desktop height, only the inquiry list may scroll if many authorized real records are returned. Compose/detail use normal scroll to preserve messages and photos.
- Recent completed inquiry strip reuses only real, accessible `board.tickets`; no fake rows, dates, counts or user data.
- Existing Phase19 SQL, RLS, API, files, permissions, event handlers, company-console screens and current HUB hero remain unchanged.
- HUB home desktop geometry adjusted by a few pixels and clips only non-content CSS overflow after confirming all real visible elements lie within the viewport at tested resolutions. Small screens retain normal page scroll.
