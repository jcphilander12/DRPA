import {createRemoteJWKSet,jwtVerify,type JWTVerifyGetKey} from 'jose';
const keySets=new Map<string,ReturnType<typeof createRemoteJWKSet>>();
export async function verifyAccessToken(token:string,issuer:string,audience:string,keys?:JWTVerifyGetKey){
 const url=new URL(issuer);if(url.protocol!=='https:'||!url.hostname.endsWith('.cloudflareaccess.com')||url.username||url.password||url.pathname!=='/'||url.search||url.hash||!audience.trim())throw new Error('Cloudflare Access issuer/audience configuration is invalid.');
 const canonical=url.origin;if(!keys){if(!keySets.has(canonical))keySets.set(canonical,createRemoteJWKSet(new URL(canonical+'/cdn-cgi/access/certs')));keys=keySets.get(canonical)!;}
 const {payload}=await jwtVerify(token,keys,{issuer:canonical,audience,algorithms:['RS256'],requiredClaims:['exp','iat','sub','email']});
 if(typeof payload.email!=='string'||!payload.email.trim()||typeof payload.sub!=='string'||!payload.sub)throw new Error('A named user session is required.');
 return {userId:'access:'+payload.sub,email:payload.email.trim(),fullName:typeof payload.name==='string'&&payload.name?payload.name:null};
}
