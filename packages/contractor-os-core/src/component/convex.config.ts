import { defineComponent } from 'convex/server';
import { v } from 'convex/values';

/**
 * Runtime mode is optional metadata, not an authorization or business-policy input.
 * Component functions read it through the generated `env` object inside handlers.
 */
export default defineComponent('contractorOs', {
  env: {
    MODE: v.optional(v.union(
      v.literal('development'),
      v.literal('test'),
      v.literal('production'),
    )),
  },
});
