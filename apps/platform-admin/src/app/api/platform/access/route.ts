import { platformAccessResponse } from '@painter-os-bts/platform/http';
import { platformReads } from '@painter-os-bts/platform/server';
export const runtime = 'nodejs';
export async function GET() { return platformAccessResponse(platformReads); }
