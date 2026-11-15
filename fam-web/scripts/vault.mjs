import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { id } from './crypto.mjs';
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const PRIVATE = path.join(ROOT, '.local');
const vaultPath = path.join(PRIVATE, 'registry.dpapi');
export function dpapi(data, decrypt = false) {
  if (process.platform !== 'win32') throw Error('Локальное хранилище требует Windows DPAPI. Перенос: используйте зашифрованную резервную копию.');
  const method = decrypt ? 'Unprotect' : 'Protect';
  return new Promise((resolve,reject) => {
    const ps = spawn('powershell.exe',['-NoProfile','-NonInteractive','-Command',`Add-Type -AssemblyName System.Security; $v=[Convert]::FromBase64String([Console]::In.ReadToEnd()); $r=[Security.Cryptography.ProtectedData]::${method}($v,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser); [Console]::Out.Write([Convert]::ToBase64String($r))`],{windowsHide:true,stdio:['pipe','pipe','pipe']});
    let out='',err=''; ps.stdout.on('data',b=>out+=b);ps.stderr.on('data',b=>err+=b);
    ps.on('error',reject);ps.on('close',c=>c===0?resolve(Buffer.from(out.trim(),'base64')):reject(Error('Ошибка защищённого хранилища DPAPI'))); ps.stdin.end(Buffer.from(data).toString('base64'));
  });
}
export async function loadVault() {
  await fs.mkdir(PRIVATE,{recursive:true});
  try { return JSON.parse((await dpapi(await fs.readFile(vaultPath),true)).toString()); }
  catch(e) { if(e.code!=='ENOENT') throw e; return {version:1,source:path.resolve(ROOT,'../Storage'),epochs:{},current:id(),users:[],records:{},cache:{},modules:[],created:new Date().toISOString()}; }
}
export async function saveVault(v) {
  if(!v.epochs[v.current]) v.epochs[v.current]=randomBytes(32).toString('base64');
  const encrypted=await dpapi(Buffer.from(JSON.stringify(v)));
  await fs.writeFile(vaultPath+'.tmp',encrypted);await fs.rename(vaultPath+'.tmp',vaultPath);
}
export function rotate(v,userId) { const u=v.users.find(u=>u.id===userId);if(!u)throw Error('Доступ не найден');u.active=false;v.current=id();v.epochs[v.current]=randomBytes(32).toString('base64'); }
