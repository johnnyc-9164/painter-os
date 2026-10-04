/** Hand-authored runtime bindings, NOT codegen. Data model is inferred from schema. */
import { anyApi, componentsGeneric, queryGeneric, mutationGeneric, type DataModelFromSchemaDefinition, type QueryBuilder, type MutationBuilder, type SystemTableNames, type TableNamesInDataModel } from 'convex/server';
import type { GenericId } from 'convex/values';
import type { ComponentApi as BetterAuthApi } from '@convex-dev/better-auth/_generated/component.js';
import type { ComponentApi as ContractorApi } from '../../contractor-os-core/src/component/_generated/component';
import schema from './schema';
export type DataModel = DataModelFromSchemaDefinition<typeof schema>;
export type Id<T extends TableNamesInDataModel<DataModel> | SystemTableNames> = GenericId<T>;
export const query = queryGeneric as QueryBuilder<DataModel,'public'>;
export const mutation = mutationGeneric as MutationBuilder<DataModel,'public'>;
export const api = anyApi;
export const components = componentsGeneric() as unknown as { betterAuth: BetterAuthApi; contractorOs: ContractorApi };
