import {authenticated,db,ApiError,runtime} from './server';
import {initialWorkspace} from './seed';
import {completion,newModel,newFMT,targetContent,contentHash,modelIssues,fmtIssues} from './finance';
import {buildBrief} from './itt';
import {reviewQuestion} from './engine';
import {deadlineInstant} from './deadlines';
import {valuesEqual} from './state';
import type {Member,Assignment,Comment,CheckRecord,AuditRecord,Workspace,Project,Collaboration} from './types';
export const SHARED_KEY='drpa-shared-workspace-v2';
// Validation reconstructs object keys in schema order. Compare values, rather
// than JSON property order, so unchanged sections do not require extra grants.
const eq=valuesEqual;
const member=(r:any):Member=>({id:r.id,email:r.email,name:r.name,role:r.role,active:!!r.active});
const assignment=(r:any):Assignment=>({id:r.id,projectId:r.project_id,targetId:r.target_id,memberId:r.member_id,access:r.access});
const comment=(r:any):Comment=>({id:r.id,projectId:r.project_id,targetId:r.target_id,authorId:r.author_id,authorName:r.author_name,text:r.text,quote:r.quote,proposal:r.proposal,baseHash:r.base_hash,status:r.status,applied:!!r.applied,decisionNote:r.decision_note,decidedBy:r.decided_by,createdAt:r.created_at,updatedAt:r.updated_at});
const check=(r:any):CheckRecord=>({id:r.id,projectId:r.project_id,targetId:r.target_id,memberId:r.member_id,contentHash:r.content_hash,createdAt:r.created_at});
const audit=(r:any):AuditRecord=>({id:r.id,projectId:r.project_id,targetId:r.target_id,actorName:r.actor_name,action:r.action,createdAt:r.created_at,actorId:r.actor_id,actorRole:r.actor_role,detail:r.detail});
export type Context={me:Member;members:Member[];assignments:Assignment[];user:{userId:string;legacyUserId:string;email:string}};
export async function context(request:Request,mutate=false):Promise<Context>{
 const user=await authenticated(request,mutate);const email=user.email.toLowerCase();let row=await db().prepare('SELECT * FROM team_members WHERE email = ?').bind(email).first<any>();
 const owner=runtime().MASTER_EMAIL?.trim().toLowerCase();if(!owner)throw new ApiError(503,'The master account has not been configured.');
 if(!row&&email===owner){await db().prepare('INSERT OR IGNORE INTO team_members (id,email,name,role,active) VALUES (?,?,?,?,1)').bind('master-owner',email,user.fullName||'Master user','master').run();row=await db().prepare('SELECT * FROM team_members WHERE email = ?').bind(email).first<any>();}
 if(!row||!row.active)throw new ApiError(403,'Your account has not been assigned access to this workbench. Ask the master user to add your sign-in email.');
 const members=(await db().prepare('SELECT * FROM team_members ORDER BY role,name').all<any>()).results.map(member);
 const active=new Set(members.filter(m=>m.active).map(m=>m.id));const assignments=(await db().prepare('SELECT * FROM bid_assignments').all<any>()).results.map(assignment).filter(a=>active.has(a.memberId));
 return {me:member(row),members,assignments,user};
}
export function allowed(c:Context,pid:string,target:string,access?:'write'|'check'){if(c.me.role==='master')return true;return c.assignments.some(a=>a.projectId===pid&&a.targetId===target&&a.memberId===c.me.id&&(!access||a.access===access)&&(a.access==='write'?c.me.role==='writer':c.me.role==='checker'));}
export function requireAccess(c:Context,pid:string,target:string,access?:'write'|'check'){if(!allowed(c,pid,target,access))throw new ApiError(403,'This item is not assigned to you with the required permission.');}
export function targetProject(w:Workspace,pid:string,target:string){const p=w.projects.find(p=>p.id===pid);if(!p||!['_model','_fmt','_itt','_brief'].includes(target)&&!p.questions.some(q=>q.id===target))throw new ApiError(404,'Assigned item not found.');return p;}
export function hydrate(w:Workspace):Workspace{for(const s of w.sources)if(!s.category)s.category=['Tender requirement','Clarification'].includes(s.kind)?'itt':s.kind==='Financial model'?'financial':'historic';for(const p of w.projects){p.serviceModel??=newModel();p.fmt??=newFMT();p.brief??=buildBrief(p,w.sources);}return w;}
export async function loadShared(c:Context):Promise<{workspace:Workspace;revision:number}>{
 let row=await db().prepare('SELECT body,revision FROM workspaces WHERE owner_id = ?').bind(SHARED_KEY).first<any>();
 if(!row){if(c.me.role!=='master')throw new ApiError(503,'The master user needs to open the workspace first.');const old=await db().prepare('SELECT body FROM workspaces WHERE owner_id IN (?,?) ORDER BY updated_at DESC LIMIT 1').bind(c.user.userId,c.user.legacyUserId).first<any>();const w=hydrate(old?JSON.parse(old.body):initialWorkspace());await db().prepare('INSERT OR IGNORE INTO workspaces (owner_id,body,revision,updated_at,mutation_id) VALUES (?,?,1,?,?)').bind(SHARED_KEY,JSON.stringify(w),new Date().toISOString(),'initial').run();row=await db().prepare('SELECT body,revision FROM workspaces WHERE owner_id = ?').bind(SHARED_KEY).first<any>();}
 if(!row)throw new Error('Shared workspace unavailable');return {workspace:hydrate(JSON.parse(row.body)),revision:row.revision};
}
export function visibleWorkspace(c:Context,w:Workspace):Workspace{
 if(c.me.role==='master')return w;const result=structuredClone(w);
 result.projects=result.projects.filter(p=>c.assignments.some(a=>a.memberId===c.me.id&&a.projectId===p.id)).map(p=>{
  p.questions=p.questions.filter(q=>allowed(c,p.id,q.id));
  if(!allowed(c,p.id,'_model')&&!allowed(c,p.id,'_fmt')){delete p.serviceModel;delete p.fmt;}
  return p;
 });
 const pids=new Set(result.projects.map(p=>p.id));result.sources=result.sources.filter(s=>s.visibility!=='master'&&(s.scope==='global'||pids.has(s.scope))).map(s=>{
  if(s.category==='tupe'&&!allowed(c,s.scope,'_model')&&!allowed(c,s.scope,'_fmt'))return null;
  if(s.category==='financial'&&!allowed(c,s.scope,'_model')&&!allowed(c,s.scope,'_fmt'))return {...s,text:'Financial model held by the assigned finance team. Use the confirmed model facts.',fileId:null};
  return s;
 }).filter(Boolean) as Workspace['sources'];return result;
}
export async function collaboration(c:Context,w?:Workspace):Promise<Collaboration>{
 const rows=await Promise.all([db().prepare(`SELECT * FROM bid_comments WHERE status='open' OR (status='accepted' AND applied=0) OR id IN (SELECT id FROM bid_comments ORDER BY created_at DESC LIMIT 1200) ORDER BY created_at DESC`).all<any>(),db().prepare('SELECT * FROM bid_checks ORDER BY created_at DESC LIMIT 2400').all<any>(),db().prepare('SELECT * FROM bid_audit ORDER BY created_at DESC LIMIT 100').all<any>()]);
 const targetHashes:Record<string,string>={};if(w){const targets=new Map(rows[1].results.map(check).filter(r=>allowed(c,r.projectId,r.targetId)).map(r=>[r.projectId+':'+r.targetId,r]));for(const [key,record] of targets){const p=w.projects.find(p=>p.id===record.projectId);if(p)targetHashes[key]=await reviewHash(p,record.targetId,w);}}
 return {targetHashes,me:c.me,members:c.me.role==='master'?c.members:c.members.filter(m=>m.id===c.me.id).map(m=>({...m,email:m.email})),assignments:c.me.role==='master'?c.assignments:c.assignments.filter(a=>a.memberId===c.me.id),comments:rows[0].results.map(comment).filter(r=>allowed(c,r.projectId,r.targetId)),checks:rows[1].results.map(check).filter(r=>allowed(c,r.projectId,r.targetId)),audit:rows[2].results.map(audit).filter(r=>allowed(c,r.projectId,r.targetId)),localDemo:runtime().LOCAL_DEMO==='1',progress:w?Object.fromEntries(w.projects.filter(p=>c.me.role==='master'||c.assignments.some(a=>a.projectId===p.id&&a.memberId===c.me.id)).map(p=>[p.id,completion(p,w.sources,rows[0].results.map(comment))])):{}};
}
export function invalidateChanged(old:Workspace,next:Workspace){
 const evidence=!eq(old.sources,next.sources)||old.rules!==next.rules;
 for(const p of next.projects){const prev=old.projects.find(x=>x.id===p.id);
  const modelChanged=!eq(prev?.serviceModel?{...prev.serviceModel,status:undefined}:null,p.serviceModel?{...p.serviceModel,status:undefined}:null);
  const fmtChanged=!eq(prev?.fmt?{...prev.fmt,status:undefined,validatedHash:undefined,validationNote:undefined,exportedHash:undefined,outputFileId:undefined}:null,p.fmt?{...p.fmt,status:undefined,validatedHash:undefined,validationNote:undefined,exportedHash:undefined,outputFileId:undefined}:null);
  const factsChanged=!eq(prev?.facts,p.facts)||prev?.modelSourceId!==p.modelSourceId;
  if(modelChanged&&p.serviceModel)p.serviceModel.status='draft';
  if((modelChanged||fmtChanged)&&p.fmt){p.fmt.status='draft';p.fmt.validatedHash='';p.fmt.validationNote='';p.fmt.exportedHash='';p.fmt.outputFileId=null;const governed=next.sources.find(s=>s.id===p.modelSourceId);if(governed)governed.status='needs_verification';p.facts=[];p.modelSourceId=null;}
  for(const q of p.questions){const was=prev?.questions.find(x=>x.id===q.id);if(evidence||modelChanged||factsChanged||!eq(was?{...was,status:undefined,versions:undefined}:null,{...q,status:undefined,versions:undefined}))q.status='draft';}
 }
}
export function mergeAllowed(c:Context,current:Workspace,submitted:Workspace):Workspace{
 if(c.me.role==='checker')throw new ApiError(403,'Bid checkers can comment and check assigned work. They cannot edit the draft.');
 for(const p of submitted.projects){const old=current.projects.find(x=>x.id===p.id);for(const key of ['validatedHash','validationNote','exportedHash','outputFileId'] as const)if(p.fmt?.[key]&&p.fmt[key]!==old?.fmt?.[key])throw new ApiError(400,'FMT validation/export records are generated by the server. Use Validate or Export.');for(const q of p.questions)if(q.status==='approved'&&old?.questions.find(x=>x.id===q.id)?.status!=='approved')throw new ApiError(400,'Complete items through the approval workflow.');for(const k of ['serviceModel','fmt'] as const)if(p[k]?.status==='approved'&&old?.[k]?.status!=='approved')throw new ApiError(400,'Complete the model through the approval workflow.');}
 if(c.me.role==='master'){if(current.projects.some(p=>!submitted.projects.some(x=>x.id===p.id)||p.questions.some(q=>!submitted.projects.find(x=>x.id===p.id)?.questions.some(x=>x.id===q.id))))throw new ApiError(400,'Use the master Delete action to remove bids or questions.');if(current.sources.some(s=>s.category==='itt'&&!submitted.sources.some(x=>x.id===s.id)))throw new ApiError(400,'Use the master Delete document action.');const next=structuredClone(submitted);invalidateChanged(current,next);refreshBriefs(current,next);return next;}
 const visible=visibleWorkspace(c,current);const next=structuredClone(current);
 if(submitted.rules!==current.rules)throw new ApiError(403,'Only the master user can change bid-writing rules.');
 for(const p of submitted.projects){const target=next.projects.find(x=>x.id===p.id);const original=visible.projects.find(x=>x.id===p.id);if(!target||!original)throw new ApiError(403,'This bid is not assigned to you.');
  if(!eq([p.name,p.commissioner,p.scope],[original.name,original.commissioner,original.scope]))throw new ApiError(403,'Only the master user can change bid details.');
  for(const q of p.questions){const old=original.questions.find(x=>x.id===q.id);if(!old){requireAccess(c,p.id,'_itt','write');if(target.questions.some(x=>x.id===q.id))throw new ApiError(403,'Question ID already belongs to another assignment.');target.questions.push(q);continue;}if(!eq(q,old)){requireAccess(c,p.id,q.id,'write');target.questions[target.questions.findIndex(x=>x.id===q.id)]=q;}}
  for(const [key,section] of [['serviceModel','_model'],['fmt','_fmt'],['brief','_brief'],['deadline','_itt']] as const)if(!eq(p[key],original[key])){requireAccess(c,p.id,section,'write');(target as any)[key]=p[key];}
  if(!eq(p.facts,original.facts)||p.modelSourceId!==original.modelSourceId){requireAccess(c,p.id,'_fmt','write');target.facts=p.facts;target.modelSourceId=p.modelSourceId;}
 }
 for(const s of submitted.sources){const old=visible.sources.find(x=>x.id===s.id);if(!eq(s,old)){if(['historic','intelligence','completed'].includes(s.category||'historic')||old&&s.category!==old.category)throw new ApiError(403,'Only master users add or change reusable evidence and source categories.');if(!old&&current.sources.some(x=>x.id===s.id))throw new ApiError(403,'That source is outside your visible scope.');if(s.visibility!==old?.visibility||!eq(s.origin,old?.origin))throw new ApiError(403,'Only the master user manages evidence feeds and visibility.');if(s.scope==='global')throw new ApiError(403,'Only the master user can update historical evidence.');requireAccess(c,s.scope,s.category==='itt'?'_itt':s.category==='tupe'?'_model':'_fmt','write');const at=next.sources.findIndex(x=>x.id===s.id);if(at<0)next.sources.push(s);else next.sources[at]=s;}}
 invalidateChanged(current,next);refreshBriefs(current,next);return next;
}
export function validateStructure(w:Workspace){if(w.projects.length>20||w.sources.length>60||w.projects.some(p=>p.questions.length>80))throw new ApiError(400,'Workspace limits: 20 active bids, 80 questions per bid and 60 reusable/document extracts. Archive completed bids or reduce older extracts.');const ids=new Set<string>();for(const p of w.projects){if(ids.has(p.id))throw new ApiError(400,'Duplicate bid ID.');ids.add(p.id);if(p.deadline&&deadlineInstant(p.deadline)===null)throw new ApiError(400,'Enter a real submission date and London time.');if(p.brief?.gaps.some(g=>g.state==='confirmed'&&!g.evidence.trim()))throw new ApiError(400,'A confirmed data item needs an evidence or input record.');const refs=new Set<string>(),qids=new Set<string>();for(const q of p.questions){if(refs.has(q.ref.trim().toLowerCase())||qids.has(q.id))throw new ApiError(400,'Question references and IDs must be unique within each bid.');refs.add(q.ref.trim().toLowerCase());qids.add(q.id);}for(const items of [p.serviceModel?.staff,p.serviceModel?.tupe,p.serviceModel?.nonPay,p.fmt?.mappings,p.fmt?.completedFacts]){const seen=new Set<string>();for(const item of items||[]){if(seen.has(item.id))throw new ApiError(400,'Duplicate model or mapping ID.');seen.add(item.id);}}}const sourceIds=new Set<string>();for(const s of w.sources){if(sourceIds.has(s.id))throw new ApiError(400,'Duplicate source ID.');sourceIds.add(s.id);}}
export async function writeShared(c:Context,w:Workspace,revision:number,action:string,pid='',target='',extra?:(mutation:string)=>D1PreparedStatement[]){
 if(!Number.isInteger(revision)||revision<1)throw new ApiError(400,'A valid workspace revision is required.');validateStructure(w);w.updatedAt=new Date().toISOString();const body=JSON.stringify(w);if(new TextEncoder().encode(body).length>1700000)throw new ApiError(413,'Workspace size limit reached. Export a backup and reduce older extracts or answer versions.');
 const mutation=crypto.randomUUID();const update=db().prepare('UPDATE workspaces SET body=?,revision=revision+1,updated_at=?,mutation_id=? WHERE owner_id=? AND revision=?').bind(body,w.updatedAt,mutation,SHARED_KEY,revision);
 const log=db().prepare('INSERT INTO bid_audit (id,project_id,target_id,actor_name,action,created_at,actor_id,actor_role) SELECT ?,?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM workspaces WHERE owner_id=? AND mutation_id=?)').bind(crypto.randomUUID(),pid,target,c.me.name,action,w.updatedAt,c.me.id,c.me.role,SHARED_KEY,mutation);
 const prune=db().prepare(`DELETE FROM bid_assignments WHERE EXISTS (SELECT 1 FROM workspaces WHERE owner_id=? AND mutation_id=?) AND NOT EXISTS (SELECT 1 FROM workspaces, json_each(workspaces.body, '$.projects') AS p WHERE workspaces.owner_id=? AND json_extract(p.value, '$.id')=bid_assignments.project_id AND (bid_assignments.target_id IN ('_itt','_brief','_model','_fmt') OR EXISTS (SELECT 1 FROM json_each(p.value, '$.questions') AS q WHERE json_extract(q.value, '$.id')=bid_assignments.target_id)))`).bind(SHARED_KEY,mutation,SHARED_KEY);
 const result=await db().batch([update,log,prune,...(extra?.(mutation)||[])]);if(!result[0].meta.changes)throw new ApiError(409,'Someone saved a newer version. Your edits remain on screen. Export them, then reload before continuing.');return {revision:revision+1,savedAt:w.updatedAt};
}
export async function targetProblems(c:Context,w:Workspace,p:Project,target:string){
 let problems:string[]=[];if(target==='_model')problems=p.serviceModel?modelIssues(p.serviceModel):['Build the service model.'];else if(target==='_fmt')problems=fmtIssues(p);else if(target==='_itt')problems=w.sources.some(s=>s.scope===p.id&&s.category==='itt'&&s.status!=='approved')?['Verify the current ITT documents.']:[];else if(target==='_brief')problems=p.brief?.gaps.filter(g=>g.priority==='high'&&g.state!=='confirmed').map(g=>g.title)||[];else {const q=p.questions.find(q=>q.id===target)!;problems=reviewQuestion(q,p,w.sources).filter(r=>r.severity==='high').map(r=>r.title);}
 const pending=await db().prepare("SELECT id FROM bid_comments WHERE project_id=? AND target_id=? AND (status='open' OR (status='accepted' AND applied=0))").bind(p.id,target).all();if(pending.results.length)problems.push(`${pending.results.length} comment(s) still need a decision or incorporation.`);return problems;
}

function refreshBriefs(old:Workspace,next:Workspace){for(const p of next.projects){const before=old.projects.find(x=>x.id===p.id);const docs=(w:Workspace)=>w.sources.filter(s=>s.scope===p.id&&s.category==='itt');if(!eq(docs(old),docs(next))||!eq(before?.questions.map(q=>[q.id,q.text,q.title]),p.questions.map(q=>[q.id,q.text,q.title])))p.brief=buildBrief(p,next.sources);}}

export async function reviewHash(p:Project,target:string,w:Workspace){const comments=(await db().prepare('SELECT id,status,applied,decision_note,text,quote,proposal FROM bid_comments WHERE project_id=? AND target_id=? ORDER BY id').bind(p.id,target).all()).results;return contentHash({content:targetContent(p,target,w),comments});}
