import {z} from 'zod';
import {ApiError,db,failed,json} from '@/lib/server';
import {context,loadShared,writeShared,targetProject,SHARED_KEY} from '@/lib/collaboration';
const memberSchema=z.object({id:z.string().max(100).optional(),email:z.string().email().max(320),name:z.string().min(1).max(200),role:z.enum(['master','writer','checker']),active:z.boolean()});
export async function POST(request:Request){try{
 const c=await context(request,true);if(c.me.role!=='master')throw new ApiError(403,'Only the master user can manage users and assignments.');const body=await request.json() as any;const state=await loadShared(c);const w=state.workspace;
 const condition='EXISTS (SELECT 1 FROM workspaces WHERE owner_id=? AND mutation_id=?)';
 if(body.action==='member'){
  const parsed=memberSchema.safeParse(body.member);if(!parsed.success)throw new ApiError(400,'Enter a valid user name, email and role.');const m=parsed.data;const email=m.email.trim().toLowerCase();const existing=c.members.find(x=>x.email===email||x.id===m.id);const id=existing?.id||crypto.randomUUID();
  if(existing?.id===c.me.id&&(!m.active||m.role!=='master'))throw new ApiError(400,'Keep your own master access active. Another master can change it later.');
  if(existing&&m.id&&m.id!==existing.id)throw new ApiError(400,'User ID does not match the email.');
  for(const p of w.projects){p.questions.forEach(q=>q.status='draft');if(p.serviceModel)p.serviceModel.status='draft';if(p.fmt)p.fmt.status='draft';}
  const result=await writeShared(c,w,body.revision,'Updated user role','',id,mutation=>[
   db().prepare(`INSERT INTO team_members (id,email,name,role,active) SELECT ?,?,?,?,? WHERE ${condition} ON CONFLICT(id) DO UPDATE SET email=excluded.email,name=excluded.name,role=excluded.role,active=excluded.active`).bind(id,email,m.name,m.role,m.active?1:0,SHARED_KEY,mutation),
   ...(existing&&(existing.role!==m.role||!m.active)?[db().prepare(`DELETE FROM bid_assignments WHERE member_id=? AND ${condition}`).bind(id,SHARED_KEY,mutation)]:[])
  ]);return json(result);
 }
 if(body.action==='assign'){
  const {projectId,targetId,memberId,access}=body;if(!['write','check'].includes(access))throw new ApiError(400,'Choose write or check access.');const p=targetProject(w,projectId,targetId);const m=c.members.find(m=>m.id===memberId&&m.active);if(!m||m.role!=='master'&&m.role!==(access==='write'?'writer':'checker'))throw new ApiError(400,'The assignment must match the user role.');
  const duplicate=c.assignments.some(a=>a.projectId===projectId&&a.targetId===targetId&&a.memberId===memberId&&a.access===access);if(duplicate)return json({revision:state.revision});
  const q=p.questions.find(q=>q.id===targetId);if(q)q.status='draft';if(targetId==='_model'&&p.serviceModel)p.serviceModel.status='draft';if((targetId==='_model'||targetId==='_fmt')&&p.fmt)p.fmt.status='draft';
  return json(await writeShared(c,w,body.revision,'Assigned '+access+' access',projectId,targetId,mutation=>[db().prepare(`INSERT INTO bid_assignments (id,project_id,target_id,member_id,access) SELECT ?,?,?,?,? WHERE ${condition}`).bind(crypto.randomUUID(),projectId,targetId,memberId,access,SHARED_KEY,mutation)]));
 }
 if(body.action==='unassign'){
  const a=c.assignments.find(a=>a.id===body.id);if(!a)throw new ApiError(404,'Assignment not found.');const p=targetProject(w,a.projectId,a.targetId);const q=p.questions.find(q=>q.id===a.targetId);if(q)q.status='draft';if(a.targetId==='_model'&&p.serviceModel)p.serviceModel.status='draft';if((a.targetId==='_model'||a.targetId==='_fmt')&&p.fmt)p.fmt.status='draft';
  return json(await writeShared(c,w,body.revision,'Removed assignment',a.projectId,a.targetId,mutation=>[db().prepare(`DELETE FROM bid_assignments WHERE id=? AND ${condition}`).bind(a.id,SHARED_KEY,mutation)]));
 }
 throw new ApiError(400,'Unknown team action.');
}catch(e){return failed(e);}}
