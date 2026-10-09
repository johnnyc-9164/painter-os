import {localEnabled} from '@/lib/local-runtime';
import Invitation from '@/components/invitation';
export default async function Page({params}:{params:Promise<{token:string}>}){return <Invitation local={localEnabled()} token={(await params).token}/>;}
