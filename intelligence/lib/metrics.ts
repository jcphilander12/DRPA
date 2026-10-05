export type Metric = {id:string; name:string; department:string; owner:string; unit:string; method:"ratio"|"sum"|"mean"|"rate"|"value"; direction:"high"|"low"; target:number; amber:number; numeratorLabel:string; denominatorLabel:string; source:string; decision:string; restricted?:boolean;sites?:string[];definitionVersion?:string};
const m = (id:string,name:string,department:string,owner:string,unit:string,method:Metric["method"],direction:Metric["direction"],target:number,amber:number,numeratorLabel:string,denominatorLabel:string,source:string,decision:string,restricted=false):Metric=>({id,name,department,owner,unit,method,direction,target,amber,numeratorLabel,denominatorLabel,source,decision,restricted});
export const METRICS:Metric[] = [
 m("delivery","Contracted hours delivered","Operations","Operations lead","%","ratio","high",98,95,"Delivered hours","Contracted hours","Rota + approved timesheets","Recover uncovered hours and reconcile commissioner reporting"),
 m("fill","Rota fill rate","Workforce","Workforce lead","%","ratio","high",98,95,"Filled planned hours","Planned rota hours","Published rota","Deploy the credentialled reserve before the next rota closes"),
 m("agency","Agency hours share","Workforce","Workforce lead","%","ratio","low",10,15,"External agency hours","Total delivered hours","Rota + workforce ledger","Review substitution costs and recruitment needs"),
 m("utilisation","Appointment utilisation","Operations","Site lead","%","ratio","high",85,75,"Completed appointments","Available appointment slots","Aggregate clinic activity","Check capacity, escorts and scheduling before reducing sessions"),
 m("dna","Did not attend rate","Operations","Site lead","%","ratio","low",8,12,"Unattended booked appointments","Booked appointments","Aggregate clinic activity","Separate patient, escort and access-related reasons"),
 m("access","Reviews within agreed time","Clinical","Clinical services lead","%","ratio","high",95,90,"Reviews completed within time","Reviews due","Aggregate clinical activity","Investigate access gaps against the contract-specific standard"),
 m("chronic","Chronic care reviews completed","Clinical","Clinical services lead","%","ratio","high",95,90,"Completed due reviews","Reviews due","Aggregate recall register","Allocate capacity to overdue reviews"),
 m("medicines","Medicines audits passed","Clinical","Clinical services lead","%","ratio","high",98,95,"Passed audit checks","Checks completed","Medicines audit","Review prescribing processes and training"),
 m("incidents","Incidents per 1,000 consultations","Governance","Governance lead","/1k","rate","low",3,5,"Reported incidents","Completed consultations","Incident log + activity","Interpret with reporting culture and case mix; lower is not automatically safer"),
 m("actions","Governance actions closed on time","Governance","Governance lead","%","ratio","high",95,85,"Actions closed by deadline","Actions due","Action register","Escalate overdue safety actions"),
 m("complaints","Complaints answered on time","Governance","Governance lead","%","ratio","high",95,90,"Responses within deadline","Complaints requiring a response","Complaints log","Review ownership and avoid closing unresolved complaints"),
 m("credential","Deployment clearance compliance","HR & Compliance","HR lead","%","ratio","high",100,100,"Deployments with all checks current","Deployments checked","Credential ledger","Stop an uncleared deployment and investigate the control failure"),
 m("training","Mandatory training compliance","HR & Compliance","HR lead","%","ratio","high",95,90,"Required learning items current","Required learning items","Learning management export","Resolve expiry and role-specific learning gaps"),
 m("retention","90-day joiner retention","HR & Compliance","HR lead","%","ratio","high",90,85,"Joiners still active after 90 days","Joiners whose 90-day window matured","HR cohort report","Review induction and early attrition; exclude unmatured joiners"),
 m("sickness","Sickness hours rate","HR & Compliance","HR lead","%","ratio","low",4,6,"Sickness absence hours","Available contracted staff hours","Aggregate HR absence report","Check sustainable workload; do not penalise individuals"),
 m("credential_days","Mean time to credential","Recruitment","Recruitment lead","days","mean","low",21,28,"Total elapsed credentialling days","Completed credentialling cases","Recruitment case log","Remove clearance bottlenecks; monitor incomplete cases separately"),
 m("conversion","Accepted-offer conversion","Recruitment","Recruitment lead","%","ratio","high",75,60,"Accepted offers","Decided offers","Recruitment pipeline","Investigate pay, lead times and candidate drop-off"),
 m("revenue","Recognised revenue","Finance","Finance lead","£","sum","high",900000,800000,"Recognised revenue in GBP","Not used","Finance ledger","Reconcile to the general ledger; do not confuse revenue and cash",true),
 m("margin","Contract contribution margin","Finance","Finance lead","%","ratio","high",20,15,"Revenue less direct contract costs","Recognised contract revenue","Finance ledger + contract cost allocation","Review direct costs and pricing; excludes central overhead",true),
 m("overdue","Overdue receivables share","Finance","Finance lead","%","ratio","low",10,15,"Overdue outstanding invoice value","Total outstanding invoice value","Debtor ledger at month end","Prioritise collections; this is a stock measure at month end",true),
 m("cost_hour","Direct cost per delivered hour","Finance","Finance lead","£/hr","mean","low",80,90,"Direct contract delivery costs","Delivered hours","Finance ledger + timesheets","Review staffing mix alongside service quality",true),
 m("invoicing","Invoice accuracy","Finance","Finance lead","%","ratio","high",99,97,"Invoices accepted without correction","Invoices issued","Finance invoice log","Reconcile variable activity evidence before invoicing",true),
 m("sla","Contract reporting on time","Contracts","Contracts lead","%","ratio","high",100,95,"Reports delivered by deadline","Reports due","Contract obligations register","Escalate missing reports and owner accountability"),
 m("exceptions","Provider-attributable lost hours","Contracts","Contracts lead","%","ratio","low",1,3,"Provider-attributable lost hours","Contracted hours","Delivery exceptions ledger","Distinguish provider, commissioner, prison and unresolved attribution"),
 m("readiness","Mobilisation milestones on time","Mobilisation","Mobilisation lead","%","ratio","high",95,85,"Due milestones completed on time","Milestones due","Mobilisation plan","Resolve blockers before the readiness review"),
 m("induction","Site induction complete","Mobilisation","Mobilisation lead","%","ratio","high",100,100,"Staff cleared with site induction","New staff deployed","Induction checklist","Do not deploy before mandatory site-specific induction"),
 m("experience","Positive patient feedback","Patient & Social Value","Service lead","%","ratio","high",90,80,"Positive valid responses","Valid feedback responses","Anonymous feedback summary","Review response count and selection bias alongside the score"),
 m("local","Local workforce hours","Patient & Social Value","Social value lead","%","ratio","high",50,40,"Hours from locally based workers","Total worker hours","Aggregate postcode-area workforce summary","Use a contract-defined local-area definition"),
 m("complete","Required-field completeness","Data & Evidence","Data analyst","%","ratio","high",100,95,"Required fields populated","Required fields expected","Validation log","Repair missing fields before approval"),
 m("validated","Submissions validated on time","Data & Evidence","Data analyst","%","ratio","high",95,90,"Submissions validated by deadline","Submissions due for validation","Validation queue","Reduce reporting delays and blocked bid evidence"),
 m("traceable","Records with source traceability","Data & Evidence","Data analyst","%","ratio","high",100,95,"Records with valid source references","Records checked","Source reconciliation log","Block unsupported claims from the bid library"),
 m("evidence","Approved reusable evidence","Data & Evidence","Bid evidence owner","%","ratio","high",90,80,"Reviewed claims cleared for bid reuse","Claims reviewed","Evidence approval register","Resolve missing consent, attribution or verification")
];
export const validPeriod=(p:unknown):p is string=>typeof p==="string"&&/^(20\d{2})-(0[1-9]|1[0-2])$/.test(p);
export const PERIODS=["2026-04","2026-05","2026-06","2026-07","2026-08","2026-09"];
export const ROLES=[{id:"board",name:"Board / director"},{id:"clinical",name:"Clinical director"},{id:"finance",name:"Finance lead"},{id:"site",name:"Site manager"},{id:"contributor",name:"Department contributor"},{id:"bid",name:"Bid developer"},{id:"commissioner",name:"Commissioner · published assurance"}];
export const TENANTS={drpa:{id:"drpa",name:"DRPA Secure",sites:["Manston","Western Jet Foil","HMP Bristol","Oakhill","HMP Portland","Community pilot"],modules:["overview","departments","contracts","assurance","finance","metrics","configure","assistant","bids","evidence","audit","product"]},customer:{id:"customer",name:"Example Care · customer",sites:["City urgent care","North community"],modules:["overview","departments","contracts","assurance","metrics","configure","assistant","bids","evidence","audit"]}};
export type TenantId=keyof typeof TENANTS;
export type Observation={id:string;tenant:string;site:string;period:string;metric:string;numerator:number;denominator:number;status:string;source:string;note:string;actor:string;updated:string;version:number;details?:string};
export type Submission={id:string;tenant:string;site:string;period:string;metric:string;numerator:number;denominator:number;status:string;source:string;note:string;actor:string;created:string};
export function formula(m:Metric){return m.method==="value"?"Reviewed site-period value; no cross-site aggregation":m.method==="sum"?"Σ numerator":m.method==="ratio"?"Σ numerator ÷ Σ denominator × 100":m.method==="rate"?"Σ numerator ÷ Σ denominator × 1,000":"Σ numerator ÷ Σ denominator";}
export function calculate(m:Metric,rows:Observation[]){const rr=rows.filter(r=>r.metric===m.id&&r.status==="approved");if(!rr.length)return null;if(m.method==="value")return rr.length===1?rr[0].numerator:null;const n=rr.reduce((s,r)=>s+r.numerator,0),d=rr.reduce((s,r)=>s+r.denominator,0);return m.method==="sum"?n:d===0?null:n/d*(m.method==="ratio"?100:m.method==="rate"?1000:1);}
export function rag(m:Metric,value:number|null){if(value===null)return "No data";return m.direction==="high"?(value>=m.target?"On target":value>=m.amber?"Watch":"Action"):(value<=m.target?"On target":value<=m.amber?"Watch":"Action");}
export function fmt(m:Metric,value:number|null){if(value===null)return "—";if(m.unit==="£")return new Intl.NumberFormat("en-GB",{style:"currency",currency:"GBP",maximumFractionDigits:0}).format(value);return (m.unit==="£/hr"?"£":"")+value.toFixed(1)+(m.unit==="%"?"%":m.unit==="days"?" days":m.unit==="/1k"?" /1k":m.unit==="£/hr"?" /hr":"");}
export function allowedMetrics(tenant:TenantId,role:string,additional:Metric[]=[]){return [...METRICS,...additional].filter(m=>{
 if(role==="commissioner")return false;
 if(m.restricted&&!["board","finance"].includes(role))return false;
 if(tenant==="customer"&&m.restricted)return false;
 if(role==="finance")return ["Finance","Contracts","Data & Evidence"].includes(m.department);
 if(role==="clinical")return !m.restricted&&!["Recruitment","Patient & Social Value"].includes(m.department);
 if(role==="site"||role==="contributor")return ["Operations","Clinical","Governance","Mobilisation","HR & Compliance"].includes(m.department);
 if(role==="bid")return !m.restricted;
 return true;
});}
export function visibleModules(tenant:TenantId,role:string){return TENANTS[tenant].modules.filter(m=>{
 if(role==="commissioner")return m==="assurance";
 if(m==="configure")return role==="board";
 if(m==="finance")return role==="board"||role==="finance";
 if(role==="contributor")return ["overview","departments","metrics","contracts"].includes(m);
 if(role==="site")return !["bids","product"].includes(m);
 if(role==="finance"||role==="clinical")return !["bids","product"].includes(m);
 if(role==="bid")return !["departments","product","assurance"].includes(m);
 return true;
});}
export function scopeSites(tenant:TenantId,role:string){if(role==="commissioner")return [TENANTS[tenant].sites[tenant==="drpa"?2:0]];return ["site","contributor"].includes(role)?[TENANTS[tenant].sites[tenant==="drpa"?3:0]]:TENANTS[tenant].sites;}
export function seedRows(tenant:TenantId):Observation[]{
 const base=tenant==="drpa"?[[4200,445000,.94],[900,102000,.99],[720,96000,.91],[960,126000,.99],[680,85000,.96],[500,76000,.98]]:[[800,92000,.97],[620,68000,.95]];
 const rows:Observation[]=[];
 PERIODS.forEach((period,pi)=>TENANTS[tenant].sites.forEach((site,si)=>{
 const [h,r,q]=base[si];const ph=Math.round(h*(.9+pi*.02));const dh=Math.round(ph*(q+.001*(pi-5)));const revenue=Math.round(r*(.9+pi*.02));const costs=Math.round(revenue*(.77+(si===0?.065:si===2?.055:.015)));const slots=Math.round(dh*3);const attended=Math.round(slots*(si===2?.73:.85));
 const pairs:Record<string,[number,number]>={delivery:[dh,ph],fill:[Math.round(ph*(q+.006)),ph],agency:[Math.round(dh*(si===0?.18:.075)),dh],utilisation:[attended,slots],dna:[Math.round(slots*(si===2?.135:.06)),slots],access:[Math.round(attended*(si===2?.89:.966)),attended],chronic:[Math.round(140*(si===2?.86:.97)),140],medicines:[Math.round(200*(si===2?.94:.99)),200],incidents:[Math.max(1,Math.round(attended*(si===2?.0048:.002))),attended],actions:[si===2?16:19,20],complaints:[si===2?8:10,10],credential:[199,200],training:[si===2?177:194,200],retention:[si===0?17:19,20],sickness:[Math.round(dh*.032),dh],credential_days:[(si===0?29:19)*12,12],conversion:[si===0?7:10,12],revenue:[revenue,0],margin:[revenue-costs,revenue],overdue:[si===0?42000:7000,si===0?220000:75000],cost_hour:[costs,dh],invoicing:[49,50],sla:[si===0?4:5,5],exceptions:[Math.round(ph*(si===0?.035:.006)),ph],readiness:[18,20],induction:[20,20],experience:[si===2?32:37,40],local:[Math.round(dh*.53),dh],complete:[990,1000],validated:[46,50],traceable:[100,100],evidence:[17,20]};
 METRICS.filter(m=>tenant!=="customer"||!m.restricted).forEach(m=>{const [n,d]=pairs[m.id];rows.push({id:`sample-${tenant}-${si}-${pi}-${m.id}`,tenant,site,period,metric:m.id,numerator:n,denominator:d,status:"approved",source:`SAMPLE-${m.id.toUpperCase()}-${si+1}-${period} · ${m.source}`,note:"Synthetic demonstration record. Not a DRPA performance claim.",actor:"Demo seed",updated:"2026-10-01T08:00:00.000Z",version:1});});
 }));return rows;
}
export const EVIDENCE=[
 {id:"EV-001",title:"Rota delivery and service continuity",department:"Operations",metrics:["delivery","fill"],status:"Sample approved",classification:"Aggregate operational",owner:"Operations lead",summary:"Monthly rota and delivered-hours reconciliation. Cite period, population and denominator together."},
 {id:"EV-002",title:"Clearance before deployment",department:"HR & Compliance",metrics:["credential","induction"],status:"Sample approved",classification:"Aggregate workforce",owner:"HR lead",summary:"Reconciled deployment checks and site induction summary. Exceptions need explicit disclosure."},
 {id:"EV-003",title:"Clinical access and planned care",department:"Clinical",metrics:["access","chronic"],status:"Sample approved",classification:"Aggregate clinical",owner:"Clinical services lead",summary:"Due reviews and completion counts at the site-month grain. No patient-level records included."},
 {id:"EV-004",title:"Closed-loop clinical governance",department:"Governance",metrics:["actions","medicines"],status:"Sample approved",classification:"Governance",owner:"Governance lead",summary:"Audit checks and action deadlines reconciled to source registers. Attribution and reuse require review."},
 {id:"EV-005",title:"Patient experience and social value",department:"Patient & Social Value",metrics:["experience","local"],status:"Sample approved",classification:"Anonymous aggregate",owner:"Social value lead",summary:"Feedback response counts and local-hours definition are retained alongside each claim."},
 {id:"EV-006",title:"Mobilisation readiness narrative",department:"Mobilisation",metrics:["readiness"],status:"Pending verification",classification:"Draft narrative",owner:"Mobilisation lead",summary:"Draft case-study outline; unsupported claims are excluded from bid generation."}
];
