import { v } from 'convex/values';
import { query } from './_generated/server.js';
import { readRecord } from './businessRecords.js';
import { checkRead } from './domainRuntime.js';
import { boundedString } from '../shared/port.js';
import { projectRecord } from '../shared/projections.js';
import { projectionReader } from './projectionStore.js';
import { projectionArgs, projectionResult } from './projectionValidators.js';

/** Parent app supplies authenticated tenant. Time-based values refresh when this query runs. */
export const get = query({
  args: { tenantId: v.string(), ...projectionArgs },
  returns: projectionResult,
  handler: async (ctx, args) => {
    checkRead(args.tenantId);
    boundedString(args.identifier, 'INVALID_IDENTIFIER');
    const record = await readRecord(ctx, args.tenantId, args.blueprint, args.identifier);
    if (!record) return null;
    return projectRecord(record, projectionReader(ctx, args.tenantId), args.asOf ?? Date.now());
  },
});
