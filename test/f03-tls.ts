import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export interface EphemeralTls { key: Buffer; cert: Buffer; ca: Buffer; directory: string; cleanup(): void }
export function createEphemeralTls(): EphemeralTls {
  const directory = mkdtempSync(join(tmpdir(), 'f03-tls-'));
  const path = (name: string) => join(directory, name);
  const run = (args: string[]) => execFileSync('openssl', args, { stdio: 'ignore' });
  try {
    run(['req','-x509','-newkey','rsa:2048','-nodes','-keyout',path('ca.key'),'-out',path('ca.pem'),'-days','1','-subj','/CN=F03 Synthetic Test CA','-addext','basicConstraints=critical,CA:TRUE','-addext','keyUsage=critical,keyCertSign,cRLSign']);
    run(['req','-new','-newkey','rsa:2048','-nodes','-keyout',path('server.key'),'-out',path('server.csr'),'-subj','/CN=localhost']);
    writeFileSync(path('server.ext'), 'subjectAltName=IP:127.0.0.1\nkeyUsage=digitalSignature,keyEncipherment\nextendedKeyUsage=serverAuth\nbasicConstraints=CA:FALSE\n');
    run(['x509','-req','-in',path('server.csr'),'-CA',path('ca.pem'),'-CAkey',path('ca.key'),'-CAcreateserial','-out',path('server.pem'),'-days','1','-sha256','-extfile',path('server.ext')]);
    return { key: readFileSync(path('server.key')), cert: readFileSync(path('server.pem')), ca: readFileSync(path('ca.pem')), directory, cleanup: () => rmSync(directory,{recursive:true,force:true}) };
  } catch (error) { rmSync(directory,{recursive:true,force:true}); throw error; }
}
