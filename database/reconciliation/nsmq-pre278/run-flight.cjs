#!/usr/bin/env node
'use strict';
const path=require('node:path'),{execFileSync}=require('node:child_process');
const files=["00_expected_part_1.sql","01_expected_part_2.sql","02_expected_part_3.sql","03_preflight.sql","04_reconcile.sql","90_postflight.sql"],args=process.argv.slice(2),value=(n)=>{const i=args.indexOf(n);return i<0?null:args[i+1];},env=value('--env'),confirm=value('--confirm'),targets={production:'aa806d65-d3dd-4cf9-9cac-e3ddd252f937',staging:'1faeca41-2233-4a0b-a273-0d3aadba9c96'},db=targets[env];
if(!db||confirm!==env+':'+db)throw Error('Use --env production|staging --confirm <env>:<pinned-uuid>');
const root=path.resolve(__dirname,'../../..'),wrangler=path.join(root,'node_modules','wrangler','bin','wrangler.js');
for(const file of files){const a=[wrangler,'d1','execute',db,'--remote','--file',path.join(__dirname,file)];if(env==='staging')a.push('--env','staging');process.stdout.write('RUN '+file+'\n');execFileSync(process.execPath,a,{cwd:root,stdio:'inherit'});}
process.stdout.write('STOP: now run unchanged canonical migrations 278-282 in order, then their canonical postflight. Cleanup remains separate.\n');
