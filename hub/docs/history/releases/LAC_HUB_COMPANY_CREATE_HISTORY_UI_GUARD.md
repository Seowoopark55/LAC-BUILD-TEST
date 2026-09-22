# LAC HUB — Company create history UI guard

Source: user-provided LAC HUB full ZIP. Web-only update; no DB migration or AXE BUILD/NET/BOT code changes.

- Calls `axe_product.lac_can_create_company()` for the logged-in account on refresh and again before opening/submitting the create form.
- Displays the new-company action based on the database creator history, not current company membership or company OWNER role.
- If eligibility lookup fails, creation actions are hidden and access to existing companies remains available.
- Existing company membership registration, platform management, styling, Discord auth and server-side create-code validation remain unchanged.
- Server-side RPC remains the ultimate creation guard.

Live QA needed: platform admin sees new-company action; ordinary creator does not; ordinary member with no creation history does; never create actual QA companies.
