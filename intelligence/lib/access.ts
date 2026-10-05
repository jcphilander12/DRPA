import { getChatGPTUser } from "../app/chatgpt-auth";
import { allowedMetrics, visibleModules, scopeSites, ROLES, TENANTS, type TenantId } from "./metrics";
import { customMetrics } from "./records";
export const dev=(import.meta as unknown as {env?:{DEV?:boolean}}).env?.DEV===true;
export async function requestScope(request:Request){
 const u=await getChatGPTUser();if(!u&&!dev)throw new Error("AUTH");const url=new URL(request.url),tenant=url.searchParams.get("tenant")||"drpa",role=url.searchParams.get("role")||"board";
 if(!Object.hasOwn(TENANTS,tenant)||!ROLES.some(r=>r.id===role))throw new Error("Invalid preview scope.");const t=tenant as TenantId,sites=scopeSites(t,role),modules=visibleModules(t,role);
 const metrics=allowedMetrics(t,role,await customMetrics(t)).filter(m=>!m.sites?.length||m.sites.some(x=>sites.includes(x)));
 return {tenant:t,role,sites,modules,metrics,url,user:{id:u?.userId||"local-demo-owner",name:u?.displayName||"Local demo owner"}};
}
export function requireModule(s:Awaited<ReturnType<typeof requestScope>>,module:string){if(!s.modules.includes(module))throw new Error("ACCESS");}
export function sameOrigin(request:Request){const url=new URL(request.url),origin=request.headers.get("origin");if(origin&&origin!==url.origin&&origin!=="https://drpa-intelligence-engine.sa33dc.chatgpt.site"&&!(dev&&origin==="http://terminal.local:4173"))throw new Error("ACCESS");}
export function apiFailure(e:unknown){const m=e instanceof Error?e.message:"The request failed.";return Response.json({error:m==="AUTH"?"Sign in to access this private workspace.":m==="ACCESS"?"This action is outside your permitted preview scope.":m},{status:m==="AUTH"?401:m==="ACCESS"?403:400,headers:{"Cache-Control":"no-store"}});}
