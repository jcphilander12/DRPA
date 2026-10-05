import type {Question,Project,Source,BidBrief,DataGap} from './types';
export type QuestionCandidate={ref:string;title:string;text:string;limit:number|null;unit:'words'|'characters';locator:string;selected:boolean;warning:string};
export function extractQuestions(text:string):QuestionCandidate[]{
 const lines=text.replace(/\r\n?/g,'\n').split('\n').map(s=>s.replace(/\b[A-Z]{1,3}[0-9]{1,7}:\s*/g,'').trim());
 const starts:{at:number;ref:string;title:string}[]=[];
 for(let at=0;at<lines.length;at++){
  const line=lines[at];let match=line.match(/^(?:question\s*|q\s*)(\d{1,3}(?:\.\d+)?)\s*(?:[-:.|–—]\s*)?(.+)$/i);
  if(!match){const bare=line.match(/^(\d{1,3}(?:\.\d+)?)\s*[-.)|–—]\s*(.{5,200})$/);if(bare&&/describe|explain|detail|service|provision|care|health|governance|mobilis|recruit|how|provide|workforce|management|delivery/i.test(bare[2]))match=bare;}
  if(match){const ref='Q'+match[1].padStart(2,'0');if(!starts.some(s=>s.ref===ref&&s.title===match![2]))starts.push({at,ref,title:match[2].replace(/\|.*$/,'').trim().slice(0,300)});}
 }
 const candidates:QuestionCandidate[]=[];
 for(const [i,s] of starts.entries()){
  const body=lines.slice(s.at,starts[i+1]?.at??lines.length).join('\n').trim();if(body.length<15)continue;
  const limits=Array.from(body.matchAll(/(?:maximum|max\.?|limit|up to|no more than)?\s*[:(]?\s*([0-9][0-9, ]{0,9})\s*(characters?|words?)\b/gi));
  const limit=limits[0]?Number(limits[0][1].replace(/[, ]/g,'')):null;const unit=limits[0]?.[2].toLowerCase().startsWith('word')?'words':'characters';
  const locator=lines.slice(0,s.at+1).reverse().find(s=>/^\[(?:Page|Sheet):?\s/i.test(s))||`Text line ${s.at+1}`;
  candidates.push({ref:s.ref,title:s.title,text:body.slice(0,40000),limit:limit&&limit<=100000?limit:null,unit,locator,selected:true,warning:!limit?'Response limit not detected. Confirm against the ITT/portal.':limits.length>1?'Several limits found. Confirm the correct question limit.':''});
 }
 return candidates.slice(0,80);
}
const gap=(id:string,title:string,detail:string,priority:'high'|'medium'='high'):DataGap=>({id,title,detail,priority,state:'open',ownerId:'',dueDate:'',evidence:''});
export function buildBrief(p:Project,sources:Source[]):BidBrief{
 const itt=sources.filter(s=>s.scope===p.id&&(s.category==='itt'||['Tender requirement','Clarification'].includes(s.kind)));const requirements:BidBrief['requirements']=[];
 const patterns=[['deadline','Submission deadline',/deadline|closing date|submission date|tender return/i],['term','Contract term and mobilisation',/contract (?:period|term|duration|start)|service commencement|mobilisation period/i],['budget','Financial envelope',/financial envelope|maximum (?:annual )?budget|contract value|budget envelope/i],['attachments','Required attachments',/pictorial|attachment|clinic.plan|pathway.diagram/i],['scoring','Scoring and evaluation',/weighting|evaluation criteria|quality threshold|minimum score/i],['tupe','TUPE requirements',/employee liability|\btupe\b/i]] as const;
 for(const s of itt)for(const [id,title,re] of patterns){const excerpts=s.text.split(/\n/).filter(line=>re.test(line)).slice(0,3);if(excerpts.length)requirements.push({id:s.id+'-'+id,title,excerpt:excerpts.join('\n').slice(0,2200),sourceId:s.id});}
 const topics=Array.from(new Set(p.questions.map(q=>q.title).filter(Boolean))).slice(0,50);
 const gaps=[gap('demand','Demand and activity baseline','Confirm arrivals, population, acuity, clinic activity, waiting times, escort/unlock constraints and peak demand with current source dates.'),gap('workforce','Funded workforce and cover','Confirm productive capacity, skill mix, hours, absence cover, escalation and partner responsibilities. Reconcile each commitment to the model.'),gap('outcomes','Evidence of delivery and outcomes','Gather site, period, baseline, intervention, measurable outcome and the supporting record for each claimed experience example.'),gap('partners','Confirmed partners and dependencies','Obtain named partner scope, prices, mobilisation capacity and written agreement. Separate commissioner and HMPPS dependencies.'),gap('finance','Completed financial model','Import the commissioner workbook, complete costs and map to verified input cells. Confirm tax/pension assumptions and financial envelopes.'),gap('tupe','Employee liability information','Use anonymised references. Confirm employment terms, salary basis, pension, allowances, working hours and mapping to planned roles. Do not assume all locums transfer.'),gap('criteria','Question wording, limits and criteria','Verify every extracted question, portal limit, weighting and required pictorial/other attachments.'),gap('delivery','Mobilisation and implementation','Confirm dependencies, readiness milestones, owners, risks, equipment, systems and Year 1 mobilisation costs.')];
 const haystack=p.questions.map(q=>q.text+' '+q.title).join(' ');
 if(/mental|substance|recovery|detox/i.test(haystack))gaps.push(gap('specialist','Specialist clinical pathways and assurance','Confirm the mental-health/substance-misuse skill mix, referral capacity, clinical supervision and evidence of safe continuity.', 'high'));
 if(/social value|sustainab|carbon/i.test(haystack))gaps.push(gap('social','Social value and sustainability evidence','Confirm deliverable targets, baselines, named owners and reporting, with costs and supporting evidence.','medium'));
 if(!itt.length)gaps.unshift(gap('itt','Current ITT documents','Upload the current invitation, specifications, clarification responses and question workbook for this bid.'));
 for(const g of gaps){const old=p.brief?.gaps.find(x=>x.id===g.id);if(old)Object.assign(g,{state:old.state,ownerId:old.ownerId,dueDate:old.dueDate,evidence:old.evidence});}
 const lookup=(id:string)=>requirements.find(r=>r.id.endsWith('-'+id))?.excerpt||'Not identified. Confirm in the current tender.';
 return {summary:`${p.name}${p.commissioner?' for '+p.commissioner:''}. ${p.scope||'Confirm the commissioned scope.'} ${p.questions.length} question${p.questions.length===1?'':'s'} currently captured. Topics: ${topics.join('; ')||'not yet extracted'}. ${itt.filter(s=>s.status!=='approved').length} ITT source(s) still need verification.`,deadline:lookup('deadline'),contractTerm:lookup('term'),budget:lookup('budget'),topics,requirements,gaps,sourceIds:itt.map(s=>s.id),generatedAt:new Date().toISOString()};
}
