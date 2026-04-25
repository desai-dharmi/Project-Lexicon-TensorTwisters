// ═══════════════════════════════════════════════════════════════
// COMPOSITION CANVAS — Main block arrangement area with DnD
// ═══════════════════════════════════════════════════════════════

import { useState, useRef, useCallback, useMemo } from 'react';
import { usePrompt } from '../store/PromptContext';
import { calculateCompleteness, compilePrompt } from '../utils/promptCompiler';
import Block from './Block';
import './CompositionCanvas.css';

export default function CompositionCanvas() {
  const {
    state,
    addBlock,
    removeBlock,
    updateBlock,
    reorderBlocks,
    duplicateBlock,
    selectBlock,
    saveTemplate,
    loadTemplate,
    deleteTemplate,
    saveHistory,
    clearCanvas,
  } = usePrompt();

  const [dragState, setDragState] = useState({ dragging: false, dragId: null, overIndex: -1 });
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const canvasRef = useRef(null);
  const dragGhostRef = useRef(null);
  const dragDataRef = useRef(null);

  const sortedBlocks = useMemo(
    () => [...state.blocks].sort((a, b) => a.order - b.order),
    [state.blocks]
  );

  const completeness = useMemo(
    () => calculateCompleteness(state.blocks),
    [state.blocks]
  );

  // ── Reorder drag-and-drop (handle-based) ───────────────────

  const handleBlockDragStart = useCallback((e, block) => {
    const el = e.target.closest('.canvas-block');
    if (!el) return;
    
    const rect = el.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    // Create ghost
    const ghost = el.cloneNode(true);
    ghost.className = 'canvas-block canvas-drag-ghost';
    ghost.style.width = rect.width + 'px';
    ghost.style.left = (e.clientX - offsetX) + 'px';
    ghost.style.top = (e.clientY - offsetY) + 'px';
    ghost.setAttribute('data-type', block.type);
    document.body.appendChild(ghost);
    dragGhostRef.current = ghost;

    dragDataRef.current = {
      blockId: block.id,
      fromIndex: block.order,
      offsetX,
      offsetY,
    };

    setDragState({ dragging: true, dragId: block.id, overIndex: block.order });

    const handleMove = (ev) => {
      requestAnimationFrame(() => {
        if (dragGhostRef.current) {
          dragGhostRef.current.style.left = (ev.clientX - offsetX) + 'px';
          dragGhostRef.current.style.top = (ev.clientY - offsetY) + 'px';
        }
      });

      // Collision detection — find which block we're over
      const blockEls = canvasRef.current?.querySelectorAll('.canvas-block:not(.canvas-drag-ghost)');
      if (!blockEls) return;

      let closestIndex = -1;
      let closestDist = Infinity;

      blockEls.forEach((bEl) => {
        const bRect = bEl.getBoundingClientRect();
        const bMidY = bRect.top + bRect.height / 2;
        const dist = Math.abs(ev.clientY - bMidY);
        if (dist < closestDist) {
          closestDist = dist;
          closestIndex = parseInt(bEl.dataset.order, 10);
          // If below midpoint, insert after
          if (ev.clientY > bMidY) {
            closestIndex += 1;
          }
        }
      });

      setDragState(prev => ({ ...prev, overIndex: closestIndex }));
    };

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);

      if (dragGhostRef.current) {
        dragGhostRef.current.remove();
        dragGhostRef.current = null;
      }

      const data = dragDataRef.current;
      if (data) {
        // Calculate final toIndex
        let toIndex = dragState.overIndex;
        // Clamp
        if (toIndex < 0) toIndex = 0;
        if (toIndex > sortedBlocks.length) toIndex = sortedBlocks.length;
        // Adjust for removal
        if (toIndex > data.fromIndex) toIndex--;
        if (toIndex !== data.fromIndex && toIndex >= 0) {
          reorderBlocks(data.fromIndex, toIndex);
        }
      }

      dragDataRef.current = null;
      setDragState({ dragging: false, dragId: null, overIndex: -1 });
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  }, [reorderBlocks, sortedBlocks.length, dragState.overIndex]);

  // ── Export ──────────────────────────────────────────────────

  const handleCopyToClipboard = useCallback(() => {
    const prompt = compilePrompt(state.blocks);
    navigator.clipboard.writeText(prompt).then(() => {
      showToast('Copied to clipboard!');
    });
  }, [state.blocks]);

  const handleDownload = useCallback(() => {
    const prompt = compilePrompt(state.blocks);
    const blob = new Blob([prompt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prompt.txt';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded prompt.txt');
  }, [state.blocks]);

  // ── Template Save ──────────────────────────────────────────

  const handleSaveTemplate = useCallback(() => {
    if (!templateName.trim()) return;
    saveTemplate(templateName.trim());
    setTemplateName('');
    setShowSaveModal(false);
    showToast('Template saved!');
  }, [templateName, saveTemplate]);

  const completenessLevel = completeness.percentage < 40 ? 'low' : completeness.percentage < 75 ? 'medium' : 'high';

  return (
    <div className="composition-canvas" ref={canvasRef}>
      {/* Toolbar */}
      <div className="canvas-toolbar">
        <div className="canvas-toolbar-left">
          <span className="canvas-title">Composition Canvas</span>
          <span className="canvas-block-count">{sortedBlocks.length} blocks</span>
          {sortedBlocks.length > 0 && (
            <div className={`completeness-badge ${completenessLevel}`} title={`Missing: ${completeness.missing.join(', ') || 'None'}`}>
              <span>⚡</span>
              <span>{completeness.percentage}%</span>
            </div>
          )}
        </div>
        <div className="canvas-toolbar-right">
          <button className="canvas-btn" onClick={handleCopyToClipboard} title="Copy prompt (Ctrl+E)">
            📋 Copy
          </button>
          <button className="canvas-btn" onClick={handleDownload}>
            💾 Export
          </button>
          <button className="canvas-btn" onClick={() => { saveHistory(); showToast('Saved to history!'); }}>
            📸 Snapshot
          </button>
          <button className="canvas-btn" onClick={() => setShowSaveModal(true)}>
            📁 Save
          </button>
          <button className="canvas-btn" onClick={() => setShowLoadModal(true)}>
            📂 Load
          </button>
          {sortedBlocks.length > 0 && (
            <button className="canvas-btn danger" onClick={clearCanvas}>
              🗑 Clear
            </button>
          )}
        </div>
      </div>

      {/* Block area */}
      <div className="canvas-scroll">
        {sortedBlocks.length === 0 ? (
          <div className="canvas-empty">
            <div className="canvas-empty-icon">🧩</div>
            <h3>Your canvas is empty</h3>
            <p>Drag blocks from the palette on the left to start building your prompt. Arrange and customize each block to create the perfect AI prompt.</p>
          </div>
        ) : (
          <div className="canvas-blocks">
            {sortedBlocks.map((block, idx) => (
              <Block
                key={block.id}
                block={block}
                isSelected={state.selectedBlockId === block.id}
                onSelect={selectBlock}
                onUpdate={updateBlock}
                onRemove={removeBlock}
                onDuplicate={duplicateBlock}
                onDragStart={handleBlockDragStart}
                isDragging={dragState.dragId === block.id}
                dragOverPosition={
                  dragState.overIndex === idx ? 'top' :
                  dragState.overIndex === idx + 1 ? 'bottom' : null
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Save Template Modal */}
      {showSaveModal && (
        <div className="template-modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div className="template-modal" onClick={e => e.stopPropagation()}>
            <h3>Save Template</h3>
            <input
              autoFocus
              placeholder="Template name..."
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveTemplate()}
            />
            <div className="template-modal-actions">
              <button className="canvas-btn" onClick={() => setShowSaveModal(false)}>Cancel</button>
              <button className="canvas-btn active" onClick={handleSaveTemplate}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Load Template Modal */}
      {showLoadModal && (
        <div className="template-modal-overlay" onClick={() => setShowLoadModal(false)}>
          <div className="template-modal" onClick={e => e.stopPropagation()}>
            <h3>Load Template</h3>
            {state.savedTemplates.length === 0 ? (
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', marginBottom: 'var(--space-lg)' }}>
                No saved templates yet. Save your current canvas first.
              </p>
            ) : (
              <div className="template-list">
                {state.savedTemplates.map(t => (
                  <div key={t.id} className="template-item" onClick={() => { loadTemplate(t.id); setShowLoadModal(false); }}>
                    <div>
                      <div className="template-item-name">{t.name}</div>
                      <div className="template-item-date">{new Date(t.createdAt).toLocaleDateString()}</div>
                    </div>
                    <button className="template-item-delete" onClick={e => { e.stopPropagation(); deleteTemplate(t.id); }}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <div className="template-modal-actions">
              <button className="canvas-btn" onClick={() => setShowLoadModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple toast notification
function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast success';
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}
