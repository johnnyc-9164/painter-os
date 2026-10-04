import { v } from 'convex/values';

export const runtimeMode = v.union(
  v.literal('development'),
  v.literal('test'),
  v.literal('production'),
);

export const componentInfoResult = v.object({
  name: v.literal('contractorOs'),
  version: v.string(),
  schemaVersion: v.string(),
  mode: v.union(runtimeMode, v.null()),
  authBoundary: v.literal('host_app'),
  idBoundary: v.literal('opaque_strings_outside_component'),
  pagination: v.literal('convex_helpers_paginator'),
  httpRoutes: v.literal('not_mounted_by_component'),
  hostCallbacks: v.literal('not_configured'),
  capabilities: v.array(v.string()),
});
