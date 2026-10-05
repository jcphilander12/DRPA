import {z} from 'zod';
import {ApiError,db,failed,json} from '@/lib/server';
import {context,loadShared,writeShared,targetProject,requireAccess,SHARED_KEY} from '@/lib/collaboration';
import {contentHash,targetContent} from '@/lib/finance';
const add=z.object({text:z.string().min(1).max(6000),quote:z.string().max(40000).default(''),proposal:z.string().max(100000).default('')});
export async function POST(request:Request){try{
 const c=await context(request,true);const b=await request.json() as any;const state=await loadShared(c);const p=targetProject(state.workspace,b.projectId,b.targetId);requireAccess(c,p.id,b.targetId);const q=p.questions.find(q=>q.id===b.targetId);const now=new Date().toISOString();const condition='EXISTS (SELECT 1 FROM workspaces WHERE owner_id=? AND mutation_id=?)';
 if(b.action==='add'){
  const parsed=add.safeParse(b);if(!parsed.success)throw new ApiError(400,'Enter a comment within the supported text limits.');const d=parsed.data;
  const count=await db().prepare('SELECT COUNT(*) AS total FROM bid_comments WHERE project_id=? AND target_id=?').bind(p.id,b.targetId).first<{total:number}>();if((count?.total||0)>=150)throw new ApiError(400,'This item has reached its comment limit. Export the review history before continuing.');
  if(d.proposal&&(!q||!d.quote))throw new ApiError(400,'Suggested text needs a quoted passage from a question answer.');if(d.quote&&(!q||q.draft.split(d.quote).length!==2))throw new ApiError(400,'The quoted passage must occur exactly once in the current answer.');
  const hash=await contentHash(targetContent(p,b.targetId,state.workspace));if(q?.status==='approved')q.status='review';if(b.targetId==='_model'&&p.serviceModel?.status==='approved')p.serviceModel.status='review';if(b.targetId==='_fmt'&&p.fmt?.status==='approved')p.fmt.status='review';
  return json(await writeShared(c,state.workspace,b.revision,'Added comment',p.id,b.targetId,mutation=>[db().prepare(`INSERT INTO bid_comments (id,project_id,target_id,author_id,author_name,text,quote,proposal,base_hash,created_at,updated_at) SELECT ?,?,?,?,?,?,?,?,?,?,? WHERE ${condition}`).bind(crypto.randomUUID(),p.id,b.targetId,c.me.id,c.me.name,d.text,d.quote,d.proposal,hash,now,now,SHARED_KEY,mutation)]));
 }
 requireAccess(c,p.id,b.targetId,'write');const row=await db().prepare('SELECT * FROM bid_comments WHERE id=? AND project_id=? AND target_id=?').bind(b.id,p.id,b.targetId).first<any>();if(!row)throw new ApiError(404,'Comment not found.');
 let status=row.status,applied=row.applied;const note=typeof b.note==='string'?b.note.slice(0,3000):'';
 if(b.action==='decide'){
  if(row.status!=='open')throw new ApiError(409,'This comment already has a decision. Reload its latest state.');if(!['accepted','rejected'].includes(b.decision))throw new ApiError(400,'Accept or reject the comment.');status=b.decision;
  if(status==='rejected'&&!note.trim())throw new ApiError(400,'Record why the comment was rejected.');
  if(status==='accepted'&&row.proposal){if(!q)throw new ApiError(400,'Suggested edits apply to question answers.');const hash=await contentHash(targetContent(p,b.targetId,state.workspace));if(hash!==row.base_hash||q.draft.split(row.quote).length!==2)throw new ApiError(409,'The answer or its evidence changed. Review the suggestion against the current answer; add a revised suggestion or incorporate it manually.');q.versions=[{id:crypto.randomUUID(),text:q.draft,action:'Before accepted suggestion',createdAt:now},...q.versions].slice(0,12);q.draft=q.draft.replace(row.quote,row.proposal);q.status='draft';applied=1;}
 }else if(b.action==='incorporate'){
  if(row.status!=='accepted'||row.applied)throw new ApiError(400,'Only an accepted, unincorporated comment can be resolved.');if(note.trim().length<4)throw new ApiError(400,'Record how the comment was incorporated or verified.');applied=1;
 }else throw new ApiError(400,'Unknown comment action.');
 return json(await writeShared(c,state.workspace,b.revision,status==='rejected'?'Rejected comment':applied?'Incorporated comment':'Accepted comment',p.id,b.targetId,mutation=>[db().prepare(`UPDATE bid_comments SET status=?,applied=?,decision_note=?,decided_by=?,updated_at=? WHERE id=? AND updated_at=? AND ${condition}`).bind(status,applied,note,c.me.name,now,row.id,row.updated_at,SHARED_KEY,mutation)]));
}catch(e){return failed(e);}}
