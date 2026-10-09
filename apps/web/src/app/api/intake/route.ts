import { NextRequest } from 'next/server';
import { body, error, reply, requireOrigin } from '@/lib/http';
import { localEnabled } from '@/lib/local-runtime';
import { intakeReads, intakeSave } from '@/lib/intake-server';
import { decodeIntakeWrite, parseIntakeSave } from '@/lib/intake-http';
import { decodeSavedIntake } from '@painter-os-bts/backend/intake-contract';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    if (localEnabled()) return reply({error: 'INTAKE_LOCAL_UNAVAILABLE'}, 503);
    if ([...request.nextUrl.searchParams.keys()].some(key => key !== 'workspaceId')) throw new Error('INVALID_INTAKE_REQUEST');
    const workspaceId = request.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId || workspaceId.length > 200) throw new Error('INVALID_INTAKE_REQUEST');
    return reply({settings: decodeSavedIntake(await intakeReads(workspaceId))});
  } catch (e) { return error(e); }
}
export async function POST(request: NextRequest) {
  try {
    requireOrigin(request);
    const args = parseIntakeSave(await body(request));
    if (localEnabled()) return reply({error: 'INTAKE_LOCAL_UNAVAILABLE'}, 503);
    return reply(decodeIntakeWrite(await intakeSave(args)));
  } catch (e) { return error(e); }
}
