import type { MetadataRoute } from 'next';
import { marketingOrigin } from '../lib/product-seo';
export default function robots():MetadataRoute.Robots {
 const origin=marketingOrigin();
 // Product page meta controls noindex when unconfigured. Preserve public journal
 // crawling; never enumerate tenant content or treat robots as access control.
 return {rules:{userAgent:'*',allow:'/',disallow:'/api/'},...(origin?{sitemap:origin+'/sitemap.xml'}:{})};
}
