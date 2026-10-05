import {createHash} from 'node:crypto';
import {identity} from './test-runtime.mjs';
import {demoModel,demoFMT,demoMappings} from './demo-fixture.mjs';

export const demoAccounts=[{email:'master@example.test',name:'Test Master',role:'master'},{email:'writer@example.test',name:'Test Writer',role:'writer'},{email:'checker@example.test',name:'Test Checker',role:'checker'}];
export async function seedDemo(mf,origin='http://127.0.0.1:4180',progress=()=>{}){
 const db=await mf.getD1Database('DB');
 if(await db.prepare('SELECT name FROM local_migrations WHERE name=?').bind('demo-seed-v1').first())return;
 const email=demoAccounts[0].email;
 async function api(path,data,method=data?'POST':'GET'){
  progress(`${method} ${path}`);
  const response=await mf.dispatchFetch(origin+path,{method,headers:{...identity(email),...(data?{Origin:origin,'Content-Type':'application/json'}:{})},...(data?{body:JSON.stringify(data)}:{})});
  const body=await response.json();if(!response.ok)throw new Error(`${path}: ${body.error||response.status}`);return body;
 }
 let state=await api('/api/workspace');const now=new Date().toISOString();
 const question=(id,ref,title,text,limit,unit)=>({id,ref,title,text,limit,unit,includeSpaces:true,countHeading:false,style:'Clear and professional',structure:'Question-led',criteria:['Describe ownership, evidence and measurable delivery.'],input:'Software demonstration only. Confirm live commitments before submission.',evidenceIds:['demo-experience'],draft:'Our clinical team will review care through an agreed governance pathway. The named service lead will monitor delivery and escalate concerns. Add the confirmed local pathway and measurable outcomes here.',status:'draft',versions:[],review:[],notes:''});
 const workspace={schemaVersion:1,updatedAt:now,rules:'Use verified evidence, answer the exact question, respect the portal limit, and keep all commitments consistent with the approved service model and FMT.',sources:[
  {id:'demo-itt',name:'Synthetic ITT requirements',text:'SYNTHETIC SOFTWARE TEST. Q01 - Service delivery\nDescribe the proposed service and governance. Maximum 1,000 words.\nQ02 - Mobilisation\nExplain mobilisation, staffing and TUPE. Limit 5,000 characters including spaces.\nContract term: one year.\nAnnual budget: £150,000.\nUpload a completed financial model. TUPE data must be reconciled to the planned roles. All figures and requirements in this demonstration are fictitious.',kind:'Tender requirement',scope:'demo-bid',status:'approved',locator:'Synthetic test fixture',category:'itt',createdAt:now},
  {id:'demo-experience',name:'Synthetic historic case study',text:'Illustrative software fixture: a fictional healthcare service used weekly governance reviews and a documented escalation pathway. No real outcome or client claim is supplied.',kind:'Delivery evidence',scope:'global',status:'approved',locator:'Synthetic example; replace before a live bid',category:'historic',createdAt:now}
 ],projects:[{id:'demo-bid',name:'Sample healthcare bid — testing only',commissioner:'Fictional commissioner',scope:'A synthetic bid for testing permissions, review and financial transfer.',modelSourceId:null,facts:[],questions:[question('q01','Q01','Service delivery','Describe the proposed service and governance.',1000,'words'),question('q02','Q02','Mobilisation','Explain mobilisation, staffing and TUPE.',5000,'characters')],serviceModel:demoModel(),fmt:{fileId:null,name:'',fingerprint:'',sheets:[],mappings:[],status:'draft',validatedHash:'',validationNote:'',exportedHash:''}}]};
 await api('/api/bids',{action:'restoreBackup',confirm:'RESTORE',workspace,revision:state.revision});
 state=await api('/api/workspace');for(const source of state.workspace.sources)source.status='approved';await api('/api/workspace',{workspace:state.workspace,revision:state.revision},'PUT');
 for(const member of demoAccounts.slice(1)){state=await api('/api/workspace');await api('/api/team',{action:'member',member:{...member,active:true},revision:state.revision});}
 state=await api('/api/workspace');
 for(const member of state.collaboration.members.filter(m=>m.role!=='master'))for(const targetId of ['q01','q02','_itt','_brief','_model','_fmt']){
  state=await api('/api/workspace');await api('/api/team',{action:'assign',projectId:'demo-bid',targetId,memberId:member.id,access:member.role==='writer'?'write':'check',revision:state.revision});
 }
 // Store a genuine small OOXML workbook without relying on cross-runtime FormData.
 const bytes=demoFMT(),boundary='synthetic-demo-upload';
 const uploadBody=Buffer.concat([Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="projectId"\r\n\r\ndemo-bid\r\n--${boundary}\r\nContent-Disposition: form-data; name="category"\r\n\r\nfinancial\r\n--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="sample-FMT.xlsx"\r\nContent-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n\r\n`),Buffer.from(bytes),Buffer.from(`\r\n--${boundary}--\r\n`)]);
 progress('POST /api/files');const uploaded=await mf.dispatchFetch(origin+'/api/files',{method:'POST',headers:{...identity(email),Origin:origin,'Content-Type':`multipart/form-data; boundary=${boundary}`},body:uploadBody});const upload=await uploaded.json();if(!uploaded.ok)throw new Error(upload.error||'Demo workbook upload failed');const fileId=upload.id;
 state=await api('/api/workspace');state.workspace.projects[0].fmt={fileId,name:'sample-FMT.xlsx',fingerprint:createHash('sha256').update(bytes).digest('hex'),sheets:[{name:'Inputs',rows:4,columns:7}],mappings:demoMappings(),status:'draft',validatedHash:'',validationNote:'',exportedHash:''};
 await api('/api/workspace',{workspace:state.workspace,revision:state.revision},'PUT');
 await db.prepare('INSERT INTO local_migrations (name) VALUES (?)').bind('demo-seed-v1').run();
}
