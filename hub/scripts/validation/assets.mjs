import fs from 'node:fs';import path from 'node:path';import {root,finish} from './common.mjs';
export function inspect(base,entry,production=false){
 const checks=[],seen=new Set(),external=[];
 function visit(rel,parent='entry'){
  rel=rel.split(/[?#]/)[0];if(seen.has(rel))return;seen.add(rel);
  const file=path.resolve(base,rel);if(!file.startsWith(path.resolve(base)+path.sep)){checks.push({name:`unsafe path ${rel}`,ok:false});return;}
  const exists=fs.existsSync(file)&&fs.statSync(file).isFile();checks.push({name:`${parent} -> ${rel}`,ok:exists});if(!exists)return;
  if(!/\.(html|css|js|mjs)$/.test(rel))return;
  const s=fs.readFileSync(file,'utf8').replace(/\/\*[\s\S]*?\*\//g,'');let refs=[];
  if(rel.endsWith('.html')) refs=[...s.matchAll(/<(?:script|link|img|source)\b[^>]*?\b(?:src|href)=["']([^"']+)["']/g)].map(m=>m[1]);
  if(/\.(?:js|mjs)$/.test(rel)) refs=[...s.matchAll(/(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)["']([^"']+)["']/g),...s.matchAll(/new URL\(\s*["']([^"']+)["']\s*,\s*import\.meta\.url/g)].map(m=>m[1]);
  if(rel.endsWith('.css')) refs=[...s.matchAll(/@import\s+(?:url\(\s*)?["']([^"']+)["']/g),...s.matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)/g)].map(m=>m[1]);
  for(const ref of new Set(refs)){
   if(/^(data:|blob:|#)/.test(ref))continue;
   if(/^(https?:|\/\/)/.test(ref)){external.push(ref);continue;}
   if(/\.(?:js|mjs)$/.test(rel)&&!ref.startsWith('.')&&!ref.startsWith('/')){external.push(`package:${ref}`);continue;}
   const target=ref.startsWith('/')?(production?ref.slice(1):fs.existsSync(path.join(base,ref))?ref.slice(1):'public/'+ref.slice(1)):path.posix.normalize(path.posix.join(path.posix.dirname(rel),ref));
   visit(target,rel);
  }
 }
 visit(entry);
 const styles=[...seen].filter(x=>x.endsWith('.css')),scripts=[...seen].filter(x=>/\.(js|mjs)$/.test(x));
 checks.push({name:'reachable stylesheet exists',ok:styles.length>0},{name:'reachable JavaScript exists',ok:scripts.length>0});
 if(production){const html=fs.readFileSync(path.join(base,entry),'utf8');checks.push({name:'production HTML has no source entry',ok:!html.includes('/src/main.js')},{name:'root base deployment (subpath not certified)',ok:!/<base\b/.test(html)});}
 return {checks,styles,scripts,external,files:[...seen]};
}
if(process.argv[1]===import.meta.filename){const production=process.argv.includes('--dist');const base=production?path.join(root,'dist'):root;if(!fs.existsSync(path.join(base,'index.html'))){finish(production?'dist-assets':'source-assets',[{name:'index.html exists',ok:false}]);}else{const r=inspect(base,'index.html',production);finish(production?'dist-assets':'source-assets',r.checks,r);}}
