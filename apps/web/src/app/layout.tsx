import type { Metadata } from 'next';
import '../index.css';
export const metadata: Metadata = {
 title: 'Painter OS — Business, beautifully run.',
 description: 'The painting business workspace. Leads, estimates, crew scheduling, field execution and financial clarity in one place.',
};
export default function RootLayout({ children }: Readonly<{children:React.ReactNode}>) {
 return <html lang="en"><body>{children}</body></html>;
}
