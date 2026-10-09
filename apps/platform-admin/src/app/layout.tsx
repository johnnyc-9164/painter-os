import type { Metadata } from 'next';
import './styles.css';
export const metadata: Metadata = { title: 'Painter OS | Platform', robots: { index: false, follow: false } };
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
