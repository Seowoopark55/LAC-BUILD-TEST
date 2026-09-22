import fs from 'node:fs';
const css=fs.readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');

// Keep the 100% baseline font sizes as the reference, while accepting the
// equivalent shared-scale calc() form used by the new typography studio.
const containsCss = text => css.includes(text) || css.includes(text.replace(/font-size:(\d+(?:\.\d+)?px)/g, 'font-size:calc(($1) * var(--lac-type-scale, 1))'));
const checks=[
 ['marker exists',containsCss('GUIDED SETUP TYPOGRAPHY R1')],
 ['hero title enlarged',containsCss('.setup-demo-hero h2,.setup-demo-quest h2,.setup-demo-complete h2{font-size:29px}')],
 ['body copy enlarged',containsCss('.setup-demo-hero p,.setup-demo-quest>p,.setup-demo-complete>p{font-size:13px')],
 ['rail labels enlarged',containsCss('.setup-demo-step strong{font-size:11px}')],
 ['field labels enlarged',containsCss('.setup-demo-field>span{font-size:11px}')],
 ['select text enlarged',containsCss('.setup-demo-field select{font-size:12.5px}')],
 ['module titles enlarged',containsCss('.setup-demo-module strong{font-size:12px}')],
 ['module descriptions enlarged',containsCss('.setup-demo-module small{font-size:9.5px}')],
 ['buttons enlarged',containsCss('.setup-demo-back,.setup-demo-restart,.setup-demo-primary{font-size:11px}')],
 ['mobile title preserved',containsCss('font-size:25px')],
];
let pass=0; for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'}  ${name}`);if(ok)pass++;}
console.log(`Guided Setup Typography: ${pass}/${checks.length} PASS`);if(pass!==checks.length)process.exit(1);
