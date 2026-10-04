import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire} from 'node:module';
// The web package is CommonJS for tsx; require supports both its transform and Node24 TS.
const {mapHttpError}=createRequire(import.meta.url)('../apps/web/src/lib/http-error.ts') as typeof import('../apps/web/src/lib/http-error.ts');
const wrapped=(code:string)=>new Error(`[CONVEX Q(painter:members)] [Request ID: abc123] Server Error\nUncaught Error: ${code}\n    at handler (painter.ts:20:1)\nCalled by client`);
test('wrapped authentication and authorization errors retain their status',()=>{
 assert.deepEqual(mapHttpError(wrapped('UNAUTHENTICATED')),{error:'UNAUTHENTICATED',status:401});
 assert.deepEqual(mapHttpError(wrapped('FORBIDDEN')),{error:'FORBIDDEN',status:403});
});
test('configuration failure remains service unavailable, never unauthenticated',()=>{
 assert.deepEqual(mapHttpError(new Error('CONVEX_DEPLOYMENT_NOT_CONFIGURED')),{error:'CONVEX_DEPLOYMENT_NOT_CONFIGURED',status:503});
 assert.deepEqual(mapHttpError(wrapped('AUTH_BACKEND_NOT_CONFIGURED')),{error:'AUTH_BACKEND_NOT_CONFIGURED',status:503});
});
test('existing validation and conflict codes and safe non-error fallback remain compatible',()=>{
 assert.deepEqual(mapHttpError(new Error('UNKNOWN_FIELD:email')),{error:'UNKNOWN_FIELD:email',status:400});
 assert.deepEqual(mapHttpError(wrapped('REVISION_CONFLICT')),{error:'REVISION_CONFLICT',status:409});
 assert.deepEqual(mapHttpError(null),{error:'INTERNAL_ERROR',status:400});
});
test('wrapper metadata and prose cannot impersonate an auth failure',()=>{
 assert.deepEqual(mapHttpError(new Error('[Request ID: UNAUTHENTICATED] transport failed')),{error:'INTERNAL_ERROR',status:400});
 assert.deepEqual(mapHttpError(new Error('Cannot fetch UNAUTHENTICATED service')),{error:'INTERNAL_ERROR',status:400});
});
test('existing invite and tenant denials remain denied',()=>{
 assert.deepEqual(mapHttpError(wrapped('OWNER_REQUIRED')),{error:'OWNER_REQUIRED',status:403});
 assert.deepEqual(mapHttpError(wrapped('EMAIL_VERIFICATION_REQUIRED')),{error:'EMAIL_VERIFICATION_REQUIRED',status:400});
 assert.deepEqual(mapHttpError(wrapped('INVALID_OR_EXPIRED_INVITE')),{error:'INVALID_OR_EXPIRED_INVITE',status:404});
});
test('untrusted field details do not change the application status',()=>{
 for(const detail of ['UNAUTHENTICATED','FORBIDDEN','CONVEX_DEPLOYMENT_NOT_CONFIGURED','REVISION_CONFLICT']){
  const error=`UNKNOWN_FIELD:${detail}`;
  assert.deepEqual(mapHttpError(new Error(error)),{error,status:400});
  assert.deepEqual(mapHttpError(wrapped(error)),{error,status:400});
 }
});
