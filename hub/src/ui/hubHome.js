import { renderHubNewsStrip } from './hubBoard.js';
import { HUB_CONTENT } from '../platform/catalog.js';

function esc(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

// ISOLATED PILOT ONLY: same-origin LAC BUILD entry; do not publish as production yet.
const BUILD_PUBLIC_URL = '/build/';
const ASSETS = '/hub/';
const chevron = '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const settingsIcon = '<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path d="M12 3.3 13.9 4l1.5-.6 2.5 2.5-.6 1.5.7 1.9 1.5.6v3.5l-1.5.6-.7 1.9.6 1.5-2.5 2.5-1.5-.6-1.9.7-.6 1.5h-3.5l-.6-1.5-1.9-.7-1.5.6-2.5-2.5.6-1.5-.7-1.9-1.5-.6V9.9l1.5-.6.7-1.9-.6-1.5L6.4 3.4l1.5.6 1.9-.7.6-1.5h3.5z" transform="translate(1 1) scale(.85)" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="12" cy="12" r="2.8" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
function accountName(state) {
  const user = state.session?.user || {};
  const meta = user.user_metadata || {};
  // The company alias is an existing field in company_memberships. Do not use
  // another company's member record or expose raw numeric Discord identifiers.
  const membership = (state.memberships || []).find(member =>
    member.user_id === user.id && member.company_id === state.companyId && member.status !== 'inactive');
  const names = [membership?.alias_name, membership?.display_name, membership?.discord_display_name,
    meta.global_name, meta.name, meta.full_name, meta.preferred_username, meta.user_name, meta.username];
  const name = names.map(value => String(value ?? '').trim()).find(value => value && !/^\d+$/.test(value));
  return name || '내 계정';
}
function accountAvatar(state, displayName) {
  const meta = state.session?.user?.user_metadata || {};
  const candidate = meta.avatar_url || meta.picture;
  let avatar = '';
  try {
    const url = new URL(String(candidate || ''));
    if(url.protocol === 'https:' && ['cdn.discordapp.com','media.discordapp.net'].includes(url.hostname)) avatar = url.href;
  } catch { /* No valid Discord avatar: show a typographic avatar instead. */ }
  return avatar ? `<img src="${esc(avatar)}" alt="" width="35" height="35" loading="eager" referrerpolicy="no-referrer">`
    : `<span aria-hidden="true">${esc(Array.from(displayName)[0] || 'L')}</span>`;
}

function contentCard({title,description,image,tag,tagType='',action='',href='',disabled=false,footnote=''}) {
  const stateClass=tagType ? ` hub-feature__tag--${tagType}` : '';
  // Internal content uses the existing delegated button actions. External BUILD
  // has one native anchor with new-tab semantics, without navigating away from HUB.
  const active=Boolean((action || href) && !disabled);
  const open=!active ? `<article class="hub-feature hub-feature--pending">`
    : href ? `<a class="hub-feature hub-feature--interactive" href="${esc(href)}" ${href.startsWith("/build/") ? "" : 'target="_blank" rel="noopener noreferrer"'} aria-label="${esc(title)} 열기">`
    : `<button type="button" class="hub-feature hub-feature--interactive" data-action="${esc(action)}" aria-label="${esc(title)} ${action==='open-company-start'?'이용 안내':'열기'}">`;
  const close=!active ? '</article>' : href ? '</a>' : '</button>';
  return `${open}<span class="hub-feature__visual"><img src="${ASSETS}${image}" alt="" loading="eager" decoding="async"><span class="hub-feature__tag${stateClass}">${esc(tag)}</span></span>
    <span class="hub-feature__content"><span><strong class="hub-feature__name">${esc(title)}</strong><span class="hub-feature__description">${esc(description)}</span>${footnote?`<small>${esc(footnote)}</small>`:''}</span>${active?'<span class="hub-feature__enter" aria-hidden="true">→</span>':'<span class="hub-feature__pending" aria-hidden="true">준비 중</span>'}</span>${close}`;
}

export function renderHubHome(state) {
  const companies = state.companies || [];
  const current = companies.find(company => company.id === state.companyId) || null;
  const displayName = accountName(state);
  const avatar = accountAvatar(state, displayName);
  const owner = state.platformAdmin === true;
  const companyAction = current ? 'open-company-console' : 'open-company-start';
  // The hero is the only company CTA on the HUB home. A member of an existing
  // company must never see a new-company CTA, even if the creation RPC reports
  // eligibility (e.g. an administrator or a member who has not created one).
  const companyLabel = current ? '내 회사로 이동' : state.canCreateCompany === true ? '+ 회사 생성' : state.companyCreatePermissionError ? '회사 등록 안내' : '회사 가입 안내';
  // One account control for every member; platform administration remains
  // independent and appears only for the platform owner.
  const accountCompany = !current
    ? `<span class="hub-account__company hub-account__company--empty">회사 미설정</span>`
    : companies.length > 1
      ? `<details class="hub-account__company-switch"><summary class="hub-account__company" title="현재 회사: ${esc(current.name)}"><span>소속 회사</span><strong>${esc(current.name)}</strong>${chevron}</summary><div class="hub-account__company-menu" aria-label="회사 전환">${companies.map(company => `<button type="button" data-action="switch-company" data-company-id="${esc(company.id)}" ${company.id === state.companyId ? 'aria-current="true"' : ''}>${esc(company.name)}</button>`).join('')}</div></details>`
      : `<span class="hub-account__company" title="현재 회사: ${esc(current.name)}"><span>소속 회사</span><strong>${esc(current.name)}</strong></span>`;
  const accountMenu = `<details class="hub-account__profile"><summary class="hub-account__trigger" aria-label="내 계정 메뉴 열기: ${esc(displayName)}"><span class="hub-account__avatar">${avatar}</span><span class="hub-account__identity"><strong>${esc(displayName)}</strong><small>${current ? esc(current.name) : '회사 미설정'}</small></span>${chevron}</summary><div class="hub-account__menu"><div class="hub-account__menu-head"><span class="hub-account__avatar hub-account__avatar--large">${avatar}</span><span><small>로그인 계정</small><strong>${esc(displayName)}</strong></span></div>${accountCompany}<button type="button" class="hub-logout" data-action="logout">로그아웃 <span aria-hidden="true">→</span></button></div></details>`;
  return `<div class="hub-home">
    <header class="hub-topbar"><div class="hub-topbar__inner">
      <span class="hub-wordmark"><img src="${ASSETS}mark.png" alt="" width="32" height="32"><strong>LAC HUB</strong></span>
      <div class="hub-account">${accountMenu}${owner?`<span class="hub-account__admin-divider" aria-hidden="true"></span><button type="button" class="hub-admin-link" data-action="open-platform-admin" title="플랫폼 운영자 관리 센터" aria-label="플랫폼 운영자 관리 센터">${settingsIcon}</button>`:''}</div>
    </div></header>
    <main class="hub-body">
      <section class="hub-hero" aria-labelledby="hub-headline"><div class="hub-hero__shade"></div><div class="hub-hero__copy"><span class="hub-kicker">LAC HUB</span><h1 id="hub-headline">LAC를 즐기는<br><em>더 편리한 방법</em></h1><p>게임 정보와 다양한 편의 기능을<br>LAC HUB에서 만나보세요.</p><div class="hub-hero__actions"><button type="button" class="hub-cta hub-cta--primary" data-action="${companyAction}">${companyLabel} <span aria-hidden="true">→</span></button></div></div></section>
      ${renderHubNewsStrip(state)}
      <section class="hub-contents" id="hub-contents" aria-labelledby="hub-contents-title"><div class="hub-contents__title"><div><h2 id="hub-contents-title">LAC 콘텐츠</h2></div><p>회사 관리부터 게임 정보까지, 필요한 서비스를 선택하세요.</p></div>
        <div class="hub-features">
          ${contentCard({title:HUB_CONTENT.company.name,description:HUB_CONTENT.company.description,image:'company.webp',tag:current?'이용 가능':'회사 선택 필요',tagType:current?'available':'neutral',action:companyAction})}
          ${contentCard({title:'게임 정보',description:'게임과 관련된 정보와 자료를 확인하세요.',image:'game.webp',tag:current?'회사 멤버 이용':'회사 선택 필요',tagType:current?'available':'neutral',action:current?'open-hub-game-info':'open-company-start',footnote:current?'기존 회사별 정보 권한 유지':'현재 회사 가입 후 이용'})}
          ${contentCard({title:HUB_CONTENT.build.name,description:HUB_CONTENT.build.description,image:'build.webp',tag:'무료',tagType:'free',href:BUILD_PUBLIC_URL,footnote:'통합 경로 시험용 · 기존 기능 유지'})}
          ${contentCard({title:HUB_CONTENT.cook.name,description:HUB_CONTENT.cook.description,image:'cook.webp',tag:'통합 예정',tagType:'neutral',disabled:true,footnote:'서비스 준비 중'})}
        </div>
      </section>
      <footer class="hub-footer"><span>LAC HUB · PLAY TOGETHER</span><span>회사 관리 · 게임 정보 · LAC BUILD · LAC COOK</span></footer>
    </main>
  </div>`;
}
