import {ApiError,db,failed,json,runtime} from '@/lib/server';
import {context,loadShared,writeShared,targetProject,requireAccess,targetProblems,reviewHash,SHARED_KEY} from '@/lib/collaboration';
import {calculateModel,contentHash,targetContent,hashBytes} from '@/lib/finance';
import {readWorkbook,completedWorkbookFacts} from '@/lib/xlsx';
export async function POST(request:Request){try{
 const c=await context(request,true);const b=await request.json() as any;if(typeof b.note==='string'&&b.note.length>4000)throw new ApiError(400,'Keep the approval record within 4,000 characters.');const state=await loadShared(c);const p=targetProject(state.workspace,b.projectId,b.targetId);if(['_itt','_brief'].includes(b.targetId))throw new ApiError(400,'Use the document and data-gap checks for this section.');const q=p.questions.find(q=>q.id===b.targetId);const item=b.targetId==='_model'?p.serviceModel:b.targetId==='_fmt'?p.fmt:q;if(!item)throw new ApiError(404,'Item not found.');
 const content=await contentHash(targetContent(p,b.targetId,state.workspace));const hash=await reviewHash(p,b.targetId,state.workspace);
 if(b.action==='submit'||b.action==='reopen'){requireAccess(c,p.id,b.targetId,'write');if(b.action==='submit'&&q&&!q.draft.trim())throw new ApiError(400,'Write the first draft before sending it for review.');item.status=b.action==='submit'?'review':'draft';return json(await writeShared(c,state.workspace,b.revision,b.action==='submit'?'Sent for review':'Reopened draft',p.id,b.targetId));}
 requireAccess(c,p.id,b.targetId,b.action==='check'?'check':undefined);
 const problems=await targetProblems(c,state.workspace,p,b.targetId);if(problems.length)throw new ApiError(400,problems.slice(0,6).join('\n'));
 if(b.targetId==='_fmt'&&p.fmt?.validatedHash!==content)throw new ApiError(400,'Validate and export the current FMT mapping before sign-off.');
 if(b.action==='check'){
  item.status='review';const condition='EXISTS (SELECT 1 FROM workspaces WHERE owner_id=? AND mutation_id=?)';
  return json(await writeShared(c,state.workspace,b.revision,'Checked current version',p.id,b.targetId,mutation=>[
   db().prepare(`DELETE FROM bid_checks WHERE project_id=? AND target_id=? AND member_id=? AND ${condition}`).bind(p.id,b.targetId,c.me.id,SHARED_KEY,mutation),
   db().prepare(`INSERT INTO bid_checks (id,project_id,target_id,member_id,content_hash,created_at) SELECT ?,?,?,?,?,? WHERE ${condition}`).bind(crypto.randomUUID(),p.id,b.targetId,c.me.id,hash,new Date().toISOString(),SHARED_KEY,mutation)
  ]));
 }
 if(b.action==='approve'){
  if(c.me.role!=='master')throw new ApiError(403,'Only the master user can mark work complete.');
  const assigned=c.assignments.filter(a=>a.projectId===p.id&&a.targetId===b.targetId&&a.access==='check').map(a=>a.memberId);const required=assigned.length?assigned:[c.me.id];const checks=(await db().prepare('SELECT member_id,content_hash FROM bid_checks WHERE project_id=? AND target_id=?').bind(p.id,b.targetId).all<any>()).results;
  if(required.some(id=>!checks.some(r=>r.member_id===id&&r.content_hash===hash)))throw new ApiError(400,'Every assigned checker must sign off the current version. With no checker assigned, complete the master check first.');
  if(b.targetId==='_fmt'){if(p.fmt?.mode!=='completed'&&p.serviceModel?.status!=='approved')throw new ApiError(400,'Complete the service-model approval first.');if(b.confirmRecalculated!==true||typeof b.note!=='string'||b.note.trim().length<4)throw new ApiError(400,'Confirm that the exported FMT was reopened, recalculated and its financial summaries checked. Record the result.');}
  if(q&&p.fmt?.status!=='approved')throw new ApiError(400,'Complete the financial-model sign-off before marking an answer complete.');
  if(b.targetId==='_fmt'){
   if(!p.fmt?.outputFileId||p.fmt.exportedHash!==content)throw new ApiError(400,'Export the current FMT before final approval.');
   const calculated=p.fmt.mode==='completed'?null:calculateModel(p.serviceModel!);const id='fmt-confirmed-'+p.id;const loc=(metric:string,lineId='')=>p.fmt!.mappings.filter(x=>x.metric===metric&&(!lineId||x.lineId===lineId)&&x.year===1).map(x=>x.sheet+'!'+x.cell).join('; ');
   let facts=p.fmt.mode==='completed'?[]:[...p.serviceModel!.staff.map((s,i)=>({id:'wte-'+s.id,label:(s.role+' WTE').slice(0,300),value:String(calculated!.rows[i].wte),locator:loc('staff_wte',s.id).slice(0,1000)})),{id:'staff-total',label:'Year 1 staffing cost',value:String(calculated!.years[0].staff),locator:p.fmt!.mappings.filter(x=>x.metric==='staff_cost'&&x.year===1).map(x=>x.sheet+'!'+x.cell).join('; ').slice(0,1000)},{id:'price',label:'Year 1 total price',value:String(calculated!.years[0].price),locator:'Validated FMT mapping; financial summary reviewed: '+String(b.note).slice(0,700)}];
   if(p.fmt.mode==='completed'){const record=await db().prepare('SELECT owner_id FROM files WHERE id=? AND project_id=? AND category=?').bind(p.fmt.fileId,p.id,'financial').first<{owner_id:string}>();const object=record&&await runtime().BUCKET?.get(`${record.owner_id}/${p.fmt.fileId}`);if(!object)throw new ApiError(404,'Completed FMT original unavailable.');const bytes=new Uint8Array(await object.arrayBuffer());if(await hashBytes(bytes)!==p.fmt.fingerprint)throw new ApiError(409,'Completed workbook changed; re-upload and review it.');facts=completedWorkbookFacts(readWorkbook(bytes),p.fmt);}
   p.facts=p.fmt.mode==='completed'?facts:[...facts.slice(0,-2).slice(0,78),...facts.slice(-2)];p.modelSourceId=id;const source={id,name:'Approved financial model',text:facts.map(f=>`${f.label}: ${f.value} (${f.locator})`).join('\n'),kind:'Financial model',scope:p.id,status:'approved' as const,locator:p.fmt.mode==='completed'?'Externally completed workbook; master recalculation and summary review recorded.':'Mapped workbook; master recalculation and financial-summary check recorded.',createdAt:new Date().toISOString(),fileId:p.fmt.outputFileId,category:'financial' as const};
   const old=state.workspace.sources.findIndex(s=>s.id===id);if(old<0)state.workspace.sources.push(source);else state.workspace.sources[old]=source;for(const q of p.questions)q.status='draft';
  }
  item.status='approved';return json(await writeShared(c,state.workspace,b.revision,'Marked complete'+(b.note?' — '+String(b.note).slice(0,500):''),p.id,b.targetId));
 }
 throw new ApiError(400,'Unknown workflow action.');
}catch(e){return failed(e);}}
