'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const WEDDING_DATE = new Date('2027-11-06T17:00:00');

function useCountdown() {
  const [time, setTime] = useState({ days:0, hours:0, minutes:0, seconds:0 });
  useEffect(() => {
    function tick() {
      const diff = WEDDING_DATE - new Date();
      if (diff <= 0) return;
      setTime({ days:Math.floor(diff/86400000), hours:Math.floor((diff%86400000)/3600000), minutes:Math.floor((diff%3600000)/60000), seconds:Math.floor((diff%60000)/1000) });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);
  const [password, setPassword]   = useState('');
  const [error, setError]         = useState('');
  const [shaking, setShaking]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const inputRef = useRef(null);
  const router = useRouter();
  const { days, hours, minutes, seconds } = useCountdown();

  useEffect(() => {
    const petals = ['🌸','🌷','✿','❀','🌺'];
    const container = document.getElementById('petals');
    if (!container) return;
    function spawn() {
      const p = document.createElement('div');
      p.textContent = petals[Math.floor(Math.random()*petals.length)];
      const dur = 9 + Math.random()*13;
      Object.assign(p.style, { position:'absolute', top:'-30px', left:Math.random()*100+'vw', fontSize:(11+Math.random()*13)+'px', opacity:'0', animation:`petalFall ${dur}s linear forwards`, animationDelay:(Math.random()*dur*0.3)+'s', pointerEvents:'none', userSelect:'none' });
      container.appendChild(p);
      setTimeout(() => p.remove(), (dur+4)*1000);
    }
    for (let i=0;i<10;i++) setTimeout(spawn, i*900);
    const id = setInterval(spawn, 2200);
    return () => clearInterval(id);
  }, []);

  function openModal() { setModalOpen(true); setTimeout(() => inputRef.current?.focus(), 300); }
  function closeOverlay(e) { if (e?.target?.id==='overlay') { setModalOpen(false); setPassword(''); setError(''); } }
  function handleKey(e) { if (e.key==='Enter') checkPassword(); if (e.key==='Escape') { setModalOpen(false); setPassword(''); setError(''); } }

  function checkPassword() {
    if (password==='062227') { setLoading(true); router.push('/planner'); }
    else { setError('Incorrect password — try again 🌷'); setShaking(true); setPassword(''); setTimeout(()=>setShaking(false),500); inputRef.current?.focus(); }
  }

  const countUnit = (val, label) => (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, minWidth:60 }}>
      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(30px,5vw,54px)', fontWeight:300, lineHeight:1, color:'white', textShadow:'0 2px 20px rgba(0,0,0,0.3)' }}>
        {String(val).padStart(2,'0')}
      </div>
      <div style={{ fontSize:9, letterSpacing:'0.25em', textTransform:'uppercase', color:'rgba(255,255,255,0.5)', fontWeight:300 }}>{label}</div>
    </div>
  );

  const dot = <div style={{ fontSize:'clamp(22px,3vw,38px)', color:'rgba(255,255,255,0.3)', fontFamily:"'Cormorant Garamond',serif", lineHeight:1, marginBottom:16, alignSelf:'flex-start', marginTop:4 }}>·</div>;

  return (
    <div style={{ position:'fixed', inset:0, overflow:'hidden', background:'#1a1218' }}>
      {/* Hero */}
      <div style={{ position:'absolute', inset:0, backgroundImage:'url(/hero.jpg)', backgroundSize:'cover', backgroundPosition:'center 75%', backgroundRepeat:'no-repeat' }} />
      {/* Vignette */}
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at center,transparent 20%,rgba(15,8,12,0.4) 100%),linear-gradient(to bottom,rgba(15,8,12,0.08) 0%,rgba(15,8,12,0.55) 100%)', pointerEvents:'none' }} />
      {/* Petals */}
      <div id="petals" style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden', zIndex:1 }} />

      {/* Title */}
      <div style={{ position:'absolute', inset:0, zIndex:2, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', pointerEvents:'none', gap:0 }}>
        <div style={{ fontSize:11, letterSpacing:'0.38em', textTransform:'uppercase', color:'rgba(255,255,255,0.6)', marginBottom:16, fontWeight:300, animation:'titleReveal 2s ease both' }}>Together in love · Forever begins</div>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(52px,8.5vw,112px)', fontWeight:300, lineHeight:1, color:'white', textShadow:'0 2px 48px rgba(0,0,0,0.28)', animation:'titleReveal 2.2s ease both' }}>
          <em style={{ fontStyle:'italic', color:'#f2cfd8' }}>Anay</em>
          <span style={{ fontStyle:'italic', color:'rgba(245,230,208,0.72)', fontSize:'0.7em', verticalAlign:'middle', margin:'0 14px' }}>&</span>
          Oscar
        </div>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(16px,2vw,24px)', color:'rgba(245,230,208,0.8)', letterSpacing:'0.18em', fontWeight:300, fontStyle:'italic', marginTop:18, marginBottom:36, animation:'titleReveal 2.4s ease both' }}>
          November 6th, 2027
        </div>
        {/* Countdown */}
        <div style={{ display:'flex', alignItems:'flex-start', gap:14, animation:'titleReveal 2.6s ease both' }}>
          {countUnit(days,'Days')} {dot} {countUnit(hours,'Hours')} {dot} {countUnit(minutes,'Mins')} {dot} {countUnit(seconds,'Secs')}
        </div>
      </div>

      {/* Hint */}
      <div onClick={openModal} style={{ position:'absolute', bottom:38, left:'50%', transform:'translateX(-50%)', fontSize:11, letterSpacing:'0.25em', textTransform:'uppercase', color:'rgba(255,255,255,0.45)', fontWeight:300, animation:'hintPulse 2.5s ease-in-out infinite', zIndex:3, whiteSpace:'nowrap', cursor:'pointer' }}>
        Tap anywhere to continue →
      </div>
      {!modalOpen && <div onClick={openModal} style={{ position:'absolute', inset:0, zIndex:2, cursor:'pointer' }} />}

      {/* Modal */}
      {modalOpen && (
        <div id="overlay" onClick={closeOverlay} style={{ position:'fixed', inset:0, zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(14px)', animation:'overlayIn .35s ease both' }}>
          <div onClick={e=>e.stopPropagation()} style={{ position:'relative', width:360, maxWidth:'90vw', borderRadius:28, padding:'42px 40px 36px', textAlign:'center', overflow:'hidden', cursor:'default', background:'linear-gradient(135deg,rgba(255,255,255,0.22),rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.15))', backdropFilter:'blur(40px) saturate(1.8)', WebkitBackdropFilter:'blur(40px) saturate(1.8)', border:'1px solid rgba(255,255,255,0.35)', boxShadow:'0 0 0 1px rgba(255,255,255,0.12) inset,0 30px 80px rgba(0,0,0,0.3)', animation:'glassIn .5s cubic-bezier(0.34,1.56,0.64,1) both' }}>
            <div style={{ position:'absolute', top:'-50%', left:'-60%', width:'120%', height:'80%', background:'linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.15) 50%,transparent 60%)', borderRadius:'50%', pointerEvents:'none', animation:'shimmer 4s ease-in-out infinite' }} />
            <div style={{ fontSize:32, marginBottom:14 }}>🌸</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:400, fontStyle:'italic', color:'white', marginBottom:6 }}>Welcome back, love</div>
            <div style={{ fontSize:11, letterSpacing:'0.18em', textTransform:'uppercase', color:'rgba(255,255,255,0.6)', fontWeight:300, marginBottom:28 }}>Enter your password to continue</div>
            <input ref={inputRef} type="password" placeholder="Enter password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={handleKey} maxLength={20}
              style={{ width:'100%', padding:'14px 18px', borderRadius:14, border:'1px solid rgba(255,255,255,0.3)', background:'rgba(255,255,255,0.12)', color:'white', fontSize:16, letterSpacing:'0.3em', textAlign:'center', outline:'none', marginBottom:16, fontFamily:"'Jost',sans-serif", animation:shaking?'shake 0.4s ease':'none' }} />
            <button onClick={checkPassword} disabled={loading}
              style={{ width:'100%', padding:14, borderRadius:14, border:'none', background:'linear-gradient(135deg,rgba(201,110,135,0.85),rgba(176,90,117,0.9))', color:'white', fontSize:13, fontWeight:500, letterSpacing:'0.12em', textTransform:'uppercase', cursor:loading?'wait':'pointer', fontFamily:"'Jost',sans-serif" }}>
              {loading?'Entering…':'Enter ✦'}
            </button>
            {error && <div style={{ fontSize:11, color:'rgba(255,160,160,0.9)', marginTop:12, animation:'shake 0.4s ease' }}>{error}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
