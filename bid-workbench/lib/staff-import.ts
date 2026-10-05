import {newStaff,staffWte} from './finance';
import {sheetRows,type XBook} from './xlsx';
import type {StaffLine,ServiceModel} from './types';
export type StaffMapping={header:number;sheet:string;fields:Partial<Record<keyof StaffLine,string>>;salaryBasis:'fte_annual'|'actual_annual'|'hourly';basis:'wte'|'coverage';fullTimeHours:number;productiveWeeks:number|null;paidWeeks:number;percentUnits:'percent'|'fraction'};
export const staffFields:{key:keyof StaffLine;label:string;pattern:RegExp}[]=[{key:'role',label:'Role / position',pattern:/^(job title|position|role|staff role|post)$/i},{key:'service',label:'Service',pattern:/service|department/i},{key:'provider',label:'Provider',pattern:/provider/i},{key:'grade',label:'Grade / band',pattern:/grade|band/i},{key:'wte',label:'Required WTE',pattern:/\bwte\b|\bfte\b|whole.time/i},{key:'weeklyCoverage',label:'Required coverage hours / week',pattern:/coverage|weekly.*required|required.*hours/i},{key:'salaryFte',label:'Basic salary or hourly pay',pattern:/basic.*salary|annual.*salary|salary.*fte|hourly.*rate|^salary$/i},{key:'allowanceFte',label:'Allowance per FTE',pattern:/allowance/i},{key:'niPct',label:'Employer NI %',pattern:/ni.*%|employer.*ni.*rate|national.*insurance.*%/i},{key:'niThreshold',label:'Annual NI threshold',pattern:/ni.*threshold|national.*insurance.*threshold/i},{key:'pensionPct',label:'Employer pension %',pattern:/pension/i},{key:'otherFte',label:'Other employer costs per FTE',pattern:/other.*cost|other.*fte/i},{key:'escalationPct',label:'Annual pay escalation %',pattern:/escalat|uplift|inflation/i},{key:'productiveWeeks',label:'Productive weeks',pattern:/productive.*weeks/i},{key:'fteHoursWeek',label:'Full-time hours / week',pattern:/full.?time.*hours|fte.*hours/i}];
export function numericCell(raw:string|undefined,max=1e10):number|null{if(!raw?.trim())return null;const cleaned=raw.replace(/[,£%\s]/g,'');if(!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(cleaned))return null;const n=Number(cleaned);return Number.isFinite(n)&&n>=0&&n<=max?n:null;}
export function suggestStaffMapping(book:XBook):StaffMapping{
 const sheet=book.sheets.find(s=>/staff|workforce|profile/i.test(s.name))||book.sheets[0];const rows=sheetRows(sheet);
 const score=(values:Record<string,string>)=>staffFields.filter(f=>Object.values(values).some(v=>f.pattern.test(v.trim()))).length;
 const best=rows.filter(r=>r.row<=60).sort((a,b)=>score(b.values)-score(a.values))[0];const fields:StaffMapping['fields']={};for(const f of staffFields){const match=Object.entries(best?.values||{}).find(([,v])=>f.pattern.test(v.trim()));if(match)fields[f.key]=match[0];}
 return {sheet:sheet.name,header:best?.row||1,fields,salaryBasis:'fte_annual',basis:fields.wte?'wte':'coverage',fullTimeHours:37.5,productiveWeeks:null,paidWeeks:52.14,percentUnits:'percent'};
}
export function importStaff(book:XBook,mapping:StaffMapping,model:ServiceModel){
 const sheet=book.sheets.find(s=>s.name===mapping.sheet);if(!sheet||!mapping.fields.role)throw new Error('Choose a worksheet, header and role column.');
 if(!Number.isInteger(mapping.header)||mapping.header<1||mapping.header>1048576)throw new Error('Choose a valid header row.');
 if(!Number.isFinite(mapping.paidWeeks)||mapping.paidWeeks<48||mapping.paidWeeks>54)throw new Error('Confirm paid weeks per year between 48 and 54.');
 if(mapping.productiveWeeks!==null&&(!Number.isFinite(mapping.productiveWeeks)||mapping.productiveWeeks<=0||mapping.productiveWeeks>model.weeksPerYear))throw new Error('Confirm valid productive weeks within the model year.');
 if(!Number.isFinite(mapping.fullTimeHours)||mapping.fullTimeHours<=0||mapping.fullTimeHours>168)throw new Error('Confirm valid full-time weekly hours.');
 const rows=sheetRows(sheet).filter(r=>r.row>mapping.header&&r.values[mapping.fields.role!]?.trim()&&!/^(?:grand\s+)?(?:sub\s*)?total(?:s|\s+staff|\s+costs)?$/i.test(r.values[mapping.fields.role!].trim()));
 if(rows.length+model.staff.length>150)throw new Error('This import exceeds 150 staffing rows. Choose the staff schedule without subtotals or notes.');
 return rows.map(row=>{
  const line=newStaff();const warnings:string[]=[];line.basis=mapping.basis;line.fteHoursWeek=mapping.fullTimeHours;line.productiveWeeks=mapping.productiveWeeks;
  for(const key of ['role','service','provider','grade'] as const)if(mapping.fields[key])line[key]=(row.values[mapping.fields[key]!]||'').trim().slice(0,key==='grade'?100:300);
  for(const key of ['wte','weeklyCoverage','salaryFte','allowanceFte','niPct','niThreshold','pensionPct','otherFte','escalationPct','productiveWeeks','fteHoursWeek'] as const){const column=mapping.fields[key];if(!column)continue;const max=key==='wte'?10000:key==='weeklyCoverage'?100000:key==='productiveWeeks'?54:key==='fteHoursWeek'?168:key.endsWith('Pct')?100:1e10;let value=numericCell(row.values[column],mapping.percentUnits==='fraction'&&key.endsWith('Pct')?1:max);if(value!==null&&key.endsWith('Pct')&&mapping.percentUnits==='fraction')value*=100;if(key==='fteHoursWeek'){if(value&&value>=1)line[key]=value;else warnings.push('Full-time hours missing; confirm the selected default.');}else line[key]=value;}
  if(mapping.salaryBasis==='hourly'&&line.salaryFte!==null)line.salaryFte*=line.fteHoursWeek*mapping.paidWeeks;
  if(mapping.salaryBasis==='actual_annual'&&line.salaryFte!==null){const wte=staffWte(line,model);line.salaryFte=wte&&wte>0?line.salaryFte/wte:null;}
  if(line.salaryFte!==null&&(!Number.isFinite(line.salaryFte)||line.salaryFte>1e10)){line.salaryFte=null;warnings.push('Converted annual salary is outside the supported range; enter a confirmed figure.');}
  for(const [key,label]of [['salaryFte','basic salary'],['allowanceFte','allowances'],['niPct','employer NI rate'],['niThreshold','NI threshold'],['pensionPct','pension'],['otherFte','other employer costs'],['escalationPct','annual pay escalation']] as const)if(line[key]===null)warnings.push('Confirm '+label+' (including explicit zero).');
  if(staffWte(line,model)===null)warnings.push('Confirm required WTE or coverage and productive weeks.');
  return {line,row:row.row,warnings};
 });
}
