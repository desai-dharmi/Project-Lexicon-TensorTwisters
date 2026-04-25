// ═══════════════════════════════════════════════════════════════
// PROMPT PREVIEW — Live compiled prompt with syntax highlighting
// ═══════════════════════════════════════════════════════════════

import { useMemo } from 'react';
import { usePrompt } from '../store/PromptContext';
import { compileSegments, compilePrompt } from '../utils/promptCompiler';
import './PromptPreview.css';

export default function PromptPreview() {
  const { state } = usePrompt();

  const segments = useMemo(
    () => compileSegments(state.blocks),
    [state.blocks]
  );

  const charCount = useMemo(
    () => compilePrompt(state.blocks).length,
    [state.blocks]
  );

  return (
    <div className="prompt-preview" id="prompt-preview">
      <div className="preview-header">
        <h3>
          <span className="live-dot" />
          Live Preview
        </h3>
        {charCount > 0 && (
          <span className="preview-char-count">{charCount} chars</span>
        )}
      </div>
      <div className="preview-content">
        {segments.length === 0 ? (
          <div className="preview-empty">
            Your compiled prompt will appear here as you add blocks...
          </div>
        ) : (
          segments.map((seg, i) => (
            <div key={i} className="preview-segment">
              <span className="segment-prefix" style={{ color: seg.color }}>
                {seg.prefix}
              </span>
              <span className="segment-content">{seg.content}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
