import { ArrowRight } from 'lucide-react';
import { buttonVariants } from '@painter-os-bts/ui/components/button';

/** Navigation keeps native link semantics while reusing the shared button styling. */
export default function ActionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <a href={href} className={buttonVariants({ className: 'product-button' })}>{children}<ArrowRight size={16} aria-hidden="true"/></a>;
}
