import { calculate, rag, type Metric, type Observation } from "./metrics";

export type Contract={id:string;title:string;commissioner:string;service:string;sites:string[];reference:string;version:string;effectiveFrom:string;effectiveTo:string;status:string;note:string};
export type Requirement={id:string;contractId:string;type:"Contract"|"HJIP"|"Bid commitment";code:string;title:string;clause:string;quote:string;metricId:string;target:number;amber:number;frequency:string;owner:string;sourceVersion:string;documentId:string;status:"draft"|"approved";attribution:string;exception:string;action:string;actionOwner:string;dueDate:string;shareEvidence:string;definitionNote:string};
export type DataField={id:string;key:string;label:string;metricId:string;type:"text"|"number"|"date"|"choice";options:string[];required:boolean};
export type FmtLine={id:string;site:string;service:string;group:string;name:string;type:"income"|"cost";reference:string;baselineVersion:string};
export type Budget={id:string;lineId:string;site:string;period:string;amount:number;source:string};
export type AccountMapping={id:string;accountCode:string;tracking:string;site:string;lineId:string};
export type Actual={id:string;accountCode:string;accountName:string;tracking:string;period:string;amount:number;reference:string;status:"pending"|"approved";source:string};
export type AssuranceRow={requirementId:string;code:string;name:string;type:string;value:number|null;unit:string;target:number;status:string;numerator:number|null;denominator:number|null;owner:string;frequency:string;clause:string;definitionVersion:string;evidence:string;exception:string;action:string;actionOwner:string;dueDate:string;attribution:string;definitionNote:string};
export type AssurancePack={id:string;contractId:string;contractTitle:string;commissioner:string;site:string;period:string;title:string;summary:string;rows:AssuranceRow[];status:"draft"|"published";version:number;created:string;publishedAt:string;approvedBy:string;dataAsOf:string;synthetic:boolean;includedCount?:number;totalCount?:number};
export type ExtractedDocument={id:string;documentId:string;contractId:string;purpose:string;title:string;sourceVersion:string;text:string;status:string;created:string};
export const FMT_GROUPS=["Staff Pay","Non-Pay Clinical","Staff Related Non-Pay","Facilities","Other Overheads","Escort & Bedwatch","Revenue"];
export const DEFINITION_SOURCE="DRPA_Secure_KPI_and_Bid_Evidence_Tracker.xlsx · KPI Dictionary";

export function parseDelimited(text:string){
 const rows:string[][]=[];let row:string[]=[],cell="",quote=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quote&&text[i+1]==='"'){cell+='"';i++;}else quote=!quote;}else if(c===","&&!quote){row.push(cell);cell="";}else if((c==="\n"||c==="\r")&&!quote){if(c==="\r"&&text[i+1]==="\n")i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell="";}else cell+=c;}
 if(quote)throw new Error("CSV contains an unclosed quote.");row.push(cell);if(row.some(x=>x.trim()))rows.push(row);const headers=(rows.shift()||[]).map(x=>x.trim().replace(/^\uFEFF/,""));if(new Set(headers).size!==headers.length)throw new Error("CSV headers must be unique.");return rows.map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]?.trim()||""])));
}
export function extractCandidates(text:string,type:Requirement["type"]){
 if(text.length>100000)throw new Error("Use an extract of up to 100,000 characters.");
 const lines=text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);const seen=new Set<string>();const candidates:Array<Partial<Requirement>>=[];
 for(const line of lines){if(!/(\bKPI\b|\bHJIP\b|indicator|performance measure|\btarget\b|\bshall\b|\bmust\b|\bwill\b)/i.test(line)||line.length<12)continue;if(seen.has(line))continue;seen.add(line);
 const percentage=line.match(/(\d+(?:\.\d+)?)\s*%/);const code=line.match(/\b(?:KPI|HJIP)[\s-]*[A-Za-z0-9.-]+/i)?.[0]||"";
 candidates.push({type,code,title:line.replace(/^[-•\s]+/,"").slice(0,130),quote:line.slice(0,3000),clause:code,metricId:"",target:percentage?Number(percentage[1]):undefined,frequency:/quarter/i.test(line)?"Quarterly":/annual|yearly/i.test(line)?"Annually":/week/i.test(line)?"Weekly":"Confirm frequency",status:"draft",definitionNote:"Text-based candidate. Confirm the exact definition, population, denominator, deadline and source version. No approved obligation has been inferred."});if(candidates.length>=30)break;
 }return candidates;
}
export function assuranceRows(requirements:Requirement[],metrics:Metric[],observations:Observation[],site:string,period:string):AssuranceRow[]{
 return requirements.filter(r=>r.status==="approved").map(r=>{const m=metrics.find(m=>m.id===r.metricId);const records=observations.filter(o=>o.site===site&&o.period===period&&o.metric===r.metricId&&o.status==="approved");const value=m?calculate(m,records):null;return {requirementId:r.id,code:r.code,name:r.title,type:r.type,value,unit:m?.unit||"",target:r.target,status:m?rag({...m,target:r.target,amber:r.amber},value):"No data",numerator:records.length?records.reduce((s,x)=>s+x.numerator,0):null,denominator:records.length?records.reduce((s,x)=>s+x.denominator,0):null,owner:r.owner,frequency:r.frequency,clause:r.clause,definitionVersion:r.sourceVersion,evidence:r.shareEvidence,exception:r.exception,action:r.action,actionOwner:r.actionOwner,dueDate:r.dueDate,attribution:r.attribution,definitionNote:r.definitionNote};});
}
export function financeRows(lines:FmtLine[],budgets:Budget[],actuals:Actual[],mappings:AccountMapping[],period:string,site:string,ytd=false){
 const fiscalYear=Number(period.slice(0,4))-(Number(period.slice(5,7))<4?1:0);const periodMatch=(p:string)=>ytd?p>=fiscalYear+"-04"&&p<=period:p===period;
 const expectedPeriods:string[]=[];if(ytd){let year=fiscalYear,month=4;while(`${year}-${String(month).padStart(2,"0")}`<=period){expectedPeriods.push(`${year}-${String(month).padStart(2,"0")}`);if(++month>12){year++;month=1;}}}else expectedPeriods.push(period);
 const aa=actuals.filter(a=>a.status==="approved"&&periodMatch(a.period));const selected=lines.filter(l=>site==="all"||l.site===site);
 const match=(a:Actual)=>mappings.find(m=>m.accountCode===a.accountCode&&m.tracking===a.tracking);
 const rows=selected.map(l=>{const bb=budgets.filter(b=>b.lineId===l.id&&b.site===l.site&&periodMatch(b.period));const lineMappings=mappings.filter(m=>m.lineId===l.id&&m.site===l.site);const mapped=aa.filter(a=>{const mp=match(a);return mp?.lineId===l.id&&mp.site===l.site;});const missingBudgetPeriods=expectedPeriods.filter(p=>!bb.some(b=>b.period===p));const missingActualPeriods=expectedPeriods.filter(p=>!lineMappings.length||lineMappings.some(m=>!mapped.some(a=>a.period===p&&a.accountCode===m.accountCode&&a.tracking===m.tracking)));const budget=!missingBudgetPeriods.length?bb.reduce((s,b)=>s+b.amount,0):null,actual=!missingActualPeriods.length?mapped.reduce((s,a)=>s+a.amount,0):null;return {...l,budget,actual,variance:budget===null||actual===null?null:l.type==="cost"?budget-actual:actual-budget,records:mapped,missingBudgetPeriods,missingActualPeriods,expectedPeriods};});
 const unmapped=aa.filter(a=>!match(a));return {rows,unmapped,pending:actuals.filter(a=>a.status==="pending"&&periodMatch(a.period))};
}
export function safeFieldValues(fields:DataField[],metricId:string,input:unknown){
 const values=(input&&typeof input==="object"&&!Array.isArray(input)?input:{}) as Record<string,unknown>;const output:Record<string,string|number>={};
 for(const f of fields.filter(f=>!f.metricId||f.metricId===metricId)){const v=values[f.key];if(v===undefined||v===""||v===null){if(f.required)throw new Error(`${f.label} is required.`);continue;}if(f.type==="number"){const n=Number(v);if(!Number.isFinite(n))throw new Error(`${f.label} must be numeric.`);output[f.key]=n;}else{const t=String(v);if(t.length>1000||f.type==="choice"&&!f.options.includes(t)||f.type==="date"&&!/^\d{4}-\d{2}-\d{2}$/.test(t))throw new Error(`${f.label} has an invalid value.`);output[f.key]=t;}}
 return output;
}
