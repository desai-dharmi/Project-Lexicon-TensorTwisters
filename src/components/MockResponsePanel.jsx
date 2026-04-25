// ═══════════════════════════════════════════════════════════════
// MOCK RESPONSE PANEL — Simulated AI output based on blocks
// ═══════════════════════════════════════════════════════════════

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { usePrompt } from '../store/PromptContext';
import { generateMockResponse } from '../utils/mockResponses';
import './MockResponsePanel.css';

export default function MockResponsePanel() {
  const { state } = usePrompt();
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const timerRef = useRef(null);
  const idxRef = useRef(0);

  const mockResult = useMemo(
    () => generateMockResponse(state.blocks),
    [state.blocks]
  );

  // Clear any existing animation
  const stopTyping = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Typing animation effect
  useEffect(() => {
    const text = mockResult.response;
    
    // Stop any previous animation
    stopTyping();

    // For short text or empty, show immediately
    if (!text || text.length < 20) {
      setDisplayedText(text);
      setIsTyping(false);
      return;
    }

    // Start typing animation
    setIsTyping(true);
    setDisplayedText('');
    idxRef.current = 0;

    const chunkSize = Math.max(3, Math.ceil(text.length / 80));
    const speed = 20; // Fixed 20ms intervals for consistent feel

    timerRef.current = setInterval(() => {
      idxRef.current += chunkSize;
      if (idxRef.current >= text.length) {
        idxRef.current = text.length;
        setDisplayedText(text);
        setIsTyping(false);
        clearInterval(timerRef.current);
        timerRef.current = null;
      } else {
        setDisplayedText(text.slice(0, idxRef.current));
      }
    }, speed);

    return () => stopTyping();
  }, [mockResult.response, stopTyping]);

  const scoreColor = mockResult.score > 70 ? 'var(--success)' :
    mockResult.score > 40 ? 'var(--warning)' : 'var(--error)';

  return (
    <div className="mock-response-panel" id="mock-response">
      <div className="mock-response-header">
        <h3>
          🤖 AI Response
          <span className={`quality-badge ${mockResult.quality}`}>
            {mockResult.quality}
          </span>
        </h3>
        <div className="mock-response-score">
          <span>{mockResult.score}%</span>
          <div className="score-bar">
            <div
              className="score-bar-fill"
              style={{
                width: `${mockResult.score}%`,
                background: scoreColor,
              }}
            />
          </div>
        </div>
      </div>
      <div className="mock-response-content">
        <div className="mock-response-text">
          {displayedText}
          {isTyping && <span className="mock-response-typing" />}
        </div>
      </div>
    </div>
  );
}
