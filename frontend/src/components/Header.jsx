import React from 'react';
import {
  Shield,
  Layers,
  Sparkles,
  Eye,
  Sliders,
  Menu,
  RotateCcw,
  Zap
} from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function Header({
  activeEngine = 'playwright',
  systemStatus = null,
  isProcessing = false,
  safetyDecision = null,
  ragGrounding = [],
  onSwitchEngine,
  highContrast,
  onToggleContrast,
  judgeMode,
  onToggleJudgeMode,
  onResetForm,
  onToggleMobileMenu
}) {
  // Compute real operational statuses based on backend state
  const isBrowserConnected = systemStatus?.browser?.status === 'CONNECTED';
  const browserLabel = isBrowserConnected ? 'CONNECTED' : 'DISCONNECTED';
  
  const agentsLabel = isProcessing
    ? 'RUNNING'
    : safetyDecision?.decision === 'BLOCK'
    ? 'BLOCKED'
    : 'IDLE';

  const groundingLabel = ragGrounding?.length > 0
    ? `${ragGrounding.length} RETRIEVED`
    : (systemStatus?.grounding?.status || 'READY');

  const safetyLabel = safetyDecision?.decision === 'BLOCK'
    ? 'BLOCKED'
    : safetyDecision?.decision === 'REQUIRE_CONFIRMATION'
    ? 'ACTION REVIEW'
    : 'READY';

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'var(--bg-header)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem'
      }}
    >
      {/* Left: Product Branding & Logo Mark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <button
          type="button"
          onClick={onToggleMobileMenu}
          aria-label="Toggle navigation menu"
          style={{
            display: 'none',
            padding: '0.4rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255, 255, 255, 0.05)',
            color: 'var(--text-primary)',
            cursor: 'pointer'
          }}
          className="mobile-menu-trigger"
        >
          <Menu style={{ width: 18, height: 18 }} />
        </button>

        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--primary), var(--accent-indigo))',
            color: '#000000',
            fontWeight: 900,
            fontSize: '1.1rem',
            fontFamily: 'var(--font-display)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px var(--primary-glow)'
          }}
        >
          AB
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.15rem',
                fontWeight: 900,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                lineHeight: 1.1
              }}
            >
              AccessBridge
            </span>
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                padding: '0.15rem 0.45rem',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(56, 189, 248, 0.12)',
                color: 'var(--primary)',
                border: '1px solid rgba(56, 189, 248, 0.3)'
              }}
            >
              Agentic A11y Layer
            </span>
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'block', marginTop: '0.1rem' }}>
            "An agentic accessibility layer between people and the digital world"
          </span>
        </div>
      </div>

      {/* Center: Real Operational System Status Badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }} className="header-status-strip">
        <StatusBadge label="SYSTEM ONLINE" variant="success" pulse size="sm" />
        <StatusBadge
          label={`BROWSER: ${browserLabel}`}
          variant={isBrowserConnected ? 'success' : 'danger'}
          pulse={!isBrowserConnected}
          size="sm"
        />
        <StatusBadge
          label={`AGENTS: ${agentsLabel}`}
          variant={agentsLabel === 'RUNNING' ? 'info' : (agentsLabel === 'BLOCKED' ? 'warning' : 'neutral')}
          pulse={agentsLabel === 'RUNNING'}
          size="sm"
        />
        <StatusBadge
          label={`GROUNDING: ${groundingLabel}`}
          variant={ragGrounding?.length > 0 ? 'accent' : 'info'}
          size="sm"
        />
        <StatusBadge
          label={`SAFETY: ${safetyLabel}`}
          variant={safetyLabel === 'BLOCKED' ? 'danger' : (safetyLabel === 'ACTION REVIEW' ? 'warning' : 'success')}
          size="sm"
        />
      </div>

      {/* Right Controls: Judge Mode, Contrast & Reset */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {/* Judge Mode Switch */}
        <button
          type="button"
          onClick={onToggleJudgeMode}
          aria-pressed={judgeMode}
          style={{
            padding: '0.4rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.72rem',
            fontWeight: 700,
            background: judgeMode ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
            color: judgeMode ? 'var(--primary)' : 'var(--text-secondary)',
            border: `1px solid ${judgeMode ? 'var(--primary)' : 'var(--border-subtle)'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            cursor: 'pointer'
          }}
        >
          <Zap style={{ width: 13, height: 13, color: judgeMode ? 'var(--primary)' : 'var(--text-dim)' }} />
          <span>{judgeMode ? 'Judge Mode: ON' : 'Judge Mode: OFF'}</span>
        </button>

        {/* High Contrast Toggle */}
        <button
          type="button"
          onClick={onToggleContrast}
          aria-pressed={highContrast}
          title="Toggle High Contrast Mode (WCAG AAA Compliance)"
          style={{
            padding: '0.4rem 0.65rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.72rem',
            fontWeight: 600,
            background: highContrast ? 'var(--status-warning)' : 'rgba(255, 255, 255, 0.04)',
            color: highContrast ? 'var(--text-inverse)' : 'var(--text-primary)',
            border: `1px solid ${highContrast ? 'var(--status-warning)' : 'var(--border-subtle)'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            cursor: 'pointer'
          }}
        >
          <Eye style={{ width: 14, height: 14 }} />
          <span className="hide-on-mobile">{highContrast ? 'Standard Mode' : 'High Contrast'}</span>
        </button>

        {/* Quick Reset Form */}
        <button
          type="button"
          onClick={onResetForm}
          title="Reset Target Form"
          style={{
            padding: '0.4rem 0.65rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.72rem',
            fontWeight: 600,
            background: 'rgba(255, 255, 255, 0.04)',
            color: 'var(--text-muted)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            cursor: 'pointer'
          }}
        >
          <RotateCcw style={{ width: 13, height: 13 }} />
          <span className="hide-on-mobile">Reset</span>
        </button>
      </div>
    </header>
  );
}
