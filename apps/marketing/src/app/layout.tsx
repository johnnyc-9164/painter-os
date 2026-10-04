import type { Metadata } from 'next';
import './styles.css';
export const metadata: Metadata = { title: 'Painter OS — Craftsmanship, shared', description: 'Painting ideas and practical guidance from our crew.' };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><header><a href="/">Painter OS</a><span>Craftsmanship, shared</span></header><main>{children}</main><footer>Published with Painter OS</footer></body></html>;
}
