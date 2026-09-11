import React from 'react';

const NODES = [
  { id: 'intake', label: '1. Intake Agent', icon: '📥', desc: 'Intent & Ambiguity' },
  { id: 'profile', label: '2. Profile Agent', icon: '👤', desc: 'Accessibility Adaptation' },
  { id: 'web_understanding', label: '3. Web Agent', icon: '🌐', desc: 'DOM & A11y Tree' },
  { id: 'rag', label: '4. RAG Knowledge', icon: '📚', desc: 'WCAG 2.2 / COGA Grounding' },
  { id: 'form_interaction', label: '5. Form Agent', icon: '✍️', desc: 'Action Proposal' },
  { id: 'verification', label: '6. Verification Agent', icon: '🛡️', desc: 'Format & Match Check' },
  { id: 'safety', label: '7. Safety & Confidence', icon: '⚖️', desc: 'Multi-Factor Gate' }
];

export default function AgentGraphVisualizer({ activeAgent, lastDecision }) {
  return (
    <div className="agent-graph-container" style={{ padding: '1.25rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          LangGraph Multi-Agent Orchestrator
        </h3>
        <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '999px', background: 'rgba(56, 189, 248, 0.15)', color: 'var(--primary)', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
          State Machine Graph
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', position: 'relative' }}>
        {NODES.map((node, idx) => {
          const isActive = activeAgent === node.id;
          return (
            <div
              key={node.id}
              style={{
                background: isActive ? 'rgba(56, 189, 248, 0.2)' : 'rgba(30, 41, 59, 0.7)',
                border: `1.5px solid ${isActive ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '8px',
                padding: '0.75rem 0.5rem',
                textAlign: 'center',
                boxShadow: isActive ? '0 0 15px rgba(56, 189, 248, 0.4)' : 'none',
                transition: 'all 0.3s ease',
                position: 'relative'
              }}
              className={isActive ? 'active-pulse' : ''}
            >
              <div style={{ fontSize: '1.4rem', marginBottom: '0.35rem' }}>{node.icon}</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: isActive ? '#fff' : 'var(--text-muted)' }}>
                {node.label}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)', marginTop: '0.2rem' }}>
                {node.desc}
              </div>
            </div>
          );
        })}
      </div>

      {/* Conditional Branching Terminals */}
      <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: 600 }}>ROUTER OUTPUT:</span>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { key: 'EXECUTE', label: 'EXECUTE (Conf >= 0.85)', color: 'var(--accent-emerald)', bg: 'rgba(16, 185, 129, 0.15)' },
            { key: 'REQUIRE_CONFIRMATION', label: 'CONFIRM (High Risk)', color: 'var(--accent-amber)', bg: 'rgba(245, 158, 11, 0.15)' },
            { key: 'ASK_CLARIFICATION', label: 'CLARIFY (< 0.85 / Ambiguity)', color: 'var(--accent-cyan)', bg: 'rgba(6, 182, 212, 0.15)' },
            { key: 'BLOCK', label: 'BLOCK (Untrusted / Attack)', color: 'var(--accent-rose)', bg: 'rgba(244, 63, 94, 0.15)' }
          ].map(route => {
            const isMatch = lastDecision === route.key;
            return (
              <span
                key={route.key}
                style={{
                  fontSize: '0.72rem',
                  fontWeight: isMatch ? 800 : 500,
                  padding: '0.25rem 0.6rem',
                  borderRadius: '6px',
                  background: isMatch ? route.bg : 'rgba(255,255,255,0.04)',
                  color: isMatch ? route.color : 'var(--text-subtle)',
                  border: `1px solid ${isMatch ? route.color : 'rgba(255,255,255,0.06)'}`,
                  boxShadow: isMatch ? `0 0 10px ${route.color}44` : 'none',
                  transition: 'all 0.2s'
                }}
              >
                {route.label}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
