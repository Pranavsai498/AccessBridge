import React from 'react';

export default function ConfirmationModal({ payload, onConfirm, onCancel }) {
  if (!payload) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal_title"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem'
      }}
    >
      <div
        className="glass-panel"
        style={{
          maxWidth: '550px',
          width: '100%',
          padding: '2rem',
          border: '2px solid var(--accent-amber)',
          boxShadow: '0 0 40px rgba(245, 158, 11, 0.3)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <span style={{ fontSize: '1.8rem' }}>🛡️</span>
          <div>
            <h3 id="modal_title" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
              {payload.title || 'Human Confirmation Required'}
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              WCAG 3.3.4 Error Prevention: Explicit human confirmation is required before high-impact submission.
            </p>
          </div>
        </div>

        <div style={{ background: 'rgba(0, 0, 0, 0.4)', borderRadius: '8px', padding: '1rem', margin: '1.25rem 0', whiteSpace: 'pre-line', fontSize: '0.9rem', lineHeight: 1.6, border: '1px solid rgba(255,255,255,0.06)' }}>
          {payload.summary}
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              background: 'var(--accent-emerald)',
              color: '#090d16',
              fontWeight: 800,
              fontSize: '0.95rem',
              padding: '0.85rem 1.25rem',
              borderRadius: '8px'
            }}
          >
            ✓ Approve & Submit Application
          </button>

          <button
            onClick={onCancel}
            style={{
              flex: 1,
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.95rem',
              padding: '0.85rem 1.25rem',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.2)'
            }}
          >
            ✎ Make Changes / Edit
          </button>
        </div>
      </div>
    </div>
  );
}
