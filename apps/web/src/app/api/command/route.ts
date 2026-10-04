import {NextRequest} from 'next/server';
import type {Command} from '@painter-os-bts/domain/contracts';
import {localEnabled,commandLocal} from '@/lib/local-runtime';
import {commandCloud} from '@/lib/convex-runtime';
import {actor,requireOrigin,body,error,reply} from '@/lib/http';
export const runtime='nodejs';
export async function POST(request:NextRequest){try{requireOrigin(request);const c=await body(request);if(typeof c.action!=='string'||typeof c.requestKey!=='string'||!c.input||typeof c.input!=='object'||Array.isArray(c.input))throw new Error('INVALID_COMMAND');const command=c as unknown as Command;return reply(localEnabled()?commandLocal(actor(request),command):await commandCloud(command));}catch(e){return error(e);}}
