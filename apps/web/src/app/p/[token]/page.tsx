import CustomerPortal from '@/components/customer-portal';
export default async function Page({params}:{params:Promise<{token:string}>}){return <CustomerPortal token={(await params).token}/>;}
