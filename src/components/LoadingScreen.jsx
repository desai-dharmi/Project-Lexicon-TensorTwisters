import { useEffect, useState } from 'react';
import './LoadingScreen.css';

export default function LoadingScreen() {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // Generate some random particles for the floating effect
    const newParticles = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 5}s`,
      animationDuration: `${4 + Math.random() * 4}s`,
      width: `${2 + Math.random() * 4}px`,
      height: `${2 + Math.random() * 4}px`,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="loading-screen">
      <div className="floating-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>
      
      {particles.map(p => (
        <div 
          key={p.id} 
          className="particle"
          style={{
            left: p.left,
            animationDelay: p.animationDelay,
            animationDuration: p.animationDuration,
            width: p.width,
            height: p.height
          }}
        />
      ))}

      <div className="loading-content">
        <h1 className="floating-text">Project Lexicon</h1>
        <p className="subtext">Initializing Environment...</p>
      </div>
    </div>
  );
}
