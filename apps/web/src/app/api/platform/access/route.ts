import { platformAccessResponse } from '@/lib/platform-http';
import { platformReads } from '@/lib/platform-server';
export const runtime = 'nodejs';
export async function GET() { return platformAccessResponse(platformReads); }
