import {context,collaboration,loadShared} from '@/lib/collaboration';
import {failed,json} from '@/lib/server';
export async function GET(request:Request){try{const c=await context(request);const state=await loadShared(c);return json({revision:state.revision,collaboration:await collaboration(c,state.workspace)});}catch(e){return failed(e);}}
