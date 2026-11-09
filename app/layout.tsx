import type { Metadata } from 'next';
import './globals.css';
import ChristmasMusic from './christmas-music';
export const metadata: Metadata={title:'Navidad con la Familia Jurado',description:'Una invitación especial para compartir, regalar y celebrar. Familia Jurado Alania · 25/12/2026.',referrer:'no-referrer',robots:{index:false,follow:false},icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es-PE"><body>{children}<ChristmasMusic/></body></html>}
