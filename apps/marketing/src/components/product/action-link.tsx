'use client';
import { ArrowUpRight } from 'lucide-react';
import { Button } from '@painter-os-bts/ui/components/button';
export default function ActionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Button nativeButton={false} render={<a href={href}/>} className="product-button">{children}<ArrowUpRight size={16} aria-hidden="true"/></Button>;
}
