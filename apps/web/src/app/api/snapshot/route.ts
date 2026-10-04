import {NextRequest} from 'next/server';
import {localEnabled,snapshotLocal} from '@/lib/local-runtime';
import {snapshotCloud} from '@/lib/convex-runtime';
import {actor,error,reply} from '@/lib/http';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(request:NextRequest){try{if(localEnabled())return reply(snapshotLocal(actor(request)));const data=await snapshotCloud(request);if(!data.session)return reply({error:'UNAUTHENTICATED'},401);return reply(data);}catch(e){return error(e);}}
