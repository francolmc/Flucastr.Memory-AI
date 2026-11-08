#!/usr/bin/env node
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { postF03 } from './http-client.js';

const help = `mem — remote Flucastr memory client\n\nUsage:\n  mem save --type TYPE --text TEXT [--scope SCOPE] [--origin ORIGIN]\n  mem search --query TEXT [--scope SCOPE]\n  mem recent [--limit N] [--scope SCOPE]\n  mem forget --id ID\n  mem serve [--port N]\n`;
function parse(args: string[]): Record<string,string> {
  const out: Record<string,string> = {};
  for (let i=0;i<args.length;i++) { const k=args[i]!; if (!k.startsWith('--') || Object.hasOwn(out,k.slice(2))) throw new Error(); const v=args[++i]; if (!v || v.startsWith('--')) throw new Error(); out[k.slice(2)]=v; }
  return out;
}
function projectScope(): string {
  const root=execFileSync('git',['rev-parse','--show-toplevel'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();
  return `project:${basename(root)}`;
}
function scopeFor(opts: Record<string,string>): string {
  if (opts.scope) return opts.scope;
  try { return projectScope(); } catch { throw new Error('usage'); }
}
export async function runMem(args: string[], env: NodeJS.ProcessEnv = process.env): Promise<number> {
  if (!args.length || (args.length===1 && args[0]==='--help')) { process.stdout.write(help); return 0; }
  if (args[0]==='serve') {
    if (args.length===2 && args[1]==='--help') { process.stdout.write('Usage: mem serve [--port N]\n'); return 0; }
    try {
      const {startServe}=await import('./serve.js'); const handle=await startServe(args.slice(1),env);
      process.stdout.write(`mem server listening on ${handle.address.port}\n`);
      const stop=():void=>{void handle.close().then(()=>{process.exitCode=0;});};
      process.once('SIGINT',stop); process.once('SIGTERM',stop);
      return 0;
    }
    catch { process.stderr.write('mem: no se pudo iniciar el servidor\n'); return 1; }
  }
  try {
    const cmd=args[0]!; if (!['save','search','recent','forget'].includes(cmd)) throw new Error('usage');
    const opts=parse(args.slice(1)); const allowed: Record<string,string[]>={save:['type','text','scope','origin'],search:['query','scope'],recent:['limit','scope'],forget:['id']};
    if (Object.keys(opts).some(k=>!allowed[cmd]!.includes(k))) throw new Error('usage');
    const url=env.MEM_URL; const token=env.MEM_TOKEN; if (!url || !token) throw new Error('remote');
    let route: '/v1/memories'|'/v1/search'|'/v1/recent'|'/v1/forget'; let body: unknown;
    if(cmd==='save') { if(!opts.type||!opts.text) throw new Error('usage'); route='/v1/memories'; body={memory:{id:randomUUID(),type:opts.type,scope:scopeFor(opts),text:opts.text,origin:opts.origin??(process.platform==='darwin'?'mem/mac':'mem/wsl'),date:new Date().toISOString().slice(0,10)}}; }
    else if(cmd==='search') { if(!opts.query) throw new Error('usage'); route='/v1/search'; body={scope:scopeFor(opts),query:opts.query}; }
    else if(cmd==='recent') { const limit=opts.limit===undefined?15:Number(opts.limit); if(!Number.isSafeInteger(limit)||limit<1) throw new Error('usage'); route='/v1/recent'; body={scope:scopeFor(opts),limit}; }
    else { if(!opts.id) throw new Error('usage'); route='/v1/forget'; body={id:opts.id}; }
    process.stdout.write(await postF03({url,token},route,body)); return 0;
  } catch (error) {
    if (error instanceof Error && error.message==='usage') { process.stderr.write('Invalid command or options.\n'); return 2; }
    process.stderr.write('mem: servidor no disponible\n'); return 1;
  }
}
if (process.argv[1] && import.meta.url === new URL(`file://${realpathSync(resolve(process.argv[1]))}`).href) process.exitCode=await runMem(process.argv.slice(2));
