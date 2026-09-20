import React from 'react';

export default function MetricCard({
  title,
  value,
  subtext,
  icon: Icon,
  badge,
  badgeVariant = 'neutral',
  accentColor = 'var(--primary)'
}) {
  return (
    <div
      className="panel panel-interactive"
      style={{
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Subtle top accent edge */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: `linear-gradient(90deg, ${accentColor}, transparent 80%)`,
          opacity: 0.8
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--text-dim)'
          }}
        >
          {title}
        </span>
        {Icon && (
          <div
            style={{
              padding: '0.45rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              color: accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Icon style={{ width: 16, height: 16 }} aria-hidden="true" />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.4rem' }}>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.75rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            lineHeight: 1.1
          }}
        >
          {value}
        </span>
        {badge && (
          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              padding: '0.15rem 0.5rem',
              borderRadius: 'var(--radius-full)',
              background: badgeVariant === 'success' ? 'var(--status-success-bg)' : 'rgba(255, 255, 255, 0.08)',
              color: badgeVariant === 'success' ? 'var(--status-success)' : 'var(--text-muted)',
              border: `1px solid ${badgeVariant === 'success' ? 'var(--status-success-border)' : 'var(--border-subtle)'}`
            }}
          >
            {badge}
          </span>
        )}
      </div>

      {subtext && (
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
          {subtext}
        </p>
      )}
    </div>
  );
}
