import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const requireWrangler=createRequire(require.resolve('wrangler/package.json'));
const {Miniflare}=requireWrangler('miniflare');
export async function createRuntime({persist,bindings={},fetchMock}={}){
 const moduleFiles=(await fs.readdir('dist/server',{recursive:true})).filter(p=>p.endsWith('.js')&&p!=='index.js');
 const modules=[{type:'ESModule',path:'dist/server/index.js'},...moduleFiles.map(p=>({type:'ESModule',path:'dist/server/'+p}))];
 const mf=new Miniflare({modules,compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],r2Buckets:['BUCKET'],cf:false,...(fetchMock?{fetchMock}:{}),bindings:{AUTH_MODE:'sites',MASTER_EMAIL:'master@example.test',LOCAL_DEMO:'1',...bindings},...(persist?{d1Persist:persist+'/d1',r2Persist:persist+'/r2'}:{})});
 const db=await mf.getD1Database('DB');await db.prepare('CREATE TABLE IF NOT EXISTS local_migrations (name TEXT PRIMARY KEY)').run();
 for(const name of (await fs.readdir('drizzle')).filter(n=>n.endsWith('.sql')).sort()){
  if(await db.prepare('SELECT name FROM local_migrations WHERE name=?').bind(name).first())continue;
  const sql=await fs.readFile('drizzle/'+name,'utf8');for(const statement of sql.replace(/--> statement-breakpoint/g,'').split(';').map(s=>s.trim()).filter(Boolean))await db.prepare(statement).run();await db.prepare('INSERT INTO local_migrations (name) VALUES (?)').bind(name).run();
 }
 return mf;
}
export const identity=email=>({'oai-authenticated-user-email':email,'oai-authenticated-user-full-name':email==='master@example.test'?'Test%20Master':email==='writer@example.test'?'Test%20Writer':'Test%20Checker','oai-authenticated-user-full-name-encoding':'percent-encoded-utf-8'});
