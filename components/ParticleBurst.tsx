import React from 'react';

const ParticleBurst: React.FC = () => {
  const particles = Array.from({ length: 12 });
  
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-visible z-50">
      <style>{`
        @keyframes burst-out {
          0% { transform: rotate(var(--angle)) translate(0px) scale(1); opacity: 1; }
          100% { transform: rotate(var(--angle)) translate(var(--dist)) scale(0); opacity: 0; }
        }
      `}</style>
      {particles.map((_, i) => {
        const angle = (i / 12) * 360;
        const dist = 60 + Math.random() * 30;
        const delay = Math.random() * 0.1;
        const color = Math.random() > 0.5 ? '#facc15' : '#ffffff'; 
        
        return (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full shadow-sm"
            style={{
              backgroundColor: color,
              ['--angle' as any]: `${angle}deg`,
              ['--dist' as any]: `${dist}px`,
              animation: `burst-out 0.6s ease-out forwards ${delay}s`
            }}
          />
        );
      })}
    </div>
  );
};

export default ParticleBurst;
