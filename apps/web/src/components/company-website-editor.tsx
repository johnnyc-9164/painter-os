'use client';
import {useEffect, useMemo, useRef, useState} from 'react';
import type {CompanyWebsiteContent, WebsiteMediaReference, WebsitePrice} from '@painter-os-bts/domain/company-website';
import {WEBSITE_MEDIA_MAX_BYTES, WEBSITE_CURRENCIES} from '@painter-os-bts/domain/company-website';
import {Button} from '@painter-os-bts/ui/components/button';
import {Input} from '@painter-os-bts/ui/components/input';
import {Textarea} from '@painter-os-bts/ui/components/textarea';
import {Label} from '@painter-os-bts/ui/components/label';
import {Checkbox} from '@painter-os-bts/ui/components/checkbox';
import {CompanyWebsite} from '@painter-os-bts/ui/components/company-website';
import {companyWebsiteTemplates} from '@painter-os-bts/ui/lib/company-website-templates';
import {createIntentKeys} from '../lib/command-intent';
import {createWebsiteEditorTransport, WebsiteTransportError, type WebsiteEditorData, type WebsiteEditorTransport} from '../lib/company-website-http';
import '@painter-os-bts/ui/company-website.css';
import './company-website-editor.css';

const sections = ['Brand', 'Services', 'Projects', 'Reviews', 'Pricing', 'Contact', 'Blog', 'Template'] as const;
type Section = typeof sections[number];
function Field({label, value, onChange, multiline = false, type = 'text', hint}: {label: string; value: string; onChange(value: string): void; multiline?: boolean; type?: string; hint?: string}) {
  return <Label className="website-field"><span>{label}</span>{multiline ? <Textarea aria-label={label} value={value} onChange={event => onChange(event.target.value)} rows={4}/> : <Input aria-label={label} type={type} step={type === 'number' ? (label.includes('rating') ? '1' : '0.01') : undefined} min={type === 'number' ? '0' : undefined} value={value} onChange={event => onChange(event.target.value)}/>} {hint && <small>{hint}</small>}</Label>;
}
const clone = <T,>(value: T): T => structuredClone(value);
const freshId = () => crypto.randomUUID();
const equal = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Parent keys this editor by verified actor/workspace. No draft or file is persisted in browser storage. */
export function CompanyWebsiteEditor({workspaceId, actorId, role, cloud, transport: suppliedTransport}: {workspaceId: string; actorId: string; role: string; cloud: boolean; transport?: WebsiteEditorTransport}) {
  const transport = useMemo(() => suppliedTransport ?? createWebsiteEditorTransport(actorId), [suppliedTransport, actorId]);
  const [data, setData] = useState<WebsiteEditorData | null>(null), [draft, setDraft] = useState<CompanyWebsiteContent | null>(null);
  const [section, setSection] = useState<Section>('Brand'), [busy, setBusy] = useState(false), [loading, setLoading] = useState(true);
  const [error, setError] = useState(''), [notice, setNotice] = useState(''), [preview, setPreview] = useState(false), [confirm, setConfirm] = useState<'publish' | 'unpublish' | 'reload' | null>(null);
  const [upload, setUpload] = useState<{file: File; requestKey: string; unknown: boolean; retryAllowed?: boolean} | null>(null);
  const generation = useRef(0);
  const lock = useRef(false), live = useRef(true), abort = useRef(new AbortController()), intents = useRef(createIntentKeys());
  const allowed = role === 'owner' || role === 'office_admin';
  const changed = !!data && !!draft && !equal(data.state.draft, draft);
  function failure(reason: unknown, fallback: string) {
    if (reason instanceof WebsiteTransportError && (reason.kind === 'signed_out' || reason.kind === 'denied')) {
      generation.current++;
      setLoading(false); setData(null); setDraft(null); setUpload(null); setPreview(false); setConfirm(null); intents.current = createIntentKeys();
    }
    setError(reason instanceof Error ? reason.message : fallback);
  }
  useEffect(() => {
    live.current = true;
    const controller = new AbortController(); abort.current = controller; const epoch = generation.current;
    if (cloud && allowed) {
      void transport.load(workspaceId, controller.signal).then(value => {if (live.current && !controller.signal.aborted && epoch === generation.current) {setData(value); setDraft(clone(value.state.draft));}}).catch(reason => {if (live.current && !controller.signal.aborted && epoch === generation.current) failure(reason, 'Website editing could not be reached.');}).finally(() => {if (live.current && !controller.signal.aborted && epoch === generation.current) setLoading(false);});
    } else setLoading(false);
    const focus = () => {
      const focusEpoch = generation.current;
      if (!cloud || !allowed) return;
      void transport.load(workspaceId, controller.signal).catch(reason => {
        if (live.current && !controller.signal.aborted && focusEpoch === generation.current) failure(reason, 'Your website access could not be checked.');
      });
    };
    window.addEventListener('focus', focus);
    return () => {live.current = false; controller.abort(); window.removeEventListener('focus', focus);};
  }, [workspaceId, cloud, allowed, transport]);
  function edit(change: (value: CompanyWebsiteContent) => void) {
    setDraft(value => {if (!value) return value; const next = clone(value); change(next); return next;}); setNotice('');
  }
  async function reload() {
    if (lock.current) return; const epoch = generation.current; lock.current = true; setBusy(true); setError('');
    try {const value = await transport.load(workspaceId, abort.current.signal); if (live.current && epoch === generation.current) {setData(value); setDraft(clone(value.state.draft)); setNotice('Saved website loaded.'); setConfirm(null);}}
    catch (reason) {if (live.current && epoch === generation.current) failure(reason, 'The saved website could not be loaded.');}
    finally {lock.current = false; if (live.current) setBusy(false);}
  }
  async function write(action: 'saveDraft' | 'publish' | 'unpublish') {
    if (lock.current || !data || !draft || (action === 'publish' && changed)) return;
    const epoch = generation.current; lock.current = true; setBusy(true); setError(''); setNotice('');
    const payload = action === 'saveDraft' ? {action, expectedRevision: data.state.revision, content: draft} as const : {action, expectedRevision: data.state.revision} as const;
    const intent = intents.current.begin(`website:${workspaceId}`, {action: `website.${action}`, expectedRevision: data.state.revision, input: action === 'saveDraft' ? draft as unknown as Record<string, unknown> : {}});
    try {
      const value = await transport.write(workspaceId, {...payload, requestKey: intent.requestKey}, abort.current.signal);
      if (!live.current || epoch !== generation.current) return;
      intents.current.complete(intent); setData(value); if (action !== 'unpublish') setDraft(clone(value.state.draft)); setConfirm(null);
      setNotice(action === 'saveDraft' ? 'Draft saved. Your published website is unchanged.' : action === 'publish' ? 'The saved draft is published.' : 'The website is unpublished. Your draft is kept.');
    } catch (reason) {if (live.current && epoch === generation.current) {setConfirm(null); failure(reason, 'The result could not be confirmed. Retry the same action or reload saved settings.');}}
    finally {lock.current = false; if (live.current) setBusy(false);}
  }
  async function handleUpload(check: boolean) {
    if (!upload || lock.current) return;
    const epoch = generation.current; lock.current = true; setBusy(true); setError(''); setNotice('');
    try {
      const receipt = check ? await transport.uploadStatus(workspaceId, upload.requestKey, abort.current.signal) : await transport.upload(workspaceId, upload.file, upload.requestKey, abort.current.signal);
      if (!live.current || epoch !== generation.current) return;
      if (receipt?.state === 'ready') {
        const value = await transport.load(workspaceId, abort.current.signal); if (!live.current || epoch !== generation.current) return;
        // Refresh verified media without overwriting unsaved text or hiding a revision conflict.
        setData(previous => previous ? {...previous, media: [...new Map([...previous.media, ...value.media].map(asset => [asset.mediaId, asset])).values()], preview: {...previous.preview, media: value.preview.media}} : value);
        setUpload(null); setNotice(`${receipt.media.name} is ready. Choose it for your logo or project photos.`);
      } else {
        setUpload(previous => previous ? {...previous, unknown: true, retryAllowed: receipt === null} : previous);
        setError(receipt ? 'This upload is not ready. Check its status again before using it.' : 'No upload was recorded. You can retry the same selected image with its existing upload reference.');
      }
    } catch (reason) {if (live.current && epoch === generation.current) {setUpload(previous => previous ? {...previous, unknown: true, retryAllowed: false} : previous); failure(reason, 'The upload result could not be confirmed. Check its status.');}}
    finally {lock.current = false; if (live.current) setBusy(false);}
  }
  async function moreMedia() {
    if (lock.current || !data?.mediaCursor) return; const epoch = generation.current; lock.current = true; setBusy(true); setError('');
    try {const page = await transport.mediaPage(workspaceId, data.mediaCursor, abort.current.signal); if (live.current && epoch === generation.current) setData(previous => previous ? {...previous, media: [...new Map([...previous.media, ...page.media].map(asset => [asset.mediaId, asset])).values()], mediaCursor: page.cursor} : previous);}
    catch (reason) {if (live.current && epoch === generation.current) failure(reason, 'More images could not be loaded.');}
    finally {lock.current = false; if (live.current) setBusy(false);}
  }
  function chooseFile(file?: File) {
    if (!file || upload || busy) return;
    if (file.size > WEBSITE_MEDIA_MAX_BYTES) {setError('Choose an image smaller than 3 MB.'); return;}
    setUpload({file, requestKey: freshId(), unknown: false}); setError(''); setNotice('');
  }
  function mediaControl(label: string, value: WebsiteMediaReference | undefined, onChange: (value: WebsiteMediaReference | undefined) => void) {
    return <div className="website-media-choice"><Label className="website-field"><span>{label}</span><select aria-label={label} value={value?.mediaId ?? ''} onChange={event => {const asset = data?.media.find(item => item.mediaId === event.target.value); onChange(asset ? {mediaId: asset.mediaId, alt: value?.alt ?? ''} : undefined);}}><option value="">No image</option>{value && !data?.media.some(asset => asset.mediaId === value.mediaId) && <option value={value.mediaId}>Previously selected image</option>}{data?.media.map(item => <option key={item.mediaId} value={item.mediaId}>{item.name}</option>)}</select></Label>{value && <Field label={`${label} description`} value={value.alt} onChange={alt => onChange({...value, alt})} hint="Describe the image for visitors using screen readers. Save your draft to load a newly selected photo in preview."/>}</div>;
  }
  if (!allowed) return <section className="website-editor"><h2>Website editor</h2><p>Only company owners and office administrators can edit and publish the company website.</p></section>;
  if (!cloud) return <section className="website-editor"><h2>Website editor</h2><p>The local demo does not save or publish a company website. Open your cloud workspace to manage your website.</p></section>;
  if (loading) return <section className="website-editor"><p role="status">Loading your website draft…</p></section>;
  if (!data || !draft) return <section className="website-editor"><h2>Website editor</h2><p role="alert">{error || 'Your website draft could not be loaded.'}</p><Button disabled={busy} onClick={() => void reload()}>Reload saved website</Button></section>;
  return <section className="website-editor" aria-labelledby="website-editor-title">
    <header className="website-editor-header"><div><h2 id="website-editor-title">Your company website</h2><p>Build with your own work, words and photos. Save a draft before publishing.</p><div className="website-version"><span>Saved version {data.state.revision}</span><span>{data.state.published ? `Published version ${data.state.published.revision}` : 'Not published'}</span>{changed && <strong>Unsaved changes</strong>}</div></div><div className="website-editor-actions"><Button variant="outline" onClick={() => setPreview(value => !value)}>{preview ? 'Close preview' : 'Preview website'}</Button><Button disabled={busy || !changed} onClick={() => void write('saveDraft')}>{busy ? 'Working…' : 'Save draft'}</Button><Button disabled={busy || changed} onClick={() => setConfirm('publish')}>Publish saved draft</Button>{data.state.published && <Button variant="outline" disabled={busy} onClick={() => setConfirm('unpublish')}>Unpublish website</Button>}</div></header>
    {error && <p role="alert" className="website-message website-error">{error}</p>}{notice && <p role="status" className="website-message">{notice}</p>}
    {confirm && <div className="website-confirm" role="group" aria-label="Confirm website action"><p>{confirm === 'publish' ? `Publish saved version ${data.state.revision}? Your saved company details and selected images will become public.` : confirm === 'unpublish' ? 'Remove the public website? Your saved draft will remain available here.' : 'Reload the saved website and discard your unsaved text changes?'}</p><Button disabled={busy} onClick={() => void (confirm === 'reload' ? reload() : write(confirm))}>Confirm {confirm === 'reload' ? 'reload' : confirm}</Button><Button variant="outline" disabled={busy} onClick={() => setConfirm(null)}>Cancel</Button></div>}
    <div className="website-editor-body"><nav aria-label="Website sections" className="website-section-nav">{sections.map(name => <Button key={name} variant={section === name ? 'default' : 'ghost'} aria-current={section === name ? 'page' : undefined} onClick={() => setSection(name)}>{name}</Button>)}<Button variant="outline" disabled={busy} onClick={() => changed ? setConfirm('reload') : void reload()}>Reload saved website</Button><a href="/content">Manage blog articles</a></nav>
      <fieldset className="website-editor-fields" disabled={busy}><legend>{section}</legend>
        {section === 'Brand' && <><Field label="Company name" value={draft.companyName} onChange={value => edit(item => {item.companyName = value;})}/><Field label="Tagline" value={draft.tagline} onChange={value => edit(item => {item.tagline = value;})}/><Field label="Headline" value={draft.hero.heading} onChange={value => edit(item => {item.hero.heading = value;})}/><Field label="Introduction" multiline value={draft.hero.summary} onChange={value => edit(item => {item.hero.summary = value;})}/>{mediaControl('Company logo', draft.logo, value => edit(item => {item.logo = value;}))}{mediaControl('Main photo', draft.hero.media, value => edit(item => {item.hero.media = value;}))}</>}
        {section === 'Services' && <><p>Describe the work your company actually offers.</p>{draft.services.map((service, index) => <div className="website-repeat" key={service.id}><Field label={`Service ${index + 1} name`} value={service.title} onChange={value => edit(item => {item.services[index]!.title = value;})}/><Field multiline label={`Service ${index + 1} description`} value={service.description} onChange={value => edit(item => {item.services[index]!.description = value;})}/><Button variant="outline" onClick={() => edit(item => {item.services.splice(index, 1);})}>Remove service {index + 1}</Button></div>)}<Button variant="outline" onClick={() => edit(item => {item.services.push({id: freshId(), title: '', description: ''});})}>Add service</Button></>}
        {section === 'Projects' && <><p>Upload images you have permission to publish. Private project files are kept separate.</p><Label className="website-field"><span>Upload website image</span><Input type="file" aria-label="Upload website image" accept="image/png,image/jpeg,image/webp" disabled={!!upload} onChange={event => {chooseFile(event.target.files?.[0]); event.target.value = '';}}/><small>PNG, JPEG or WebP, up to 3 MB. Uploaded images must pass verification before you can use them.</small></Label>{upload && <div className="website-upload"><strong>{upload.file.name}</strong>{upload.unknown ? <><Button variant="outline" onClick={() => void handleUpload(true)}>Check upload status</Button>{upload.retryAllowed && <Button onClick={() => void handleUpload(false)}>Retry same upload</Button>}</> : <><Button onClick={() => void handleUpload(false)}>Upload selected image</Button><Button variant="outline" onClick={() => setUpload(null)}>Cancel selection</Button></>}</div>}
          {data.mediaCursor && <Button variant="outline" onClick={() => void moreMedia()}>Load more saved images</Button>}{draft.projects.map((project, index) => <div className="website-repeat" key={project.id}><Field label={`Project ${index + 1} title`} value={project.title} onChange={value => edit(item => {item.projects[index]!.title = value;})}/><Field multiline label={`Project ${index + 1} description`} value={project.summary} onChange={value => edit(item => {item.projects[index]!.summary = value;})}/>{project.media.map((photo, photoIndex) => <div key={`${project.id}-${photoIndex}`}>{mediaControl(`Project ${index + 1} photo ${photoIndex + 1}`, photo, value => edit(item => {if (value) item.projects[index]!.media[photoIndex] = value; else item.projects[index]!.media.splice(photoIndex, 1);}))}</div>)}<Button variant="outline" disabled={!data.media.length} onClick={() => edit(item => {item.projects[index]!.media.push({mediaId: data.media[0]!.mediaId, alt: ''});})}>Add photo to project {index + 1}</Button><Button variant="outline" onClick={() => edit(item => {item.projects.splice(index, 1);})}>Remove project {index + 1}</Button></div>)}<Button variant="outline" onClick={() => edit(item => {item.projects.push({id: freshId(), title: '', summary: '', media: []});})}>Add project</Button><h3>Photo gallery</h3>{draft.gallery.map((photo, index) => <div key={index}>{mediaControl(`Gallery photo ${index + 1}`, photo, value => edit(item => {if (value) item.gallery[index] = value; else item.gallery.splice(index, 1);}))}</div>)}<Button variant="outline" disabled={!data.media.length} onClick={() => edit(item => {item.gallery.push({mediaId: data.media[0]!.mediaId, alt: ''});})}>Add gallery photo</Button></>}
        {section === 'Reviews' && <><p>Use genuine customer quotes you have permission to publish. These entries are company-authored testimonials, not verified ratings.</p>{draft.testimonials.map((review, index) => <div className="website-repeat" key={review.id}><Field multiline label={`Review ${index + 1} quote`} value={review.quote} onChange={value => edit(item => {item.testimonials[index]!.quote = value;})}/><Field label={`Review ${index + 1} attribution`} value={review.attribution} onChange={value => edit(item => {item.testimonials[index]!.attribution = value;})}/><Field label={`Review ${index + 1} rating (optional)`} type="number" value={review.rating === undefined ? '' : String(review.rating)} onChange={value => edit(item => {item.testimonials[index]!.rating = value === '' ? undefined : Number(value);})}/><Button variant="outline" onClick={() => edit(item => {item.testimonials.splice(index, 1);})}>Remove review {index + 1}</Button></div>)}<Button variant="outline" onClick={() => edit(item => {item.testimonials.push({id: freshId(), quote: '', attribution: ''});})}>Add review</Button></>}
        {section === 'Pricing' && <><p>Publish only prices and terms your company has approved.</p>{draft.pricing.map((price, index) => <div className="website-repeat" key={price.id}><Field label={`Price ${index + 1} title`} value={price.title} onChange={value => edit(item => {item.pricing[index]!.title = value;})}/><Field multiline label={`Price ${index + 1} description`} value={price.description} onChange={value => edit(item => {item.pricing[index]!.description = value;})}/><Label className="website-field"><span>Price {index + 1} format</span><select aria-label={`Price ${index + 1} format`} value={price.price.mode} onChange={event => edit(item => {const mode = event.target.value as WebsitePrice['mode']; item.pricing[index]!.price = mode === 'descriptive' ? {mode, label: ''} : mode === 'range' ? {mode, minMinor: 0, maxMinor: 0, currency: 'USD'} : {mode, amountMinor: 0, currency: 'USD'};})}><option value="descriptive">Written description</option><option value="from">Starting price</option><option value="fixed">Fixed price</option><option value="range">Price range</option></select></Label>{price.price.mode === 'descriptive' ? <Field label={`Price ${index + 1} wording`} value={price.price.label} onChange={value => edit(item => {item.pricing[index]!.price = {mode: 'descriptive', label: value};})}/> : <><Label className="website-field"><span>Price {index + 1} currency</span><select aria-label={`Price ${index + 1} currency`} value={price.price.currency} onChange={event => edit(item => {const current = item.pricing[index]!.price; if (current.mode !== 'descriptive') current.currency = event.target.value;})}>{WEBSITE_CURRENCIES.map(currency => <option key={currency} value={currency}>{currency}</option>)}</select></Label>{price.price.mode === 'range' ? <><Field type="number" label={`Price ${index + 1} minimum`} value={String(price.price.minMinor / 100)} onChange={value => edit(item => {const current = item.pricing[index]!.price; if (current.mode === 'range') current.minMinor = Math.round(Number(value) * 100);})}/><Field type="number" label={`Price ${index + 1} maximum`} value={String(price.price.maxMinor / 100)} onChange={value => edit(item => {const current = item.pricing[index]!.price; if (current.mode === 'range') current.maxMinor = Math.round(Number(value) * 100);})}/></> : <Field type="number" label={`Price ${index + 1} amount`} value={String(price.price.amountMinor / 100)} onChange={value => edit(item => {const current = item.pricing[index]!.price; if (current.mode === 'fixed' || current.mode === 'from') current.amountMinor = Math.round(Number(value) * 100);})}/>}<Field label={`Price ${index + 1} unit`} value={price.price.unit ?? ''} onChange={value => edit(item => {const current = item.pricing[index]!.price; if (current.mode !== 'descriptive') current.unit = value || undefined;})}/><Field label={`Price ${index + 1} terms`} value={price.price.qualifier ?? ''} onChange={value => edit(item => {const current = item.pricing[index]!.price; if (current.mode !== 'descriptive') current.qualifier = value || undefined;})}/></>}<Button variant="outline" onClick={() => edit(item => {item.pricing.splice(index, 1);})}>Remove price {index + 1}</Button></div>)}<Button variant="outline" onClick={() => edit(item => {item.pricing.push({id: freshId(), title: '', description: '', price: {mode: 'descriptive', label: ''}});})}>Add price</Button></>}
        {section === 'Contact' && <><Field type="tel" label="Public phone number" value={draft.contacts.phone ?? ''} onChange={value => edit(item => {item.contacts.phone = value || undefined;})}/><Field type="email" label="Public email address" value={draft.contacts.email ?? ''} onChange={value => edit(item => {item.contacts.email = value || undefined;})}/><Field multiline label="Address lines" value={draft.contacts.address?.lines.join('\n') ?? ''} onChange={value => edit(item => {item.contacts.address = {...item.contacts.address, lines: value.split('\n').filter(Boolean)};})} hint="Publish only an address you want visitors to see."/>{(['city', 'region', 'postalCode', 'country'] as const).map(key => <Field key={key} label={{city: 'City', region: 'State or region', postalCode: 'Postal code', country: 'Country'}[key]} value={draft.contacts.address?.[key] ?? ''} onChange={value => edit(item => {item.contacts.address = {...item.contacts.address, lines: item.contacts.address?.lines ?? [], [key]: value || undefined};})}/>)}<Button variant="outline" onClick={() => edit(item => {item.contacts.address = undefined;})}>Remove address</Button><Field multiline label="Service areas" value={draft.contacts.serviceAreas.join('\n')} onChange={value => edit(item => {item.contacts.serviceAreas = value.split('\n').filter(Boolean);})} hint="One town or area per line."/>{draft.contacts.hours.map((hour, index) => <div className="website-repeat" key={hour.id}><Field label={`Opening hours ${index + 1} days`} value={hour.label} onChange={value => edit(item => {item.contacts.hours[index]!.label = value;})}/><Field label={`Opening hours ${index + 1} times`} value={hour.value} onChange={value => edit(item => {item.contacts.hours[index]!.value = value;})}/><Button variant="outline" onClick={() => edit(item => {item.contacts.hours.splice(index, 1);})}>Remove opening hours {index + 1}</Button></div>)}<Button variant="outline" onClick={() => edit(item => {item.contacts.hours.push({id: freshId(), label: '', value: ''});})}>Add opening hours</Button></>}
        {section === 'Blog' && <><Label className="website-checkbox"><Checkbox checked={draft.blogEnabled} onCheckedChange={value => edit(item => {item.blogEnabled = value === true;})}/>Show published blog articles</Label><p>Write and publish articles in Content Studio. Unpublished articles never appear on the company website.</p><a href="/content">Open Content Studio</a></>}
        {section === 'Template' && <div className="website-templates">{companyWebsiteTemplates.map(template => <Label key={template.id} className={`website-template ${draft.template === template.id ? 'selected' : ''}`}><input type="radio" name="website-template" aria-label={template.label} checked={draft.template === template.id} onChange={() => edit(item => {item.template = template.id;})}/><span><strong>{template.label}</strong><small>{template.description}</small></span></Label>)}</div>}
      </fieldset></div>
    {preview && <div className="website-preview"><div className="website-preview-heading"><h3>{changed ? 'Unsaved preview' : 'Saved draft preview'}</h3><p>This preview is private. Publishing uses the saved draft, never unsaved edits.</p></div><CompanyWebsite content={draft} media={data.preview.media} workspaceId={workspaceId} blog={data.blog} preview/></div>}
  </section>;
}
