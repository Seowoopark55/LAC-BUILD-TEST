import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import {root} from './common.mjs';
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.png':'image/png','.json':'application/json','.woff2':'font/woff2','.svg':'image/svg+xml'};
export async function serve({production=false}={}){
 const base=production?path.join(root,'dist'):root;
 const server=http.createServer((req,res)=>{try{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let body,type='text/javascript';
 if(!production&&pathname==='/__validation/'){
  // Test-only page: same inline boot styles and original renderer; no production markup edits.
  body=fs.readFileSync(path.join(root,'index.html'),'utf8').replace('<script type="module" src="/src/main.js"></script>','<link rel="stylesheet" href="/src/styles.css"><script type="module" src="/__validation/main.js"></script>');type='text/html';
 }else if(!production&&pathname==='/__validation/main.js'){
  const s=fs.readFileSync(path.join(root,'src/main.js'),'utf8');
  if(!s.includes("import './styles.css';")||!s.endsWith('cleanupLegacyPwa();\nboot();\n'))throw Error('main harness anchors changed; review adapter');
  body=s.replace("import './styles.css';",'').replace("'./lib/supabase.js'","'/__validation/env.js'").replace("'./lib/productApi.js'","'/__validation/api.js'").replace("'./ui/render.js'","'/src/ui/render.js'").replace(/cleanupLegacyPwa\(\);\nboot\(\);\n$/,`\nwindow.__axeTest={state,render,setNotice,reset(next){Object.keys(state).forEach(k=>delete state[k]);Object.assign(state,next);render();}};\n`);
 }else if(!production&&pathname==='/__validation/env.js'){body='export const envReady=true;';
 }else if(!production&&pathname==='/__validation/api.js'){
  const api=fs.readFileSync(path.join(root,'src/lib/productApi.js'),'utf8');const names=[...api.matchAll(/export (?:async )?function (\w+)\(/g)].map(m=>m[1]);
  body=names.map(n=>`export async function ${n}(...args){window.__apiCalls??=[];window.__apiCalls.push({name:${JSON.stringify(n)},args});const fn=window.__apiMock?.[${JSON.stringify(n)}];if(!fn)throw new Error('Unconfigured fixture API: ${n}');return fn(...args);}`).join('\n');
 }else{
  const rel=pathname==='/'?'index.html':pathname.slice(1);let file=path.resolve(base,rel);
  if(!file.startsWith(base+path.sep)){res.writeHead(403);res.end();return;}
  if(!production&&!fs.existsSync(file))file=path.resolve(base,'public',rel);
  if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end('Not found');return;}
  body=fs.readFileSync(file);type=types[path.extname(file)]||'application/octet-stream';
 }
 res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'});res.end(body);
 }catch(e){res.writeHead(500);res.end(e.message);}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));return {server,url:`http://127.0.0.1:${server.address().port}`,close:()=>new Promise(r=>server.close(r))};
}
