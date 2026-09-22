# Phase21 · viewport and board detail polish

Base: Phase20 full. Changes are scoped to HUB main and HUB support board; existing company console is not altered.

- Desktop home dynamically allocates vertical space for hero, news/support cards and four unchanged service cards. At very short screens and mobile, normal page scroll remains to prevent clipping or illegible text.
- Home news shows up to three REAL notices with an internal scroll region, never fake entries; no notices has a neutral empty message.
- Support categories have descriptions. Notices and private inquiries retain independent tabs, notice landing guidance is static copy rather than fictional data.
- Private inquiry status counters derive from the already fetched, viewer-authorized board.tickets list, not platform-wide totals; filters affect the list separately.
- Existing 19-20 API, SQL, photo uploads, private access restrictions and board event handling remain unchanged.
