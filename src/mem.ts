#!/usr/bin/env node
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { postF03 } from './http-client.js';
import { agentConfig, agentInstructions } from './agent-config.js';
import { buildMemoryContext } from './context.js';
import { confirmProposal, incrementStat, listProposals, proposeMemories, readStats, removeProposal } from './local-state.js';

async function count(env: NodeJS.ProcessEnv, tool: string): Promise<void> {
  try { await incrementStat(env.MEM_AGENT, tool); } catch { process.stderr.write('mem: estadísticas locales no disponibles; la operación continúa\n'); }
}

const help = `mem — remote Flucastr memory client\n\nUsage:\n  mem save --type TYPE --text TEXT [--scope SCOPE] [--origin ORIGIN]\n  mem search --query TEXT [--scope SCOPE]\n  mem recent [--limit N] [--scope SCOPE]\n  mem context [--scope SCOPE]\n  mem propose --type TYPE --text TEXT [--scope SCOPE] (repeat up to three times)\n  mem proposals\n  mem stats\n  mem discard --id ID\n  mem confirm --id ID\n  mem forget --id ID\n  mem init <claude-code|cursor|codex|pi|claude-desktop> [--instructions]\n  mem init chatgpt --instructions\n  mem serve [--port N]\n`;
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
  if (args[0]==='init') {
    if (args.length!==2 && !(args.length===3 && args[2]==='--instructions')) { process.stderr.write('Uso: mem init <agente> [--instructions]\n'); return 2; }
    const config=args.length===3 ? agentInstructions(args[1]!) : agentConfig(args[1]!);
    if (!config) { process.stderr.write(`mem init: agente no reconocido: ${args[1]}\n`); return 2; }
    process.stdout.write(`${config}\n`); return 0;
  }
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
    const cmd=args[0]!;
    if (cmd === 'stats') {
      if (args.length !== 1) throw new Error('usage');
      process.stdout.write(`${JSON.stringify({ stats: await readStats() })}\n`); return 0;
    }
    if (cmd === 'proposals') {
      if (args.length !== 1) throw new Error('usage');
      process.stdout.write(`${JSON.stringify({ proposals: await listProposals() })}\n`); return 0;
    }
    if (cmd === 'propose') {
      const groups: Record<string,string>[] = [];
      for (let i = 1; i < args.length; i++) {
        if (args[i] !== '--type') throw new Error('usage');
        while (i < args.length && args[i] === '--type') {
          const type = args[++i]; if (!type || !['decision','learning','resolved-blocker','rule'].includes(type)) throw new Error('usage');
          const textFlag=args[++i], text=args[++i];
          if (textFlag !== '--text' || !text || text.startsWith('--')) throw new Error('usage');
          const scopeFlag=args[++i];
          let scope: string;
          if (scopeFlag === '--scope') { scope=args[++i] ?? ''; if (!scope || scope.startsWith('--')) throw new Error('usage'); }
          else if (scopeFlag === undefined || scopeFlag.startsWith('--')) { i--; scope=scopeFor({}); }
          else throw new Error('usage');
          groups.push({ type, text, scope });
        }
      }
      if (groups.length < 1 || groups.length > 3) throw new Error('usage');
      await count(env, 'propose');
      const proposals = await proposeMemories(groups as Array<{ type: 'decision'|'learning'|'resolved-blocker'|'rule'; text: string; scope: string }>);
      process.stdout.write(`${JSON.stringify({ proposals, savedToServer: false })}\n`); return 0;
    }
    if (cmd === 'discard') {
      const opts=parse(args.slice(1)); if (Object.keys(opts).join() !== 'id' || !opts.id) throw new Error('usage');
      process.stdout.write(`${JSON.stringify({ discarded: await removeProposal(opts.id) })}\n`); return 0;
    }
    if (cmd === 'confirm') {
      const opts=parse(args.slice(1)); if (Object.keys(opts).join() !== 'id' || !opts.id) throw new Error('usage');
      const url=env.MEM_URL, token=env.MEM_TOKEN; if (!url || !token) throw new Error('remote');
      const saved = await confirmProposal(opts.id, { url, token });
      process.stdout.write(`${JSON.stringify({ saved })}\n`); return 0;
    }
    if (!['save','search','recent','context','forget'].includes(cmd)) throw new Error('usage');
    const opts=parse(args.slice(1)); const allowed: Record<string,string[]>={save:['type','text','scope','origin'],search:['query','scope'],recent:['limit','scope'],context:['scope'],forget:['id']};
    if (Object.keys(opts).some(k=>!allowed[cmd]!.includes(k))) throw new Error('usage');
    if (cmd==='search' && !opts.query) throw new Error('usage');
    if (cmd==='search' || cmd==='context') await count(env, cmd);
    const url=env.MEM_URL; const token=env.MEM_TOKEN; if (!url || !token) throw new Error('remote');
    let route: '/v1/memories'|'/v1/search'|'/v1/recent'|'/v1/forget'; let body: unknown;
    if(cmd==='save') { if(!opts.type||!opts.text) throw new Error('usage'); route='/v1/memories'; body={memory:{id:randomUUID(),type:opts.type,scope:scopeFor(opts),text:opts.text,origin:opts.origin??(process.platform==='darwin'?'mem/mac':'mem/wsl'),date:new Date().toISOString().slice(0,10)}}; }
    else if(cmd==='search') { if(!opts.query) throw new Error('usage'); route='/v1/search'; body={scope:scopeFor(opts),query:opts.query}; }
    else if(cmd==='recent') { const limit=opts.limit===undefined?15:Number(opts.limit); if(!Number.isSafeInteger(limit)||limit<1) throw new Error('usage'); route='/v1/recent'; body={scope:scopeFor(opts),limit}; }
    else if(cmd==='context') {
      route='/v1/recent';
      let scope: string;
      if (opts.scope === 'general') scope='general';
      else if (opts.scope === undefined) scope=projectScope();
      else {
        if (!opts.scope.startsWith('project:') || !opts.scope.slice(8).trim() || opts.scope.trim()!==opts.scope) throw new Error('usage');
        try { if (opts.scope!==projectScope()) throw new Error('usage'); scope=opts.scope; }
        catch (error) { if (error instanceof Error && error.message==='usage') throw error; scope=opts.scope; }
      }
      body={scope,limit:100};
    }
    else { if(!opts.id) throw new Error('usage'); route='/v1/forget'; body={id:opts.id}; }
    const response=await postF03({url,token},route,body);
    if (cmd==='context') {
      const result=JSON.parse(response) as { memories: Parameters<typeof buildMemoryContext>[0] };
      process.stdout.write(JSON.stringify(buildMemoryContext(result.memories)));
    } else process.stdout.write(response);
    return 0;
  } catch (error) {
    if (args[0] === 'stats' && !(error instanceof Error && error.message === 'usage')) { process.stderr.write('mem: estadísticas locales no disponibles\n'); return 1; }
    if (error instanceof Error && error.message==='usage') { process.stderr.write('Invalid command or options.\n'); return 2; }
    if (error instanceof Error && error.message.startsWith('Local proposal locking is unavailable')) {
      process.stderr.write('mem: el bloqueo local de propuestas no está disponible; no se modificaron las propuestas\n'); return 1;
    }
    process.stderr.write('mem: servidor no disponible\n'); return 1;
  }
}
if (process.argv[1] && import.meta.url === new URL(`file://${realpathSync(resolve(process.argv[1]))}`).href) process.exitCode=await runMem(process.argv.slice(2));
