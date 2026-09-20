import React, { useState } from 'react';
import { History, Wrench, Shield, CheckCircle, Clock } from 'lucide-react';

export default function TraceTimeline({ traces = [] }) {
  const [filter, setFilter] = useState('ALL');

  const filtered = traces.filter(t => {
    if (filter === 'ALL') return true;
    if (filter === 'TOOLS') return !!t.tool_call;
    if (filter === 'DECISIONS') return !!t.decision;
    return true;
  });

  return (
    <div className="panel" style={{ padding: '1.5rem', background: 'var(--bg-surface)', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History style={{ width: 18, height: 18, color: 'var(--primary)' }} />
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              OBSERVABILITY AUDIT TRAIL
            </h3>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Permanent SQLite trace ledger recording inputs, tool calls, confidence scores & decisions
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.35rem' }}>
          {['ALL', 'TOOLS', 'DECISIONS'].map(mode => (
            <button
              key={mode}
              type="button"
              onClick={() => setFilter(mode)}
              style={{
                fontSize: '0.68rem',
                fontWeight: 600,
                padding: '0.25rem 0.65rem',
                borderRadius: 'var(--radius-full)',
                background: filter === mode ? 'var(--primary)' : 'rgba(255, 255, 255, 0.04)',
                color: filter === mode ? 'var(--text-inverse)' : 'var(--text-muted)',
                border: `1px solid ${filter === mode ? 'var(--primary)' : 'var(--border-subtle)'}`,
                cursor: 'pointer'
              }}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.65rem',
          paddingRight: '0.35rem',
          maxHeight: '480px'
        }}
      >
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '2.5rem 1rem', fontSize: '0.8rem' }}>
            <History style={{ width: 28, height: 28, margin: '0 auto 0.5rem', opacity: 0.5 }} />
            No trace records yet. Interaction events will appear here in real-time.
          </div>
        ) : (
          filtered.map((t, idx) => {
            const isBlocked = t.decision === 'BLOCK';
            const isTool = !!t.tool_call;

            return (
              <div
                key={idx}
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderLeft: `3px solid ${
                    isBlocked
                      ? 'var(--status-danger)'
                      : isTool
                      ? 'var(--accent-cyan)'
                      : 'var(--primary)'
                  }`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem 1rem',
                  fontSize: '0.78rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-display)' }}>
                    {t.agent_name}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock style={{ width: 11, height: 11 }} />
                    {t.timestamp}
                  </span>
                </div>

                {t.tool_call && (
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--accent-cyan)',
                      fontSize: '0.72rem',
                      background: 'rgba(6, 182, 212, 0.08)',
                      padding: '0.35rem 0.55rem',
                      borderRadius: 'var(--radius-xs)',
                      border: '1px solid rgba(6, 182, 212, 0.2)',
                      margin: '0.35rem 0'
                    }}
                  >
                    ⚡ FastMCP: <strong>{t.tool_call}</strong>({t.tool_args ? JSON.stringify(t.tool_args) : ''})
                  </div>
                )}

                {t.notes && (
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', lineHeight: 1.45, marginTop: '0.25rem' }}>
                    {t.notes}
                  </div>
                )}

                {(t.confidence !== null && t.confidence !== undefined) && (
                  <div style={{ display: 'flex', gap: '0.85rem', marginTop: '0.5rem', paddingTop: '0.35rem', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.7rem' }}>
                    <span style={{ color: 'var(--text-dim)' }}>
                      Confidence: <strong style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{t.confidence}</strong>
                    </span>
                    {t.decision && (
                      <span style={{ color: 'var(--text-dim)' }}>
                        Decision: <strong style={{ color: '#ffffff' }}>{t.decision}</strong>
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
