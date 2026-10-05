import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {initialWorkspace} from './seed';
import type {Workspace} from './types';
type Bindings={DB?:D1Database;BUCKET?:R2Bucket;OPENAI_API_KEY?:string;OPENAI_MODEL?:string;MASTER_EMAIL?:string;LOCAL_DEMO?:string;AUTH_MODE?:string;ACCESS_TEAM_DOMAIN?:string;ACCESS_AUD?:string;INTELLIGENCE_FEED_URL?:string;INTELLIGENCE_FEED_KEY?:string;INTELLIGENCE_SITES_TOKEN?:string};
export const runtime=()=>env as unknown as Bindings;
export class ApiError extends Error{constructor(public status:number,message:string){super(message);}}
export function db(){const d=runtime().DB;if(!d)throw new Error('Workspace storage is unavailable');return d;}
export function json(data:unknown,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
export function failed(e:unknown){console.error('bid-workbench request failed',e instanceof ApiError?e.status:e instanceof Error?`${e.name}: ${e.message.slice(0,300)}`:'internal');return json({error:e instanceof ApiError?e.message:'The request could not be completed. Your changes are kept on screen; please try again.'},e instanceof ApiError?e.status:503);}
export async function authenticated(request:Request,mutate=false){
 const user=await getChatGPTUser();
 if(!user)throw new ApiError(401,'Sign in to your private workbench.');
 if(mutate){const origin=request.headers.get('origin');if(!origin||origin!==new URL(request.url).origin)throw new ApiError(403,'This request must come from your workbench.');}
 // Keep an existing email-keyed workspace and its R2 uploads accessible when
 // the dispatcher later starts supplying the stable platform user-id header.
 if(user.userId!==user.legacyUserId){
  const existing=await db().prepare('SELECT owner_id FROM workspaces WHERE owner_id = ?').bind(user.legacyUserId).first<{owner_id:string}>();
  if(existing)return {...user,userId:user.legacyUserId};
 }
 return user;
}
export async function loadWorkspace(ownerId:string):Promise<{workspace:Workspace;revision:number}>{let row=await db().prepare('SELECT body,revision FROM workspaces WHERE owner_id = ?').bind(ownerId).first<{body:string;revision:number}>();if(!row){const w=initialWorkspace();await db().prepare('INSERT OR IGNORE INTO workspaces (owner_id,body,revision,updated_at) VALUES (?,?,1,?)').bind(ownerId,JSON.stringify(w),new Date().toISOString()).run();row=await db().prepare('SELECT body,revision FROM workspaces WHERE owner_id = ?').bind(ownerId).first<{body:string;revision:number}>();}if(!row)throw new Error('Workspace load failed');return {workspace:JSON.parse(row.body),revision:row.revision};}
