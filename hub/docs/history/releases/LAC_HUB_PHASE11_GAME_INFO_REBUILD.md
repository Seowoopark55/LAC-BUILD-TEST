# LAC HUB / GAME INFO — Phase 11 standalone rebuild

## Why
Phases 6–10 stacked `game-center-premium`, `v2`, `compact`, `density`, and
`composition` selectors plus duplicated overrides. Later rules conflicted with
earlier height/width choices. The live view drifted from the original concept.

## Source-of-truth
- Only `src/styles/game-center.css` is imported for the standalone game-info shell.
- Old incremental files remain as historical references but are not active.
- The independent content uses a centered 1216px maximum width; cinematic hero,
  overlaid working search field, five existing tabs, real category filters, and
  proportional two-column results/detail panels.
- The prior short-list image endcap is no longer rendered.
- No fake catalogue records, invented recipe fields, actions, or modified game data.
- Small screens and short viewports use standard page scrolling, large desktop
  uses in-panel overflow for lists/details.

## Safety
`renderInfoPage` is still shared with embedded company Game Info, and retains
its original database fields and `data-info-*` interactive attributes. Only
the standalone CSS and removal of its decorative endcap were changed. The
company-embedded page, Supabase functions and RLS, Discord authentication,
LAC BUILD/COOK/NET/BOT are unchanged.

## Validation and limitations
- `npm run check` passed; Phase 4/5 functional checks and Phase 11 ownership
  check passed.
- Browser DOM + screenshot preview checked at 1724x900, 1440x900,
  1280x800, 390x844 using a synthetic category preview and actual CSS assets.
- Legacy phase 6–10 CSS-snapshot tests are superseded by the phase 11 stylesheet
  and are retained solely as historical tests, not applicable to the redesign.
- Production Vite build was not available because this environment lacks its
  dev dependency. A live Discord+Supabase run still needs deployment QA.
