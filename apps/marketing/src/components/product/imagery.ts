export type ProductImage = { src: string; alt: string; width: number; height: number };
/** Locally materialized, inspected decorative scenes. See the asset provenance receipt. */
export const productImagery: { hero: ProductImage | null; dashboard: ProductImage | null; story: ProductImage | null } = {
  hero: { src: '/images/product/painter-hero-v2.webp', alt: '', width: 1536, height: 1024 },
  dashboard: null,
  story: { src: '/images/product/house-van.webp', alt: 'Illustrative freshly painted home with an unbranded work van in the driveway', width: 1536, height: 1024 },
};
