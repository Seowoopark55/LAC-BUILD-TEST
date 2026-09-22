# LAC HUB Phase 23 — Account identity / site-notice UI

Source base: LAC_HUB_PHASE22_PREMIUM_COMPACT_UI_FULL.zip.

## User-facing changes
- The HUB home header uses a native profile dropdown with Discord avatar where a trusted Discord CDN URL is available (otherwise first-character avatar), selected nickname, and a small current-company badge. Profile menu contains the company name/switch for historical multi-company memberships and the existing sign-out action.
- Nickname selection uses the **current authenticated user's** company_memberships alias_name → display_name → discord_display_name, then Discord OAuth metadata global_name/name/full_name/preferred_username/user_name/username. Numeric-only account identifiers are not displayed as nicknames. If none is a suitable name, show "내 계정". No personal nickname editor, company-name change, or new table/SQL is included.
- Only platformAdmin accounts see the discreet independent icon control on the far-right of the top bar, with the unchanged open-platform-admin action and permission guard. Normal account menu remains the same for all signed-in users.
- The HUB homepage "LAC 소식" panel is titled "사이트 공지" and explicitly describes LAC HUB website operations; this is not presented as an in-game official announcement. Existing notice list, admin publication, and notice links remain unchanged.

## Preserved
- Company creation restrictions, single stateful hero CTA, past-company switch action, company management & game information, site support board, photo uploads, storage and RLS.
- No DB migrations or API changes. No images or fonts added.
- Source tests for 18/21 are updated only to reflect intentional account markup/notice wording changes. New Phase 23 test covers identity priority and escaping, permissions, and no numeric fallback.

## Verification notes
- npm run check, scripts/hub-phase18/19/20/21/22/23 and node --check of the changed view files.
- Static Chromium preview with synthetic account/notice data at 1600x900, 1280x800, and 390x844. Desktop pages do not overflow and the open account menu stays within the viewport. Mobile retains scrolling for content.
- Actual Supabase account/Discord OAuth metadata and deployed Vercel site are not verified by these synthetic previews.
