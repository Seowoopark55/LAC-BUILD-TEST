# LAC ONE WEB · R2 corrective release (STAGING ONLY)

Source: uploaded `lac one.zip` WEB full package 1.7.41-web-ui.79, plus branding-only text work from R1. Do not apply to old AXE NET or operational BOT.

Correction: original generated black/gold outer wallpaper and compact 1672x941 premium login layout are restored, using separate logo-clean image assets; no gradient redesign. Original login from uploaded ZIP contained only old `runtime-auth-card` markup even though the premium CSS existed but was not imported. This release reconnects that existing design to the working Discord login action. It does NOT invent invite-code login or change authentication logic.

Studio: original upload contains `src/ui/layoutStudio.js` and `src/styles/layout-studio.css` but no studio route, UI or handlers. This release restores a PLATFORM OWNER-only account menu, studio page, live settings, local save/revert/reset and persisted visual tokens. Storage key is the original one, and no DB writes are added.

Preserved: DB `axe_product`, API, environment keys, browser storage keys, company/permissions, and old BOT/NET.

Deploy to WEB STAGING via whole-folder GitHub copy/overwrite. Check premium login, background on desktop, account menu (PLATFORM OWNER), font + row + table width changed in Studio and preserved after reload. Non-owner accounts must not see Studio.
