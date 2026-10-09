import { Paintbrush } from 'lucide-react';
import ActionLink from './action-link';
export default function SiteNav({adminOrigin}:{adminOrigin:string|null}){
 return <header className="product-nav product-container" data-workspace={adminOrigin ? 'true' : 'false'}><a href="/" className="product-brand"><span className="product-brand-mark" aria-hidden="true"><Paintbrush size={21}/></span>Painter OS</a><nav aria-label="Product navigation"><a href="/product">Product</a><a href="/workflow">How it works</a><a href="/resources">Resources</a><a href="/workspace-options">Your workspace</a></nav><div className="product-nav-actions">{adminOrigin&&<a className="product-signin" href={adminOrigin}>Sign in</a>}<ActionLink href={adminOrigin||'/product'}>{adminOrigin?'Open workspace':'Explore product'}</ActionLink></div></header>;
}
