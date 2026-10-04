import {NextRequest} from 'next/server';
import {localEnabled,membersLocal} from '@/lib/local-runtime';
import {getConvexBridge} from '@/lib/auth-server';
import {api} from '@painter-os-bts/backend/convex/runtime';
import {actor,error,reply} from '@/lib/http';
export async function GET(request:NextRequest){try{if(localEnabled())return reply(membersLocal(actor(request)));return reply(await getConvexBridge().fetchAuthQuery(api.painter.members,{}));}catch(e){return error(e);}}
