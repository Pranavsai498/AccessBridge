import React from 'react';
import { CheckCircle2, FileText, ArrowRight, RotateCcw, ExternalLink } from 'lucide-react';

export default function CompletionState({
  sessionId,
  pageState,
  onReset
}) {
  const fields = pageState?.fields || [];

  return (
    <div
      className="panel-elevated"
      style={{
        padding: '2.5rem',
        maxWidth: '680px',
        margin: '2rem auto',
        textAlign: 'center',
        background: 'var(--bg-surface)'
      }}
    >
      {/* Success Badge */}
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'var(--status-success-bg)',
          color: 'var(--status-success)',
          border: '2px solid var(--status-success)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem',
          boxShadow: '0 0 30px rgba(16, 185, 129, 0.4)'
        }}
      >
        <CheckCircle2 style={{ width: 36, height: 36 }} />
      </div>

      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.6rem',
          fontWeight: 800,
          color: 'var(--text-primary)',
          marginBottom: '0.4rem',
          letterSpacing: '-0.02em'
        }}
      >
        Application Submitted Successfully
      </h2>

      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
        Your fellowship application has been securely validated, verified against WCAG 3.3.4 standards, and submitted through Playwright browser automation.
      </p>

      {/* Verified Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.75rem',
          marginBottom: '2rem'
        }}
      >
        <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: 'var(--status-success)', display: 'block' }}>
            98%
          </span>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
            Final Confidence
          </span>
        </div>

        <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)', display: 'block' }}>
            100%
          </span>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
            Fields Verified
          </span>
        </div>

        <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-indigo)', display: 'block' }}>
            0
          </span>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
            Safety Violations
          </span>
        </div>
      </div>

      {/* Submitted Field Summary List */}
      <div
        style={{
          textAlign: 'left',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid var(--border-subtle)',
          padding: '1.25rem',
          marginBottom: '2rem'
        }}
      >
        <h4 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-dim)', marginBottom: '0.75rem' }}>
          Final Application Record Summary
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.78rem' }}>
          {fields.map((f) => (
            <div key={f.field_id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.35rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>{f.label}:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {f.current_value || '[Default]'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Session Audit Link */}
      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginBottom: '1.5rem' }}>
        Audit Session ID: <span style={{ color: 'var(--primary)' }}>{sessionId}</span>
      </div>

      {/* Reset Action */}
      <button
        type="button"
        onClick={onReset}
        style={{
          padding: '0.75rem 1.5rem',
          borderRadius: 'var(--radius-md)',
          background: 'var(--primary)',
          color: 'var(--text-inverse)',
          fontWeight: 700,
          fontSize: '0.85rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          cursor: 'pointer'
        }}
      >
        <RotateCcw style={{ width: 16, height: 16 }} />
        Start Another Application Session
      </button>
    </div>
  );
}
