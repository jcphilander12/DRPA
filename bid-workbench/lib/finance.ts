import type {ServiceModel,StaffLine,TupeLine,NonPayLine,FMTPlan,FMTMetric,Project,Workspace,Collaboration,Source,Comment} from './types';
import {canonical} from './state';
export const newModel=():ServiceModel=>({narrative:'',pathways:[],staff:[],tupe:[],nonPay:[],contractYears:5,weeksPerYear:52.14,tupeAssumption:'unknown',overheadPct:null,profitPct:null,pricingMethod:'margin',annualBudget:null,status:'draft',assumptions:''});
export const newFMT=():FMTPlan=>({fileId:null,name:'',fingerprint:'',sheets:[],mappings:[],mode:'mapped',completedFacts:[],status:'draft',validatedHash:'',validationNote:'',exportedHash:''});
export const newStaff=():StaffLine=>({id:crypto.randomUUID(),service:'Primary care',role:'',provider:'DRPA Secure',grade:'',basis:'wte',wte:null,weeklyCoverage:null,fteHoursWeek:37.5,productiveWeeks:null,salaryFte:null,allowanceFte:null,niPct:null,niThreshold:null,pensionPct:null,otherFte:null,escalationPct:null});
export const newTupe=():TupeLine=>({id:crypto.randomUUID(),reference:'',role:'',staffLineId:'',fte:null,salaryFte:null,allowanceAnnual:null,niPct:null,niThreshold:null,pensionPct:null,otherAnnual:null,include:true,verified:false,notes:''});
export const newNonPay=():NonPayLine=>({id:crypto.randomUUID(),label:'',kind:'recurring',amount:null,escalationPct:null,capitalTreatment:'year1',amortisationYears:null});
export function staffWte(s:StaffLine,m:ServiceModel):number|null{return s.basis==='wte'?s.wte:s.weeklyCoverage===null||s.productiveWeeks===null||s.productiveWeeks<=0?null:s.weeklyCoverage*m.weeksPerYear/(s.fteHoursWeek*s.productiveWeeks);}
const complete=(values:(number|null)[])=>values.every(v=>v!==null&&Number.isFinite(v));
function tupeCost(t:TupeLine):number|null{if(!complete([t.fte,t.salaryFte,t.allowanceAnnual,t.niPct,t.niThreshold,t.pensionPct,t.otherAnnual]))return null;const salary=t.salaryFte!*t.fte!;const gross=salary+t.allowanceAnnual!;return gross+Math.max(0,gross-t.niThreshold!)*t.niPct!/100+salary*t.pensionPct!/100+t.otherAnnual!;}
export type StaffResult={id:string;wte:number|null;tupeWte:number;recruitWte:number|null;tupeCost:number|null;cost:number|null};
export type YearResult={year:number;staff:number|null;nonPay:number|null;overhead:number|null;profit:number|null;price:number|null};
export function calculateModel(m:ServiceModel){
 const included=m.tupe.filter(t=>t.include);const rows:StaffResult[]=m.staff.map(s=>{
  const wte=staffWte(s,m);const people=included.filter(t=>t.staffLineId===s.id);const tupeWte=people.reduce((a,t)=>a+(t.fte??0),0);const costs=people.map(t=>tupeCost(t));const transferCost=costs.some(c=>c===null)?null:costs.reduce<number>((a,c)=>a+c!,0);const recruitWte=wte===null?null:Math.max(0,wte-tupeWte);
  const inputs=[s.salaryFte,s.allowanceFte,s.niPct,s.niThreshold,s.pensionPct,s.otherFte];
  const gross=(s.salaryFte??0)+(s.allowanceFte??0);const employment=gross+Math.max(0,gross-(s.niThreshold??0))*(s.niPct??0)/100+(s.salaryFte??0)*(s.pensionPct??0)/100+(s.otherFte??0);
  return {id:s.id,wte,tupeWte,recruitWte,tupeCost:transferCost,cost:wte===null||recruitWte===null||transferCost===null||(recruitWte>0&&!complete(inputs))?null:transferCost+employment*recruitWte};
 });
 const nonPayValue=(s:NonPayLine,year:number):number|null=>{if(s.amount===null)return null;if(s.kind==='mobilisation')return year===1?s.amount:0;if(s.kind==='capital')return s.capitalTreatment==='year1'?(year===1?s.amount:0):!s.amortisationYears?null:year<=s.amortisationYears?s.amount/s.amortisationYears:0;if(s.escalationPct===null)return null;return s.amount*Math.pow(1+s.escalationPct/100,year-1);};
 const years:YearResult[]=Array.from({length:m.contractYears},(_,i)=>{
  const year=i+1;const staffValues=rows.map((r,n)=>r.cost===null||m.staff[n].escalationPct===null?null:r.cost*Math.pow(1+m.staff[n].escalationPct!/100,i));
  const staff=!rows.length||included.some(t=>!m.staff.some(s=>s.id===t.staffLineId))||staffValues.some(v=>v===null)?null:staffValues.reduce<number>((a,v)=>a+v!,0);const np=m.nonPay.map(s=>nonPayValue(s,year));const nonPay=np.some(v=>v===null)?null:np.reduce<number>((a,v)=>a+v!,0);
  const direct=staff===null||nonPay===null?null:staff+nonPay;const overhead=direct===null||m.overheadPct===null?null:direct*m.overheadPct/100;const cost=direct===null||overhead===null?null:direct+overhead;
  const price=cost===null||m.profitPct===null||m.pricingMethod==='margin'&&m.profitPct>=100?null:m.pricingMethod==='margin'?cost/(1-m.profitPct/100):cost*(1+m.profitPct/100);const profit=price===null||cost===null?null:price-cost;
  return {year,staff,nonPay,overhead,profit,price};
 });
 const totalWte=rows.some(r=>r.wte===null)?null:rows.reduce((a,r)=>a+r.wte!,0);
 return {rows,years,totalWte,nonPayValue};
}
export function modelIssues(m:ServiceModel):string[]{
 const issues:string[]=[];const result=calculateModel(m);
 if(!m.narrative.trim())issues.push('Describe the service model and how it meets the requirements.');
 if(!m.staff.length)issues.push('Add the staffing establishment.');
 for(const [i,s] of m.staff.entries()){
  if(!s.role.trim())issues.push(`Staff row ${i+1}: name the role.`);
  const row=result.rows[i];if(row.wte===null)issues.push(`${s.role||'Staff row '+(i+1)}: confirm WTE or coverage/productive hours.`);
  if(s.basis==='coverage'&&s.productiveWeeks!==null&&s.productiveWeeks>m.weeksPerYear)issues.push(`${s.role}: productive weeks exceed the weeks per year.`);
  if(row.cost===null)issues.push(`${s.role||'Staff row '+(i+1)}: complete employment costs, including explicit zeros.`);
  if(s.escalationPct===null)issues.push(`${s.role||'Staff row '+(i+1)}: confirm annual pay escalation.`);
  if(row.wte!==null&&row.tupeWte>row.wte+0.000001)issues.push(`${s.role}: transferred WTE exceeds the planned establishment. Cost and resolve the excess.`);
 }
 if(m.tupeAssumption==='unknown')issues.push('Confirm whether TUPE data is available, or explicitly use a no-TUPE assumption.');
 if(m.tupeAssumption==='provided'&&!m.tupe.some(t=>t.include))issues.push('TUPE is marked provided but there are no included transfer records.');
 if(m.tupeAssumption==='none'&&m.tupe.some(t=>t.include))issues.push('Included TUPE records conflict with the no-TUPE assumption.');
 const refs=new Set<string>();for(const t of m.tupe.filter(t=>t.include)){
  if(!t.reference.trim()||refs.has(t.reference.trim().toLowerCase()))issues.push('Included TUPE records need unique anonymised references.');refs.add(t.reference.trim().toLowerCase());
  if(!m.staff.some(s=>s.id===t.staffLineId))issues.push(`${t.reference||'TUPE record'}: map to a planned role.`);
  if(!t.verified)issues.push(`${t.reference||'TUPE record'}: verify employee liability information and costing assumptions.`);
  if(tupeCost(t)===null)issues.push(`${t.reference||'TUPE record'}: complete the annual cost inputs.`);
 }
 for(const [i,n] of m.nonPay.entries()){if(!n.label.trim()||n.amount===null)issues.push(`Non-pay row ${i+1}: confirm description and amount.`);if(n.kind==='recurring'&&n.escalationPct===null)issues.push(`${n.label}: confirm escalation.`);if(n.kind==='capital'&&n.capitalTreatment==='amortise'&&(!n.amortisationYears||n.amortisationYears>m.contractYears))issues.push(`${n.label}: confirm amortisation years within the contract.`);}
 if(m.overheadPct===null||m.profitPct===null)issues.push('Confirm overhead and the margin/markup assumption, including explicit zeros.');
 if(m.pricingMethod==='margin'&&m.profitPct!==null&&m.profitPct>=100)issues.push('A selling-price margin must be below 100%.');
 if(m.annualBudget!==null&&result.years.some(y=>y.price!==null&&y.price>m.annualBudget!+0.01))issues.push('The model exceeds the entered annual budget in at least one year.');
 return Array.from(new Set(issues));
}
export const metricNames:Record<FMTMetric,string>={staff_wte:'Staff WTE',staff_cost:'Staff annual cost',nonpay_cost:'Non-pay cost',total_staff:'Total staff cost',total_nonpay:'Total non-pay cost',overhead:'Overhead',profit:'Profit / contribution',price:'Total price'};
export function mappedValue(m:ServiceModel,metric:FMTMetric,lineId:string,year:number):number|null{const r=calculateModel(m);const y=r.years[year-1];if(!y)return null;const staff=r.rows.find(s=>s.id===lineId);if(metric==='staff_wte')return staff?.wte??null;if(metric==='staff_cost'){const line=m.staff.find(s=>s.id===lineId);return !staff||staff.cost===null||line?.escalationPct===null||line?.escalationPct===undefined?null:staff.cost*Math.pow(1+line.escalationPct/100,year-1);}if(metric==='nonpay_cost'){const n=m.nonPay.find(s=>s.id===lineId);return n?r.nonPayValue(n,year):null;}return ({total_staff:y.staff,total_nonpay:y.nonPay,overhead:y.overhead,profit:y.profit,price:y.price} as Partial<Record<FMTMetric,number|null>>)[metric]??null;}
export function fmtIssues(p:Project):string[]{const m=p.serviceModel,f=p.fmt;if(f?.mode==='completed'){const issues:string[]=[];if(!f.fileId||!f.fingerprint)issues.push('Upload the completed FMT workbook.');if(!f.completedFacts?.length)issues.push('Select the aggregate staffing and financial facts that will control the answers.');const seen=new Set<string>();for(const fact of f.completedFacts||[]){const key=fact.sheet+'!'+fact.cell.toUpperCase();if(!fact.label.trim()||!fact.verified)issues.push('Name and verify each selected financial fact.');if(seen.has(key))issues.push('Select each completed-workbook cell once.');seen.add(key);}return [...new Set(issues)];}if(!m)return ['Build the service model first.'];const issues=modelIssues(m);if(!f?.fileId)issues.push('Upload the commissioner FMT workbook.');if(!f?.mappings.length)issues.push('Map the model outputs to the FMT input cells.');const cells=new Set<string>();for(const map of f?.mappings||[]){const key=map.sheet+'!'+map.cell.toUpperCase();if(cells.has(key))issues.push(`Duplicate FMT target ${key}.`);cells.add(key);if(!map.verified)issues.push(`Confirm the intended input cell ${key}.`);if(mappedValue(m,map.metric,map.lineId,map.year)===null)issues.push(`No calculated value for ${key}.`);}
 for(const s of m.staff)for(let year=1;year<=m.contractYears;year++)for(const metric of ['staff_wte','staff_cost'] as const)if(!f?.mappings.some(x=>x.metric===metric&&x.lineId===s.id&&x.year===year))issues.push(`${s.role||'Staff role'}: missing Year ${year} ${metricNames[metric]} mapping.`);
 for(const n of m.nonPay)for(let year=1;year<=m.contractYears;year++)if(!f?.mappings.some(x=>x.metric==='nonpay_cost'&&x.lineId===n.id&&x.year===year))issues.push(`${n.label||'Non-pay cost'}: missing Year ${year} mapping.`);
 for(let year=1;year<=m.contractYears;year++)for(const metric of ['overhead','profit'] as const)if(mappedValue(m,metric,'',year)!==0&&!f?.mappings.some(x=>x.metric===metric&&x.year===year))issues.push(`Missing Year ${year} ${metricNames[metric]} mapping.`);
 return Array.from(new Set(issues));}
export async function hashBytes(bytes:Uint8Array){const hash=await crypto.subtle.digest('SHA-256',bytes.slice().buffer);return Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');}
export async function contentHash(value:unknown){const bytes=new TextEncoder().encode(JSON.stringify(canonical(value)));const hash=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');}
export function targetContent(p:Project,target:string,w?:Workspace):unknown{if(target==='_model')return p.serviceModel?{...p.serviceModel,status:undefined}:null;if(target==='_fmt')return {model:p.serviceModel?{...p.serviceModel,status:undefined}:null,fmt:p.fmt?{...p.fmt,status:undefined,validatedHash:undefined,validationNote:undefined,exportedHash:undefined,outputFileId:undefined}:null};if(target==='_itt')return w?.sources.filter(s=>s.scope===p.id&&(s.category==='itt'||['Tender requirement','Clarification'].includes(s.kind)));if(target==='_brief')return p.brief;const q=p.questions.find(q=>q.id===target);return q?{question:{...q,status:undefined,versions:undefined},facts:p.facts,modelSourceId:p.modelSourceId,rules:w?.rules,sources:w?.sources.map(s=>({id:s.id,status:s.status,text:s.text,scope:s.scope,locator:s.locator}))}:null;}
export function completion(p:Project,sources:Source[]=[],comments:Comment[]=[]){const answers=p.questions.filter(q=>q.status==='approved').length;const unresolved=(target:string)=>comments.some(c=>c.projectId===p.id&&c.targetId===target&&(c.status==='open'||c.status==='accepted'&&!c.applied));const docs=sources.filter(s=>s.scope===p.id&&s.category==='itt');const itt=docs.length&&p.deadline?.confirmed&&docs.every(s=>s.status==='approved')&&!unresolved('_itt')?1:0;const brief=p.brief?.summary.trim()&&p.brief.gaps.every(g=>g.priority!=='high'||g.state==='confirmed'&&g.evidence.trim())&&!unresolved('_brief')?1:0;const model=p.serviceModel?.status==='approved'?1:0;const fmt=p.fmt?.status==='approved'?1:0;const total=p.questions.length+4;return {answers,itt,brief,model,fmt,total,completed:answers+itt+brief+model+fmt,percent:Math.round((answers+itt+brief+model+fmt)/total*100)};}
export function canAccess(c:Collaboration,pid:string,target:string,access?:'write'|'check'){return c.me.role==='master'||c.assignments.some(a=>a.projectId===pid&&a.targetId===target&&a.memberId===c.me.id&&(!access||a.access===access));}
