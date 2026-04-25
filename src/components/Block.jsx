// ═══════════════════════════════════════════════════════════════
// BLOCK — Individual prompt block component
// ═══════════════════════════════════════════════════════════════

import { useRef, useCallback, memo } from 'react';
import { BLOCK_TYPES } from '../utils/constants';
import './Block.css';

const DragIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor">
    <circle cx="5" cy="3" r="1.5" />
    <circle cx="11" cy="3" r="1.5" />
    <circle cx="5" cy="8" r="1.5" />
    <circle cx="11" cy="8" r="1.5" />
    <circle cx="5" cy="13" r="1.5" />
    <circle cx="11" cy="13" r="1.5" />
  </svg>
);

function Block({
  block,
  isSelected,
  onSelect,
  onUpdate,
  onRemove,
  onDuplicate,
  onDragStart,
  isDragging,
  dragOverPosition,
}) {
  const typeInfo = BLOCK_TYPES[block.type];
  const inputRef = useRef(null);

  const handleContentChange = useCallback((e) => {
    onUpdate(block.id, e.target.value);
  }, [block.id, onUpdate]);

  const handleClick = useCallback((e) => {
    // Don't select if clicking on input/button
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'BUTTON') return;
    onSelect(block.id);
  }, [block.id, onSelect]);

  const handleDragHandlePointerDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    onDragStart?.(e, block);
  }, [block, onDragStart]);

  const className = [
    'canvas-block',
    isSelected && 'selected',
    isDragging && 'dragging',
    dragOverPosition === 'top' && 'drag-over-top',
    dragOverPosition === 'bottom' && 'drag-over-bottom',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={className}
      data-type={block.type}
      data-block-id={block.id}
      data-order={block.order}
      onClick={handleClick}
    >
      <div className="block-stripe" />
      <div
        className="block-drag-handle"
        onPointerDown={handleDragHandlePointerDown}
        title="Drag to reorder"
      >
        <DragIcon />
      </div>
      <div className="block-main">
        <div className="block-header">
          <span className="block-type-badge">
            <span>{typeInfo?.icon}</span>
            <span>{typeInfo?.label}</span>
          </span>
          <div className="block-actions">
            <button
              className="block-action-btn"
              onClick={(e) => { e.stopPropagation(); onDuplicate(block.id); }}
              title="Duplicate (Ctrl+D)"
            >
              ⧉
            </button>
            <button
              className="block-action-btn delete"
              onClick={(e) => { e.stopPropagation(); onRemove(block.id); }}
              title="Delete (Del)"
            >
              ✕
            </button>
          </div>
        </div>
        <textarea
          ref={inputRef}
          className="block-content-input"
          value={block.content}
          onChange={handleContentChange}
          placeholder={typeInfo?.placeholder}
          rows={1}
          onFocus={() => onSelect(block.id)}
          onInput={(e) => {
            // Auto-resize
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
          }}
        />
      </div>
    </div>
  );
}

export default memo(Block);
