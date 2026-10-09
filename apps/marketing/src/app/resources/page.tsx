import '../product.css';
import ProductPage from '../../components/product/product-page';
import { productPages } from '../../components/product/pages';
import { productMetadata } from '../../lib/product-seo';
const page=productPages.find(page=>page.path==='/resources')!;
export const metadata=productMetadata(page.path,page.title,page.description);
export default function Page(){return <ProductPage page={page}/>;}
