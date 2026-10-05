import Image from 'next/image';
import { ArrowRight, BookOpen, CalendarDays, Check, FileText, HardHat, Paintbrush, Receipt, ShieldCheck, Users } from 'lucide-react';
import { productFeatures } from './content';
import { BrandLogo } from '@painter-os-bts/ui/components/brand-logo';
import ActionLink from './action-link';
import { productImagery } from './imagery';
import WorkspacePreview from './workspace-preview';

const featureIcons = [Users, FileText, Paintbrush, CalendarDays, HardHat, Receipt, BookOpen, ShieldCheck];
const workflow = [
  { label: 'Capture the lead', icon: Users }, { label: 'Build the estimate', icon: FileText },
  { label: 'Plan the job', icon: CalendarDays }, { label: 'Support the crew', icon: HardHat },
  { label: 'Keep the details', icon: Receipt },
];

export default function ProductLanding({ adminOrigin }: { adminOrigin: string | null }) {
  const workspaceAction = adminOrigin ? <ActionLink href={adminOrigin}>Open your workspace</ActionLink> : <ActionLink href="#workflow">Explore the workflow</ActionLink>;
  return <div className="product-landing">
    <a className="product-skip-link" href="#product-title">Skip to content</a>
    <div className="product-masthead">
      {productImagery.hero && <div className="product-hero-background" aria-hidden="true"><Image {...productImagery.hero} alt={productImagery.hero.alt} preload sizes="(max-width: 760px) 100vw, 70vw"/></div>}
      <header className="product-nav product-container">
        <a href="/" className="product-brand" aria-label="Painter OS home"><BrandLogo/></a>
        <nav aria-label="Product navigation"><a href="#features">Product</a><a href="#workflow">How it works</a><a href="#ownership">Your workspace</a></nav>
        <div className="product-nav-actions">{adminOrigin && <a className="product-signin" href={adminOrigin}>Sign in</a>}<ActionLink href={adminOrigin || '#features'}>{adminOrigin ? 'Open workspace' : 'Explore product'}</ActionLink></div>
      </header>
      <section className="product-hero product-container" aria-labelledby="product-title">
        <div className="product-hero-copy">
          <p className="product-eyebrow">BUILT FOR PAINTING PROS</p>
          <h1 id="product-title">Run a smoother,<br/>more organized<br/>painting business.</h1>
          <p>Painter OS brings your leads, estimates, jobs, crews and invoices into one place. Less chasing details. More room for great work.</p>
          <div className="product-actions">{workspaceAction}<a className="product-secondary-button" href="#features"><span><ArrowRight size={12}/></span>See the features</a></div>
          <ul className="product-benefits"><li><Check/>Built for painting contractors</li><li><Check/>Connected office &amp; field</li></ul>
        </div>
        <div className="product-hero-art"><WorkspacePreview/></div>
      </section>
    </div>
    <section className="product-workflow-strip product-container" aria-label="The connected workflow"><p>FROM THE FIRST CONVERSATION TO THE FINAL WALKTHROUGH</p><div>{workflow.map(({ label, icon: Icon }) => <span key={label}><Icon size={25} strokeWidth={1.5}/>{label}</span>)}</div></section>
    <section id="features" className="product-features product-container" aria-labelledby="features-title">
      <div className="product-section-heading"><h2 id="features-title">Everything you need to keep work moving.</h2><p>Connected tools. Clear next steps. A better working day.</p></div>
      <div className="product-feature-grid">{productFeatures.map((feature, index) => { const Icon = featureIcons[index]; return <article key={feature.icon} className={`product-feature${index > 5 ? ' product-feature-violet' : ''}`}><span className="product-feature-icon"><Icon aria-hidden="true" size={25} strokeWidth={2}/></span><h3>{feature.title}</h3><p>{feature.description}</p></article>; })}</div>
    </section>
    <section id="workflow" className="product-story" aria-labelledby="workflow-title">
      <div className="product-story-grid">
        {productImagery.story && <div className="product-story-photo"><Image {...productImagery.story} alt={productImagery.story.alt} sizes="(max-width: 760px) 100vw, 55vw"/><div className="product-story-note"><span className="product-story-note-icon"><Paintbrush size={23}/></span><strong>Great work deserves<br/>a well-run business.</strong><span>Keep the office and the job site connected.</span></div></div>}
        <div className="product-story-copy"><p className="product-eyebrow">BUILT AROUND THE WORK YOU DO.</p><h2 id="workflow-title">More clarity in the office.<br/>More confidence on site.</h2><p>Too many spreadsheets, scattered details and hours spent chasing the next step. Bring your customer conversation, job plan and crew together, so you can focus on the work in front of you.</p><ol className="product-workflow"><li>Plan the work with leads and estimates</li><li>Give your crew a clear schedule and checklist</li><li>Keep completion evidence and invoices together</li></ol><a className="product-text-link" href="#ownership">A workspace that fits your business <ArrowRight size={16} aria-hidden="true"/></a></div>
      </div>
    </section>
    <section className="product-closing" aria-labelledby="closing-title"><div className="product-container"><p className="product-eyebrow">MAKE ROOM FOR YOUR BEST WORK</p><h2 id="closing-title">A smoother day starts with Painter OS.</h2><p>One connected workspace for the business behind the brush.</p><div className="product-actions">{workspaceAction}<a className="product-secondary-button" href="#ownership">Explore workspace options</a></div><ul className="product-benefits"><li><Check/>Clear next steps</li><li><Check/>Connected crews</li><li><Check/>Details in one place</li></ul></div></section>
    <footer className="product-footer product-container">
      <div className="product-footer-top"><a href="/" className="product-brand" aria-label="Painter OS home"><BrandLogo size="sm"/></a><p>Thoughtful software for the people who transform spaces.</p><a href="#features">Explore features <ArrowRight size={14} aria-hidden="true"/></a></div>
      <details id="ownership" className="product-ownership"><summary>Your workspace, your way forward <span>Deployment options</span></summary><div><p>Painter OS is being built for a hosted SaaS workspace and independently operated, customer-owned deployments. Contractor operations and public sites stay distinct from platform administration.</p><p>Hosting setup and ownership handoff require a reviewed deployment plan. Subscription billing and live provider connections are not available through this page.</p></div></details>
    </footer>
  </div>;
}
