import {localEnabled} from '@/lib/local-runtime';
import {InvitationAccount} from '@/components/invitation-account';
export default function JoinPage(){return <InvitationAccount local={localEnabled()}/>;}
