'use client';
import {useEffect,useState} from 'react';
import {authHeaders} from './client-session';
export default function PrivateImage({id,alt,className,admin=false}:{id:string;alt:string;className?:string;admin?:boolean}){
 const [src,setSrc]=useState(''),[error,setError]=useState(false);
 useEffect(()=>{let active=true,objectUrl='';const abort=new AbortController();setSrc('');setError(false);
 const clear=()=>{if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=''}if(active){setSrc('');setError(true)}};
 fetch('/api/image/'+encodeURIComponent(id),{headers:authHeaders(admin),credentials:'same-origin',cache:'no-store',signal:abort.signal}).then(async r=>{if(!r.ok)throw Error();return r.blob()}).then(blob=>{if(active){objectUrl=URL.createObjectURL(blob);setSrc(objectUrl)}}).catch(()=>{if(active)clear()});
 const verify=async()=>{try{const r=await fetch('/api/image-status/'+encodeURIComponent(id),{headers:authHeaders(admin),credentials:'same-origin',cache:'no-store',signal:abort.signal});if(!r.ok)clear()}catch{if(active)clear()}};
 const timer=setInterval(verify,15000),visible=()=>{if(!document.hidden)verify()};document.addEventListener('visibilitychange',visible);
 return()=>{active=false;abort.abort();clearInterval(timer);document.removeEventListener('visibilitychange',visible);if(objectUrl)URL.revokeObjectURL(objectUrl)};
 },[id,admin]);
 if(!src)return <span className={'image-placeholder '+(className||'')} role="status">{error?'Esta imagen ya no está disponible.':'Cargando imagen…'}</span>;
 return <img src={src} alt={alt} className={className}/>;
}
