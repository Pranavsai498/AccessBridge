import React from 'react';
import { Check, ShieldAlert, Loader2 } from 'lucide-react';

export default function AgentNode({
  stepNumber,
  name,
  role,
  status = 'standby', // 'standby' | 'running' | 'completed' | 'blocked'
  icon: Icon,
  confidence,
  details
}) {
  const isRunning = status === 'running';
  const isCompleted = status === 'completed';
  const isBlocked = status === 'blocked';

  return (
    <div
      className={`panel panel-interactive ${isRunning ? 'anim-running-node' : ''}`}
      style={{
        padding: '1rem',
        borderRadius: 'var(--radius-md)',
        background: isRunning
          ? 'var(--bg-surface-elevated)'
          : isBlocked
          ? 'rgba(244, 63, 94, 0.08)'
          : 'var(--bg-surface)',
        borderColor: isRunning
          ? 'var(--primary)'
          : isBlocked
          ? 'var(--status-danger)'
          : isCompleted
          ? 'rgba(16, 185, 129, 0.4)'
          : 'var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        minHeight: '140px',
        transition: 'all 0.25s ease'
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: 'var(--radius-sm)',
                background: isRunning
                  ? 'rgba(56, 189, 248, 0.2)'
                  : isBlocked
                  ? 'rgba(244, 63, 94, 0.2)'
                  : 'rgba(255, 255, 255, 0.05)',
                color: isRunning ? 'var(--primary)' : isBlocked ? 'var(--status-danger)' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {Icon && <Icon style={{ width: 15, height: 15 }} aria-hidden="true" />}
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.04em' }}>
              STEP {stepNumber}
            </span>
          </div>

          {/* Status Badge */}
          {isRunning && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.65rem',
                fontWeight: 700,
                color: 'var(--primary)',
                background: 'var(--primary-glow)',
                padding: '0.15rem 0.45rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid rgba(56, 189, 248, 0.4)'
              }}
            >
              <Loader2 style={{ width: 10, height: 10, animation: 'spin 1s linear infinite' }} />
              RUNNING
            </span>
          )}
          {isCompleted && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.2rem',
                fontSize: '0.65rem',
                fontWeight: 700,
                color: 'var(--status-success)',
                background: 'var(--status-success-bg)',
                padding: '0.15rem 0.45rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--status-success-border)'
              }}
            >
              <Check style={{ width: 10, height: 10 }} />
              PASSED
            </span>
          )}
          {isBlocked && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.2rem',
                fontSize: '0.65rem',
                fontWeight: 700,
                color: 'var(--status-danger)',
                background: 'var(--status-danger-bg)',
                padding: '0.15rem 0.45rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--status-danger-border)'
              }}
            >
              <ShieldAlert style={{ width: 10, height: 10 }} />
              BLOCKED
            </span>
          )}
          {!isRunning && !isCompleted && !isBlocked && (
            <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>
              STANDBY
            </span>
          )}
        </div>

        <h4
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.88rem',
            fontWeight: 700,
            color: isRunning ? '#ffffff' : 'var(--text-primary)',
            marginBottom: '0.2rem'
          }}
        >
          {name}
        </h4>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
          {role}
        </p>
      </div>

      <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
          {details || 'Ready'}
        </span>
        {confidence !== undefined && confidence !== null && (
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
            {Math.round(confidence * 100)}% Conf
          </span>
        )}
      </div>
    </div>
  );
}
