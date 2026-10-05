import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ProductLanding from '../../../apps/marketing/src/components/product/product-landing';
const adminOrigin = process.argv[2] || null;
process.stdout.write(JSON.stringify({ html: renderToStaticMarkup(createElement(ProductLanding, { adminOrigin })) }));
