#!/usr/bin/env node
/**
 * Fail closed on the exact staged HTML CSP before artifact publication.
 * The shared verifier is used during PR CI, Pages staging and Vercel preview
 * staging so source-only smoke tests cannot mask a loosened policy.
 */
import fs from 'node:fs';
import {verifyIndexCsp} from './verify-deployed-release.mjs';

const file=process.argv[2];
if(!file||process.argv.length!==3){
  console.error('Usage: node verify-production-csp.mjs <staged-html>');
  process.exitCode=1;
}else{
  try{
    const stat=fs.statSync(file);
    if(!stat.isFile()||stat.size===0||stat.size>2_000_000)
      throw new Error('Empty or oversized staged production HTML');
    verifyIndexCsp(fs.readFileSync(file,'utf8'));
    console.log('Staged production CSP verified: '+file);
  }catch(e){
    console.error('Staged production CSP FAILED: '+e.message);
    process.exitCode=1;
  }
}
