import type { MetadataRoute } from 'next';
import { marketingOrigin } from '../lib/product-seo';
import { productRoutes } from '../components/product/pages';
export default function sitemap():MetadataRoute.Sitemap {
 const origin=marketingOrigin();return origin?productRoutes.map(path=>({url:origin+path})):[];
}
