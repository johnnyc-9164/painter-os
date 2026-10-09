import type { Metadata } from 'next';
export const existingMarketingOrigin='https://painter-os-marketing.vercel.app';
export function marketingOrigin(value=process.env.MARKETING_SITE_URL):string|null {
 if(value===undefined||value==='')return null;
 if(value!==existingMarketingOrigin&&value!==existingMarketingOrigin+'/')throw new Error('INVALID_MARKETING_SITE_URL');
 return existingMarketingOrigin;
}
export function productMetadata(path:string,title:string,description:string):Metadata {
 const origin=marketingOrigin();
 return {title,description,robots:{index:!!origin,follow:true},...(origin?{alternates:{canonical:origin+path},openGraph:{type:'website',siteName:'Painter OS',title,description,url:origin+path},twitter:{card:'summary',title,description}}:{})};
}
