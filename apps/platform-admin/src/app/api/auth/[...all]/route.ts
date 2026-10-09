import { getConvexBridge } from '@painter-os-bts/cloud-session/server';
import { platformSessionResponse } from '@painter-os-bts/cloud-session/platform-auth';
export const runtime = 'nodejs';
export async function GET(request: Request) { return platformSessionResponse(request, getConvexBridge, process.env.PLATFORM_APP_URL); }
export async function POST(request: Request) { return platformSessionResponse(request, getConvexBridge, process.env.PLATFORM_APP_URL); }
