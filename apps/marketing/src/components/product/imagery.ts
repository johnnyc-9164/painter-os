export type ProductImage = { src: string; alt: string; width: number; height: number };
/** Activate only after the actual asset payload and its provenance are reviewed. */
export const productImagery: { hero: ProductImage | null; dashboard: ProductImage | null; story: ProductImage | null } = {
  hero: null,
  dashboard: null,
  story: null,
};
