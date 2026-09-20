import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

export default function ConfidencePanel({
  safetyDecision,
  onClarify,
  onCancel,
  onRequestReview
}) {
  if (!safetyDecision) {
    return (
      <div className="panel" style={{ padding: '1.25rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <ShieldCheck style={{ width: 16, height: 16, color: 'var(--status-success)' }} />
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              SAFETY GATE
            </h4>
          </div>
          <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', background: 'var(--status-success-bg)', color: 'var(--status-success)', border: '1px solid var(--status-success-border)' }}>
            SYSTEM READY
          </span>
        </div>
        <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0, 0, 0, 0.25)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
            No action currently pending.
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', margin: 0, lineHeight: 1.4 }}>
            Multi-signal confidence calculation (Intent match, Field match, Value validation) and WCAG 3.3.4 gating activate upon user interaction.
          </p>
        </div>
      </div>
    );
  }

  const {
    composite_confidence = 0.0,
    risk_level = 'LOW',
    decision = 'EXECUTE',
    reason = '',
    confidence_breakdown = {},
    blocking_factors = []
  } = safetyDecision;

  const percentage = Math.round(composite_confidence * 100);

  const getDecisionTheme = () => {
    if (decision === 'BLOCK') {
      return {
        color: 'var(--status-danger)',
        bg: 'var(--status-danger-bg)',
        border: 'var(--status-danger-border)',
        label: 'ACTION BLOCKED',
        icon: ShieldAlert
      };
    }
    if (decision === 'REQUIRE_CONFIRMATION') {
      return {
        color: 'var(--status-warning)',
        bg: 'var(--status-warning-bg)',
        border: 'var(--status-warning-border)',
        label: 'USER CONFIRMATION REQUIRED',
        icon: AlertTriangle
      };
    }
    if (decision === 'ASK_CLARIFICATION' || composite_confidence < 0.85) {
      return {
        color: 'var(--accent-cyan)',
        bg: 'rgba(6, 182, 212, 0.12)',
        border: 'rgba(6, 182, 212, 0.35)',
        label: 'CLARIFICATION NEEDED',
        icon: AlertTriangle
      };
    }
    return {
      color: 'var(--status-success)',
      bg: 'var(--status-success-bg)',
      border: 'var(--status-success-border)',
      label: 'ACTION ALLOWED',
      icon: ShieldCheck
    };
  };

  const theme = getDecisionTheme();
  const Icon = theme.icon;

  // Gauge circumference math
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (composite_confidence * circumference);

  return (
    <div className="panel" style={{ padding: '1.5rem', background: 'var(--bg-surface)' }}>
      {/* Title & Risk Tag */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            SAFETY & CONFIDENCE GATE
          </h3>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Explicit multi-signal formula with active ambiguity & risk gating
          </span>
        </div>

        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 800,
            padding: '0.2rem 0.65rem',
            borderRadius: 'var(--radius-full)',
            background: risk_level === 'CRITICAL' ? 'var(--status-danger-bg)' : risk_level === 'HIGH' ? 'var(--status-warning-bg)' : 'var(--status-success-bg)',
            color: risk_level === 'CRITICAL' ? 'var(--status-danger)' : risk_level === 'HIGH' ? 'var(--status-warning)' : 'var(--status-success)',
            border: `1px solid ${risk_level === 'CRITICAL' ? 'var(--status-danger-border)' : risk_level === 'HIGH' ? 'var(--status-warning-border)' : 'var(--status-success-border)'}`,
            fontFamily: 'var(--font-mono)'
          }}
        >
          RISK: {risk_level}
        </span>
      </div>

      {/* Main Gauge & Decision Summary */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
          padding: '1.25rem',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid var(--border-subtle)',
          marginBottom: '1.25rem'
        }}
      >
        {/* SVG Radial Gauge */}
        <div style={{ position: 'relative', width: '90px', height: '90px', flexShrink: 0 }}>
          <svg width="90" height="90" viewBox="0 0 90 90" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="45"
              cy="45"
              r={radius}
              fill="transparent"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="7"
            />
            <circle
              cx="45"
              cy="45"
              r={radius}
              fill="transparent"
              stroke={theme.color}
              strokeWidth="7"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: theme.color, lineHeight: 1 }}>
              {percentage}%
            </span>
            <span style={{ fontSize: '0.62rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Score
            </span>
          </div>
        </div>

        {/* Decision & Reason */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.75rem',
              fontWeight: 800,
              padding: '0.2rem 0.6rem',
              borderRadius: 'var(--radius-sm)',
              background: theme.bg,
              color: theme.color,
              border: `1px solid ${theme.border}`,
              marginBottom: '0.4rem'
            }}
          >
            <Icon style={{ width: 14, height: 14 }} aria-hidden="true" />
            <span>{theme.label}</span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
            {reason || 'System analyzed all factors and found intent safe and verified.'}
          </p>
        </div>
      </div>

      {/* Multi-Factor Mathematical Breakdown */}
      <div style={{ marginBottom: '1.25rem' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)', display: 'block', marginBottom: '0.6rem' }}>
          Multi-Factor Signal Weights:
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.6rem' }}>
          {[
            { label: 'Intent Signal', weight: '25%', val: confidence_breakdown.intent_confidence ?? 1.0 },
            { label: 'Field Match', weight: '40%', val: confidence_breakdown.field_match ?? 0.95 },
            { label: 'Value Validation', weight: '30%', val: confidence_breakdown.semantic_value_match ?? 0.92 },
            { label: 'RAG Grounding', weight: '5%', val: confidence_breakdown.rag_evidence ?? 0.85 }
          ].map((factor, idx) => {
            const factorPct = Math.round(factor.val * 100);
            return (
              <div
                key={idx}
                style={{
                  padding: '0.6rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  <span>{factor.label} ({factor.weight})</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{factorPct}%</span>
                </div>
                <div style={{ height: '4px', width: '100%', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${factorPct}%`,
                      background: factorPct >= 85 ? 'var(--status-success)' : factorPct >= 65 ? 'var(--primary)' : 'var(--status-warning)',
                      borderRadius: '2px'
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Blocking Factors & Penalties */}
      {blocking_factors && blocking_factors.length > 0 && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--status-danger-bg)',
            border: '1px solid var(--status-danger-border)',
            marginBottom: '1rem'
          }}
        >
          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--status-danger)', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>
            Active Guardrail Penalties Triggered:
          </span>
          {blocking_factors.map((bf, idx) => (
            <div key={idx} style={{ fontSize: '0.75rem', color: '#fecdd3', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
              <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--status-danger)' }} />
              {bf}
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons for Non-Execute States */}
      {decision === 'ASK_CLARIFICATION' && (
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button
            type="button"
            onClick={onClarify}
            style={{
              flex: 1,
              padding: '0.65rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--primary)',
              color: 'var(--text-inverse)',
              fontWeight: 700,
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem'
            }}
          >
            Provide Clarification
          </button>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '0.65rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
              fontWeight: 600,
              fontSize: '0.8rem'
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {decision === 'REQUIRE_CONFIRMATION' && (
        <button
          type="button"
          onClick={onRequestReview}
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--status-warning)',
            color: 'var(--text-inverse)',
            fontWeight: 800,
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            boxShadow: '0 0 15px rgba(245, 158, 11, 0.3)'
          }}
        >
          <AlertTriangle style={{ width: 16, height: 16 }} />
          Review & Confirm Application Submission
        </button>
      )}
    </div>
  );
}
