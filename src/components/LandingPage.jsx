// ═══════════════════════════════════════════════════════════════
// LANDING PAGE — 3D Interactive Hero with Project Explanation
// ═══════════════════════════════════════════════════════════════

import { useState, useCallback, useEffect, useRef } from 'react';
import { BLOCK_TYPE_LIST } from '../utils/constants';
import logoUrl from '../assets/logo.png';
import './LandingPage.css';

const FEATURES = [
  {
    icon: '🧩',
    title: 'Block-Based Composition',
    desc: 'Construct prompts from typed AST nodes — Role, Context, Constraint, Format, Tone, Example, and Output Length. Each block is a building block of the perfect AI prompt.',
  },
  {
    icon: '🎯',
    title: 'Custom Drag & Drop',
    desc: 'Hand-built pointer-event drag engine with real-time collision detection, ghost placeholders, and 60fps reorder animations. Zero external libraries.',
  },
  {
    icon: '⚡',
    title: 'Live Prompt Preview',
    desc: 'Watch your prompt compile in real-time with syntax highlighting. Every keystroke instantly reflects in the assembled output string.',
  },
  {
    icon: '⚖️',
    title: 'A/B Comparison Engine',
    desc: 'Character-level diff powered by a hand-rolled LCS algorithm. Toggle blocks to create variants and see exactly what changed — highlighted in green and red.',
  },
  {
    icon: '🤖',
    title: 'Mock AI Response',
    desc: 'Simulated AI output adapts to your prompt structure. More complete prompts produce richer, more detailed responses — demonstrating the impact of prompt engineering.',
  },
  {
    icon: '📜',
    title: 'History & Templates',
    desc: 'Snapshot your work, restore past versions, and save reusable templates. Everything persists in localStorage — zero backend required.',
  },
];

const CUBE_FACES = [
  {
    type: 'role', icon: '👤', label: 'Role', face: 'front',
    desc: 'Define the AI persona — tell the model WHO to be. Example: "You are a senior Python developer with 10 years of experience."',
    color: '#4A90FF',
  },
  {
    type: 'context', icon: '📋', label: 'Context', face: 'back',
    desc: 'Provide background information and situational framing. Example: "I am building a REST API for a healthcare startup."',
    color: '#A855F7',
  },
  {
    type: 'constraint', icon: '🔒', label: 'Constraint', face: 'right',
    desc: 'Set boundaries and limitations for the response. Example: "Do not use external libraries. Keep the code under 100 lines."',
    color: '#EF4444',
  },
  {
    type: 'format', icon: '📐', label: 'Format', face: 'left',
    desc: 'Specify the output structure and formatting. Example: "Respond in bullet points with code blocks and inline comments."',
    color: '#22C55E',
  },
  {
    type: 'tone', icon: '🎭', label: 'Tone', face: 'top',
    desc: 'Control the communication style and voice. Example: "Professional yet approachable. Avoid jargon, explain like I\'m a beginner."',
    color: '#F97316',
  },
  {
    type: 'example', icon: '💡', label: 'Example', face: 'bottom',
    desc: 'Show the AI what good output looks like. Example: "Input: \'sort array\' → Output: complete working function with tests."',
    color: '#06B6D4',
  },
];

// ─── Mouse Trail Component ──────────────────────────────────
const TRAIL_LENGTH = 20;

function MouseTrail() {
  const trailRef = useRef([]);
  const dotsRef = useRef([]);
  const rafRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    // Initialize trail positions
    trailRef.current = Array.from({ length: TRAIL_LENGTH }, () => ({ x: -100, y: -100 }));
    
    // Create dot elements
    const container = containerRef.current;
    if (!container) return;
    
    container.innerHTML = '';
    dotsRef.current = [];
    
    for (let i = 0; i < TRAIL_LENGTH; i++) {
      const dot = document.createElement('div');
      dot.className = 'trail-dot';
      const scale = 1 - (i / TRAIL_LENGTH);
      const opacity = 0.6 * scale;
      const size = 8 + 12 * scale;
      dot.style.width = `${size}px`;
      dot.style.height = `${size}px`;
      dot.style.opacity = opacity;
      container.appendChild(dot);
      dotsRef.current.push(dot);
    }

    const handleMouseMove = (e) => {
      trailRef.current[0] = { x: e.clientX, y: e.clientY };
    };

    const animate = () => {
      // Smooth follow — each dot lerps toward the one before it
      for (let i = TRAIL_LENGTH - 1; i > 0; i--) {
        const prev = trailRef.current[i - 1];
        const curr = trailRef.current[i];
        curr.x += (prev.x - curr.x) * 0.35;
        curr.y += (prev.y - curr.y) * 0.35;
      }

      // Apply positions
      for (let i = 0; i < TRAIL_LENGTH; i++) {
        const dot = dotsRef.current[i];
        if (dot) {
          dot.style.transform = `translate(${trailRef.current[i].x}px, ${trailRef.current[i].y}px) translate(-50%, -50%)`;
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return <div ref={containerRef} className="mouse-trail-container" />;
}

// ─── Generate particles ─────────────────────────────────────
function generateParticles(count) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const colors = ['#4A90FF', '#A855F7', '#22C55E', '#EF4444', '#06B6D4', '#F97316', '#EAB308'];
    particles.push({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 15,
      duration: 10 + Math.random() * 15,
      size: 2 + Math.random() * 3,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }
  return particles;
}

const particles = generateParticles(30);

// ─── Main Component ─────────────────────────────────────────
export default function LandingPage({ onEnter }) {
  const [exiting, setExiting] = useState(false);
  const [hoveredFace, setHoveredFace] = useState(null);
  const sceneRef = useRef(null);
  const cubeManualRef = useRef(false);

  const handleEnter = useCallback(() => {
    setExiting(true);
    setTimeout(() => onEnter(), 600);
  }, [onEnter]);

  // Mouse parallax for 3D scene + face detection
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const handleMouse = (e) => {
      const rect = scene.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
      const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
      
      const cube = scene.querySelector('.cube-container');
      if (cube) {
        cubeManualRef.current = true;
        cube.style.animationPlayState = 'paused';
        const rotX = -20 + y * 15;
        const rotY = x * 40;
        cube.style.transform = `translate(-50%, -50%) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
      }
    };

    const handleLeave = () => {
      const cube = scene.querySelector('.cube-container');
      if (cube) {
        cubeManualRef.current = false;
        cube.style.animationPlayState = 'running';
        cube.style.transform = '';
      }
    };

    scene.addEventListener('mousemove', handleMouse);
    scene.addEventListener('mouseleave', handleLeave);
    return () => {
      scene.removeEventListener('mousemove', handleMouse);
      scene.removeEventListener('mouseleave', handleLeave);
    };
  }, []);

  // Get the active face data
  const activeFaceData = hoveredFace 
    ? CUBE_FACES.find(f => f.face === hoveredFace) 
    : null;

  return (
    <div className={`landing-page ${exiting ? 'exiting' : ''}`}>
      {/* Mouse Trail */}
      <MouseTrail />

      {/* Background effects */}
      <div className="landing-bg">
        <div className="landing-grid" />
        <div className="landing-glow-1" />
        <div className="landing-glow-2" />
      </div>

      {/* Floating particles */}
      <div className="particles">
        {particles.map(p => (
          <div
            key={p.id}
            className="particle"
            style={{
              left: `${p.left}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: p.color,
              boxShadow: `0 0 6px ${p.color}`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Nav */}
      <nav className="landing-nav">
        <div className="nav-logo">
          <img src={logoUrl} alt="Lexicon" style={{ height: '34px', width: 'auto', objectFit: 'contain' }} />
          <span className="nav-brand">Project Lexicon</span>
        </div>
        <div className="nav-links">
          <button className="nav-link" onClick={() => document.querySelector('.landing-features')?.scrollIntoView({ behavior: 'smooth' })}>
            Features
          </button>
          <button className="nav-link" onClick={() => document.querySelector('.landing-blocks-showcase')?.scrollIntoView({ behavior: 'smooth' })}>
            Block Types
          </button>
          <button className="nav-link primary" onClick={handleEnter}>
            Launch App →
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot" />
            <span>Prompt Engineering Reinvented</span>
          </div>

          <h1 className="hero-title">
            <span className="title-line">Build Prompts</span>
            <span className="title-line title-gradient">Block by Block.</span>
          </h1>

          <p className="hero-subtitle">
            A visual, block-based interface for constructing, comparing, and optimizing 
            AI prompts. Drag typed blocks, see live compilation, and run character-level 
            diffs — all in your browser.
          </p>

          <div className="hero-actions">
            <button className="hero-btn-primary" onClick={handleEnter}>
              <span>⚡</span>
              <span>Start Building</span>
            </button>
            <button className="hero-btn-secondary" onClick={() => document.querySelector('.landing-features')?.scrollIntoView({ behavior: 'smooth' })}>
              Learn More ↓
            </button>
          </div>
        </div>

        {/* 3D Cube Scene */}
        <div className="hero-3d-scene" ref={sceneRef}>
          <div className="cube-container">
            {CUBE_FACES.map(f => (
              <div 
                key={f.type} 
                className={`cube-face ${f.face} ${f.type}`}
                onMouseEnter={() => setHoveredFace(f.face)}
                onMouseLeave={() => setHoveredFace(null)}
              >
                <span className="face-icon">{f.icon}</span>
                <span>{f.label}</span>
              </div>
            ))}
          </div>

          {/* Orbit rings */}
          <div className="orbit-ring orbit-ring-1">
            <div className="orbit-dot orbit-dot-1" />
          </div>
          <div className="orbit-ring orbit-ring-2">
            <div className="orbit-dot orbit-dot-2" />
          </div>

          {/* Face Info Tooltip */}
          <div className={`cube-tooltip ${activeFaceData ? 'visible' : ''}`}>
            {activeFaceData && (
              <>
                <div className="cube-tooltip-header" style={{ color: activeFaceData.color }}>
                  <span className="cube-tooltip-icon">{activeFaceData.icon}</span>
                  <span className="cube-tooltip-label">{activeFaceData.label}</span>
                  <div className="cube-tooltip-indicator" style={{ background: activeFaceData.color }} />
                </div>
                <p className="cube-tooltip-desc">{activeFaceData.desc}</p>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="landing-stats">
          <div className="stat-item">
            <div className="stat-value">7</div>
            <div className="stat-label">Block Types</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">0</div>
            <div className="stat-label">Dependencies</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">60</div>
            <div className="stat-label">FPS Target</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">LCS</div>
            <div className="stat-label">Diff Algorithm</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">∞</div>
            <div className="stat-label">Templates</div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="landing-features">
        <div className="features-header">
          <h2>Engineered for Precision</h2>
          <p>Every feature hand-crafted with zero external libraries. Pure React, pure performance.</p>
        </div>
        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3D Block Type Showcase */}
      <section className="landing-blocks-showcase">
        <div className="blocks-showcase-header">
          <h2>7 Typed Building Blocks</h2>
          <p>Each block maps to a semantic prompt component</p>
        </div>
        <div className="blocks-3d-row">
          {BLOCK_TYPE_LIST.map(bt => (
            <div key={bt.id} className="block-3d-card tooltip-container" data-type={bt.id}>
              <div className="block-3d-front">
                <span className="block-3d-icon">{bt.icon}</span>
                <span className="block-3d-label">{bt.label}</span>
                <div className="block-3d-line" />
              </div>
              <div className="block-hover-tooltip" style={{ borderTop: `3px solid ${bt.color}` }}>
                <strong>{bt.label}</strong>
                <p>{bt.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="landing-cta">
        <h2>Ready to Engineer<br/>Better Prompts?</h2>
        <p>No signup. No backend. Just open the app and start building prompts that produce better AI outputs.</p>
        <button className="hero-btn-primary" onClick={handleEnter} style={{ margin: '0 auto' }}>
          <span>🚀</span>
          <span>Launch Project Lexicon</span>
        </button>
      </section>
    </div>
  );
}
