import fs from 'node:fs';
const css=fs.readFileSync(new URL('../src/styles/pages.css',import.meta.url),'utf8');

// Keep the 100% baseline font sizes as the reference, while accepting the
// equivalent shared-scale calc() form used by the new typography studio.
const containsCss = text => css.includes(text) || css.includes(text.replace(/font-size:(\d+(?:\.\d+)?px)/g, 'font-size:calc(($1) * var(--lac-type-scale, 1))'));
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const checks=[]; const expect=(label,ok)=>checks.push([label,Boolean(ok)]);
expect('current web package version',pkg.version==='1.7.41-web-ui.79');
expect('dashboard hero description is readable',containsCss('.axe-dashboard-hero p{margin:6px 0 0;color:#929ca5;font-size:11.5px}'));
expect('dashboard refresh is at least 10px',containsCss('color:#a7b0b8;font-size:10.5px;font-weight:850'));
expect('metric labels increased',containsCss('.axe-dashboard-metrics span{color:#8a959f;font-size:10px'));
expect('metric values remain prominent',containsCss('.axe-dashboard-metrics strong{color:#f0ece4;font-size:19px'));
expect('metric helper text removed',!containsCss('.axe-dashboard-metrics small{'));
expect('panel titles increased to 14px',containsCss('.axe-dashboard-panel>header h2{margin:0;color:#ece8e1;font-size:14px}'));
expect('panel eyebrow increased',containsCss('font-size:9.2px;font-weight:950;letter-spacing:.11em'));
expect('attention title increased',containsCss('color:#e5e8eb;font-size:11.5px'));
expect('attention metadata increased',containsCss('color:#7f8a94;font-size:9.5px'));
expect('quick action title remains prominent',containsCss('color:#e4e7ea;font-size:12px'));
expect('quick action helper text removed',!containsCss('.axe-dashboard-quick-grid small{'));
expect('activity title increased',containsCss('color:#e0e4e7;font-size:11px'));
expect('activity metadata increased',containsCss('color:#79848e;font-size:9.5px'));
expect('activity timestamp increased',containsCss('color:#707a83;font-size:9px'));
expect('snapshot labels increased',containsCss('color:#76818b;font-size:9.2px'));
expect('system connection title increased',containsCss('.axe-dashboard-system-line .connection-status strong{font-size:11.5px'));
expect('system connection helper removed',!containsCss('.axe-dashboard-system-line .connection-status small{'));
expect('module labels increased',containsCss('.axe-dashboard-module-tags>strong{color:#89949e;font-size:9.5px}'));
expect('module chips increased',containsCss('color:#abb4bc;font-size:9.2px'));
expect('desktop one-glance grid retained',containsCss("grid-template-areas:'attention quick' 'activity system'")&&containsCss('height:clamp(400px,calc(100dvh - 345px),640px)'));
expect('dashboard still has no nested list scrollbar',!containsCss('.axe-dashboard-activity-list{overflow:auto')&&!containsCss('.axe-dashboard-attention-list{overflow:auto'));
let failed=0; for(const [label,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${label}`); if(!ok) failed++;}
console.log(`Dashboard readability: ${checks.length-failed}/${checks.length} PASS`); if(failed) process.exit(1);
