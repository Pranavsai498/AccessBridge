import React from 'react';

export default function StatusBadge({
  label,
  variant = 'neutral',
  icon: Icon = null,
  pulse = false,
  size = 'md',
  title = ''
}) {
  const variantStyles = {
    success: {
      bg: 'var(--status-success-bg)',
      border: 'var(--status-success-border)',
      color: 'var(--status-success)',
      dot: 'var(--status-success)'
    },
    warning: {
      bg: 'var(--status-warning-bg)',
      border: 'var(--status-warning-border)',
      color: 'var(--status-warning)',
      dot: 'var(--status-warning)'
    },
    danger: {
      bg: 'var(--status-danger-bg)',
      border: 'var(--status-danger-border)',
      color: 'var(--status-danger)',
      dot: 'var(--status-danger)'
    },
    info: {
      bg: 'var(--status-info-bg)',
      border: 'var(--status-info-border)',
      color: 'var(--primary)',
      dot: 'var(--primary)'
    },
    neutral: {
      bg: 'rgba(255, 255, 255, 0.04)',
      border: 'var(--border-subtle)',
      color: 'var(--text-secondary)',
      dot: 'var(--text-muted)'
    },
    accent: {
      bg: 'rgba(99, 102, 241, 0.12)',
      border: 'rgba(99, 102, 241, 0.3)',
      color: 'var(--accent-violet)',
      dot: 'var(--accent-violet)'
    }
  };

  const style = variantStyles[variant] || variantStyles.neutral;
  const isSm = size === 'sm';

  return (
    <span
      title={title || label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isSm ? '0.3rem' : '0.45rem',
        padding: isSm ? '0.15rem 0.5rem' : '0.3rem 0.75rem',
        borderRadius: 'var(--radius-full)',
        backgroundColor: style.bg,
        border: `1px solid ${style.border}`,
        color: style.color,
        fontSize: isSm ? '0.68rem' : '0.78rem',
        fontWeight: 600,
        letterSpacing: '0.02em',
        fontFamily: 'var(--font-sans)',
        whiteSpace: 'nowrap',
        userSelect: 'none'
      }}
    >
      {pulse && (
        <span
          aria-hidden="true"
          style={{
            width: isSm ? '5px' : '7px',
            height: isSm ? '5px' : '7px',
            borderRadius: '50%',
            backgroundColor: style.dot,
            boxShadow: `0 0 8px ${style.dot}`,
            display: 'inline-block',
            flexShrink: 0
          }}
        />
      )}
      {Icon && <Icon style={{ width: isSm ? 12 : 14, height: isSm ? 12 : 14 }} aria-hidden="true" />}
      <span>{label}</span>
    </span>
  );
}
