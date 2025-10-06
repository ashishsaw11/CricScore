import React, { useEffect, useState } from 'react';
import { MatchState } from '../../types';

interface Props { match: MatchState; }

// Simple confetti generation without external deps
const ConfettiOverlay: React.FC<Props> = ({ match }) => {
  const [bursts, setBursts] = useState<{ id:number; created:number; type:string }[]>([]);

  useEffect(()=>{
    const hist = match.currentOverHistory;
    if(!hist || hist.length === 0) return;
    const last = hist[hist.length-1];
    if(['4','6','W'].some(k=> last.includes(k))){
      const id = Date.now();
      setBursts(b=>[...b,{id,created:id,type:last.includes('W')?'wicket': last.includes('6')?'six':'four'}]);
      const timeout = setTimeout(()=>{
        setBursts(b=> b.filter(x=> x.id!==id));
      }, 4000); // Increased to 4s to match animation duration
      return ()=> clearTimeout(timeout);
    }
  },[match.currentOverHistory]);

  if(bursts.length===0) return null;
  const pieces = 80;
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {bursts.map(b=> (
        <div key={b.id} className="absolute inset-0">
          {Array.from({length: pieces}).map((_,i)=>{
            const left = Math.random()*100;
            const delay = Math.random()*0.3;
            const duration = 2.5 + Math.random()*1.5;
            const size = 6+Math.random()*6;
            const rotate = Math.random()*360;
            const colors = b.type==='wicket' ? ['#dc2626','#7f1d1d','#ef4444'] : b.type==='six' ? ['#065f46','#10b981','#34d399'] : ['#1d4ed8','#3b82f6','#93c5fd'];
            const color = colors[i%colors.length];
            return <span key={i} style={{
              position:'absolute',
              left: left+'%',
              top: '-10px',
              width: size,
              height: size*0.6,
              background: color,
              transform:`rotate(${rotate}deg)`,
              animation: `fall ${duration}s linear ${delay}s forwards`,
              borderRadius:2,
              display:'block'
            }} />;
          })}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`text-5xl font-extrabold tracking-wide drop-shadow-lg ${b.type==='wicket'?'text-red-600':'text-white'} animate-pulse`}>{b.type==='wicket'?'WICKET!': b.type==='six'?'SIX!':'FOUR!'}</div>
          </div>
        </div>
      ))}
      <style>{`@keyframes fall {0%{transform:translateY(0) rotate(0deg);}100%{transform:translateY(110vh) rotate(720deg);opacity:0;}}`}</style>
    </div>
  );
};

export default ConfettiOverlay;