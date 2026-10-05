import './product.css';
import type { Metadata } from 'next';
import { publicAdminOrigin } from '@painter-os-bts/backend/published-articles.mjs';
import ProductLanding from '../components/product/product-landing';
export const metadata: Metadata = { title: 'Painter OS | A clearer workflow for your painting business', description: 'Connect leads, estimates, projects, crew schedules, field evidence and invoices in your painting workspace.' };
export default function Home() {
  return <ProductLanding adminOrigin={publicAdminOrigin(process.env.NEXT_PUBLIC_ADMIN_ORIGIN)}/>;
}
