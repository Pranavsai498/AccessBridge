import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function AccessibilityProfileCard({
  profile,
  isSelected,
  onSelect,
  icon: Icon
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      onClick={() => onSelect(profile)}
      className={`panel panel-interactive ${isSelected ? 'anim-running-node' : ''}`}
      style={{
        textAlign: 'left',
        padding: '1.25rem',
        borderRadius: 'var(--radius-md)',
        background: isSelected ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
        borderColor: isSelected ? 'var(--primary)' : 'var(--border-subtle)',
        boxShadow: isSelected ? 'var(--shadow-glow)' : 'var(--shadow-subtle)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        outline: 'none',
        minHeight: '190px'
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                background: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${isSelected ? 'rgba(56, 189, 248, 0.3)' : 'var(--border-subtle)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isSelected ? 'var(--primary)' : 'var(--text-secondary)'
              }}
            >
              {Icon && <Icon style={{ width: 18, height: 18 }} aria-hidden="true" />}
            </div>
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.95rem',
                fontWeight: 700,
                color: isSelected ? '#ffffff' : 'var(--text-primary)',
                letterSpacing: '-0.01em'
              }}
            >
              {profile.name}
            </h3>
          </div>

          {isSelected ? (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.68rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: 'var(--status-success)',
                background: 'var(--status-success-bg)',
                padding: '0.2rem 0.55rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--status-success-border)'
              }}
            >
              <CheckCircle2 style={{ width: 12, height: 12 }} aria-hidden="true" />
              Active
            </span>
          ) : (
            <span
              style={{
                fontSize: '0.68rem',
                color: 'var(--text-dim)',
                padding: '0.2rem 0.5rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              Select
            </span>
          )}
        </div>

        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '1rem' }}>
          {profile.description}
        </p>
      </div>

      {/* Feature Tags List */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
        {profile.features && profile.features.map((feat, idx) => (
          <span
            key={idx}
            style={{
              fontSize: '0.68rem',
              fontWeight: 500,
              padding: '0.15rem 0.45rem',
              borderRadius: 'var(--radius-xs)',
              background: 'rgba(255, 255, 255, 0.04)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-subtle)',
              fontFamily: 'var(--font-mono)'
            }}
          >
            {feat}
          </span>
        ))}
      </div>
    </button>
  );
}
