// Shared by all content mutations and physical deletion; no application content is logged.
export async function withContentLock<T>(env:any,operation:()=>Promise<T>):Promise<T>{
 const db=env.DB,owner=crypto.randomUUID(),now=Date.now();
 await db.prepare("INSERT OR IGNORE INTO locks(id,until,owner) VALUES('content',0,'')").run();
 const result=await db.prepare("UPDATE locks SET until=?,owner=? WHERE id='content' AND until<?").bind(now+120000,owner,now).run();
 if(!result.meta.changes)throw Object.assign(Error('Hay otra actualización en proceso. Tus cambios se conservan; vuelve a intentarlo.'),{status:409});
 try{return await operation()}finally{await db.prepare("UPDATE locks SET until=0 WHERE id='content' AND owner=?").bind(owner).run()}
}
