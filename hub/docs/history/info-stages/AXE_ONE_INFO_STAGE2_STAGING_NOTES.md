# AXE ONE WEB — INFO STAGE 2 (STAGING review)

Baseline: AXE_ONE_WEB_INFO_STAGE1_STAGING_R1.zip, which was based on user-supplied axe one(2).zip.

Scope: UI-only adjustments to `src/ui/infoPage.js` and `src/styles/info.css`. The original six large category cards become one compact tab rail on desktop (3 columns at narrower viewports, 2 on mobile). List rows now show a single title line without repeated descriptive subtitles. Skill-rank entries include the rank in the *title* to distinguish duplicate skill names. The detail pane has a clear initial empty state and aligned field/value rows. Search and inactive toggle share a lightweight toolbar. The owner's read-only notice is moved below the content. Existing sidebar/menu and support tabs are unchanged. No new editing affordance has been enabled.

No changes to DB, Supabase policies or functions, API calls, BOT, main.js, navigation, or existing platform/organization workflows. Existing staged inactive filtering and the six-table lookup remain read-only.

Validation: `npm run check`, Stage 1 info check, and Stage 2 info check pass in workspace. Production build and authenticated browser rendering must be confirmed via STAGING/Vercel because this container has no local Vite dependencies. Do not deploy to LIVE.
