import {unzipSync,zipSync,strFromU8,strToU8} from 'fflate';
import type {FMTPlan,ServiceModel,FMTMapping} from './types';
import {mappedValue} from './finance';
export type XCell={ref:string;value:string;formula:string;style:number};
export type XSheet={name:string;path:string;cells:XCell[];rows:number;columns:number;protected:boolean;merges:string[]};
export type XBook={sheets:XSheet[];files:Record<string,Uint8Array>;styles:string[]};
const attrs=(s:string)=>Object.fromEntries(Array.from(s.matchAll(/([\w:.-]+)\s*=\s*["']([^"']*)["']/g)).map(m=>[m[1],unesc(m[2])]));
const unesc=(s:string)=>s.replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16))).replace(/&#([0-9]+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&');
const escaped=(s:string)=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]!));
export function columnNumber(ref:string){let n=0;for(const c of ref.toUpperCase().replace(/[0-9]/g,''))n=n*26+c.charCodeAt(0)-64;return n;}
export function columnName(n:number){let s='';while(n>0){n--;s=String.fromCharCode(65+n%26)+s;n=Math.floor(n/26);}return s;}
const rowNumber=(ref:string)=>Number(ref.match(/[0-9]+$/)?.[0]||0);
function zipFiles(bytes:Uint8Array){if(bytes.byteLength>15*1024*1024)throw new Error('Choose an XLSX smaller than 15 MB.');let total=0;return unzipSync(bytes,{filter(e){total+=e.originalSize;if(e.originalSize>10*1024*1024||total>30*1024*1024)throw new Error('Expanded workbook exceeds the import limit.');return true;}});}
export function readWorkbook(bytes:Uint8Array):XBook{
 const files=zipFiles(bytes);if(!files['xl/workbook.xml'])throw new Error('This file is not a standard XLSX workbook.');
 const shared=files['xl/sharedStrings.xml']?Array.from(strFromU8(files['xl/sharedStrings.xml']).matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)).map(m=>Array.from(m[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)).map(x=>unesc(x[1])).join('')):[];
 const relations=new Map(Array.from(strFromU8(files['xl/_rels/workbook.xml.rels']||new Uint8Array()).matchAll(/<Relationship\b([^>]*?)\/?\s*>/g)).map(m=>{const a=attrs(m[1]);return [a.Id,a.Target];}));
 const styleXml=strFromU8(files['xl/styles.xml']||new Uint8Array());const cellXfs=styleXml.match(/<cellXfs\b[^>]*>([\s\S]*?)<\/cellXfs>/)?.[1]||'';const styles=Array.from(cellXfs.matchAll(/<xf\b[^>]*(?:\/>|>[\s\S]*?<\/xf>)/g)).map(m=>m[0]);
 const sheets:XSheet[]=[];
 for(const match of strFromU8(files['xl/workbook.xml']).matchAll(/<sheet\b([^>]*?)\/?\s*>/g)){
  const a=attrs(match[1]),target=relations.get(a['r:id']);if(!target)continue;const path=target.startsWith('/')?target.slice(1):'xl/'+target.replace(/^\.\//,'');if(!files[path]||path.includes('..'))throw new Error('Unsupported worksheet relationship.');const xml=strFromU8(files[path]);if(/<\w+:c\b/.test(xml))throw new Error('This worksheet uses an unsupported cell namespace. Save a standard XLSX copy first.');
  const cells:XCell[]=Array.from(xml.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)).map(m=>{const a=attrs(m[1]),body=m[2]||'',v=body.match(/<v\b[^>]*>([\s\S]*?)<\/v>/)?.[1]||'';return {ref:a.r,value:a.t==='s'?shared[Number(v)]||'':a.t==='inlineStr'?Array.from(body.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)).map(t=>unesc(t[1])).join(''):unesc(v),formula:body.match(/<f\b[^>]*>([\s\S]*?)<\/f>/)?.[1]||(/<f\b/.test(body)?'[shared formula]':''),style:Number(a.s||0)};}).filter(c=>c.ref);
  sheets.push({name:a.name,path,cells,rows:cells.reduce((n,c)=>Math.max(n,rowNumber(c.ref)),0),columns:cells.reduce((n,c)=>Math.max(n,columnNumber(c.ref)),0),protected:/<sheetProtection\b/.test(xml),merges:Array.from(xml.matchAll(/<mergeCell\b([^>]*?)\/?\s*>/g)).map(m=>attrs(m[1]).ref)});
 }
 if(!sheets.length)throw new Error('No readable worksheets were found.');return {sheets,files,styles};
}
function within(ref:string,range:string){const [a,b=a]=range.split(':');return columnNumber(ref)>=columnNumber(a)&&columnNumber(ref)<=columnNumber(b)&&rowNumber(ref)>=rowNumber(a)&&rowNumber(ref)<=rowNumber(b);}
export function validateMappings(book:XBook,m:ServiceModel,f:FMTPlan){
 const errors:string[]=[];const seen=new Set<string>();for(const map of f.mappings){const ref=map.cell.toUpperCase(),key=map.sheet+'!'+ref,s=book.sheets.find(s=>s.name===map.sheet);if(seen.has(key))errors.push(`Duplicate target ${key}.`);seen.add(key);
  if(!s){errors.push(`Worksheet not found: ${map.sheet}.`);continue;}if(!/^[A-Z]{1,3}[1-9][0-9]{0,6}$/.test(ref)||columnNumber(ref)>16384||rowNumber(ref)>1048576){errors.push(`Invalid cell ${key}.`);continue;}
  const cell=s.cells.find(c=>c.ref.toUpperCase()===ref);if(cell?.formula)errors.push(`${key} contains a formula. Map an input cell instead.`);
  if(s.merges.some(range=>range.includes(':')&&within(ref,range)))errors.push(`${key} is part of a merged range. Map an unmerged input cell.`);
  if(cell&&cell.value&&(!Number.isFinite(Number(cell.value))||/^\s*(?:TRUE|FALSE)$/i.test(cell.value)))errors.push(`${key} contains text. Map a numeric input cell.`);
  if(s.protected&&!/\blocked\s*=\s*["']0["']/.test(book.styles[cell?.style??0]||''))errors.push(`${key} is locked in the commissioner workbook.`);
  if(mappedValue(m,map.metric,map.lineId,map.year)===null)errors.push(`${key} has an incomplete model output.`);
  if(!map.verified)errors.push(`${key} has not been confirmed as the intended input.`);
 }return Array.from(new Set(errors));
}
function patchCell(xml:string,ref:string,value:number){
 const matcher=new RegExp('<c\\b([^>]*\\br=["\\\']'+ref+'["\\\'][^>]*)(?:\\/>|>([\\s\\S]*?)<\\/c>)');const found=xml.match(matcher);
 if(found){const a=attrs(found[1]);const kept=Object.entries(a).filter(([k])=>k!=='t').map(([k,v])=>`${k}="${escaped(v)}"`).join(' ');return xml.replace(matcher,`<c ${kept}><v>${value}</v></c>`);}
 const r=rowNumber(ref);const cell=`<c r="${ref}"><v>${value}</v></c>`;const rowMatch=new RegExp('<row\\b([^>]*\\br=["\\\']'+r+'["\\\'][^>]*)(?:\\/>|>([\\s\\S]*?)<\\/row>)');const row=xml.match(rowMatch);
 if(row){const body=row[2]||'';let inserted=false;const content=body.replace(/<c\b[^>]*\br=["']([A-Z]+[0-9]+)["'][^>]*(?:\/>|>[\s\S]*?<\/c>)/g,(whole,other)=>{if(!inserted&&columnNumber(other)>columnNumber(ref)){inserted=true;return cell+whole;}return whole;});return xml.replace(rowMatch,`<row${row[1]}>${content}${inserted?'':cell}</row>`);}
 const add=`<row r="${r}">${cell}</row>`;let inserted=false;xml=xml.replace(/<row\b[^>]*\br=["']([0-9]+)["'][^>]*(?:\/>|>[\s\S]*?<\/row>)/g,(whole,n)=>{if(!inserted&&Number(n)>r){inserted=true;return add+whole;}return whole;});return inserted?xml:xml.replace('</sheetData>',add+'</sheetData>');
}
export function fillFMT(bytes:Uint8Array,m:ServiceModel,f:FMTPlan){
 const book=readWorkbook(bytes);const errors=validateMappings(book,m,f);if(errors.length)throw new Error(errors.slice(0,8).join('\n'));const files={...book.files};
 for(const sheet of book.sheets){let xml=strFromU8(files[sheet.path]);for(const map of f.mappings.filter(x=>x.sheet===sheet.name)){const value=mappedValue(m,map.metric,map.lineId,map.year)!;const rounded=Number(value.toFixed(map.metric==='staff_wte'?8:2));xml=patchCell(xml,map.cell.toUpperCase(),rounded);}
  // Formula caches are invalid after changing inputs. Excel must recalculate.
  xml=xml.replace(/<c\b([^>]*?)>([\s\S]*?)<\/c>/g,(all,a,body)=>/<f\b/.test(body)?`<c${a}>${body.replace(/<v\b[^>]*>([\s\S]*?)<\/v>/g,'')}</c>`:all);files[sheet.path]=strToU8(xml);
 }
 let wb=strFromU8(files['xl/workbook.xml']);wb=wb.replace(/<calcPr\b[^>]*(?:\/>|>[\s\S]*?<\/calcPr>)/g,'');wb=wb.replace('</workbook>','<calcPr calcMode="auto" fullCalcOnLoad="1" forceFullCalc="1"/></workbook>');files['xl/workbook.xml']=strToU8(wb);
 if(files['xl/calcChain.xml']){delete files['xl/calcChain.xml'];for(const path of ['xl/_rels/workbook.xml.rels','[Content_Types].xml'])if(files[path])files[path]=strToU8(strFromU8(files[path]).replace(/<(?:Relationship|Override)\b[^>]*(?:calcChain|calcchain)[^>]*\/?\s*>/g,''));}
 return zipSync(files);
}
export function suggestedWinchesterMappings(m:ServiceModel,book:XBook):FMTMapping[]{
 if(!book.sheets.some(s=>s.name==='Provider Staff Costs')||!book.sheets.some(s=>s.name==='Non Pay Costs'))return [];
 const result:FMTMapping[]=[];for(const [i,s] of m.staff.entries())for(let year=1;year<=Math.min(8,m.contractYears);year++){for(const [metric,first] of [['staff_wte',6],['staff_cost',16]] as const)result.push({id:crypto.randomUUID(),metric,lineId:s.id,year,sheet:'Provider Staff Costs',cell:columnName(first+year-1)+(7+i),verified:false});}
 for(const [i,n] of m.nonPay.entries())for(let year=1;year<=Math.min(8,m.contractYears);year++)result.push({id:crypto.randomUUID(),metric:'nonpay_cost',lineId:n.id,year,sheet:'Non Pay Costs',cell:columnName(2+year)+(5+i),verified:false});return result;
}
export function sheetRows(s:XSheet){const map=new Map<number,Record<string,string>>();for(const c of s.cells){const r=rowNumber(c.ref);if(!map.has(r))map.set(r,{});map.get(r)![columnName(columnNumber(c.ref))]=c.value;}return Array.from(map.entries()).sort((a,b)=>a[0]-b[0]).map(([row,values])=>({row,values}));}
export function completedWorkbookFacts(book:XBook,f:FMTPlan){return (f.completedFacts||[]).map(fact=>{const ref=fact.cell.toUpperCase();if(!fact.verified||!fact.label.trim()||!/^([A-Z]{1,3})([1-9][0-9]{0,6})$/.test(ref)||columnNumber(ref)>16384||rowNumber(ref)>1048576)throw new Error('Name and verify a valid worksheet cell for every financial fact.');const cell=book.sheets.find(s=>s.name===fact.sheet)?.cells.find(c=>c.ref.toUpperCase()===ref);if(!cell?.value.trim()||/^#(?:REF!|VALUE!|DIV\/0!|N\/A|NAME\?|NUM!|NULL!)/.test(cell.value))throw new Error(`${fact.sheet}!${ref} has no usable value. Recalculate and save the completed workbook in Excel, then upload it again.`);if(cell.value.length>2000)throw new Error('Select a summary value rather than a long narrative or personal record.');return {id:fact.id,label:fact.label,value:cell.value,locator:`${fact.sheet}!${ref}${cell.formula?' (saved formula value; recalculation reviewed)':''}`};});}
