// TEST PILOT ONLY. Keep HUB mounted and host the existing BUILD React app
// inside an isolated shadow tree; switching the URL does not reload HUB.
import React from 'react';
import { createRoot } from 'react-dom/client';
import BuildApp from '../../build/src/App.jsx';
import buildCss from '../../build/src/styles.css?inline';

let mounted = false;

export function mountEmbeddedBuild(host) {
  if (mounted) return;
  mounted = true;
  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  // BUILD's :root variables belong to its isolated host, not the HUB document.
  style.textContent = buildCss.replace(/:root\b/g, ':host') + `
    :host { display: block; min-height: 100vh; color: #f4f4f5;
      font-family: Inter, Pretendard, "Noto Sans KR", system-ui, sans-serif;
      background: #09090a; }
    .app { min-height: 100vh; background: var(--bg, #09090a); }
    .lac-build-return { position: relative; z-index: 100; width: 100%;
      height: 36px; padding: 0 22px; border: 0; border-bottom: 1px solid #25252b;
      background: #121215; color: #e3bf74; text-align: left; cursor: pointer;
      font-size: 12px; font-weight: 800; }
    .lac-build-return:hover { background: #1d1b17; }
  `;
  shadow.appendChild(style);
  const returnButton = document.createElement('button');
  returnButton.className = 'lac-build-return';
  returnButton.type = 'button';
  returnButton.textContent = '← LAC HUB로 돌아가기';
  returnButton.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('lac:navigate-hub'));
  });
  shadow.appendChild(returnButton);
  const appRoot = document.createElement('div');
  appRoot.id = 'lac-build-react-root';
  shadow.appendChild(appRoot);
  createRoot(appRoot).render(<BuildApp />);
}
