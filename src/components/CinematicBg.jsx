// ═══════════════════════════════════════════════════════════════
// CinematicBg.jsx — React wrapper for the CinematicBackground engine
// Mount once at app root level; renders behind all content.
// ═══════════════════════════════════════════════════════════════

import { useEffect, useRef } from 'react';
import CinematicBackground from '../bg';
import '../bg.css';

/**
 * <CinematicBg />
 *
 * Props (all optional):
 *   palette  — string[]  — custom colour set, e.g. ['#FF0', '#0FF']
 *   config   — object     — any CinematicBackground config overrides
 *
 * Usage:
 *   <CinematicBg />                          ← default theme
 *   <CinematicBg palette={['#fff','#aaa']} /> ← light theme
 */
export default function CinematicBg({ palette, config } = {}) {
  const containerRef = useRef(null);
  const engineRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const userConfig = { ...config };
    if (palette) userConfig.palette = palette;

    const engine = new CinematicBackground(containerRef.current, userConfig);
    engineRef.current = engine;
    engine.start();

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
    // Intentionally empty deps — we only create/destroy once on mount/unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hot-swap palette if it changes
  useEffect(() => {
    if (engineRef.current && palette) {
      engineRef.current.setTheme(palette);
    }
  }, [palette]);

  return <div ref={containerRef} className="cb-container" />;
}
