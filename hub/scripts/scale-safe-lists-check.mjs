import fs from 'node:fs';
const render=fs.readFileSync('src/ui/render.js','utf8');
const main=fs.readFileSync('src/main.js','utf8');
const management=fs.readFileSync('src/styles/management.css','utf8');
const settings=fs.readFileSync('src/styles/settings.css','utf8');
const pages=fs.readFileSync('src/styles/pages.css','utf8');
const checks=[
  ['shared page-size contract',/OPS_PAGE_SIZE=\{questions:5,suggestions:5,fund:8,fundReview:6,members:8,assets:8,returns:8,accounts:8,cooking:9,platform:6\}/.test(render)],
  ['shared pager renderer',render.includes('function renderDataPager')&&render.includes('data-action="list-page"')],
  ['fund ledger bounded',render.includes("renderDataPager('fundLedger'")&&main.includes('fundLedgerPage:1')],
  ['members bounded',render.includes("renderDataPager('members'")&&main.includes('memberPage:1')],
  ['assets bounded',render.includes("renderDataPager('assets'")&&render.includes("renderDataPager('returns'")],
  ['accounts bounded',render.includes("renderDataPager('accounts'")&&render.includes('pending.slice(0,4)')],
  ['cooking search filter pager',render.includes('data-cooking-query')&&render.includes('data-cooking-status')&&render.includes("renderDataPager('cooking'")],
  ['questions scope/status pager',render.includes('data-action="question-scope"')&&render.includes('data-action="question-filter"')&&render.includes("renderDataPager('questions'")],
  ['fund review bounded',render.includes("renderDataPager('fundReview'")&&main.includes('fundReviewPage:1')],
  ['platform companies bounded',render.includes("renderDataPager('platform'")&&main.includes('platformPage:1')],
  ['filters reset pages',main.includes('state.memberPage=1')&&main.includes('state.accountPage=1')&&main.includes('state.cookingPage=1')],
  ['pager action routing',main.includes("if(action==='list-page')")&&main.includes("fundLedger:'fundLedgerPage'")],
  ['no nested list scrollbar',management.includes('.ops-mgmt-list,.axe-fund-ledger-list{max-height:none;overflow:visible}')],
  ['cooking scale styling',settings.includes('Cooking list stays compact as menu count grows')],
  ['question scale styling',pages.includes('Question board bounded list')&&pages.includes('Question board scope + hard visual bound')],
  ['weekly fund viewport bounded',fs.readFileSync('src/styles/fund.css','utf8').includes('max-height:min(52vh,420px)')],
];
let failed=0;
for(const [label,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${label}`);if(!ok)failed++;}
if(failed){console.error(`Scale-safe lists: ${checks.length-failed}/${checks.length} PASS`);process.exit(1);}
console.log(`Scale-safe lists: ${checks.length}/${checks.length} PASS`);
