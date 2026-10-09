import { readPublicIntake } from '@painter-os-bts/public-content/intake';
export const readCompanyIntake = (workspaceId: string) => readPublicIntake(process.env.NEXT_PUBLIC_CONVEX_URL, workspaceId);
