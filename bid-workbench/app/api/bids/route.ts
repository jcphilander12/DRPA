import {context,loadShared,writeShared,SHARED_KEY,collaboration,invalidateChanged} from '@/lib/collaboration';
import {db,runtime,failed,json,ApiError} from '@/lib/server';
import {completion} from '@/lib/finance';
import type {Workspace} from '@/lib/types';
import {workspaceSchema} from '@/lib/validation';
export async function GET(request:Request){try{const c=await context(request);if(c.me.role!=='master')throw new ApiError(403,'Archived bids are available to master users.');const id=new URL(request.url).searchParams.get('id');if(id){const row=await db().prepare('SELECT * FROM bid_archives WHERE id=?').bind(id).first<any>();if(!row)throw new ApiError(404,'Archived bid not found.');return json({...row,body:JSON.parse(row.body)});}const rows=await db().prepare('SELECT id,name,commissioner,archived_at,archived_by,note,submitted_at FROM bid_archives ORDER BY archived_at DESC LIMIT 300').all();return json({archives:rows.results});}catch(e){return failed(e);}}
export async function POST(request:Request){try{
 const c=await context(request,true);if(c.me.role!=='master')throw new ApiError(403,'Only master users can delete, submit, archive or restore bids and questions.');const b=await request.json() as any;const state=await loadShared(c);const w=state.workspace;
 const condition='EXISTS (SELECT 1 FROM workspaces WHERE owner_id=? AND mutation_id=?)';
 if(b.action==='restoreBackup'){if(b.confirm!=='RESTORE')throw new ApiError(400,'Type RESTORE to confirm replacement.');const parsed=workspaceSchema.safeParse(b.workspace);if(!parsed.success)throw new ApiError(400,'Choose a valid workspace backup.');const restored=parsed.data as Workspace;for(const bid of restored.projects){if(await db().prepare('SELECT id FROM bid_archives WHERE id=?').bind(bid.id).first())throw new ApiError(409,'An archived bid has the same ID. Restore it from Archives first.');bid.questions.forEach(q=>q.status='draft');bid.modelSourceId=null;bid.facts=[];if(bid.serviceModel)bid.serviceModel.status='draft';if(bid.fmt){bid.fmt.status='draft';bid.fmt.validatedHash='';bid.fmt.validationNote='';bid.fmt.exportedHash='';bid.fmt.outputFileId=null;}}for(const source of restored.sources)if(source.status==='approved')source.status='needs_verification';return json(await writeShared(c,restored,b.revision,'Restored workspace backup with fresh review required','','',mutation=>[db().prepare(`DELETE FROM bid_checks WHERE ${condition}`).bind(SHARED_KEY,mutation)]));}
 if(b.action==='restore'){
  const record=await db().prepare('SELECT body FROM bid_archives WHERE id=?').bind(b.projectId).first<{body:string}>();if(!record)throw new ApiError(404,'Archived bid not found.');const saved=JSON.parse(record.body);const p=saved.workspace.projects[0];if(w.projects.some(x=>x.id===p.id))throw new ApiError(409,'An active bid already has this ID.');if(w.projects.length>=20)throw new ApiError(400,'Archive another bid before restoring this one.');
  p.questions.forEach((q:any)=>q.status='draft');if(p.serviceModel)p.serviceModel.status='draft';if(p.fmt){p.fmt.status='draft';p.fmt.validatedHash='';p.fmt.exportedHash='';p.fmt.outputFileId=null;}p.submittedAt='';p.submissionNote='';w.projects.push(p);
  for(const s of saved.workspace.sources.filter((s:any)=>s.scope===p.id)){if(!w.sources.some(x=>x.id===s.id)){s.status='needs_verification';w.sources.push(s);}}p.modelSourceId=null;p.facts=[];
  return json(await writeShared(c,w,b.revision,'Restored bid for fresh review',p.id,'_bid',mutation=>[db().prepare(`DELETE FROM bid_archives WHERE id=? AND ${condition}`).bind(p.id,SHARED_KEY,mutation),db().prepare(`DELETE FROM bid_checks WHERE project_id=? AND ${condition}`).bind(p.id,SHARED_KEY,mutation)]));
 }
 let p=w.projects.find(x=>x.id===b.projectId);
 if(b.action==='deleteArchive'){
  const row=await db().prepare('SELECT name FROM bid_archives WHERE id=?').bind(b.projectId).first<{name:string}>();if(!row)throw new ApiError(404,'Archived bid not found.');if(b.confirm!==row.name)throw new ApiError(400,'Type the archived bid name to delete it.');
  const files=(await db().prepare('SELECT id,owner_id FROM files WHERE project_id=?').bind(b.projectId).all<any>()).results;const retained=await retainedFiles(w,b.projectId);const remove=files.filter(f=>!retained.has(f.id));
  const result=await writeShared(c,w,b.revision,'Deleted archived bid',b.projectId,'_bid',mutation=>[db().prepare(`DELETE FROM bid_archives WHERE id=? AND ${condition}`).bind(b.projectId,SHARED_KEY,mutation),...cleanup(b.projectId,remove,mutation)]);await deleteObjects(remove);return json(result);
 }
 if(b.action==='deleteDocument'||b.action==='deleteEvidence'){
  const source=w.sources.find(s=>s.id===b.sourceId&&(b.action==='deleteEvidence'||s.scope===b.projectId&&s.category==='itt'));if(!source)throw new ApiError(404,'Document not found for this bid.');if(b.confirm!==source.name)throw new ApiError(400,'Type the document name to delete it.');w.sources=w.sources.filter(s=>s.id!==source.id);for(const bid of w.projects){for(const q of bid.questions){if(q.evidenceIds.includes(source.id))q.evidenceIds=q.evidenceIds.filter(id=>id!==source.id);q.status='draft';}if(bid.modelSourceId===source.id){bid.modelSourceId=null;bid.facts=[];}}
  const {buildBrief}=await import('@/lib/itt');if(p)p.brief=buildBrief(p,w.sources);if(p?.deadline?.sourceId===source.id)p.deadline.confirmed=false;
  const retained=await retainedFiles(w);const record=source.fileId&&!retained.has(source.fileId)?await db().prepare('SELECT id,owner_id FROM files WHERE id=?').bind(source.fileId).first<any>():null;
  const result=await writeShared(c,w,b.revision,'Deleted '+(source.category==='itt'?'ITT document':'evidence document'),source.scope,'_itt',mutation=>record?[db().prepare(`DELETE FROM files WHERE id=? AND ${condition}`).bind(record.id,SHARED_KEY,mutation)]:[]);if(record)await deleteObjects([record]);return json(result);
 }
 if(!p)throw new ApiError(404,'Bid not found.');
 if(b.action==='deleteQuestion'){
  const before=structuredClone(w);const q=p.questions.find(x=>x.id===b.questionId);if(!q)throw new ApiError(404,'Question not found.');if(b.confirm!==q.ref)throw new ApiError(400,'Type the question reference to delete it.');p.questions=p.questions.filter(x=>x.id!==q.id);for(const path of p.serviceModel?.pathways||[])path.questionIds=path.questionIds.filter(id=>id!==q.id);const {buildBrief}=await import('@/lib/itt');p.brief=buildBrief(p,w.sources);invalidateChanged(before,w);
  return json(await writeShared(c,w,b.revision,'Deleted question '+q.ref,p.id,q.id,mutation=>['bid_comments','bid_checks'].map(table=>db().prepare(`DELETE FROM ${table} WHERE project_id=? AND target_id=? AND ${condition}`).bind(p!.id,q.id,SHARED_KEY,mutation))));
 }
 if(b.action==='submit'){
  if(!p.questions.length||p.questions.some(q=>q.status!=='approved')||p.fmt?.status!=='approved')throw new ApiError(400,'Complete all answers and the FMT before recording submission.');if(typeof b.submittedAt!=='string'||!Number.isFinite(Date.parse(b.submittedAt)))throw new ApiError(400,'Enter the actual submission date and time.');p.submittedAt=new Date(b.submittedAt).toISOString();p.submissionNote=String(b.note||'').slice(0,2000);return json(await writeShared(c,w,b.revision,'Recorded bid submission',p.id,'_bid'));
 }
 if(b.action==='archive'){
  if(typeof b.note!=='string'||b.note.trim().length<4||b.note.length>2000)throw new ApiError(400,'Record why this bid is being archived.');
  const collab=await collaboration(c,w);const chosen=new Set(p.questions.flatMap(q=>q.evidenceIds));if(p.modelSourceId)chosen.add(p.modelSourceId);
  const snapshot:Workspace={...w,projects:[p],sources:w.sources.filter(s=>s.scope===p!.id||chosen.has(s.id))};const files=(await db().prepare('SELECT id,name,category,size,created_at FROM files WHERE project_id=?').bind(p.id).all()).results;
  const body=JSON.stringify({workspace:snapshot,collaboration:{...collab,comments:collab.comments.filter(x=>x.projectId===p!.id),checks:collab.checks.filter(x=>x.projectId===p!.id),audit:collab.audit.filter(x=>x.projectId===p!.id)},files,progress:completion(p,w.sources,collab.comments),archivedAt:new Date().toISOString()});
  w.projects=w.projects.filter(x=>x.id!==p!.id);w.sources=w.sources.filter(s=>s.scope!==p!.id);
  return json(await writeShared(c,w,b.revision,'Archived bid',p.id,'_bid',mutation=>[db().prepare(`INSERT INTO bid_archives (id,name,commissioner,body,archived_at,archived_by,note,submitted_at) SELECT ?,?,?,?,?,?,?,? WHERE ${condition}`).bind(p!.id,p!.name,p!.commissioner,body,new Date().toISOString(),c.me.name,b.note.trim(),p!.submittedAt||'',SHARED_KEY,mutation),db().prepare(`DELETE FROM bid_checks WHERE project_id=? AND ${condition}`).bind(p!.id,SHARED_KEY,mutation)]));
 }
 if(b.action==='deleteBid'){
  if(b.confirm!==p.name)throw new ApiError(400,'Type the bid name to delete it.');w.projects=w.projects.filter(x=>x.id!==p!.id);w.sources=w.sources.filter(s=>s.scope!==p!.id);const retained=await retainedFiles(w);const files=(await db().prepare('SELECT id,owner_id FROM files WHERE project_id=?').bind(p.id).all<any>()).results.filter(f=>!retained.has(f.id));
  const result=await writeShared(c,w,b.revision,'Deleted bid',p.id,'_bid',mutation=>cleanup(p!.id,files,mutation));await deleteObjects(files);return json(result);
 }
 throw new ApiError(400,'Unknown bid-management action.');
}catch(e){return failed(e);}}
function cleanup(pid:string,files:{id:string}[],mutation:string){const condition='EXISTS (SELECT 1 FROM workspaces WHERE owner_id=? AND mutation_id=?)';return [...['bid_comments','bid_checks','post_bid_reviews'].map(t=>db().prepare(`DELETE FROM ${t} WHERE project_id=? AND ${condition}`).bind(pid,SHARED_KEY,mutation)),...files.map(f=>db().prepare(`DELETE FROM files WHERE id=? AND ${condition}`).bind(f.id,SHARED_KEY,mutation))];}
async function deleteObjects(files:{id:string;owner_id:string}[]){for(const f of files)try{await runtime().BUCKET?.delete(`${f.owner_id}/${f.id}`);}catch{console.error('Document cleanup pending');}}

async function retainedFiles(w:Workspace,exceptArchive=''){const retained=new Set<string>();const scan=(state:Workspace)=>{for(const source of state.sources)if(source.fileId)retained.add(source.fileId);for(const p of state.projects){if(p.fmt?.fileId)retained.add(p.fmt.fileId);if(p.fmt?.outputFileId)retained.add(p.fmt.outputFileId);for(const f of [...(p.serviceModel?.staffFiles||[]),...(p.serviceModel?.tupeFiles||[])])retained.add(f.id);}};scan(w);const archives=(await db().prepare('SELECT id,body FROM bid_archives').all<{id:string;body:string}>()).results;for(const archive of archives)if(archive.id!==exceptArchive){const saved=JSON.parse(archive.body);scan(saved.workspace);for(const f of saved.files||[])retained.add(f.id);}return retained;}
