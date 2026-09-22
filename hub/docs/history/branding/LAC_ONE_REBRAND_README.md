# LAC ONE WEB · branding-only update

Based on the supplied WEB ZIP (package 1.7.41-web-ui.79, 3.26.19). This is a complete WEB project for GitHub whole-folder copy/overwrite, not a BOT patch.

Customer-facing labels were updated in the login page, first run, global header, game info, admin/support dialogs, test center and Discord guided channel creation defaults. Browser title and icon now say LAC ONE. Desktop login and outer wallpaper no longer load legacy AXE-logo PNGs; they use dark/gold CSS gradients and a LAC ONE wordmark. Mobile retains existing layout.

Technical interfaces remain unchanged: axe_product Supabase schema, AXE_PRODUCT_* env keys, axe_product_* browser storage keys, Vercel address, OAuth URLs, RPC names, CSS selectors, Discord identifiers and company IDs. Do NOT rename these as part of a display brand change. No SQL was executed or added.

Not in scope: deployed Discord BOT executable and its embed/panel content, server application nickname/avatar, already-created Discord categories/channels, old database-stored support author labels, external Vercel project/domain, and old validation screenshot baselines. Those require their respective latest sources and explicit separate staging rollout.

Apply: unzip and copy all source files/folders into the WEB GitHub project root (preserving env configuration); deploy STAGING and visually check login, first-run onboarding, header, info pages, guided setup, notices and responsive desktop/mobile. The original three PNGs in public/brand are intentionally retained only as dormant historical assets for baseline comparison; no runtime CSS loads them.
