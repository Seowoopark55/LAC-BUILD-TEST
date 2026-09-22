# Phase 9 — Game info density without synthetic game data

- On full-height desktops, selected detail headers expand into their available space and let the matching category image remain visible; live database fields stay in their original order, with internal scrolling where needed.
- In short, real result lists (1–7 records), the standalone screen alone shows a small visual endcap with the **actual filtered heading and count**, never invented items. Lists above 7 do not render the endcap. Screens too short for the endcap hide it.
- The endcap reserves its own space so it does not overlay list buttons. Blank/empty selection is still a neutral invitation and not a fictional selected item.
- The company-embedded info page receives no new markup, and backend, company scope, auth, CRUD, tab and search routing remain unchanged.
- Validate selected records across crafting, production, quest, skill and modbook after deployment. Production build and authenticated Chromium verification must be completed separately if unavailable locally.
