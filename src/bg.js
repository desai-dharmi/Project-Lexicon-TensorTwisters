// ═══════════════════════════════════════════════════════════════
// BG.JS — Cinematic Animated Background Engine
// Modular • Reusable • High-Performance Canvas Particle System
// ═══════════════════════════════════════════════════════════════

/**
 * CinematicBackground — a self-contained, high-performance particle
 * system rendered to a full-screen <canvas>. Designed to be dropped
 * into any project without touching existing app logic.
 *
 * Features:
 *  • Dual-layer depth particles (background + foreground)
 *  • Neural-network connection lines with proximity opacity
 *  • Mouse attraction with smooth easing
 *  • Click energy-pulse burst
 *  • Cursor radial glow (separate DOM element)
 *  • Adaptive particle count & FPS throttling
 *  • Fully configurable color palette
 */

export default class CinematicBackground {
  // ─── Default Configuration ──────────────────────────────────
  static DEFAULTS = {
    // Color palette — easily swap for any theme
    palette: ['#00C2FF', '#7F5AF0', '#2CB67D'],

    // Particle tuning
    particleDensity: 0.000045,   // particles per px² (yields ~60-100 on 1080p)
    minParticles: 40,
    maxParticles: 120,

    // Connection (neural) lines
    connectionDistance: 170,      // px threshold
    connectionLineWidth: 1.5,

    // Mouse interaction
    mouseAttractionRadius: 200,
    mouseAttractionStrength: 0.012,
    mouseConnectionBoost: 2.0,   // opacity multiplier near cursor

    // Click pulse
    pulseForce: 3.5,
    pulseRadius: 180,
    pulseDuration: 400,          // ms

    // Cursor glow
    glowSize: 420,               // px diameter
    glowOpacity: 0.25,

    // Depth layers
    bgLayerOpacity: 0.65,
    bgLayerSpeedFactor: 0.4,
    fgLayerOpacity: 1.0,
    fgLayerSpeedFactor: 1.0,

    // Performance
    fpsThrottleThreshold: 30,    // if FPS drops below this, reduce work
    maxConnectionChecks: 12000,  // cap on pairwise distance checks per frame
  };

  // ─── Constructor ────────────────────────────────────────────
  constructor(containerEl, userConfig = {}) {
    this.config = { ...CinematicBackground.DEFAULTS, ...userConfig };
    this.container = containerEl;

    // State
    this.particles = [];
    this.mouse = { x: -9999, y: -9999, active: false };
    this.pulses = [];
    this.animationId = null;
    this.running = false;
    this.parallax = { x: 0, y: 0 };
    this.targetParallax = { x: 0, y: 0 };

    // Performance tracking
    this._lastFrameTime = 0;
    this._frameCount = 0;
    this._fpsAccum = 0;
    this._currentFps = 60;
    this._lowPerfMode = false;

    // Bind methods
    this._onResize = this._onResize.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseLeave = this._onMouseLeave.bind(this);
    this._onClick = this._onClick.bind(this);
    this._animate = this._animate.bind(this);

    this._setup();
  }

  // ─── Setup ──────────────────────────────────────────────────
  _setup() {
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'cb-canvas';
    this.ctx = this.canvas.getContext('2d');
    this.container.appendChild(this.canvas);

    // Create cursor-glow DOM element
    this.glow = document.createElement('div');
    this.glow.className = 'cb-glow';
    this.container.appendChild(this.glow);

    // Size canvas to viewport
    this._resize();

    // Spawn particles
    this._spawnParticles();

    // Listen
    window.addEventListener('resize', this._onResize);
    window.addEventListener('mousemove', this._onMouseMove);
    window.addEventListener('mouseleave', this._onMouseLeave);
    window.addEventListener('click', this._onClick);
  }

  // ─── Start / Stop ──────────────────────────────────────────
  start() {
    if (this.running) return;
    this.running = true;
    this._lastFrameTime = performance.now();
    this.animationId = requestAnimationFrame(this._animate);
  }

  stop() {
    this.running = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  destroy() {
    this.stop();
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('mouseleave', this._onMouseLeave);
    window.removeEventListener('click', this._onClick);

    this.canvas.remove();
    this.glow.remove();
    this.particles = [];
    this.pulses = [];
  }

  // ─── Theme Switching ───────────────────────────────────────
  setTheme(palette) {
    this.config.palette = palette;
    this.particles.forEach(p => {
      p.color = this._pickColor();
    });
  }

  // ─── Particle Spawning ─────────────────────────────────────
  _spawnParticles() {
    const { particleDensity, minParticles, maxParticles } = this.config;
    const area = this.w * this.h;
    let count = Math.round(area * particleDensity);
    count = Math.max(minParticles, Math.min(maxParticles, count));

    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push(this._createParticle());
    }
  }

  _createParticle(x, y) {
    const isForeground = Math.random() > 0.45; // ~55 % foreground
    const speedBase = 0.15 + Math.random() * 0.35;
    const layerSpeed = isForeground
      ? speedBase * this.config.fgLayerSpeedFactor
      : speedBase * this.config.bgLayerSpeedFactor;

    return {
      x: x ?? Math.random() * this.w,
      y: y ?? Math.random() * this.h,
      vx: (Math.random() - 0.5) * layerSpeed * 2,
      vy: (Math.random() - 0.5) * layerSpeed * 2,
      baseVx: 0,
      baseVy: 0,
      radius: isForeground
        ? 1.2 + Math.random() * 1.4
        : 0.6 + Math.random() * 0.8,
      color: this._pickColor(),
      opacity: isForeground ? this.config.fgLayerOpacity : this.config.bgLayerOpacity,
      isForeground,
      // Slight per-particle glow variation
      glowRadius: isForeground ? 6 + Math.random() * 4 : 3 + Math.random() * 2,
    };
  }

  _pickColor() {
    const { palette } = this.config;
    return palette[Math.floor(Math.random() * palette.length)];
  }

  // ─── Resize ─────────────────────────────────────────────────
  _resize() {
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = this.w * dpr;
    this.canvas.height = this.h * dpr;
    this.canvas.style.width = this.w + 'px';
    this.canvas.style.height = this.h + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  _onResize() {
    this._resize();
    // Re-constrain existing particles rather than respawning
    this.particles.forEach(p => {
      if (p.x > this.w) p.x = this.w - 10;
      if (p.y > this.h) p.y = this.h - 10;
    });
    // Adjust count
    const { particleDensity, minParticles, maxParticles } = this.config;
    const ideal = Math.max(minParticles, Math.min(maxParticles,
      Math.round(this.w * this.h * particleDensity)));
    while (this.particles.length < ideal) {
      this.particles.push(this._createParticle());
    }
    while (this.particles.length > ideal) {
      this.particles.pop();
    }
  }

  // ─── Mouse Handlers ────────────────────────────────────────
  _onMouseMove(e) {
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
    this.mouse.active = true;

    // Update glow position (translate for perf)
    const halfGlow = this.config.glowSize / 2;
    this.glow.style.transform =
      `translate(${e.clientX - halfGlow}px, ${e.clientY - halfGlow}px)`;
    this.glow.style.opacity = this.config.glowOpacity;
  }

  _onMouseLeave() {
    this.mouse.active = false;
    this.glow.style.opacity = 0;
  }

  _onClick(e) {
    this.pulses.push({
      x: e.clientX,
      y: e.clientY,
      birth: performance.now(),
    });
  }

  // ─── Main Animation Loop ──────────────────────────────────
  _animate(now) {
    if (!this.running) return;

    // FPS tracking
    const dt = now - this._lastFrameTime;
    this._lastFrameTime = now;
    this._frameCount++;
    this._fpsAccum += dt;
    if (this._fpsAccum >= 1000) {
      this._currentFps = this._frameCount;
      this._frameCount = 0;
      this._fpsAccum = 0;
      this._lowPerfMode = this._currentFps < this.config.fpsThrottleThreshold;
    }

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);
    
    // Parallax logic
    const dtFactor = Math.min(dt / 16.667, 3);
    if (this.mouse.active) {
      const cx = this.w / 2;
      const cy = this.h / 2;
      this.targetParallax.x = ((cx - this.mouse.x) / cx) * 15;
      this.targetParallax.y = ((cy - this.mouse.y) / cy) * 15;
    } else {
      this.targetParallax.x = 0;
      this.targetParallax.y = 0;
    }
    
    this.parallax.x += (this.targetParallax.x - this.parallax.x) * 0.05 * dtFactor;
    this.parallax.y += (this.targetParallax.y - this.parallax.y) * 0.05 * dtFactor;

    ctx.save();
    ctx.translate(this.parallax.x, this.parallax.y);

    // Update & draw particles
    this._updateParticles(dt, now);
    this._drawConnections(ctx);
    this._drawParticles(ctx);

    ctx.restore();

    // Cleanup expired pulses
    this.pulses = this.pulses.filter(p =>
      now - p.birth < this.config.pulseDuration
    );

    this.animationId = requestAnimationFrame(this._animate);
  }

  // ─── Particle Physics ──────────────────────────────────────
  _updateParticles(dt, now) {
    const {
      mouseAttractionRadius,
      mouseAttractionStrength,
      pulseForce,
      pulseRadius,
      pulseDuration,
    } = this.config;

    const dtFactor = Math.min(dt / 16.667, 3); // normalise to ~60 fps

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // ── Click pulses ──
      for (let j = 0; j < this.pulses.length; j++) {
        const pulse = this.pulses[j];
        const age = now - pulse.birth;
        const progress = age / pulseDuration;
        const force = pulseForce * (1 - progress);

        const dx = p.x - pulse.x;
        const dy = p.y - pulse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < pulseRadius && dist > 0.1) {
          const push = (force / dist) * dtFactor;
          p.vx += (dx / dist) * push;
          p.vy += (dy / dist) * push;
        }
      }

      // ── Mouse attraction ──
      if (this.mouse.active) {
        const dx = this.mouse.x - p.x;
        const dy = this.mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouseAttractionRadius && dist > 1) {
          const strength = mouseAttractionStrength * (1 - dist / mouseAttractionRadius) * dtFactor;
          p.vx += (dx / dist) * strength;
          p.vy += (dy / dist) * strength;
        }
      }

      // ── Velocity damping ──
      p.vx *= 0.988;
      p.vy *= 0.988;

      // ── Move ──
      p.x += p.vx * dtFactor;
      p.y += p.vy * dtFactor;

      // ── Bounce ──
      if (p.x < 0)      { p.x = 0;      p.vx = Math.abs(p.vx) * 0.6; }
      if (p.x > this.w)  { p.x = this.w; p.vx = -Math.abs(p.vx) * 0.6; }
      if (p.y < 0)      { p.y = 0;      p.vy = Math.abs(p.vy) * 0.6; }
      if (p.y > this.h)  { p.y = this.h; p.vy = -Math.abs(p.vy) * 0.6; }
    }
  }

  // ─── Draw Connections ──────────────────────────────────────
  _drawConnections(ctx) {
    const {
      connectionDistance,
      connectionLineWidth,
      mouseConnectionBoost,
    } = this.config;

    const maxDist2 = connectionDistance * connectionDistance;
    const particles = this.particles;
    const len = particles.length;
    let checks = 0;
    const maxChecks = this._lowPerfMode
      ? this.config.maxConnectionChecks * 0.5
      : this.config.maxConnectionChecks;

    ctx.lineWidth = connectionLineWidth;

    for (let i = 0; i < len; i++) {
      const a = particles[i];
      for (let j = i + 1; j < len; j++) {
        if (++checks > maxChecks) return; // perf cap

        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist2 = dx * dx + dy * dy;

        if (dist2 > maxDist2) continue;

        const dist = Math.sqrt(dist2);
        let alpha = 1 - dist / connectionDistance;
        alpha *= 0.25; // keep subtle

        // Boost near cursor
        if (this.mouse.active) {
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          const md = Math.sqrt(
            (mx - this.mouse.x) ** 2 + (my - this.mouse.y) ** 2
          );
          if (md < this.config.mouseAttractionRadius) {
            alpha *= mouseConnectionBoost;
          }
        }

        // Blend colours of the two particles
        ctx.strokeStyle = this._blendAlpha(a.color, alpha * a.opacity);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }

  // ─── Draw Particles ────────────────────────────────────────
  _drawParticles(ctx) {
    // Draw background-layer first, then foreground
    for (let pass = 0; pass < 2; pass++) {
      const isFg = pass === 1;
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        if (p.isForeground !== isFg) continue;

        // Soft glow
        if (!this._lowPerfMode) {
          const grad = ctx.createRadialGradient(
            p.x, p.y, 0, p.x, p.y, p.glowRadius
          );
          grad.addColorStop(0, this._blendAlpha(p.color, 0.18 * p.opacity));
          grad.addColorStop(1, this._blendAlpha(p.color, 0));
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.glowRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        // Core dot
        ctx.fillStyle = this._blendAlpha(p.color, p.opacity);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // ─── Utility: hex colour → rgba string ─────────────────────
  _blendAlpha(hex, alpha) {
    // Fast hex → rgb
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, alpha))})`;
  }
}
