# AXE ONE WEB STAGING — Stage 11 AI channel settings

- Based on Stage 10 full WEB source.
- Company settings → Function settings: append AI channel selector as a separate preparatory setting; preserve seven existing module count and styles.
- WEB uses authenticated Supabase RLS on axe_product.discord_company_config (company owner/admin update), not BOT runtime keys.
- Reads/writes only company scoped ai_channel_id; validates picked channel from the connected company guild and avoids already selected enabled module channels.
- Empty selection clears channel ID. AI replies are **not** deployed by this WEB patch.
- Existing Discord command/notification channel settings and BOT behavior unchanged. No SQL or DB changes in this archive.
- TEST SCOPE: source checks and production build where environment supports them. Live logged-in multi-company/RLS testing remains required on STAGING.

## Stage 11 UI finish R2
- AI question row receives the same inset 2px gold left finish as the seven existing enabled feature rows.
- No behavior changes: AI channel selection and saving remain the same; AI responses are still unconnected.
- Only `src/styles/brand-skin.css` changes from Stage 11 R1, plus this note.
