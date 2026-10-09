import type { CompanyWebsiteContent, WebsiteMediaReference, WebsiteResolvedMedia } from '@painter-os-bts/domain/company-website';
import { buttonVariants } from './button';

export interface CompanyWebsiteProps {
  content: CompanyWebsiteContent;
  media: WebsiteResolvedMedia[];
  workspaceId: string;
  blog?: {id: string; title: string; slug: string; excerpt: string}[];
  preview?: boolean;
  projectGuidanceEnabled?: boolean;
}
/** Public-safe presentation. Membership, publishing and trusted URL resolution belong to the host. */
export function CompanyWebsite({ content, media, workspaceId, blog = [], preview = false, projectGuidanceEnabled = false }: CompanyWebsiteProps) {
  const base = `/company/${encodeURIComponent(workspaceId)}`;
  const journal = `/site/${encodeURIComponent(workspaceId)}`;
  function photo(reference: WebsiteMediaReference, className?: string, eager = false) {
    const asset = media.find(item => item.mediaId === reference.mediaId);
    if (!asset && preview) return <div className="cw-missing-media">Photo unavailable in this draft preview. Save and refresh to resolve its media.</div>;
    if (!asset || !/^(?:https:\/\/|\/[^/])/.test(asset.url)) throw new Error('UNRESOLVED_WEBSITE_MEDIA');
    return <img className={className} src={asset.url} alt={reference.alt} width={asset.width} height={asset.height}
      style={reference.focalPoint ? {objectPosition:`${reference.focalPoint.x*100}% ${reference.focalPoint.y*100}%`} : undefined} loading={eager ? "eager" : "lazy"} fetchPriority={eager ? "high" : undefined}/>;
  }
  const address = content.contacts.address;
  const addressLines = address ? [...address.lines,address.city,address.region,address.postalCode,address.country].filter(value => Boolean(value?.trim())) : [];
  const serviceAreas = content.contacts.serviceAreas.filter(area => area.trim());
  const hours = content.contacts.hours.filter(hour => hour.label.trim() || hour.value.trim());
  const hasContact = Boolean(content.contacts.phone || content.contacts.email || addressLines.length || serviceAreas.length || hours.length);
  const action = content.contacts.phone ? {href:`tel:${content.contacts.phone.replaceAll(' ','')}`,label:'Call to discuss your project'}
    : content.contacts.email ? {href:`mailto:${encodeURIComponent(content.contacts.email)}`,label:'Contact our team'}
    : hasContact ? {href:'#contact',label:'Contact information'} : null;
  const link = (href: string, label: string) => <a className={`${buttonVariants({size:'lg'})} cw-button`} href={href}>{label}</a>;
  const services = content.services.length > 0 && <section id="services" className="cw-section"><div className="cw-container"><div className="cw-section-heading"><h2>Our services</h2></div><div className="cw-service-grid">{content.services.map(service=><article className="cw-service" key={service.id}><h3>{service.title}</h3><p>{service.description}</p></article>)}</div></div></section>;
  const projects = (content.projects.length > 0 || content.gallery.length > 0) && <section id="projects" className="cw-section cw-projects"><div className="cw-container"><div className="cw-section-heading"><h2>Our work</h2></div><div className="cw-project-grid">{content.projects.map(project=><article className="cw-project" key={project.id}>{project.media[0]&&<figure className="cw-project-photo">{photo(project.media[0])}</figure>}<h3>{project.title}</h3><p>{project.summary}</p>{project.media.length>1&&<div className="cw-gallery">{project.media.slice(1).map(reference=><figure key={reference.mediaId}>{photo(reference)}</figure>)}</div>}</article>)}</div>{content.gallery.length>0&&<div className="cw-gallery">{content.gallery.map(reference=><figure key={reference.mediaId}>{photo(reference)}</figure>)}</div>}</div></section>;
  const reviews = content.testimonials.length > 0 && <section className="cw-section"><div className="cw-container"><div className="cw-section-heading"><h2>Customer feedback</h2></div><div className="cw-reviews">{content.testimonials.map(review=><figure className="cw-review" key={review.id}><blockquote>{review.quote}</blockquote><figcaption>{review.attribution}{review.rating!==undefined&&<span> · {review.rating}/5, recorded by the company</span>}</figcaption></figure>)}</div></div></section>;
  function priceText(price: CompanyWebsiteContent['pricing'][number]['price']) {
    if (price.mode === 'descriptive') return price.label;
    const formatter = new Intl.NumberFormat('en',{style:'currency',currency:price.currency});
    const money = (amount: number) => formatter.format(amount / 10 ** (formatter.resolvedOptions().maximumFractionDigits ?? 2));
    if (price.mode === 'range') return `${money(price.minMinor)}–${money(price.maxMinor)}`;
    return `${price.mode === 'from' ? 'From ' : ''}${money(price.amountMinor)}`;
  }
  const pricing = content.pricing.length > 0 && <section id="pricing" className="cw-section cw-pricing"><div className="cw-container"><div className="cw-section-heading"><h2>Pricing information</h2></div><div className="cw-price-grid">{content.pricing.map(item=><article className="cw-price" key={item.id}><h3>{item.title}</h3><p>{item.description}</p><p className="cw-price-value">{priceText(item.price)}</p>{item.price.mode!=='descriptive'&&<>{item.price.unit&&<p>{item.price.unit}</p>}{item.price.qualifier&&<p>{item.price.qualifier}</p>}</>}</article>)}</div></div></section>;
  return <div className="company-website" data-template={content.template}>
    {preview&&<p className="cw-preview" role="status">Private draft preview. This is not the published website.</p>}
    <a className="cw-skip" href="#company-title">Skip to content</a>
    <header className="cw-nav cw-container"><a className="cw-brand" href={base} aria-label={content.companyName}>{content.logo ? photo(content.logo, undefined, true) : content.companyName}</a><nav aria-label="Company navigation">{content.services.length>0&&<a href="#services">Services</a>}{(content.projects.length>0||content.gallery.length>0)&&<a href="#projects">Our work</a>}{content.pricing.length>0&&<a href="#pricing">Pricing</a>}{content.blogEnabled&&<a href={journal}>Journal</a>}{hasContact&&<a href="#contact">Contact</a>}</nav></header>
    <section className="cw-hero"><div className="cw-container cw-hero-grid"><div className="cw-hero-copy">{content.tagline&&<p className="cw-tagline">{content.tagline}</p>}<h1 id="company-title">{content.hero.heading.trim() || content.companyName}</h1>{content.hero.summary&&<p>{content.hero.summary}</p>}<div className="cw-actions">{action&&link(action.href,action.label)}{projectGuidanceEnabled&&<a href={`/estimate-request/${encodeURIComponent(workspaceId)}`}>Explore your painting project</a>}</div></div>{content.hero.media&&<figure className="cw-hero-photo">{photo(content.hero.media, undefined, true)}</figure>}</div></section>
    {content.template==='editorial'?<>{projects}{services}</>:<>{services}{content.template==='direct'&&pricing}{projects}</>}{reviews}{content.template!=='direct'&&pricing}
    {content.blogEnabled&&blog.length>0&&<section className="cw-section"><div className="cw-container"><div className="cw-section-heading"><h2>From our journal</h2><a href={journal}>All articles</a></div><div className="cw-blog-grid">{blog.map(article=><article className="cw-blog-item" key={article.id}><h3>{article.title}</h3><p>{article.excerpt}</p><a href={`${journal}/${encodeURIComponent(article.slug)}`}>Read article</a></article>)}</div></div></section>}
    {hasContact&&<section id="contact" className="cw-section cw-contact"><div className="cw-container cw-contact-grid"><div><h2>Let’s talk about your project.</h2>{action&&<div className="cw-actions">{link(action.href,action.label)}</div>}</div><div className="cw-contact-details">{content.contacts.phone&&<div><h3>Phone</h3><p><a href={`tel:${content.contacts.phone.replaceAll(' ','')}`}>{content.contacts.phone}</a></p></div>}{content.contacts.email&&<div><h3>Email</h3><p><a href={`mailto:${encodeURIComponent(content.contacts.email)}`}>{content.contacts.email}</a></p></div>}{addressLines.length>0&&<div><h3>Address</h3><address>{addressLines.join('\n')}</address></div>}{serviceAreas.length>0&&<div><h3>Service areas</h3><ul>{serviceAreas.map(area=><li key={area}>{area}</li>)}</ul></div>}{hours.length>0&&<div><h3>Hours</h3>{hours.map(hour=><p key={hour.id}>{hour.label}: {hour.value}</p>)}</div>}</div></div></section>}
    <footer className="cw-footer cw-container"><span>{content.companyName}</span><span>Published with Painter OS</span></footer>
  </div>;
}
