import { platformActivityResponse } from '@/lib/platform-http';
import { platformReads } from '@/lib/platform-server';
export const runtime = 'nodejs';
export async function GET(request: Request) { return platformActivityResponse(request, platformReads); }
