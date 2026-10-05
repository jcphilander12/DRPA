import type {Deadline,Source} from './types';
export type DeadlineCandidate={date:string;time:string;sourceId:string;excerpt:string};
const monthNames=['january','february','march','april','may','june','july','august','september','october','november','december'];
export function validDate(date:string){if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return false;const d=new Date(date+'T12:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===date;}
const pad=(n:number)=>String(n).padStart(2,'0');
const iso=(d:number,m:number,y:number)=>`${y<100?2000+y:y}-${pad(m)}-${pad(d)}`;
export function extractDeadlines(sources:Source[]):DeadlineCandidate[]{
 const candidates:DeadlineCandidate[]=[],seen=new Set<string>();
 for(const source of sources){const lines=source.text.split('\n');for(let i=0;i<lines.length;i++){
  if(!/submission.{0,30}(?:date|deadline)|(?:closing|return|completion)\s+(?:date|deadline)|deadline.{0,30}(?:bid|tender|submit|submission)|tenders?\s+(?:must|shall|to|return|close)|bid.{0,30}(?:due|deadline|complete)|submit.{0,25}by/i.test(lines[i]))continue;
  const excerpt=lines.slice(Math.max(0,i-1),i+3).join(' ').slice(0,1800);
  const dates:string[]=[];
  for(const m of excerpt.matchAll(/\b(20\d{2})-(\d{2})-(\d{2})\b/g))dates.push(iso(+m[3],+m[2],+m[1]));
  for(const m of excerpt.matchAll(/\b(\d{1,2})[/.\-](\d{1,2})[/.\-](20\d{2}|\d{2})\b/g))dates.push(iso(+m[1],+m[2],+m[3]));
  for(const m of excerpt.matchAll(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*,?\s*(20\d{2}|\d{2})\b/gi)){const month=monthNames.findIndex(n=>n.startsWith(m[2].toLowerCase()))+1;dates.push(iso(+m[1],month,+m[3]));}
  const clock=excerpt.match(/\b(\d{1,2})(?::([0-5]\d)|\.([0-5]\d))?\s*(am|pm)\b/i)||excerpt.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  let time='';if(clock){let hour=+clock[1];if(clock[4]){hour%=12;if(clock[4].toLowerCase()==='pm')hour+=12;}time=pad(hour)+':'+pad(+(clock[2]||clock[3]||0));}
  for(const date of dates){const key=source.id+date+time;if(validDate(date)&&!seen.has(key)){seen.add(key);candidates.push({date,time,sourceId:source.id,excerpt});}}
 }}return candidates.slice(0,30);
}
function londonParts(date:Date){const values=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date);return Object.fromEntries(values.map(x=>[x.type,x.value]));}
export function deadlineInstant(d:Deadline|undefined):number|null{
 if(!d)return null;
 if(!validDate(d.date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(d.time))return null;
 const target=Date.parse(d.date+'T'+d.time+':00Z');let instant=target;
 for(let i=0;i<3;i++){const p=londonParts(new Date(instant));const local=Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:00Z`);instant+=target-local;}
 const p=londonParts(new Date(instant));return `${p.year}-${p.month}-${p.day}`===d.date&&`${p.hour}:${p.minute}`===d.time?instant:null;
}
export function countdown(d:Deadline|undefined,now=new Date()){
 const instant=d?.confirmed?deadlineInstant(d):null;if(instant===null)return {label:'Deadline not confirmed',days:null as number|null,expired:false,hours:null as number|null};
 const p=londonParts(now);const today=`${p.year}-${p.month}-${p.day}`;const days=Math.round((Date.parse(d!.date+'T12:00:00Z')-Date.parse(today+'T12:00:00Z'))/86400000);const expired=now.getTime()>=instant;
 return {days,expired,hours:Math.max(0,Math.floor((instant-now.getTime())/3600000)),label:expired?(days<0?`${Math.abs(days)} day${days===-1?'':'s'} overdue`:'Submission deadline passed'):days===0?'Submission due today':`${days} day${days===1?'':'s'} left`};
}
