import {env} from 'cloudflare:workers';
import {getChatGPTUser,chatGPTSignInPath} from './chatgpt-auth';
import Workbench from './workbench';
export const dynamic='force-dynamic';
export default async function Page(){const user=await getChatGPTUser();if(!user){const config=env as unknown as {AUTH_MODE?:string};return <main className="boot"><div className="monogram">D</div><h1>Private Bid Workbench</h1><p>{config.AUTH_MODE?'Open this workbench through your approved account.':'The account connection has not been configured. Ask the administrator to complete setup.'}</p>{config.AUTH_MODE==='sites'&&<a className="btn primary" href={chatGPTSignInPath('/')} target="_top">Sign in with ChatGPT</a>}</main>;}return <Workbench/>;}
