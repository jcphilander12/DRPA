import {db} from './server';
import {SHARED_KEY,type Context} from './collaboration';
import {valuesEqual} from './state';
import type {Workspace} from './types';
export function activityChanges(c:Context,before:Workspace,after:Workspace,mutation:string){
 const statements:D1PreparedStatement[]=[];const time=new Date().toISOString();
 const add=(pid:string,target:string,action:string,detail:unknown)=>statements.push(db().prepare('INSERT INTO bid_audit (id,project_id,target_id,actor_name,action,created_at,actor_id,actor_role,detail) SELECT ?,?,?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM workspaces WHERE owner_id=? AND mutation_id=?)').bind(crypto.randomUUID(),pid,target,c.me.name,action,time,c.me.id,c.me.role,JSON.stringify(detail),SHARED_KEY,mutation));
 for(const p of after.projects){const old=before.projects.find(x=>x.id===p.id);if(!old){add(p.id,'_bid','Created bid',{});continue;}
  if(!valuesEqual(old.deadline,p.deadline))add(p.id,'_itt','Changed submission deadline',{before:old.deadline?.date,after:p.deadline?.date});
  for(const q of p.questions){const prev=old.questions.find(x=>x.id===q.id);if(!prev){add(p.id,q.id,'Added question',{reference:q.ref});continue;}
   const fields=(x:typeof q)=>({draft:x.draft,text:x.text,input:x.input,criteria:x.criteria,limit:x.limit,unit:x.unit,style:x.style,structure:x.structure,evidenceIds:x.evidenceIds,notes:x.notes,versions:x.versions,review:x.review});
   if(!valuesEqual(fields(prev),fields(q)))add(p.id,q.id,!prev.draft.trim()&&q.draft.trim()?'First draft saved':prev.draft!==q.draft?'Edited answer':'Updated question inputs',{reference:q.ref,beforeCharacters:prev.draft.length,afterCharacters:q.draft.length,wasInReview:prev.status==='review',wasComplete:prev.status==='approved',versionSaved:q.versions.length!==prev.versions.length});
  }
  for(const [key,target]of [['serviceModel','_model'],['fmt','_fmt'],['brief','_brief']] as const)if(!valuesEqual(old[key],p[key]))add(p.id,target,'Updated '+(key==='serviceModel'?'service model':key==='fmt'?'FMT inputs':'bid briefing'),{});
  const sources=after.sources.filter(s=>s.scope===p.id);for(const source of sources){const prev=before.sources.find(x=>x.id===source.id);if(!valuesEqual(source,prev))add(p.id,'_itt',!prev?'Added bid document':prev.status!=='approved'&&source.status==='approved'?'Verified bid document':'Updated bid document',{sourceId:source.id,category:source.category});}
 }
 if(c.me.role==='master')for(const source of after.sources.filter(s=>s.fileId))statements.push(db().prepare('UPDATE files SET visibility=? WHERE id=? AND EXISTS (SELECT 1 FROM workspaces WHERE owner_id=? AND mutation_id=?)').bind(source.visibility==='master'?'master':'team',source.fileId!,SHARED_KEY,mutation));
 return statements;
}
