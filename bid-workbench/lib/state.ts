export function canonical(value:unknown):unknown {
 if(Array.isArray(value))return value.map(canonical);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([,v])=>v!==undefined).sort(([a],[b])=>a.localeCompare(b)).map(([key,v])=>[key,canonical(v)]));
 return value;
}
export const valuesEqual=(a:unknown,b:unknown)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));

// Preserve typing that happened during an autosave, while taking derived brief,
// approval and validation values returned by the successful server write.
export function reconcileSaved(server:any,base:any,local:any):any {
 if(valuesEqual(base,local))return server;
 if(Array.isArray(local)&&Array.isArray(base)&&Array.isArray(server)){
  if([...local,...base,...server].every(item=>item&&typeof item==='object'&&typeof item.id==='string')){
   const b=new Map(base.map(item=>[item.id,item]));const s=new Map(server.map(item=>[item.id,item]));
   return [...local.map(item=>b.has(item.id)?reconcileSaved(s.get(item.id),b.get(item.id),item):item),...server.filter(item=>!b.has(item.id)&&!local.some(current=>current.id===item.id))];
  }
  return local;
 }
 if(local&&base&&server&&typeof local==='object'&&typeof base==='object'&&typeof server==='object'&&!Array.isArray(local)){
  const result:Record<string,unknown>={};
  for(const key of new Set([...Object.keys(server),...Object.keys(local)])){
   if(!(key in local)&&key in base)continue;
   result[key]=reconcileSaved(server[key],base[key],local[key]);
  }
  return result;
 }
 return local;
}
