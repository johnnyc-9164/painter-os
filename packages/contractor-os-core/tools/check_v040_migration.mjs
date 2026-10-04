#!/usr/bin/env node
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {auditLegacyRelations} from '../build/shared/migration.js';
const [input,output]=process.argv.slice(2);
if(!input){console.error('Usage: npm run build:core && node tools/check_v040_migration.mjs table-export.json [report.json]');process.exit(2);}
try{
 if(output&&resolve(input)===resolve(output))throw Error('OUTPUT_MUST_NOT_OVERWRITE_INPUT');
 const report=auditLegacyRelations(JSON.parse(await readFile(input,'utf8')));
 const result=JSON.stringify(report,null,2)+'\n';
 if(output)await writeFile(output,result,{flag:'wx'});else process.stdout.write(result);
 process.exitCode=report.safeToEnableStrictRelations?0:1;
}catch(error){console.error(error instanceof Error?error.message:String(error));process.exitCode=2;}
