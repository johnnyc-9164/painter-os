import type { Metadata } from 'next';
import './styles.css';
export const metadata: Metadata = { title: 'Painting company journals', description: 'Published painting guidance from independent company journals.' };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><header><a href="/">Company journals</a></header><main>{children}</main><footer>Published with Painter OS</footer></body></html>;
}
