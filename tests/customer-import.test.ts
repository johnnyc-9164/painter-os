import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {parseCustomerCsv,defaultCustomerMapping,previewCustomerCsv,customerDuplicate}=createRequire(import.meta.url)('../apps/web/src/lib/customer-import.ts') as typeof import('../apps/web/src/lib/customer-import.ts');
const existing={name:'Alex Painter',email:'alex@example.test',phone:'5551234567',address:'12 Main St'};
test('quoted commas, escaped quotes, CRLF, multiline cells and BOM are parsed with bounded columns',()=>{
 const csv=parseCustomerCsv('\uFEFFName,Address,Email\r\n"Alex, Jr","12 \"\"Main\"\"\nStreet",alex@example.test\r\n');
 assert.deepEqual(csv,{headers:['Name','Address','Email'],rows:[['Alex, Jr','12 "Main"\nStreet','alex@example.test']]});
});
test('malformed, unequal, empty/duplicate headers and file/row/cell bounds fail closed',()=>{
 for(const source of ['name\n"unclosed','name\n"Alex"oops','name,email\nAlex','name,name\nA,B',',name\nA,B','name\n','name\n'+ 'a'.repeat(1001),'name\n'+Array.from({length:101},(_,i)=>'customer'+i).join('\n'),'name\n'+'x'.repeat(128*1024)])assert.throws(()=>parseCustomerCsv(source));
});
test('mapping strips unselected authority fields and only projects contact drafts',()=>{
 const csv=parseCustomerCsv('name,email,status,deposit,approved,verifiedReview\nAlex,alex@example.test,paid,100,true,true');
 const preview=previewCustomerCsv(csv,defaultCustomerMapping(csv.headers),[]);
 assert.deepEqual(preview[0]?.draft,{name:'Alex',email:'alex@example.test',phone:'',address:''});assert.equal(preview[0]?.state,'ready');
 assert.throws(()=>previewCustomerCsv(csv,{email:1},[]));assert.throws(()=>previewCustomerCsv(csv,{name:0,email:0},[]));assert.throws(()=>previewCustomerCsv(csv,{name:99},[]));
 assert.equal(previewCustomerCsv(csv,{name:0,email:undefined},[])[0]?.state,'ready');
});
test('duplicate matching is deterministic by normalized email, phone or name/address, never name alone',()=>{
 for(const draft of [{...existing,email:' ALEX@EXAMPLE.TEST '},{...existing,email:'',phone:'(555) 123-4567'},{...existing,email:'',phone:'',name:'alex  painter',address:'12 MAIN st'}])assert.equal(customerDuplicate(existing,draft),true);
 assert.equal(customerDuplicate(existing,{name:existing.name,email:'',phone:'',address:''}),false);
 const csv=parseCustomerCsv('name,email\nExisting,ALEX@example.test\nNew,new@example.test\nLater,new@example.test');const before=JSON.stringify(csv);
 const rows=previewCustomerCsv(csv,{name:0,email:1},[existing]);assert.deepEqual(rows.map(row=>row.state),['duplicate','ready','duplicate']);assert.equal(rows[0]?.reason,'possible workspace match');assert.equal(rows[2]?.reason,'possible earlier CSV match');assert.equal(JSON.stringify(csv),before);
});
test('invalid row contact/name is excluded and cannot poison later ready row',()=>{
 const csv=parseCustomerCsv('name,email\n,bad\nValid,valid@example.test');assert.deepEqual(previewCustomerCsv(csv,{name:0,email:1},[]).map(row=>row.state),['invalid','ready']);
});

test('split first and last name compose explicitly while full name takes precedence',()=>{
 const csv=parseCustomerCsv('First Name,Last Name,Email\nAlex,Painter,alex@example.test');const mapping=defaultCustomerMapping(csv.headers);assert.equal(previewCustomerCsv(csv,mapping,[])[0]?.draft.name,'Alex Painter');
});
