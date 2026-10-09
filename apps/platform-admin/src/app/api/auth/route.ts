import { getConvexBridge } from '@painter-os-bts/cloud-session/server';
import { platformAuthResponse } from '@painter-os-bts/cloud-session/platform-auth';
export const runtime = 'nodejs';
export async function POST(request: Request) { return platformAuthResponse(request, getConvexBridge, process.env.PLATFORM_APP_URL); }
