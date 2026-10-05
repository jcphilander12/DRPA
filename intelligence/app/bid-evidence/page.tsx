import {requireChatGPTUser} from '../chatgpt-auth';
import FeedPanel from './panel';
export const dynamic='force-dynamic';
export default async function Page(){await requireChatGPTUser('/bid-evidence');return <FeedPanel/>;}
