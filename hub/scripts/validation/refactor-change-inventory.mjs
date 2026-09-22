import fs from 'node:fs';
import path from 'node:path';
import {root,walk,finish,write,hash} from './common.mjs';

const manifestPath=path.join(root,'tests/validation/product-sha256.json');
const configPath=path.join(root,'tests/validation/refactor-allowed-changes.json');
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const config=JSON.parse(fs.readFileSync(configPath,'utf8'));
const allowed=new Set(config.allowedProductFiles||[]);
const forbidden=config.forbiddenPrefixes||[];
const changed=[];
const unchanged=[];
const missing=[];
const unauthorized=[];

for(const [name,digest] of Object.entries(manifest)){
  const file=path.join(root,name);
  if(!fs.existsSync(file)){missing.push(name);continue;}
  const same=hash(fs.readFileSync(file))===digest;
  if(same)unchanged.push(name);
  else if(allowed.has(name))changed.push(name);
  else unauthorized.push(name);
}

const protectedRoots=['src','api','server','database','public'];
const known=new Set(Object.keys(manifest));
const added=[];
for(const dir of protectedRoots){
  const abs=path.join(root,dir);
  if(!fs.existsSync(abs))continue;
  for(const file of walk(abs)){
    const rel=path.relative(root,file).replaceAll(path.sep,'/');
    if(!known.has(rel)&&!allowed.has(rel))added.push(rel);
  }
}

const forbiddenChanged=changed.filter(name=>forbidden.some(prefix=>name.startsWith(prefix)));
const checks=[
  {name:'no original product file missing',ok:missing.length===0,detail:missing},
  {name:'only approved original product files changed',ok:unauthorized.length===0,detail:unauthorized},
  {name:'no unexpected product files added',ok:added.length===0,detail:added},
  {name:'no forbidden integration area changed',ok:forbiddenChanged.length===0,detail:forbiddenChanged}
];
const details={batch:config.batch,allowed:[...allowed],changed,unchangedCount:unchanged.length,missing,unauthorized,added,forbiddenChanged};
const status=finish('change-inventory',checks,details);
write('product-integrity',{status,mode:'refactor-aware',baselineManifest:'tests/validation/product-sha256.json',...details,checks});
write('refactor-change-summary',{status,batch:config.batch,changed,allowed:[...allowed]});
