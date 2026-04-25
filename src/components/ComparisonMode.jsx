// ═══════════════════════════════════════════════════════════════
// COMPARISON MODE — A/B diff with character-level LCS
// ═══════════════════════════════════════════════════════════════

import { useMemo } from 'react';
import { usePrompt } from '../store/PromptContext';
import { compilePrompt } from '../utils/promptCompiler';
import { computeDiff } from '../utils/diffEngine';
import { BLOCK_TYPES } from '../utils/constants';
import './ComparisonMode.css';

export default function ComparisonMode() {
  const { state, toggleVariantBlock } = usePrompt();

  const sortedBlocks = useMemo(
    () => [...state.blocks].sort((a, b) => a.order - b.order),
    [state.blocks]
  );

  // Full prompt (all blocks)
  const fullPrompt = useMemo(
    () => compilePrompt(state.blocks),
    [state.blocks]
  );

  // Variant prompt (excluded blocks removed)
  const variantBlocks = useMemo(
    () => state.blocks.filter(b => !state.variantExcluded.includes(b.id)),
    [state.blocks, state.variantExcluded]
  );

  const variantPrompt = useMemo(
    () => compilePrompt(variantBlocks),
    [variantBlocks]
  );

  // Compute diff
  const diffResult = useMemo(
    () => computeDiff(fullPrompt, variantPrompt),
    [fullPrompt, variantPrompt]
  );

  // Diff stats
  const diffStats = useMemo(() => {
    let added = 0, removed = 0;
    diffResult.forEach(op => {
      if (op.type === 'add') added += op.text.length;
      if (op.type === 'remove') removed += op.text.length;
    });
    return { added, removed };
  }, [diffResult]);

  return (
    <div className="comparison-panel" id="comparison-panel">
      <div className="comparison-header">
        <h3>A/B Comparison</h3>
      </div>

      {/* Block toggle chips */}
      <div className="comparison-toggle-list">
        {sortedBlocks.map(block => {
          const typeInfo = BLOCK_TYPES[block.type];
          const isExcluded = state.variantExcluded.includes(block.id);
          return (
            <div
              key={block.id}
              className={`comparison-toggle-chip ${isExcluded ? 'excluded' : ''}`}
              onClick={() => toggleVariantBlock(block.id)}
              title={`Click to ${isExcluded ? 'include' : 'exclude'} this block in variant`}
            >
              <span className="chip-dot" style={{ background: typeInfo?.color }} />
              <span>{typeInfo?.label}</span>
            </div>
          );
        })}
      </div>

      <div className="comparison-body">
        {/* Full prompt */}
        <div className="comparison-side">
          <div className="comparison-side-label">
            <span className="label-badge full">A</span>
            Full Prompt
          </div>
          {fullPrompt ? (
            <div className="comparison-text">{fullPrompt}</div>
          ) : (
            <div className="comparison-empty">Add blocks to see the full prompt</div>
          )}
        </div>

        {/* Diff view */}
        <div className="diff-container">
          <div className="diff-label">Character Diff</div>
          {fullPrompt === variantPrompt ? (
            <div className="comparison-empty">
              {fullPrompt ? 'No differences — toggle blocks above to create a variant' : 'Add blocks to compare'}
            </div>
          ) : (
            <>
              <div className="diff-output">
                {diffResult.map((op, i) => (
                  <span key={i} className={`diff-${op.type}`}>{op.text}</span>
                ))}
              </div>
              <div className="diff-stats">
                <span className="diff-stat-add">+{diffStats.added} added</span>
                <span className="diff-stat-remove">-{diffStats.removed} removed</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
