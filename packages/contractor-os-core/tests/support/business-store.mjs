// Explicit transaction-port test double. This is not the Convex backend.
export class MemoryStore {
 rows=new Map(); events=[]; receipts=new Map(); evidence=new Set(); nextId=0;
 tenant='tenant-a'; now=Date.parse('2026-09-22T12:00:00Z'); failAfterWrites=Infinity; writes=0;
 key(bp,id){return `${bp}/${id}`;}
 async hasJobForContract(contractId){return [...this.rows.values()].some(r=>r.tenantId===this.tenant&&r.blueprint==='co_job'&&r.relations.contract===contractId);}
 async load(bp,identifier){return structuredClone(this.rows.get(this.key(bp,identifier))??null);}
 async loadId(bp,id){return structuredClone([...this.rows.values()].find(r=>r.blueprint===bp&&r.id===id)??null);}
 async create(bp,r,eventId){if(++this.writes>this.failAfterWrites)throw Error('INJECTED_STORAGE_FAILURE');const id=`${bp}:${++this.nextId}`;this.rows.set(this.key(bp,r.identifier),{...structuredClone(r),blueprint:bp,id,lastEventId:eventId});return id;}
 async save(r,eventId){if(++this.writes>this.failAfterWrites)throw Error('INJECTED_STORAGE_FAILURE');this.rows.set(this.key(r.blueprint,r.identifier),{...structuredClone(r),lastEventId:eventId});}
 async event(e){const id=`event:${this.events.length+1}`;this.events.push({...structuredClone(e),id});return id;}
 async receipt(key){return structuredClone(this.receipts.get(key)??null);}
 async saveReceipt(key,value){this.receipts.set(key,structuredClone(value));}
 async evidenceUsed(kind,ref){return this.evidence.has(`${kind}/${ref}`);}
 async claimEvidence(kind,ref){this.evidence.add(`${kind}/${ref}`);}
 seed(bp,identifier,properties={},relations={},tenantId=this.tenant){const id=`${bp}:${++this.nextId}`;const r={blueprint:bp,id,identifier,tenantId,title:identifier,properties,relations,revision:1};this.rows.set(this.key(bp,identifier),r);return structuredClone(r);}
 expect(...records){return records.map(r=>({blueprint:r.blueprint,identifier:r.identifier,revision:r.revision}));}
 async transaction(fn){const backup=structuredClone({rows:this.rows,events:this.events,receipts:this.receipts,evidence:this.evidence,nextId:this.nextId,writes:this.writes});try{return await fn(this);}catch(error){Object.assign(this,backup);throw error;}}
}
