import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";
import { database, seed, auditStatement } from "@/lib/store";
import { allowedMetrics, scopeSites, visibleModules, ROLES, TENANTS, validPeriod, EVIDENCE, type Observation, type TenantId, type Metric } from "@/lib/metrics";
import { customMetrics, listRecords, seedAdvanced } from "@/lib/records";
import { safeFieldValues, type DataField, type Contract, type Requirement, type FmtLine, type Budget, type Actual, type AccountMapping } from "@/lib/contracts";
import { governedSources } from "@/lib/governed-sources";
import { respond } from "@/lib/assistant";
export const dynamic="force-dynamic";
const dev=(import.meta as unknown as {env?:{DEV?:boolean}}).env?.DEV===true;
function reply(data:unknown,status=200){return Response.json(data,{status,headers:{"Cache-Control":"no-store"}});}
async function identity(){const u=await getChatGPTUser();if(!u&&!dev)throw new Error("AUTH");return {id:u?.userId||"local-demo-owner",name:u?.displayName||"Local demo owner"};}
async function scope(url:URL){const tenant=url.searchParams.get("tenant")||"drpa",role=url.searchParams.get("role")||"board";if(!Object.hasOwn(TENANTS,tenant)||!ROLES.some(r=>r.id===role))throw new Error("Invalid preview scope.");return {tenant:tenant as TenantId,role,metrics:allowedMetrics(tenant as TenantId,role,await customMetrics(tenant)).filter(m=>!m.sites?.length||m.sites.some(x=>scopeSites(tenant as TenantId,role).includes(x))),sites:scopeSites(tenant as TenantId,role),modules:visibleModules(tenant as TenantId,role)};}
async function rowsFor(tenant:TenantId,metrics:Metric[],sites:string[]){const all=await database().prepare("SELECT * FROM observations WHERE tenant = ? ORDER BY period,site,metric").bind(tenant).all<Observation>();return all.results.filter(r=>sites.includes(r.site)&&metrics.some(m=>m.id===r.metric));}
async function extraSources(s:Awaited<ReturnType<typeof scope>>,observations:Observation[],period:string,site:string,includeFinance:boolean){
 await seedAdvanced(s.tenant);
 const contracts=s.modules.includes("contracts")?await listRecords<Contract>(s.tenant,"contract"):[];
 const requirements=s.modules.includes("contracts")?await listRecords<Requirement>(s.tenant,"requirement"):[];
 const finance=includeFinance&&s.modules.includes("finance")?{lines:await listRecords<FmtLine>(s.tenant,"fmt_line"),budgets:await listRecords<Budget>(s.tenant,"budget"),actuals:await listRecords<Actual>(s.tenant,"actual"),mappings:await listRecords<AccountMapping>(s.tenant,"mapping")}:undefined;
 return governedSources({contracts,requirements,metrics:s.metrics,observations,sites:s.sites,period,site,finance});
}
function failure(e:unknown){if(e instanceof Error&&e.message==="AUTH")return reply({error:"Sign in to access this private workspace."},401);console.error("Platform request failed",e instanceof Error?e.message:"Unknown error");return reply({error:e instanceof Error?e.message:"The request could not be completed."},400);}
export async function GET(request:Request){try{
 const u=await identity();const s=await scope(new URL(request.url));await seed(s.tenant);const db=database();const observations=s.role==="commissioner"?[]:await rowsFor(s.tenant,s.metrics,s.sites);
 const fields=s.role==="commissioner"?[]:(await listRecords<DataField>(s.tenant,"field")).filter(f=>!f.metricId||s.metrics.some(m=>m.id===f.metricId));
 const submissions=s.modules.includes("departments")?(await db.prepare("SELECT * FROM submissions WHERE tenant = ? ORDER BY created DESC LIMIT 200").bind(s.tenant).all()).results.filter(r=>s.sites.includes(r.site as string)&&s.metrics.some(m=>m.id===r.metric)):[];
 const audit=s.modules.includes("audit")?(await db.prepare("SELECT * FROM audit_events WHERE tenant = ? ORDER BY created DESC LIMIT 150").bind(s.tenant).all()).results.filter(r=>{if(s.role==="board")return true;if(r.actor!==u.id)return false;try{const d=JSON.parse(String(r.detail));if(d.rolePreview!==s.role)return false;const metric=d.metric||d.after?.metric;const recordSite=d.site||d.after?.site;if(metric&&!s.metrics.some(m=>m.id===metric))return false;if(recordSite&&recordSite!=="all"&&!s.sites.includes(recordSite))return false;if(d.department&&!s.metrics.some(m=>m.department===d.department))return false;return true;}catch{return false;}}):[];
 const drafts=s.modules.includes("bids")?(await db.prepare("SELECT id,title,question,content,sources,mode,status,created,version FROM bid_drafts WHERE tenant = ? ORDER BY created DESC LIMIT 40").bind(s.tenant).all()).results:[];
 const ai=env as unknown as {OPENAI_API_KEY?:string;AI_MODEL?:string};
 return reply({fields,observations,submissions,audit,drafts,metrics:s.metrics,sites:s.sites,modules:s.modules,evidence:EVIDENCE.filter(e=>e.metrics.some(id=>s.metrics.some(m=>m.id===id))),aiConnected:!!(ai.OPENAI_API_KEY&&ai.AI_MODEL),demo:true,identity:u.name});
 }catch(e){return failure(e);}}
export async function POST(request:Request){try{
 const u=await identity();const url=new URL(request.url);const s=await scope(url);const origin=request.headers.get("origin");if(origin&&origin!==url.origin&&origin!=="https://drpa-intelligence-engine.sa33dc.chatgpt.site"&&!(dev&&origin==="http://terminal.local:4173"))return reply({error:"Request origin is not permitted."},403);
 if(!request.headers.get("content-type")?.startsWith("application/json"))return reply({error:"JSON input is required."},415);
 const text=await request.text();if(text.length>120000)return reply({error:"The input is too large."},413);const body=JSON.parse(text);const db=database();await seed(s.tenant);
 if(body.action==="submit"){
 if(!s.modules.includes("departments"))return reply({error:"Submissions are outside this preview role."},403);
 const records=Array.isArray(body.records)?body.records:[body];if(!records.length||records.length>40)throw new Error("Submit between 1 and 40 records.");
 const statements:D1PreparedStatement[]=[];const ids:string[]=[];const grains=new Set<string>();
 for(const r of records){const metric=s.metrics.find(m=>m.id===r.metric);if(!metric||!s.sites.includes(r.site)||(metric.sites?.length&&!metric.sites.includes(r.site))||!validPeriod(r.period))throw new Error("The metric, site or month is outside your permitted scope.");
 const grain=`${r.site}|${r.period}|${r.metric}`;if(grains.has(grain))throw new Error("The batch repeats a site-month metric. Submit one change per value.");grains.add(grain);const n=Number(r.numerator),d=Number(r.denominator);if(r.numerator===""||r.denominator===""||!Number.isFinite(n)||!Number.isFinite(d)||d<0||n<0&&metric.id!=="margin"&&metric.method!=="value"||!["sum","value"].includes(metric.method)&&d<=0||metric.method==="value"&&d!==1||metric.method==="ratio"&&n>d)throw new Error("Use valid values. A ratio needs a positive denominator and a numerator no greater than its denominator.");
 if(typeof r.source!=="string"||r.source.trim().length<5||r.source.length>500||typeof r.note!=="string"||r.note.length>2000)throw new Error("Add a source reference of 5–500 characters and a note of up to 2,000 characters.");
 const current=await db.prepare("SELECT version FROM observations WHERE tenant=? AND site=? AND period=? AND metric=?").bind(s.tenant,r.site,r.period,r.metric).first<{version:number}>();
 const details=JSON.stringify(safeFieldValues(await listRecords<DataField>(s.tenant,"field"),r.metric,r.details));const id=crypto.randomUUID();ids.push(id);statements.push(db.prepare("INSERT INTO submissions (id,tenant,site,period,metric,numerator,denominator,source,note,actor,status,created,base_version,details) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(id,s.tenant,r.site,r.period,r.metric,n,d,r.source.trim(),r.note,u.id,"pending",new Date().toISOString(),current?.version||0,details));statements.push(auditStatement(s.tenant,u.id,"Submission created",id,JSON.stringify({metric:r.metric,site:r.site,period:r.period,numerator:n,denominator:d,rolePreview:s.role})));
 }
 await db.batch(statements);return reply({ok:true,ids});
 }
 if(body.action==="review"){
 if(!s.modules.includes("departments")||s.role==="contributor")return reply({error:"This role can submit but cannot review."},403);
 const record=await db.prepare("SELECT * FROM submissions WHERE id=? AND tenant=?").bind(body.id,s.tenant).first<Record<string,unknown>>();if(!record||!s.sites.includes(record.site as string)||!s.metrics.some(m=>m.id===record.metric))return reply({error:"Submission not found in your scope."},404);
 if(record.status!=="pending")throw new Error("This submission has already been reviewed.");if(!["approve","reject"].includes(body.decision))throw new Error("Choose approve or reject.");
 const time=new Date().toISOString();if(body.decision==="reject"){await db.batch([db.prepare("UPDATE submissions SET status='rejected', reviewed_by=?, reviewed=? WHERE id=? AND tenant=? AND status='pending'").bind(u.id,time,body.id,s.tenant),auditStatement(s.tenant,u.id,"Submission rejected",body.id,JSON.stringify({rolePreview:s.role,metric:record.metric,site:record.site}))]);return reply({ok:true});}
 const current=await db.prepare("SELECT * FROM observations WHERE tenant=? AND site=? AND period=? AND metric=?").bind(s.tenant,record.site,record.period,record.metric).first<Observation>();if((current?.version||0)!==record.base_version)throw new Error("A newer value has been approved. Resubmit this change against the current value.");
 const next=(record.base_version as number)+1;const oid=current?.id||crypto.randomUUID();
 const result=await db.batch([
 db.prepare("INSERT INTO observations (id,tenant,site,period,metric,numerator,denominator,status,source,note,actor,updated,version,details) SELECT ?,?,?,?,?,?,?,'approved',?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM submissions WHERE id=? AND tenant=? AND status='pending') ON CONFLICT(tenant,site,period,metric) DO UPDATE SET numerator=excluded.numerator,denominator=excluded.denominator,source=excluded.source,note=excluded.note,actor=excluded.actor,updated=excluded.updated,version=excluded.version,details=excluded.details WHERE observations.version=?").bind(oid,s.tenant,record.site,record.period,record.metric,record.numerator,record.denominator,record.source,record.note,u.id,time,next,record.details||"{}",body.id,s.tenant,record.base_version),
 db.prepare("UPDATE submissions SET status='approved',reviewed_by=?,reviewed=? WHERE id=? AND tenant=? AND status='pending' AND EXISTS (SELECT 1 FROM observations WHERE tenant=? AND site=? AND period=? AND metric=? AND version=? AND updated=?)").bind(u.id,time,body.id,s.tenant,s.tenant,record.site,record.period,record.metric,next,time),
 db.prepare("INSERT INTO audit_events (id,tenant,actor,action,entity,detail,created) SELECT ?,?,?,'Value approved',?,?,? WHERE EXISTS (SELECT 1 FROM submissions WHERE id=? AND tenant=? AND reviewed=? AND status='approved')").bind(crypto.randomUUID(),s.tenant,u.id,body.id,JSON.stringify({before:current,after:record,rolePreview:s.role}),time,body.id,s.tenant,time)
 ]);if(result[1].meta.changes===0)throw new Error("A simultaneous approval changed this value. Refresh and resubmit.");return reply({ok:true});
 }
 if(body.action==="ask"||body.action==="bid"){
 if(!s.modules.includes(body.action==="ask"?"assistant":"bids"))return reply({error:"This module is outside your role preview."},403);
 if(typeof body.question!=="string"||body.question.trim().length<4||body.question.length>4000)throw new Error("Enter a question of 4–4,000 characters.");if(!validPeriod(body.period)||body.site!=="all"&&!s.sites.includes(body.site))throw new Error("Invalid period or site.");
 const count=await db.prepare("SELECT count(*) AS total FROM audit_events WHERE tenant=? AND actor=? AND action IN ('Question answered','Bid generated') AND created>?").bind(s.tenant,u.id,new Date(Date.now()-3600000).toISOString()).first<{total:number}>();if((count?.total||0)>=30)return reply({error:"The hourly AI limit has been reached. Try again later."},429);
 const rows=await rowsFor(s.tenant,s.metrics,s.sites);const answer=await respond(body.action==="ask"?"ask":"bid",body.question,rows,s.metrics,body.period,body.site,await extraSources(s,rows,body.period,body.site,body.action==="ask"));
 await db.batch([auditStatement(s.tenant,u.id,body.action==="ask"?"Question answered":"Bid generated",crypto.randomUUID(),JSON.stringify({question:body.question,period:body.period,site:body.site,mode:answer.mode,sourceIds:answer.sources.map(x=>x.id),rolePreview:s.role}))]);return reply(answer);
 }
 if(body.action==="save_bid"){
 if(!s.modules.includes("bids"))return reply({error:"Bid drafting is outside this preview role."},403);
 if(typeof body.content!=="string"||body.content.length<20||body.content.length>50000||typeof body.title!=="string"||!body.title.trim()||body.title.length>150||typeof body.question!=="string"||body.question.length>4000)throw new Error("Provide a title, question and draft of up to 50,000 characters.");
 const ids=Array.isArray(body.sources)?body.sources:[];const allowedObligations=await extraSources(s,await rowsFor(s.tenant,s.metrics,s.sites),validPeriod(body.period)?body.period:"2026-09",body.site&&s.sites.includes(body.site)?body.site:"all",false);if(!ids.every((x:unknown)=>typeof x==="string"&&(allowedObligations.some(r=>r.id===x)||EVIDENCE.some(e=>e.id===x&&e.status==="Sample approved"&&e.metrics.some(id=>s.metrics.some(m=>m.id===id))))))throw new Error("The draft contains evidence outside the approved scope.");
 const id=crypto.randomUUID();await db.batch([db.prepare("INSERT INTO bid_drafts (id,tenant,title,question,content,sources,mode,status,actor,created,version) VALUES (?,?,?,?,?,?,?,?,?,?,1)").bind(id,s.tenant,body.title.trim(),body.question,body.content,JSON.stringify(ids),body.mode==="live"?"live":"example","Draft — human review required",u.id,new Date().toISOString()),auditStatement(s.tenant,u.id,"Bid draft saved",id,JSON.stringify({rolePreview:s.role,sources:ids}))]);return reply({ok:true,id});
 }
 throw new Error("Unknown action.");
 }catch(e){return failure(e);}}
