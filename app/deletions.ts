import {withContentLock} from './content-lock';
import {syncExcel} from './excel';
const stamp=()=>new Date().toISOString();
const idsFrom=(value:any)=>{const ids=new Set<string>();const walk=(v:any)=>{if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object'){if(typeof v.image==='string'&&v.image)ids.add(v.image);Object.values(v).forEach(walk)}};walk(value);return ids};
export async function beginDeletion(env:any,participantId:string,version:number){
 // Caller holds content lock, so in-flight uploads and edits finish before this snapshot.
 const db=env.DB,old=await db.prepare('SELECT * FROM deletion_jobs WHERE participant_id=?').bind(participantId).first();if(old)return old;
 const p=await db.prepare('SELECT * FROM participants WHERE id=?').bind(participantId).first();if(!p)throw Object.assign(Error('Participante no encontrado.'),{status:404});if(p.version!==version)throw Object.assign(Error('La cartita cambió. Actualiza la lista y revisa de nuevo.'),{status:409});
 const trash=(await db.prepare('SELECT snapshot FROM letter_trash WHERE participant_id=?').bind(participantId).all()).results;
 const ids=idsFrom([JSON.parse(p.draft),p.published?JSON.parse(p.published):[],...trash.map((t:any)=>JSON.parse(t.snapshot))]);
 const owned=(await db.prepare('SELECT id FROM images WHERE owner=?').bind(participantId).all()).results;owned.forEach((i:any)=>ids.add(i.id));
 const jobId=crypto.randomUUID(),created=stamp();
 const statements=[db.prepare("INSERT INTO outbox(created) VALUES(?)").bind(created),db.prepare("INSERT INTO deletion_jobs(id,participant_id,outbox_id,created,updated) SELECT ?,?,max(id),?,? FROM outbox").bind(jobId,participantId,created,created),db.prepare("UPDATE participants SET draft='[]',published=NULL,letter_state='purging',version=version+1,updated=? WHERE id=? AND version=?").bind(created,participantId,version),db.prepare('DELETE FROM letter_trash WHERE participant_id=?').bind(participantId),db.prepare('INSERT INTO sync_meta(id,revision) VALUES(1,1) ON CONFLICT(id) DO UPDATE SET revision=revision+1')];
 for(const id of ids)statements.push(db.prepare('INSERT INTO deletion_assets(id,job_id,image_id) VALUES(?,?,?)').bind(crypto.randomUUID(),jobId,id));
 statements.push(db.prepare('INSERT INTO admin_audit(id,actor,action,target,detail,created) VALUES(?,?,?,?,?,?)').bind(crypto.randomUUID(),'administradora','solicitar eliminación definitiva',participantId,'Operación '+jobId,created));
 await db.batch(statements);return db.prepare('SELECT * FROM deletion_jobs WHERE id=?').bind(jobId).first();
}
async function referenced(db:any,imageId:string){
 const pattern='%'+imageId+'%';
 // Every live or recoverable record is protected, including duplicate/retired records.
 return !!await db.prepare('SELECT id FROM participants WHERE draft LIKE ? OR published LIKE ? UNION ALL SELECT id FROM letter_trash WHERE snapshot LIKE ? LIMIT 1').bind(pattern,pattern,pattern).first();
}
async function deleteAsset(env:any,asset:any){return withContentLock(env,async()=>{
 const db=env.DB;if(await referenced(db,asset.image_id)){await db.prepare("UPDATE deletion_assets SET state='shared' WHERE id=?").bind(asset.id).run();return}
 const files=(await db.prepare('SELECT object_key FROM image_files WHERE image_id=?').bind(asset.image_id).all()).results;
 const keys=new Set<string>([asset.image_id,...files.map((f:any)=>f.object_key)]);
 // No thumbnails are currently generated. Future derivatives must be registered in image_files.
 // Also purge namespaced derivative objects belonging to this image, with paginated listing.
 let cursor: string|undefined;
 do{const page=await env.BUCKET.list({prefix:asset.image_id+'/',...(cursor?{cursor}:{})});for(const o of page.objects)keys.add(o.key);cursor=page.truncated?page.cursor:undefined}while(cursor);
 for(const key of keys){const shared=await db.prepare('SELECT id FROM image_files WHERE object_key=? AND image_id!=? LIMIT 1').bind(key,asset.image_id).first();if(shared)continue;await env.BUCKET.delete(key);if(await env.BUCKET.head(key))throw Error('El almacenamiento aún conserva un archivo. Puedes reintentar la eliminación.');}
 await db.batch([db.prepare('DELETE FROM image_files WHERE image_id=?').bind(asset.image_id),db.prepare('DELETE FROM images WHERE id=?').bind(asset.image_id),db.prepare("UPDATE deletion_assets SET state='deleted' WHERE id=?").bind(asset.id)]);
})}
export async function processDeletions(env:any,onlyJob?:string){
 const db=env.DB;if(!db)return {ok:false,message:'El servicio no está disponible.'};
 const jobs=(await db.prepare("SELECT * FROM deletion_jobs WHERE state!='done'"+(onlyJob?' AND id=?':' AND (attempts=0 OR updated<?)')+' ORDER BY created LIMIT 5').bind(...(onlyJob?[onlyJob]:[new Date(Date.now()-30000).toISOString()])).all()).results;
 for(const job of jobs){try{
  await db.prepare('UPDATE deletion_jobs SET attempts=attempts+1,updated=? WHERE id=?').bind(stamp(),job.id).run();
  const assets=(await db.prepare("SELECT * FROM deletion_assets WHERE job_id=? AND state='pending'").bind(job.id).all()).results;
  for(const asset of assets)await deleteAsset(env,asset);
  await db.prepare("UPDATE deletion_jobs SET storage_state='done',error=NULL,updated=? WHERE id=?").bind(stamp(),job.id).run();
 }catch{await db.prepare("UPDATE deletion_jobs SET error=?,updated=? WHERE id=?").bind('No se pudo terminar el borrado de archivos. Los datos ya no están disponibles; pulsa Reintentar.',stamp(),job.id).run();}}
 // Excel is a mandatory stage. Even with no Microsoft connection, never report a completed deletion.
 if(jobs.length)await syncExcel(env,{force:true});
 for(const job of jobs){const remaining=await db.prepare("SELECT id FROM outbox WHERE id<=? AND state!='done' LIMIT 1").bind(job.outbox_id).first();
  if(!remaining)await db.prepare("UPDATE deletion_jobs SET excel_state='done',updated=? WHERE id=?").bind(stamp(),job.id).run();
  else await db.prepare("UPDATE deletion_jobs SET error=CASE WHEN storage_state='done' THEN ? ELSE error END,updated=? WHERE id=?").bind('El borrado local avanzó; falta confirmar la retirada de filas en Excel. Revisa la conexión y reintenta.',stamp(),job.id).run();
  const fresh=await db.prepare('SELECT * FROM deletion_jobs WHERE id=?').bind(job.id).first();
  if(fresh.storage_state==='done'&&fresh.excel_state==='done')await withContentLock(env,async()=>{await db.batch([db.prepare("UPDATE participants SET draft='[]',published=NULL,letter_state='erased' WHERE id=? AND letter_state='purging'").bind(job.participant_id),db.prepare('DELETE FROM deletion_assets WHERE job_id=?').bind(job.id),db.prepare("UPDATE deletion_jobs SET state='done',error=NULL,updated=? WHERE id=?").bind(stamp(),job.id)])});
 }
 return {ok:true,message:'Estado de eliminación actualizado.'};
}
