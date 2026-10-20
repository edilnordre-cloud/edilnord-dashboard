// Ricava dashboard-src.html dalla versione cifrata index.html (inverso di encrypt.mjs).
// Uso:  node decrypt.mjs "LaPassword"
import { readFileSync, writeFileSync } from 'node:fs';
import { webcrypto as crypto } from 'node:crypto';

const password = process.argv[2];
if (!password) { console.error('Uso: node decrypt.mjs "password"'); process.exit(1); }

const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const m = html.match(/var D=\{s:"([^"]+)",i:"([^"]+)",c:"([^"]+)",n:(\d+)\}/);
if (!m) { console.error('Dati cifrati non trovati in index.html'); process.exit(1); }
const u8 = (b) => new Uint8Array(Buffer.from(b, 'base64'));

const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: u8(m[1]), iterations: +m[4], hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
let pt;
try { pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: u8(m[2]) }, key, u8(m[3])); }
catch { console.error('Password errata'); process.exit(1); }
writeFileSync(new URL('./dashboard-src.html', import.meta.url), new TextDecoder().decode(pt));
console.log('dashboard-src.html aggiornato alla versione pubblicata');
