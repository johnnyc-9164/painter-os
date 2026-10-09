import { v } from 'convex/values';
export const intakeSettingsFields = {
  enabled: v.boolean(),
  servicePostalCodes: v.array(v.string()),
  supportedProjectTypes: v.array(v.union(v.literal('interior'), v.literal('exterior'), v.literal('commercial'))),
  consentText: v.string(),
};
export const intakeSettingsValidator = v.object(intakeSettingsFields);
