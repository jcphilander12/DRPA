import { assuranceRows, financeRows, type Contract, type Requirement, type FmtLine, type Budget, type Actual, type AccountMapping } from "./contracts";
import { type Metric, type Observation } from "./metrics";
import type { SourceRef } from "./assistant";

export function governedSources(input:{contracts:Contract[];requirements:Requirement[];metrics:Metric[];observations:Observation[];sites:string[];period:string;site:string;finance?:{lines:FmtLine[];budgets:Budget[];actuals:Actual[];mappings:AccountMapping[]}}):SourceRef[]{
 const sources:SourceRef[]=[];
 for(const contract of input.contracts){
  if(input.period<contract.effectiveFrom.slice(0,7)||input.period>contract.effectiveTo.slice(0,7))continue;
  const requirements=input.requirements.filter(r=>r.contractId===contract.id&&r.status==="approved"&&input.metrics.some(m=>m.id===r.metricId));
  for(const site of contract.sites.filter(s=>input.sites.includes(s)&&(input.site==="all"||s===input.site))){
   for(const row of assuranceRows(requirements,input.metrics,input.observations,site,input.period)){
    const requirement=requirements.find(r=>r.id===row.requirementId)!;
    sources.push({id:`OBL-${row.requirementId}-${site.replace(/\W/g,"_")}`,title:`${site} · ${row.code} · ${row.name}`,displayDetail:`${input.period} · ${row.definitionVersion} · ${row.clause}. ${row.evidence||"Reviewed evidence commentary not supplied."} Definition: ${row.definitionNote||"See the reviewed source definition."}`,detail:JSON.stringify({kind:row.type,site,period:input.period,contract:contract.title,sourceVersion:row.definitionVersion,clause:row.clause,reviewedSourceExcerpt:requirement.quote.slice(0,1000),result:row.value,unit:row.unit,target:row.target,status:row.status,numerator:row.numerator,denominator:row.denominator,evidence:row.evidence,exception:row.exception,action:row.action,owner:row.actionOwner,due:row.dueDate,attribution:row.attribution,definition:row.definitionNote}),metric:requirement.metricId});
   }
  }
 }
 if(input.finance){const f=input.finance;const calculated=financeRows(f.lines,f.budgets,f.actuals,f.mappings,input.period,input.site);
  for(const line of calculated.rows)sources.push({id:`FMT-${line.id}`,title:`${line.site} · ${line.name}`,displayDetail:`${input.period} · ${line.baselineVersion} · ${line.reference}. ${line.records.length} approved account balances. Sources: ${line.records.map(a=>a.reference).join("; ")||"No complete approved source."}`,detail:JSON.stringify({kind:"FMT budget",site:line.site,service:line.service,period:input.period,group:line.group,type:line.type,baseline:line.baselineVersion,reference:line.reference,budget:line.budget,approvedActual:line.actual,favourableVariance:line.variance,missingBudgetMonths:line.missingBudgetPeriods,missingActualMonths:line.missingActualPeriods,balanceReferences:line.records.map(a=>a.reference),limitation:"Service contribution excludes unallocated balances. This does not validate a statutory financial statement or automatically update other finance KPIs."})});
  if(calculated.unmapped.length)sources.push({id:"FMT-UNMAPPED",title:"Unmapped approved account balances",displayDetail:"Unallocated balances are excluded from service contribution until their account and tracking option are mapped.",detail:JSON.stringify({kind:"Finance reconciliation gap",period:input.period,count:calculated.unmapped.length,amount:calculated.unmapped.reduce((s,a)=>s+a.amount,0),limitation:"These balances are excluded from service contribution; service attribution is unconfirmed."})});
 }
 return sources.slice(0,120);
}

export function governedExampleAnswer(question:string,sources:SourceRef[]){
 const q=question.toLowerCase();const finance=/\bbudget|\bfmt\b|\bxero\b|\bvariance/.test(q);const obligations=/\bhjip|\bcontract|\bobligation|\bcommissioner|\bassurance/.test(q);
 if(!finance&&(/margin|profit|cost|revenue|cash|invoice/.test(q)||!obligations))return null;
 const relevant=sources.filter(s=>finance?s.id.startsWith("FMT-"):s.id.startsWith("OBL-"));const selected=relevant.slice(0,12);
 if(!selected.length)return {mode:"example",content:"No approved information for this question is available in your selected scope. The example has no live Xero connection or imported signed obligations.",sources:[],gaps:["Import, map and review the relevant service sources."]};
 const money=(n:number|null)=>n===null?"No complete approved value":new Intl.NumberFormat("en-GB",{style:"currency",currency:"GBP",maximumFractionDigits:0}).format(n);
 const lines=selected.map(s=>{const d=JSON.parse(s.detail);if(s.id==="FMT-UNMAPPED")return `${s.title}: ${d.count} balances totalling ${money(d.amount)} remain outside service contribution. [${s.id}]`;if(s.id.startsWith("FMT-"))return `${s.title}: budget ${money(d.budget)}; approved actual ${money(d.approvedActual)}; favourable variance ${money(d.favourableVariance)}. Missing or incomplete balances are withheld. [${s.id}]`;return `${s.title}: ${d.result===null?"No data":d.result.toFixed(1)+d.unit}; target ${d.target}${d.unit}; ${d.status}. Source ${d.sourceVersion}, ${d.clause}. Action: ${d.action||"No action recorded"}; owner ${d.owner||"Unassigned"}; due ${d.due||"Not recorded"}. [${s.id}]`;});
 return {mode:"example",content:`Reviewed example records for the selected service and month. All displayed obligations and financial amounts are fictional.\n\n${lines.join("\n\n")}\n\nThis is a source-based rule summary. It does not establish causes or certify compliance. Review the evidence and exclusions with the accountable owner.`,sources:selected,gaps:["Live AI and Xero accounts are not connected in this demonstration.","Replace illustrative obligations and figures with reviewed current sources.",...(relevant.length>selected.length?["This summary lists up to 12 relevant sources; use the detailed service views for full coverage."]:[])]};
}
