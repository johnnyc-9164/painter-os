import { Bell, CalendarDays, Check, ClipboardCheck, FileText, Home, Paintbrush, Receipt, Search, Settings, Users } from 'lucide-react';

const navigation = [
  { label: 'Overview', icon: Home }, { label: 'Leads', icon: Users },
  { label: 'Estimates', icon: FileText }, { label: 'Projects', icon: Paintbrush },
  { label: 'Schedule', icon: CalendarDays }, { label: 'Invoices', icon: Receipt },
  { label: 'Crew', icon: Users }, { label: 'Settings', icon: Settings },
];
const activity = [
  { icon: Users, title: 'A new conversation', detail: 'Exterior painting · New lead', time: '12 min', tone: 'blue' },
  { icon: FileText, title: 'Estimate prepared', detail: 'Kitchen refresh · Draft estimate', time: '1 hr', tone: 'teal' },
  { icon: ClipboardCheck, title: 'Walkthrough recorded', detail: 'Living room · Field checklist', time: '3 hr', tone: 'green' },
  { icon: Receipt, title: 'Invoice organized', detail: 'Exterior project · Ready to review', time: '5 hr', tone: 'green' },
];

/** Marketing illustration, never a live business snapshot or an interactive application. */
export default function WorkspacePreview() {
  return <figure className="product-preview" aria-label="Illustration of a connected painting workspace with example data">
    <div className="product-preview-window" aria-hidden="true">
      <div className="product-preview-sidebar">
        <div className="product-preview-brand"><span><Paintbrush size={12}/></span>Painter OS</div>
        <div className="product-preview-nav">{navigation.map(({ label, icon: Icon }, index) => <div key={label} className={index === 0 ? 'is-selected' : undefined}><Icon size={12}/>{label}</div>)}</div>
        <span className="product-preview-sidebar-note">Everything, together.</span>
      </div>
      <div className="product-preview-main">
        <div className="product-preview-topbar"><span className="product-preview-search"><Search size={11}/>Your work, in one place</span><Bell size={12}/><span className="product-preview-avatar">PO</span></div>
        <div className="product-preview-content">
          <div className="product-preview-greeting"><div><strong>A clearer day starts here.</strong><span>Your painting business at a glance.</span></div><span className="product-preview-sample">EXAMPLE</span></div>
          <div className="product-preview-metrics">
            {[['Open leads', '24', 'Next conversations'], ['Estimates', '18', 'Ready for follow-up'], ['Active jobs', '12', 'Work in motion'], ['Invoices', '08', 'Details in one place']].map(([label, value, detail]) => <div key={label}><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>)}
          </div>
          <div className="product-preview-panels">
            <div className="product-preview-activity"><strong>Recent activity</strong>{activity.map(({ icon: Icon, title, detail, time, tone }) => <div className="product-preview-event" key={title}><span className={`product-preview-event-icon tone-${tone}`}><Icon size={13}/></span><div><b>{title}</b><span>{detail}</span></div><small>{time}</small></div>)}</div>
            <div className="product-preview-schedule"><strong>This week</strong><div className="product-preview-chart">{[46, 35, 79, 53, 67, 49, 86].map((height, index) => <div key={index}><i style={{ height: `${height}%` }}/><span>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}</span></div>)}</div><b>Coming up</b><div className="product-preview-appointment"><CalendarDays size={12}/><span><b>Interior walkthrough</b><small>Tomorrow · 8:00 AM</small></span></div><div className="product-preview-appointment"><Check size={12}/><span><b>Exterior preparation</b><small>Wednesday · 9:00 AM</small></span></div></div>
          </div>
        </div>
      </div>
    </div>
    <figcaption>Workspace illustration · Example data</figcaption>
  </figure>;
}
