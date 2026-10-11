import { NextRequest } from 'next/server';
import { error, reply } from '@/lib/http';
import { localEnabled } from '@/lib/local-runtime';
import { contactIntakePreview } from '@/lib/contact-intake-server';
import { decodeContactPreview } from '@/lib/contact-intake-http';
/** Read-only. Membership/role denials surface as 403, matching the settings route. */
const fail = (e: unknown) => e instanceof Error && /WORKSPACE_MEMBERSHIP_REQUIRED/.test(e.message) ? reply({error: 'FORBIDDEN'}, 403) : error(e);
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    if (localEnabled()) return reply({error: 'CONTACT_INTAKE_LOCAL_UNAVAILABLE'}, 503);
    if ([...request.nextUrl.searchParams.keys()].some(key => key !== 'workspaceId')) throw new Error('INVALID_CONTACT_CONFIG_REQUEST');
    const workspaceId = request.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId || workspaceId.length > 200) throw new Error('INVALID_CONTACT_CONFIG_REQUEST');
    return reply(decodeContactPreview(await contactIntakePreview(workspaceId)));
  } catch (e) { return fail(e); }
}
