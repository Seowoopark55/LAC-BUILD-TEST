# LAC HUB Phase 3 — user-facing home image integration

- Phase 2 source retained; only `src/ui/hubHome.js`, `src/styles/hub-home.css`, and one HOME game-info action in `src/main.js` changed.
- Visual assets are independent files under `public/hub`; all labels, buttons and user/company names are live HTML, not text burned into image mocks.
- Home: hero, compact selected company entry, 4 content cards. Platform operator link exists only when `platformAdmin` is true and enters existing platform console. Separating the entire platform admin shell and moving subscription management are NOT part of this UI-only phase.
- Game info card opens the existing company-scoped page; users without a selected company see the existing registration/join flow. No company-private data is made public.
- LAC BUILD and LAC COOK are visual placeholders: their original source and independent URLs are not modified or guessed. DB flags remain storage-only; real access pass controls are not connected.
- No database, OAuth or other AXE code changes. Existing release screenshot baselines intentionally unchanged; do not interpret this visual redesign as a verified deployment.
