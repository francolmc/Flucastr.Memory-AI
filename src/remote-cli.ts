#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { postF03 } from './http-client.js';
const help = `Flucastr Memory AI HTTP CLI\n\nUsage:\n  remote-cli --help\n  remote-cli save --url ORIGIN --token-file PATH --input PATH\n  remote-cli search --url ORIGIN --token-file PATH --scope SCOPE --query TEXT\n`;
const forbidden = new Set(['db','confirm-franco','confirm-general-rule','archive','conflict','resolve-conflict']);
function parse(args: string[]): Record<string,string> {
 const result: Record<string,string> = {};
 for(let i=0;i<args.length;i++) { const k=args[i]!; if(!k.startsWith('--')||forbidden.has(k.slice(2))||Object.hasOwn(result,k.slice(2))) throw new Error(); const v=args[++i]; if(!v||v.startsWith('--')) throw new Error(); result[k.slice(2)]=v; }
 return result;
}
export async function runRemoteCli(args: string[]): Promise<number> {
 if(args.length===0||(args.length===1&&args[0]==='--help')) { process.stdout.write(help); return 0; }
 let usageError=false;
 try {
  const cmd=args[0]; if(cmd!=='save'&&cmd!=='search') throw new Error();
  let o: Record<string,string>; try { o=parse(args.slice(1)); } catch { usageError=true; throw new Error(); }
  const required=cmd==='save'?['url','token-file','input']:['url','token-file','scope','query'];
  if(Object.keys(o).length!==required.length||required.some(k=>!Object.hasOwn(o,k))) { usageError=true; throw new Error(); }
  let payload: unknown;
  if(cmd==='save') { const v: unknown=JSON.parse(readFileSync(o.input!,'utf8')); if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).length!==6||!['id','type','scope','text','origin','date'].every(k=>typeof (v as Record<string,unknown>)[k]==='string')) throw new Error(); payload={memory:v}; }
  else payload={scope:o.scope,query:o.query};
  const out=await postF03({url:o.url!,tokenPath:o['token-file']!},cmd==='save'?'/v1/memories':'/v1/search',payload);
  process.stdout.write(out); return 0;
 } catch { const invalid=usageError||(args[0]!=='save'&&args[0]!=='search'); process.stderr.write(invalid?'Invalid command or options.\n':'Remote operation failed.\n'); return invalid?2:1; }
}
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) process.exitCode=await runRemoteCli(process.argv.slice(2));
