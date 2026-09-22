import {PNG} from 'pngjs';import pixelmatch from 'pixelmatch';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {inspect} from './assets.mjs';import {root,finish} from './common.mjs';
// Corrupt only disposable copies, never production files.
const checks=[],tmp=fs.mkdtempSync(path.join(os.tmpdir(),'axe-asset-test-'));
try{
 fs.mkdirSync(path.join(tmp,'src/styles'),{recursive:true});fs.mkdirSync(path.join(tmp,'public/brand'),{recursive:true});
 fs.writeFileSync(path.join(tmp,'index.html'),'<script type="module" src="/src/main.js"></script>');fs.writeFileSync(path.join(tmp,'src/main.js'),"import './styles.css';");fs.writeFileSync(path.join(tmp,'src/styles.css'),"@import './styles/child.css';");fs.writeFileSync(path.join(tmp,'src/styles/child.css'),"body{background:url('/brand/test.png')}");fs.writeFileSync(path.join(tmp,'public/brand/test.png'),'fixture');
 checks.push({name:'healthy source graph',ok:inspect(tmp,'index.html').checks.every(c=>c.ok)});
 for(const name of ['src/styles.css','src/styles/child.css','public/brand/test.png']){const f=path.join(tmp,name),b=fs.readFileSync(f);fs.unlinkSync(f);checks.push({name:'missing '+name+' detected',ok:inspect(tmp,'index.html').checks.some(c=>!c.ok)});fs.writeFileSync(f,b);}
 fs.mkdirSync(path.join(tmp,'assets'));fs.writeFileSync(path.join(tmp,'index.html'),'<script type="module" src="/assets/index-abc123.js"></script><link rel="stylesheet" href="/assets/index-abc123.css">');fs.writeFileSync(path.join(tmp,'assets/index-abc123.js'),'');checks.push({name:'missing hashed CSS detected',ok:inspect(tmp,'index.html',true).checks.some(c=>!c.ok)});
 fs.writeFileSync(path.join(tmp,'assets/index-abc123.css'),'body{}');checks.push({name:'healthy production graph',ok:inspect(tmp,'index.html',true).checks.every(c=>c.ok)});
 fs.unlinkSync(path.join(tmp,'assets/index-abc123.js'));checks.push({name:'missing hashed JS detected',ok:inspect(tmp,'index.html',true).checks.some(c=>!c.ok)});
}finally{fs.rmSync(tmp,{recursive:true,force:true});}const image=(offset=0)=>{const p=new PNG({width:100,height:100});p.data.fill(255);for(let y=20;y<60;y++)for(let x=20+offset;x<60+offset;x++){const i=(y*100+x)*4;p.data[i]=0;p.data[i+1]=0;p.data[i+2]=0;}return p;};const a=image(),b=image(2);const differentPixels=pixelmatch(a.data,b.data,null,100,100,{threshold:0,includeAA:true});checks.push({name:'2px displacement detected by visual policy',ok:differentPixels>4,differentPixels,allowedPixels:4});finish('negative-controls',checks);
