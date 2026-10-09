import test from 'node:test';
import assert from 'node:assert/strict';
import { marketingOrigin,productMetadata,existingMarketingOrigin } from '../apps/marketing/src/lib/product-seo';
import { productPages,productRoutes } from '../apps/marketing/src/components/product/pages';
import sitemap from '../apps/marketing/src/app/sitemap';
import robots from '../apps/marketing/src/app/robots';
test('canonical configuration accepts only the observed existing marketing origin',()=>{
 for(const value of ['',undefined])assert.equal(marketingOrigin(value),null);
 assert.equal(marketingOrigin(existingMarketingOrigin),existingMarketingOrigin);assert.equal(marketingOrigin(existingMarketingOrigin+'/'),existingMarketingOrigin);
 for(const value of ['https://new.example','http://painter-os-marketing.vercel.app','https://user@painter-os-marketing.vercel.app','https://painter-os-marketing.vercel.app/path','https://painter-os-marketing.vercel.app?key=x',' https://painter-os-marketing.vercel.app'])assert.throws(()=>marketingOrigin(value),/INVALID_MARKETING_SITE_URL/);
});
test('product SEO fails closed without canonical configuration and never enumerates tenants',()=>{
 const old=process.env.MARKETING_SITE_URL;delete process.env.MARKETING_SITE_URL;
 try{assert.deepEqual(sitemap(),[]);assert.equal(productMetadata('/product','Product','Description').alternates,undefined);assert.deepEqual(productMetadata('/product','Product','Description').robots,{index:false,follow:true});assert.deepEqual(robots().rules,{userAgent:'*',allow:'/',disallow:'/api/'});
 process.env.MARKETING_SITE_URL=existingMarketingOrigin;
 assert.deepEqual(sitemap().map(row=>row.url),productRoutes.map(path=>existingMarketingOrigin+path));assert.equal(sitemap().length,7);assert.ok(!sitemap().some(row=>row.lastModified));
 for(const page of productPages){const meta=productMetadata(page.path,page.title,page.description);assert.equal(meta.alternates?.canonical,existingMarketingOrigin+page.path);assert.deepEqual(meta.robots,{index:true,follow:true});}
 }finally{if(old===undefined)delete process.env.MARKETING_SITE_URL;else process.env.MARKETING_SITE_URL=old;}
});
test('pages have distinct useful content and internal guide destinations',()=>{
 assert.equal(new Set(productPages.map(p=>p.title)).size,6);assert.equal(new Set(productPages.map(p=>p.description)).size,6);
 for(const page of productPages){assert.ok(page.sections.length>=3);assert.ok(page.sections.every(section=>section.body.length>0));}
 for(const path of ['/resources/estimate-handoff','/resources/job-closeout'])assert.ok(productRoutes.includes(path));
});
