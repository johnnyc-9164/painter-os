import { test, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CompanyWebsite } from '../packages/ui/src/components/company-website';
import type { CompanyWebsiteContent, WebsiteResolvedMedia } from '../packages/domain/src/company-website';
const content: CompanyWebsiteContent = {template:'studio',companyName:'Fixture painting company',tagline:'Owner-authored tagline',hero:{heading:'Actual authored headline <script>text</script>',summary:'Owner-authored introduction'},gallery:[],services:[{id:'service',title:'Authored service',description:'Owner supplied scope'}],projects:[],testimonials:[{id:'review',quote:'An owner-curated quote',attribution:'Named source',rating:4}],pricing:[{id:'price',title:'Authored package',description:'Informational pricing',price:{mode:'from',amountMinor:175000,currency:'USD',unit:'per project',qualifier:'Owner-written scope conditions'}}],contacts:{phone:'+1 555 010 0200',email:'company@example.test',address:{lines:['Owner-supplied address'],city:'Authored city'},serviceAreas:['Authored area'],hours:[{id:'hours',label:'Weekdays',value:'Owner-supplied hours'}]},blogEnabled:true};
const render=(value=content,media:WebsiteResolvedMedia[]=[])=>renderToStaticMarkup(createElement(CompanyWebsite,{content:value,media,workspaceId:'fixture',blog:[{id:'blog',title:'Existing article',slug:'article',excerpt:'Published blog excerpt'}]}));
test('all three compositions retain identical authored content and real shared Button utility classes',()=>{
for(const template of ['studio','editorial','direct'] as const){const html=render({...content,template});expect(html).toContain(`data-template="${template}"`);for(const value of ['Authored service','An owner-curated quote','Named source','From $1,750.00','Owner-written scope conditions','Authored area','Owner-supplied address','Existing article'])expect(html).toContain(value);expect(html).toContain('bg-primary');expect(html).toContain('focus-visible:ring-ring/50');expect(html).toContain('/site/fixture/article');expect(html).toContain('href="/estimate-request/fixture"');expect(html).not.toContain('Verified');}
});
test('missing optional fields never fabricate phone, reviews, prices, services or project photos',()=>{
const minimal={...content,tagline:'',services:[],testimonials:[],pricing:[],contacts:{address:{lines:[]},serviceAreas:[],hours:[]},blogEnabled:false};const html=render(minimal);
for(const absent of ['href="tel:', 'href="mailto:', 'Customer feedback','Pricing information','Our services','Our work','<img','From our journal'])expect(html).not.toContain(absent);
expect(html).toContain('&lt;script&gt;text&lt;/script&gt;');expect(html).not.toContain('<script>text</script>');
expect(render({...minimal,hero:{heading:'',summary:''}})).toContain('id="company-title">Fixture painting company</h1>');
});
test('publication-resolved media is required and alt/focal point/text are escaped',()=>{
const reference={mediaId:'image',alt:'Owned photo <tag>',focalPoint:{x:.25,y:.75}};const rich={...content,hero:{...content.hero,media:reference}};
expect(()=>render(rich)).toThrow('UNRESOLVED_WEBSITE_MEDIA');
const asset={mediaId:'image',url:'/api/company-website-media?workspaceId=fixture&mediaId=image&revision=1',width:1000,height:800,contentType:'image/webp'} as WebsiteResolvedMedia;
const html=render(rich,[asset]);expect(html).toContain('alt="Owned photo &lt;tag&gt;"');expect(html).toContain('object-position:25% 75%');expect(html).not.toContain('Private draft preview');
expect(()=>render(rich,[{...asset,url:'javascript:alert(1)'}])).toThrow('UNRESOLVED_WEBSITE_MEDIA');
});
test('private preview is clearly labeled and contains the same authored sections',()=>{
const html=renderToStaticMarkup(createElement(CompanyWebsite,{content,media:[],workspaceId:'fixture',preview:true}));expect(html).toContain('Private draft preview. This is not the published website.');expect(html).toContain('Authored service');
const unresolved={...content,hero:{...content.hero,media:{mediaId:'absent',alt:'Selected owned image'}}};
expect(renderToStaticMarkup(createElement(CompanyWebsite,{content:unresolved,media:[],workspaceId:'fixture',preview:true}))).toContain('Photo unavailable in this draft preview');
});
