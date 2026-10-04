import { query, env } from './_generated/server.js';
import { componentInfoResult } from './metaValidators.js';
import {
  CONTRACTOR_OS_CAPABILITIES,
  CONTRACTOR_OS_COMPONENT,
  CONTRACTOR_OS_SCHEMA_VERSION,
  CONTRACTOR_OS_VERSION,
} from '../shared/version.js';

/**
 * Instance metadata for host compatibility checks. Authentication remains in the host app.
 * Read typed component env values inside the handler; they are not defined during deployment analysis.
 */
export const info = query({
  args: {},
  returns: componentInfoResult,
  handler: async () => ({
    name: CONTRACTOR_OS_COMPONENT,
    version: CONTRACTOR_OS_VERSION,
    schemaVersion: CONTRACTOR_OS_SCHEMA_VERSION,
    mode: env.MODE ?? null,
    authBoundary: 'host_app' as const,
    idBoundary: 'opaque_strings_outside_component' as const,
    pagination: 'convex_helpers_paginator' as const,
    httpRoutes: 'not_mounted_by_component' as const,
    hostCallbacks: 'not_configured' as const,
    capabilities: [...CONTRACTOR_OS_CAPABILITIES],
  }),
});
