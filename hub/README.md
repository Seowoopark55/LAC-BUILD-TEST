# LAC ONE WEB · rebrand staging

Current customer-facing brand is LAC ONE. Internal technical names and the existing Vercel URL are retained. For the scope and caveats of the rebrand, see `docs/history/branding/LAC_ONE_REBRAND_README.md`.

---

# AXE ONE WEB STAGING 3.26.19 · MEMBER / ACCOUNT BALANCE R1

Baseline: AXE ONE WEB STAGING 3.26.18.

Changes:
- Member management keeps the Discord display-name column because it is useful identity information on the member screen.
- Member desktop column proportions were rebalanced so `이름 ↔ Discord ↔ 역할` center-to-center spacing is visually even; header and row values still share the exact same grid tracks.
- Account management removes the Discord display-name column because it is redundant and visually unnatural in an account-centric list.
- Account management now uses `이름 | 역할 | 계좌번호 | 상태 | 관리`.
- Account search copy is simplified to `멤버 · 계좌 검색`, matching the visible account information.
- Account five-column widths were redistributed so the account number receives appropriate width without creating empty-looking lanes.
- Mobile account action span updated for the five-field row.

Safety:
- WEB only.
- No DB migration.
- No BOT change.
- LIVE untouched.
- `index.html`, `src/main.js`, and root `src/styles.css` remain byte-identical to 3.26.18.

Validation:
- `node --check src/ui/render.js`: PASS.
- `npm run check`: PASS, including dedicated member/account balance checks.
- Critical Vite entry files are byte-identical to the 3.26.18 baseline.
- Local `npm run build` could not run because the workspace has no Vite binary (`vite: not found`); use Vercel Ready as the final build check.
