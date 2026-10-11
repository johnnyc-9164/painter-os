import type {ReactNode} from 'react';
import './styles.css';
export const metadata={title:'Painter OS · Local run viewer',robots:{index:false,follow:false}};
export default function Layout({children}:{children:ReactNode}){return <html lang="en"><body><a className="skip-link" href="#run-view">Skip to run view</a>{children}</body></html>;}
