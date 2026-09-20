import React from 'react';
import { ShieldCheck, AlertTriangle, Check, Edit2 } from 'lucide-react';

export default function ConfirmationDialog({
  payload,
  onConfirm,
  onCancel
}) {
  if (!payload) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm_title"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1.5rem'
      }}
    >
      <div
        className="panel-elevated"
        style={{
          maxWidth: '560px',
          width: '100%',
          padding: '2rem',
          border: '2px solid var(--status-warning)',
          boxShadow: '0 0 50px rgba(245, 158, 11, 0.35)',
          background: 'var(--bg-surface)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--status-warning-bg)',
              color: 'var(--status-warning)',
              border: '1px solid var(--status-warning-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <ShieldCheck style={{ width: 24, height: 24 }} />
          </div>
          <div>
            <h3 id="confirm_title" style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--status-warning)' }}>
              {payload.title || 'Human Confirmation Required'}
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              WCAG 2.2 Guideline 3.3.4 (Error Prevention): High-impact submissions strictly require human approval.
            </p>
          </div>
        </div>

        {/* Application Data Summary */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.35)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            margin: '1.25rem 0',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.85rem',
            lineHeight: 1.6,
            color: 'var(--text-primary)',
            whiteSpace: 'pre-line',
            maxHeight: '260px',
            overflowY: 'auto'
          }}
        >
          {payload.summary || 'Please review your application details prior to final submission.'}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              flex: 1.3,
              background: 'var(--status-success)',
              color: 'var(--text-inverse)',
              fontWeight: 800,
              fontSize: '0.88rem',
              padding: '0.85rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.35)'
            }}
          >
            <Check style={{ width: 16, height: 16 }} />
            Approve & Submit Application
          </button>

          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1,
              background: 'rgba(255, 255, 255, 0.06)',
              color: 'var(--text-primary)',
              fontWeight: 600,
              fontSize: '0.88rem',
              padding: '0.85rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              cursor: 'pointer'
            }}
          >
            <Edit2 style={{ width: 14, height: 14 }} />
            Make Changes / Edit
          </button>
        </div>
      </div>
    </div>
  );
}
