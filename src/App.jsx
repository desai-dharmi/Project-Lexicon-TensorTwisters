// ═══════════════════════════════════════════════════════════════
// APP.JSX — Main application shell with Landing Page
// ═══════════════════════════════════════════════════════════════

import { useState, useCallback, useRef, useEffect } from 'react';
import { PromptProvider, usePrompt } from './store/PromptContext';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { compilePrompt } from './utils/promptCompiler';
import LandingPage from './components/LandingPage';
import LoadingScreen from './components/LoadingScreen';
import CinematicBg from './components/CinematicBg';
import BlockPalette from './components/BlockPalette';
import CompositionCanvas from './components/CompositionCanvas';
import PromptPreview from './components/PromptPreview';
import ComparisonMode from './components/ComparisonMode';
import MockResponsePanel from './components/MockResponsePanel';
import HistorySidebar from './components/HistorySidebar';
import logoUrl from './assets/logo.png';
import './App.css';

function AppContent() {
  const {
    state,
    addBlock,
    removeBlock,
    duplicateBlock,
    moveBlock,
    selectBlock,
    saveHistory,
    toggleComparison,
  } = usePrompt();

  const [isLoading, setIsLoading] = useState(true);
  const [showLanding, setShowLanding] = useState(true);
  const [rightTab, setRightTab] = useState('preview');
  const [showHistory, setShowHistory] = useState(false);

  // Initial loading latency
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);
  const [isDroppingFromPalette, setIsDroppingFromPalette] = useState(false);
  const [appVisible, setAppVisible] = useState(false);
  const canvasAreaRef = useRef(null);

  // Handle landing page exit
  const handleEnterApp = useCallback(() => {
    setShowLanding(false);
    // Small delay for the entrance animation
    setTimeout(() => setAppVisible(true), 50);
  }, []);

  // Handle palette drag start
  const handlePaletteDragStart = useCallback(() => {
    setIsDroppingFromPalette(true);
  }, []);

  // Handle palette drag end — add block if dropped on canvas
  const handlePaletteDragEnd = useCallback((blockType, x, y) => {
    setIsDroppingFromPalette(false);
    if (!blockType) return;

    const canvasEl = canvasAreaRef.current;
    if (!canvasEl) {
      addBlock(blockType);
      return;
    }
    const rect = canvasEl.getBoundingClientRect();
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      const blockEls = canvasEl.querySelectorAll('.canvas-block');
      let insertIndex = blockEls.length;

      for (let i = 0; i < blockEls.length; i++) {
        const bRect = blockEls[i].getBoundingClientRect();
        if (y < bRect.top + bRect.height / 2) {
          insertIndex = i;
          break;
        }
      }

      addBlock(blockType, insertIndex);
    }
  }, [addBlock]);

  // Export handler for keyboard shortcut
  const handleExport = useCallback(() => {
    const prompt = compilePrompt(state.blocks);
    navigator.clipboard.writeText(prompt).then(() => {
      const toast = document.createElement('div');
      toast.className = 'toast success';
      toast.textContent = 'Prompt copied to clipboard!';
      document.body.appendChild(toast);
      requestAnimationFrame(() => toast.classList.add('show'));
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
      }, 2000);
    });
  }, [state.blocks]);

  // Register keyboard shortcuts
  useKeyboardShortcuts({
    selectedBlockId: state.selectedBlockId,
    removeBlock,
    duplicateBlock,
    moveBlock,
    selectBlock,
    saveHistory,
    onExport: handleExport,
  });

  // Show loading screen first
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Show landing page next
  if (showLanding) {
    return <LandingPage onEnter={handleEnterApp} />;
  }

  return (
    <div className={`app-root ${appVisible ? 'app-visible' : ''}`}>
      {/* Header */}
      <header className="app-header">
        <div className="app-logo">
          <img src={logoUrl} alt="Lexicon" style={{ height: '34px', width: 'auto', objectFit: 'contain' }} />
          <span className="app-logo-text">
            Project <span className="text-accent">Lexicon</span>
          </span>
          <span className="app-logo-badge">v1.0</span>
        </div>
        <div className="app-header-actions">
          <button
            className={`header-btn ${state.comparisonMode ? 'active' : ''}`}
            onClick={() => {
              toggleComparison();
              if (!state.comparisonMode) setRightTab('comparison');
              else setRightTab('preview');
            }}
          >
            ⚖️ Compare
          </button>
          <button className="header-btn" onClick={() => setShowHistory(true)}>
            📜 History
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="app-layout">
        {/* Left: Block Palette */}
        <BlockPalette
          onDragStart={handlePaletteDragStart}
          onDragEnd={handlePaletteDragEnd}
        />

        {/* Center: Composition Canvas */}
        <div
          ref={canvasAreaRef}
          style={{ flex: 1, display: 'flex', minWidth: 0 }}
          className={isDroppingFromPalette ? 'canvas-drop-active' : ''}
        >
          <CompositionCanvas />
        </div>

        {/* Right Panel */}
        <div className="right-panel">
          <div className="right-panel-tabs">
            <button
              className={`right-panel-tab ${rightTab === 'preview' ? 'active' : ''}`}
              onClick={() => setRightTab('preview')}
            >
              📝 Preview
            </button>
            <button
              className={`right-panel-tab ${rightTab === 'comparison' ? 'active' : ''}`}
              onClick={() => setRightTab('comparison')}
            >
              ⚖️ Diff
            </button>
            <button
              className={`right-panel-tab ${rightTab === 'response' ? 'active' : ''}`}
              onClick={() => setRightTab('response')}
            >
              🤖 Response
            </button>
          </div>
          <div className="right-panel-content">
            {rightTab === 'preview' && (
              <>
                <PromptPreview />
                <MockResponsePanel />
              </>
            )}
            {rightTab === 'comparison' && <ComparisonMode />}
            {rightTab === 'response' && <MockResponsePanel />}
          </div>
          <div className="shortcuts-hint">
            <p>
              <kbd>Del</kbd> Delete · <kbd>Ctrl+D</kbd> Duplicate · <kbd>Ctrl+↑↓</kbd> Move · <kbd>Ctrl+S</kbd> Save · <kbd>Ctrl+E</kbd> Copy · <kbd>Esc</kbd> Deselect
            </p>
          </div>
        </div>
      </div>

      {/* History Sidebar */}
      {showHistory && <HistorySidebar onClose={() => setShowHistory(false)} />}
    </div>
  );
}

function App() {
  return (
    <PromptProvider>
      <CinematicBg />
      <AppContent />
    </PromptProvider>
  );
}

export default App;
