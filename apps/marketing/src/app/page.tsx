import { publicAdminOrigin } from '@painter-os-bts/backend/published-articles.mjs';
export default function Home() {
  const adminOrigin = publicAdminOrigin(process.env.NEXT_PUBLIC_ADMIN_ORIGIN);
  return <><p className="eyebrow">THOUGHTFUL WORK. BEAUTIFUL SPACES.</p><h1>Better spaces begin with great painting.</h1><p>Ideas and practical guidance from the people who care for every detail.</p>{adminOrigin && <a href={adminOrigin}>Open your workspace →</a>}</>;
}
