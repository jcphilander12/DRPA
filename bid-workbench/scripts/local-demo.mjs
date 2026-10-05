// Portable, loopback-only software test harness. Never deploy this server.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {randomBytes} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createRuntime,identity} from './test-runtime.mjs';
import {seedDemo,demoAccounts} from './demo-seed.mjs';

process.chdir(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'));
if(process.env.SITES_MANAGED_LINUX_CONTAINER==='1')throw new Error('Run pnpm demo on your own computer. Managed Sites uses its supervised preview.');
await fs.access('dist/server/index.js').catch(()=>{throw new Error('Build first: pnpm build');});
const port=4180,origin=`http://127.0.0.1:${port}`,storage=path.resolve('.local-demo');
await fs.mkdir(storage,{recursive:true});const mf=await createRuntime({persist:storage});await seedDemo(mf,origin);
const sessions=new Map(),assetRoot=path.resolve('dist/client');
const mime={'.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.ico':'image/x-icon','.woff2':'font/woff2','.json':'application/json','.wasm':'application/wasm','.map':'application/json'};
const loginPage=()=>`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DRPA local test users</title><style>body{font:16px system-ui;background:#f3f6f9;color:#13233f;max-width:640px;margin:12vh auto;padding:24px}form{display:grid;gap:12px}button{background:#13233f;color:white;padding:16px;border:0;border-radius:8px;text-align:left;font:inherit}p{line-height:1.6}</style><h1>Choose a test user</h1><p>This local demonstration uses synthetic bid and workforce figures. Switch users to test assignments, comments and approvals. It is for your computer only.</p><form method="post" action="/demo-login">${demoAccounts.map(a=>`<button name="account" value="${a.role}">${a.name} · ${a.role}</button>`).join('')}</form><p>The master assigns work, the writer edits it, and the checker adds comments and checks the current version.</p></html>`;
const server=http.createServer(async(req,res)=>{
 try{
  if(req.headers.host!==`127.0.0.1:${port}`){res.writeHead(403);res.end('Use '+origin);return;}
  const url=new URL(req.url||'/',origin);
  if(url.pathname==='/demo-login'){
   if(req.method==='POST'){
    if(req.headers.origin!==origin){res.writeHead(403);res.end('Invalid origin');return;}
    let body='';for await(const chunk of req){body+=chunk;if(body.length>1024)throw new Error('Invalid account form');}
    const choice=new URLSearchParams(body).get('account');const account=demoAccounts.find(a=>a.role===choice);
    if(!account){res.writeHead(400);res.end('Choose a test account');return;}
    const token=randomBytes(24).toString('hex');sessions.set(token,account.email);
    res.writeHead(303,{Location:'/', 'Set-Cookie':`drpa_demo=${token}; Path=/; HttpOnly; SameSite=Strict`,'Cache-Control':'no-store'});res.end();return;
   }
   res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(loginPage());return;
  }
  const cookie=req.headers.cookie?.split(';').map(s=>s.trim()).find(s=>s.startsWith('drpa_demo='))?.slice(10);const email=sessions.get(cookie);
  if(!email){res.writeHead(303,{Location:'/demo-login','Cache-Control':'no-store'});res.end();return;}
  const asset=path.resolve(assetRoot,'.'+decodeURIComponent(url.pathname));
  if((req.method==='GET'||req.method==='HEAD')&&asset.startsWith(assetRoot+path.sep)){
   const stat=await fs.stat(asset).catch(()=>null);
   if(stat?.isFile()){
    res.writeHead(200,{'Content-Type':mime[path.extname(asset)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:await fs.readFile(asset));return;
   }
  }
  const headers=new Headers();for(const [key,value]of Object.entries(req.headers)){
   if(/^(oai-|cf-|x-forwarded-|host$|content-length$|connection$|cookie$)/i.test(key))continue;
   if(value!==undefined)headers.set(key,Array.isArray(value)?value.join(','):value);
  }
  for(const [key,value]of Object.entries(identity(email)))headers.set(key,value);
  const chunks=[];let length=0;for await(const chunk of req){length+=chunk.length;if(length>16*1024*1024){res.writeHead(413);res.end('Upload exceeds local test limit');return;}chunks.push(chunk);}
  const body=Buffer.concat(chunks);const response=await mf.dispatchFetch(url.toString(),{method:req.method,headers,...(body.length?{body}:{})});
  res.writeHead(response.status,Object.fromEntries(response.headers));
  if(response.body)for await(const chunk of response.body)res.write(Buffer.from(chunk));res.end();
 }catch(error){console.error(error.message);if(!res.headersSent)res.writeHead(500,{'Content-Type':'text/plain'});res.end('Local test request failed. Check the terminal.');}
});
server.listen(port,'127.0.0.1',()=>console.log(`DRPA sample workbench: ${origin}/demo-login\nSynthetic data only. Stop with Ctrl+C. Reset by deleting .local-demo while stopped.`));
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>{server.close(async()=>{await mf.dispose();process.exit(0);});});
