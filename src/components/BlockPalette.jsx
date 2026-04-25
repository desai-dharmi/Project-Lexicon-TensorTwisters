// ═══════════════════════════════════════════════════════════════
// BLOCK PALETTE — Draggable block type sidebar
// ═══════════════════════════════════════════════════════════════

import { useRef, useCallback } from 'react';
import { BLOCK_TYPE_LIST } from '../utils/constants';
import './BlockPalette.css';

const HINTS = {
  role: 'Define the AI persona',
  context: 'Set background info',
  constraint: 'Set limitations',
  format: 'Output structure',
  tone: 'Communication style',
  example: 'Show desired output',
  output_length: 'Response length',
};

export default function BlockPalette({ onDragStart, onDragEnd }) {
  const dragRef = useRef(null);
  const cloneRef = useRef(null);

  const handlePointerDown = useCallback((e, blockType) => {
    e.preventDefault();
    
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    // Create drag clone
    const clone = document.createElement('div');
    clone.className = 'palette-block-clone';
    clone.style.background = `rgba(${blockType.colorRgb}, 0.15)`;
    clone.style.border = `1px solid rgba(${blockType.colorRgb}, 0.3)`;
    clone.innerHTML = `<span>${blockType.icon}</span> <span>${blockType.label}</span>`;
    clone.style.left = `${e.clientX - offsetX}px`;
    clone.style.top = `${e.clientY - offsetY}px`;
    document.body.appendChild(clone);
    cloneRef.current = clone;

    dragRef.current = {
      blockType: blockType.id,
      offsetX,
      offsetY,
      startX: e.clientX,
      startY: e.clientY,
    };

    onDragStart?.(blockType.id);

    const handlePointerMove = (ev) => {
      if (cloneRef.current) {
        requestAnimationFrame(() => {
          if (cloneRef.current) {
            cloneRef.current.style.left = `${ev.clientX - offsetX}px`;
            cloneRef.current.style.top = `${ev.clientY - offsetY}px`;
          }
        });
      }
    };

    const handlePointerUp = (ev) => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      
      if (cloneRef.current) {
        cloneRef.current.remove();
        cloneRef.current = null;
      }
      
      onDragEnd?.(dragRef.current?.blockType, ev.clientX, ev.clientY);
      dragRef.current = null;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }, [onDragStart, onDragEnd]);

  return (
    <aside className="block-palette" id="block-palette">
      <div className="palette-header">
        <h2>Block Types</h2>
        <p>Drag blocks to the canvas to build your prompt</p>
      </div>
      <div className="palette-blocks">
        {BLOCK_TYPE_LIST.map((bt) => (
          <div
            key={bt.id}
            className="palette-block"
            data-type={bt.id}
            onPointerDown={(e) => handlePointerDown(e, bt)}
            title={bt.desc}
          >
            <div className="block-icon">{bt.icon}</div>
            <div className="block-info">
              <span className="block-label">{bt.label}</span>
              <span className="block-hint">{HINTS[bt.id]}</span>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
