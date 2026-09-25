// Cifra dashboard-src.html → index.html (protetto da password).
// Uso:  node encrypt.mjs "LaPassword"
// La pagina pubblicata contiene solo dati cifrati (AES-256-GCM, chiave da PBKDF2-SHA256):
// senza password il contenuto non è leggibile, nemmeno aprendo il codice sorgente.
import { readFileSync, writeFileSync } from 'node:fs';
import { webcrypto as crypto } from 'node:crypto';

const password = process.argv[2];
if (!password) { console.error('Uso: node encrypt.mjs "password"'); process.exit(1); }

const ITER = 600000;
const src = readFileSync(new URL('./dashboard-src.html', import.meta.url), 'utf8');
const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));
const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: ITER, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(src)));
const b64 = (u) => Buffer.from(u).toString('base64');

const html = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="theme-color" content="#080f0a">
<title>Edilnord RE</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0}
body{min-height:100vh;min-height:100dvh;display:grid;place-items:center;padding:16px;background:radial-gradient(ellipse at top,#152319,#080f0a 70%);font-family:'Plus Jakarta Sans',system-ui,sans-serif;color:#e8f2ec}
.card{width:100%;max-width:360px;padding:36px 28px;border-radius:22px;background:rgba(255,255,255,.05);border:1px solid rgba(157,192,170,.14);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);box-shadow:0 30px 80px rgba(0,0,0,.45)}
.logo{width:48px;height:48px;border-radius:14px;display:grid;place-items:center;background:linear-gradient(135deg,#9dc0aa,#5a9a70);color:#080f0a;margin-bottom:20px}
h1{font-size:22px;font-weight:700;background:linear-gradient(135deg,#fff 40%,rgba(157,192,170,.8));-webkit-background-clip:text;background-clip:text;color:transparent}
p{font-size:14px;color:rgba(232,242,236,.6);margin:6px 0 24px}
input[type=password]{width:100%;padding:14px 16px;border-radius:12px;border:1px solid rgba(157,192,170,.2);background:rgba(0,0,0,.25);color:#fff;font:inherit;font-size:16px;outline:none;transition:border-color .2s}
input[type=password]:focus{border-color:#9dc0aa}
label.rem{display:flex;align-items:center;gap:8px;font-size:13px;color:rgba(232,242,236,.6);margin:14px 0 20px;cursor:pointer}
button{width:100%;padding:14px;border:0;border-radius:12px;background:linear-gradient(135deg,#9dc0aa,#6db882);color:#080f0a;font:inherit;font-weight:700;font-size:15px;cursor:pointer}
button:disabled{opacity:.6;cursor:wait}
.err{min-height:20px;margin-top:12px;font-size:13px;color:#ff8a80;text-align:center}
.shake{animation:sh .35s}
@keyframes sh{20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}
</style>
</head>
<body>
<form class="card" id="f" autocomplete="on">
  <div class="logo"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></div>
  <h1>Edilnord RE</h1>
  <p>Area riservata. Inserisci la password.</p>
  <input type="text" name="username" value="edilnord" autocomplete="username" hidden>
  <input type="password" id="pw" autocomplete="current-password" placeholder="Password" required autofocus>
  <label class="rem"><input type="checkbox" id="rem" checked> Ricordami su questo dispositivo</label>
  <button id="btn">Entra</button>
  <div class="err" id="err"></div>
</form>
<script>
var D={s:"${b64(salt)}",i:"${b64(iv)}",c:"${b64(ct)}",n:${ITER}};
var K='edilnord-dash-key';
function u8(b){return Uint8Array.from(atob(b),function(c){return c.charCodeAt(0)})}
function st(){try{return localStorage}catch(e){return null}}
async function derive(pw){
  var b=await crypto.subtle.importKey('raw',new TextEncoder().encode(pw),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt:u8(D.s),iterations:D.n,hash:'SHA-256'},b,{name:'AES-GCM',length:256},true,['decrypt']);
}
async function open(key){
  var pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:u8(D.i)},key,u8(D.c));
  var h=new TextDecoder().decode(pt);
  document.open();document.write(h);document.close();
}
async function auto(){
  var s=st(),k=s&&s.getItem(K);if(!k)return;
  var f=document.getElementById('f');f.style.visibility='hidden';
  try{var key=await crypto.subtle.importKey('raw',u8(k),'AES-GCM',false,['decrypt']);await open(key);}
  catch(e){try{s.removeItem(K)}catch(_){}f.style.visibility='';}
}
document.getElementById('f').addEventListener('submit',async function(e){
  e.preventDefault();
  var btn=document.getElementById('btn'),err=document.getElementById('err');
  btn.disabled=true;btn.textContent='Verifica…';err.textContent='';
  try{
    var key=await derive(document.getElementById('pw').value);
    var raw=new Uint8Array(await crypto.subtle.exportKey('raw',key));
    var imp=await crypto.subtle.importKey('raw',raw,'AES-GCM',false,['decrypt']);
    await crypto.subtle.decrypt({name:'AES-GCM',iv:u8(D.i)},imp,u8(D.c));
    if(document.getElementById('rem').checked){var s=st();try{s&&s.setItem(K,btoa(String.fromCharCode.apply(null,raw)))}catch(_){}}
    await open(imp);
  }catch(x){
    btn.disabled=false;btn.textContent='Entra';err.textContent='Password errata';
    var f=document.getElementById('f');f.classList.remove('shake');void f.offsetWidth;f.classList.add('shake');
  }
});
// document.write funziona solo a pagina caricata: aspetta il load prima dell'auto-accesso
if(document.readyState==='complete')auto();else addEventListener('load',auto);
</script>
</body>
</html>
`;
writeFileSync(new URL('./index.html', import.meta.url), html);
console.log('OK → index.html cifrato (' + Math.round(html.length / 1024) + ' KB)');
