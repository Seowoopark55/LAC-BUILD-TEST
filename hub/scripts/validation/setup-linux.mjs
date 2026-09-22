// Optional reproducible Linux x64 test runtime. Does not modify product files.
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import zlib from 'node:zlib';import {spawnSync} from 'node:child_process';import {root,write,hash} from './common.mjs';
if(process.platform!=='linux'||process.arch!=='x64'){write('runtime-setup',{status:'NOT RUN',reason:'Reference environment is Linux x64. Use Playwright install on other platforms and a separately reviewed baseline.'});process.exit(2);}
const cache=path.join(root,'node_modules/.cache/axe-validation');fs.mkdirSync(cache,{recursive:true});
const bin=path.join(root,'node_modules/@sparticuz/chromium/bin');
try{
 const executable=path.join(cache,'chromium');fs.writeFileSync(executable,zlib.brotliDecompressSync(fs.readFileSync(path.join(bin,'chromium.br'))),{mode:0o755});fs.chmodSync(executable,0o755);
 for(const name of ['swiftshader','fonts','al2023']){const tar=path.join(cache,name+'.tar');fs.writeFileSync(tar,zlib.brotliDecompressSync(fs.readFileSync(path.join(bin,name+'.tar.br'))));const p=spawnSync('tar',['--no-same-owner','-xf',tar,'-C',cache],{encoding:'utf8'});if(p.status!==0)throw Error(p.stderr);fs.unlinkSync(tar);}
 const source=path.join(root,'node_modules/pretendard/dist/public/static');const fonts=path.join(os.homedir(),'.local/share/fonts/axe-validation');fs.mkdirSync(fonts,{recursive:true});const installed=[];
 for(const name of fs.readdirSync(source).filter(n=>n.endsWith('.otf'))){const b=fs.readFileSync(path.join(source,name));fs.writeFileSync(path.join(fonts,name),b);installed.push({name,sha256:hash(b)});}
 const fc=spawnSync('fc-cache',['-f',fonts],{encoding:'utf8'});if(fc.status!==0)throw Error('fontconfig required: '+fc.stderr);
 write('runtime-setup',{status:'PASS',executable,chromiumPackage:'153.0.0',fonts:installed});
}catch(e){write('runtime-setup',{status:'NOT RUN',reason:e.message});process.exitCode=2;}
