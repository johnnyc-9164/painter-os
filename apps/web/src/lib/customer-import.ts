/** Local-only migration preview. This establishes no membership or durable duplicate lock. */
export const CUSTOMER_CSV_LIMITS={bytes:128*1024,rows:100,columns:30,cell:1000} as const;
export type CustomerDraft={name:string;email:string;phone:string;address:string};
export type CustomerField=keyof CustomerDraft;
export type CustomerMapping=Partial<Record<CustomerField|'firstName'|'lastName',number>>;
export type CustomerCsv={headers:string[];rows:string[][]};
export function parseCustomerCsv(source:string):CustomerCsv{
 if(new TextEncoder().encode(source).length>CUSTOMER_CSV_LIMITS.bytes)throw new Error('Choose a CSV smaller than 128 KB.');
 const records:string[][]=[];let row:string[]=[],cell='',quoted=false,closed=false;
 const pushCell=()=>{if(cell.length>CUSTOMER_CSV_LIMITS.cell)throw new Error('A CSV cell exceeds 1,000 characters.');row.push(cell);cell='';closed=false;if(row.length>CUSTOMER_CSV_LIMITS.columns)throw new Error('Use at most 30 columns.');};
 const pushRow=()=>{pushCell();if(row.some(value=>value.trim()))records.push(row);row=[];if(records.length>CUSTOMER_CSV_LIMITS.rows+1)throw new Error('Preview at most 100 customers at a time.');};
 source=source.replace(/^\uFEFF/,'');
 for(let index=0;index<source.length;index++){
  const char=source[index]!;
  if(quoted){if(char==='"'){if(source[index+1]==='"'){cell+='"';index++;}else{quoted=false;closed=true;}}else cell+=char;}
  else if(char==='"'){if(cell||closed)throw new Error('Invalid CSV quoting.');quoted=true;}
  else if(char===',')pushCell();
  else if(char==='\n'||char==='\r'){if(char==='\r'&&source[index+1]==='\n')index++;pushRow();}
  else{if(closed)throw new Error('Unexpected text after a quoted CSV cell.');cell+=char;}
  if(cell.length>CUSTOMER_CSV_LIMITS.cell)throw new Error('A CSV cell exceeds 1,000 characters.');
 }
 if(quoted)throw new Error('A quoted CSV cell is not closed.');if(cell||row.length||closed)pushRow();
 const headers=records.shift();if(!headers?.length||!records.length)throw new Error('Include a header row and at least one customer.');
 if(headers.some(header=>!header.trim())||new Set(headers.map(header=>header.trim().toLowerCase())).size!==headers.length)throw new Error('Use nonempty, distinct column names.');
 if(records.some(record=>record.length!==headers.length))throw new Error('Every row must have the same number of columns.');
 return {headers:headers.map(header=>header.trim()),rows:records};
}
const fields:CustomerField[]=['name','email','phone','address'];
export function defaultCustomerMapping(headers:string[]):CustomerMapping{
 return Object.fromEntries([...fields,'firstName','lastName'].flatMap(field=>{const index=headers.findIndex(header=>header.toLowerCase().replace(/[ _-]/g,'')===field.toLowerCase());return index<0?[]:[[field,index]];}));
}
const normalized=(value:string)=>value.trim().toLowerCase().replace(/\s+/g,' ');
export function customerDuplicate(a:CustomerDraft,b:CustomerDraft):boolean{
 return !!(a.email&&b.email&&normalized(a.email)===normalized(b.email))||!!(a.phone&&b.phone&&a.phone.replace(/\D/g,'')&&a.phone.replace(/\D/g,'')===b.phone.replace(/\D/g,''))
  ||!!(a.name&&a.address&&b.address&&normalized(a.name)===normalized(b.name)&&normalized(a.address)===normalized(b.address));
}
export function previewCustomerCsv(csv:CustomerCsv,mapping:CustomerMapping,existing:CustomerDraft[]){
 if(Object.keys(mapping).some(key=>![...fields,'firstName','lastName'].includes(key))||(mapping.name===undefined&&mapping.firstName===undefined))throw new Error('Map customer name or first name (with optional last name).');
 const indexes=Object.values(mapping).filter((index):index is number=>index!==undefined);if(indexes.some(index=>!Number.isInteger(index)||index!<0||index!>=csv.headers.length)||new Set(indexes).size!==indexes.length)throw new Error('Map each field to a different valid column.');
 const seen:CustomerDraft[]=[];
 return csv.rows.map((row,index)=>{
  const draft=Object.fromEntries(fields.map(field=>[field,mapping[field]===undefined?'':row[mapping[field]!]!.trim()])) as CustomerDraft;
  if(mapping.name===undefined)draft.name=[mapping.firstName,mapping.lastName].filter((index):index is number=>index!==undefined).map(index=>row[index]!.trim()).filter(Boolean).join(' ');
  const invalid=!draft.name||draft.name.length>200||draft.email.length>254||draft.phone.length>100||draft.address.length>500||!!(draft.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email));
  const duplicate=existing.some(customer=>customerDuplicate(draft,customer))?'possible workspace match':seen.some(customer=>customerDuplicate(draft,customer))?'possible earlier CSV match':null;
  if(!invalid&&!duplicate)seen.push(draft);
  return {row:index+2,draft,state:invalid?'invalid':duplicate?'duplicate':'ready',reason:invalid?'Check name, contact format and field lengths.':duplicate||'Ready for individual review'} as const;
 });
}
