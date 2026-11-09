'use client';
import {useEffect,useRef,useState} from 'react';
// Original, quiet instrumental phrase; no external audio, tracking or downloads.
const phrase=[72,76,79,76,74,77,81,77,76,79,84,79,74,77,79,71,72,76,79,84,81,79,77,74,76,79,77,74,72,null,67,null];
export default function ChristmasMusic(){
 const [playing,setPlaying]=useState(false),[error,setError]=useState('');
 const context=useRef<AudioContext|null>(null),timer=useRef<ReturnType<typeof setInterval>|null>(null),notes=useRef<OscillatorNode[]>([]),next=useRef(0),step=useRef(0);
 function clear(){if(timer.current)clearInterval(timer.current);timer.current=null;for(const note of notes.current)try{note.stop()}catch{}notes.current=[]}
 useEffect(()=>()=>{clear();context.current?.close()},[]);
 function schedule(){const audio=context.current;if(!audio||audio.state!=='running')return;while(next.current<audio.currentTime+.3){const i=step.current%phrase.length,midi=phrase[i],at=next.current;if(midi!==null){const oscillator=audio.createOscillator(),gain=audio.createGain();oscillator.type='sine';oscillator.frequency.value=440*Math.pow(2,(midi-69)/12);gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.055,at+.025);gain.gain.exponentialRampToValueAtTime(.001,at+.8);oscillator.connect(gain);gain.connect(audio.destination);notes.current.push(oscillator);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();notes.current=notes.current.filter(n=>n!==oscillator)};oscillator.start(at);oscillator.stop(at+.85)}next.current+=.48;step.current++}}
 async function toggle(){setError('');if(playing){clear();await context.current?.suspend();setPlaying(false);return}try{if(!context.current)context.current=new AudioContext();await context.current.resume();if(context.current.state!=='running')throw Error();next.current=context.current.currentTime+.04;schedule();timer.current=setInterval(schedule,120);setPlaying(true)}catch{clear();setPlaying(false);setError('No pudimos reproducir la música. Puedes volver a intentarlo.')}}
 return <aside className="music-control" aria-label="Música de la invitación"><button type="button" aria-pressed={playing} onClick={toggle}><span aria-hidden="true">{playing?'♫':'♪'}</span>{playing?'Desactivar música':'Activar música'}<span className="music-indicator" aria-hidden="true">{playing?'●':'○'}</span></button>{error&&<p role="status">{error}</p>}</aside>
}
