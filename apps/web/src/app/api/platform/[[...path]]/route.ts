/** Reserve the API namespace; unknown platform endpoints never render contractor UI. */
function missing() { return Response.json({ state: 'not_found' }, { status: 404, headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } }); }
export const GET = missing;
export const POST = missing;
export const PUT = missing;
export const PATCH = missing;
export const DELETE = missing;
