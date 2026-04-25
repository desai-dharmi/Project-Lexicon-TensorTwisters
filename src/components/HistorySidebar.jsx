// ═══════════════════════════════════════════════════════════════
// HISTORY SIDEBAR — Timestamped prompt history with restore
// ═══════════════════════════════════════════════════════════════

import { usePrompt } from '../store/PromptContext';
import { BLOCK_TYPES } from '../utils/constants';
import './HistorySidebar.css';

export default function HistorySidebar({ onClose }) {
  const { state, restoreHistory } = usePrompt();

  const handleRestore = (index) => {
    restoreHistory(index);
    onClose();
  };

  return (
    <>
      <div className="history-overlay" onClick={onClose} />
      <aside className="history-sidebar" id="history-sidebar">
        <div className="history-header">
          <h3>📜 Prompt History</h3>
          <button className="history-close" onClick={onClose}>✕</button>
        </div>
        <div className="history-list">
          {state.history.length === 0 ? (
            <div className="history-empty">
              <p>No history yet.</p>
              <p style={{ marginTop: 8, fontSize: '0.7rem' }}>
                Click "Snapshot" or press Ctrl+S to save the current prompt.
              </p>
            </div>
          ) : (
            state.history.map((entry, index) => (
              <div
                key={index}
                className="history-entry"
                onClick={() => handleRestore(index)}
                style={{ animationDelay: `${index * 0.03}s` }}
                title="Click to restore this version"
              >
                <div className="history-entry-time">
                  {formatTime(entry.timestamp)}
                </div>
                <div className="history-entry-preview">
                  {entry.prompt || '(empty prompt)'}
                </div>
                <div className="history-entry-blocks">
                  {entry.blocks.map((b, i) => (
                    <span
                      key={i}
                      className="history-entry-dot"
                      style={{ background: BLOCK_TYPES[b.type]?.color || '#888' }}
                      title={BLOCK_TYPES[b.type]?.label}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
}

function formatTime(iso) {
  try {
    const date = new Date(iso);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}
