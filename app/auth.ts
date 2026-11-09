import { env } from 'cloudflare:workers';
import { scryptAsync } from '@noble/hashes/scrypt.js';
export const E=()=>env as any;
export const DB=()=>E().DB;
export const now=()=>new Date().toISOString();
export const randomToken=()=>crypto.randomUUID()+crypto.randomUUID().replaceAll('-','');
export const text=(v:any,max=2000)=>typeof v==='string'?v.trim().slice(0,max):'';
export class Problem extends Error{constructor(message:string,public status=400,public extra:any={}){super(message)}}
export const reply=(body:any,status=200,headers:any={})=>Response.json(body,{status,headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer',...headers}});
export async function digest(v:string){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)))].map(x=>x.toString(16).padStart(2,'0')).join('')}
const equal=(a:string,b:string)=>{let diff=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)diff|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return diff===0};
export function passwordValid(v:any){return typeof v==='string'&&v.length>=12&&v.length<=128}
export async function passwordHash(password:string,salt=crypto.randomUUID()){
 const bytes=await scryptAsync(new TextEncoder().encode(password),new TextEncoder().encode(salt),{N:16384,r:8,p:5,dkLen:32,maxmem:48*1024*1024,asyncTick:10});
 return 'scrypt$16384$8$5$'+salt+'$'+[...bytes].map(x=>x.toString(16).padStart(2,'0')).join('');
}
export async function passwordMatches(password:string,encoded?:string){const salt=encoded?.split('$')[4]||'dummy-salt-for-invalid-credentials';const computed=await passwordHash(typeof password==='string'?password.slice(0,128):'',salt);return !!encoded&&equal(computed,encoded)}
export function cookie(name:string,value:string,remember=false,kind='participant'){return `${name}=${value}; HttpOnly; Secure; SameSite=${kind==='admin'?'Strict':'Lax'}; Path=/${remember?'; Max-Age=15552000':''}`}
export function bearer(req:Request,kind='participant'){const header=req.headers.get('authorization')||'';if(header.startsWith('Bearer '))return header.slice(7);return (req.headers.get('cookie')||'').match(new RegExp('(?:^|; )'+(kind==='admin'?'jurado_admin':'jurado')+'=([^;]+)'))?.[1]||''}
export async function issue(kind:string,subject:string,revision:number,remember=false){const token=randomToken();await DB().prepare('INSERT INTO app_sessions(hash,kind,subject,revision,expires,created) VALUES(?,?,?,?,?,?)').bind(await digest(token),kind,subject,revision,Date.now()+(kind==='admin'?2*3600000:remember?180*86400000:12*3600000),now()).run();return token}
export async function participant(req:Request){const token=bearer(req);if(!token)return null;const hash=await digest(token);const p=await DB().prepare("SELECT p.* FROM app_sessions s JOIN participants p ON p.id=s.subject LEFT JOIN participant_accounts a ON a.participant_id=p.id WHERE s.hash=? AND s.kind='participant' AND s.expires>? AND s.revision=COALESCE(a.revision,0) AND p.revoked=0").bind(hash,Date.now()).first();if(p)return p;
 // Legacy personal links remain compatible and revocable.
 return DB().prepare('SELECT * FROM participants WHERE token_hash=? AND revoked=0').bind(hash).first();
}
export async function administrator(req:Request){const token=bearer(req,'admin');if(!token)return false;return !!await DB().prepare("SELECT a.id FROM app_sessions s JOIN admin_account a ON a.id=1 WHERE s.hash=? AND s.kind='admin' AND s.subject='1' AND s.revision=a.revision AND s.expires>?").bind(await digest(token),Date.now()).first()}
export function isOwner(req:Request){const email=req.headers.get('oai-authenticated-user-email');return !!email&&!!E().ADMIN_EMAIL&&equal(email.toLowerCase(),E().ADMIN_EMAIL.toLowerCase())}
export const adminError='No pudimos verificar tus datos de acceso. Revisa tu DNI y contraseña.';
export function correctDni(value:any){return typeof value==='string'&&/^\d{8}$/.test(value)&&!!E().ADMIN_DNI&&equal(value,E().ADMIN_DNI)}
export async function auditEntry(action:string,target:string|null=null,detail='',actor='administradora'){return DB().prepare('INSERT INTO admin_audit(id,actor,action,target,detail,created) VALUES(?,?,?,?,?,?)').bind(crypto.randomUUID(),actor,action,target,detail,now())}
export async function gate(req:Request,scope:string,identity=''){const ip=req.headers.get('cf-connecting-ip')||'local';const keys=[scope+':ip:'+await digest(ip),scope+':account:'+await digest(identity.toLowerCase())];for(const k of keys){const row=await DB().prepare('SELECT blocked_until FROM auth_attempts WHERE id=?').bind(k).first();if(row?.blocked_until>Date.now())throw new Problem(scope==='admin'?adminError:'No pudimos iniciar sesión. Revisa tus datos o espera unos minutos.',429,{retryAfter:Math.ceil((row.blocked_until-Date.now())/1000)})}return keys}
export async function failed(keys:string[]){for(const k of keys)await DB().prepare('INSERT INTO auth_attempts(id,failures,updated) VALUES(?,1,?) ON CONFLICT(id) DO UPDATE SET failures=CASE WHEN updated<? THEN 1 ELSE failures+1 END,blocked_until=CASE WHEN updated>=? AND failures+1>=5 THEN ? ELSE 0 END,updated=?').bind(k,Date.now(),Date.now()-900000,Date.now()-900000,Date.now()+900000,Date.now()).run()}
export async function succeeded(keys:string[]){for(const k of keys)await DB().prepare('DELETE FROM auth_attempts WHERE id=?').bind(k).run()}
export async function queueStatement(){return DB().prepare('INSERT INTO outbox(created) VALUES(?)').bind(now())}
export async function rate(req:Request,key:string,max:number){const ip=req.headers.get('cf-connecting-ip')||'local';const id=key+await digest(ip)+':'+Math.floor(Date.now()/3600000);const r=await DB().prepare('INSERT INTO limits(id,count) VALUES(?,1) ON CONFLICT(id) DO UPDATE SET count=count+1 RETURNING count').bind(id).first();if(r.count>max)throw new Problem('Se hicieron varios intentos. Espera unos minutos antes de continuar.',429)}
export function safe(p:any){return {id:p.id,name:p.name,label:p.label,draft:JSON.parse(p.draft),published:p.published?JSON.parse(p.published):null,version:p.version,created:p.created,updated:p.updated,letterState:p.letter_state}}
