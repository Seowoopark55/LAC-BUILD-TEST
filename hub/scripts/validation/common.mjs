import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
export const root=path.resolve(import.meta.dirname,'../..');
export const out=path.join(root,'validation-results');fs.mkdirSync(out,{recursive:true});
export const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
export function write(name,value){fs.writeFileSync(path.join(out,name+'.json'),JSON.stringify(value,null,2));console.log(name+': '+(value.status||'recorded'));}
export function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
export function finish(name,checks,extra={}){const status=checks.some(c=>!c.ok)?'FAIL':'PASS';write(name,{status,checks,...extra});if(status==='FAIL')process.exitCode=1;return status;}
