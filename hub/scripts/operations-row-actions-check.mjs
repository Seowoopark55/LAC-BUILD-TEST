import fs from 'node:fs';
const render=fs.readFileSync(new URL('../src/ui/render.js',import.meta.url),'utf8');
const main=fs.readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../src/styles/management.css',import.meta.url),'utf8');
const checks=[
 ['member header/value axes centered',css.includes('.main--members .ops-lane-head>span,')&&css.includes('.main--members .ops-lane-row>.ops-lane-cell,')&&css.includes('justify-content:center;')],
 ['asset header/value axes centered',css.includes('.main--assets .ops-lane-head>span,')&&css.includes('.main--assets .ops-lane-row>.ops-lane-cell,')],
 ['account header/value axes centered',css.includes('.main--accounts .ops-lane-head>span,')&&css.includes('.main--accounts .ops-lane-row>.ops-lane-cell{')],
 ['fund linked entries have active edit control',render.includes("r.can_edit?'':'is-correction'")&&render.includes('data-action="edit-ledger"')],
 ['fund correction modal exists',render.includes('data-form="ledger-correction"')&&render.includes('원본 행은 삭제하지 않고 정정 차액만 별도 기록됩니다.')],
 ['fund correction submit creates delta entry',main.includes("if(type==='ledger-correction')")&&main.includes('const delta=targetSigned-oldSigned')&&main.includes('saveFundLedgerEntry')],
 ['account own row has edit action',render.includes("r.membership_id===my?.id")&&render.includes('>수정</button>')],
 ['account pending row has review action',render.includes("r.pending)return")&&render.includes('>검수</button>')],
 ['account other row has detail action',render.includes('>상세</button>')&&render.includes('accountDetailModal')],
 ['account row action routed',main.includes("if(action==='open-account-row')")],
];
let pass=0;for(const [label,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${label}`);if(ok)pass++;}
console.log(`Operations Row Actions: ${pass}/${checks.length} PASS`);if(pass!==checks.length)process.exit(1);
