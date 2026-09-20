import React from 'react';

export default function ConfidenceGauge({ safetyDecision }) {
  if (!safetyDecision) {
    return (
      <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-subtle)' }}>
        No confidence score calculated yet. Send an input to activate the multi-signal engine.
      </div>
    );
  }

  const { composite_confidence, risk_level, decision, confidence_breakdown = {}, blocking_factors = [] } = safetyDecision;
  const percentage = Math.round(composite_confidence * 100);

  const getScoreColor = () => {
    if (decision === 'BLOCK') return 'var(--accent-rose)';
    if (composite_confidence >= 0.85) return 'var(--accent-emerald)';
    if (composite_confidence >= 0.65) return 'var(--accent-cyan)';
    return 'var(--accent-amber)';
  };

  const scoreColor = getScoreColor();

  return (
    <div className="glass-panel" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Confidence & Safety Gate
        </h4>
        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 800,
            padding: '0.2rem 0.6rem',
            borderRadius: '4px',
            background: risk_level === 'CRITICAL' ? 'rgba(244,63,94,0.2)' : (risk_level === 'HIGH' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)'),
            color: risk_level === 'CRITICAL' ? 'var(--accent-rose)' : (risk_level === 'HIGH' ? 'var(--accent-amber)' : 'var(--accent-emerald)'),
            border: `1px solid ${risk_level === 'CRITICAL' ? 'var(--accent-rose)' : (risk_level === 'HIGH' ? 'var(--accent-amber)' : 'var(--accent-emerald)')}`
          }}
        >
          RISK: {risk_level}
        </span>
      </div>

      {/* Main Score Dial */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.25rem' }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          border: `3px solid ${scoreColor}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 0 16px ${scoreColor}33`,
          background: 'rgba(0,0,0,0.3)',
          flexShrink: 0
        }}>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{percentage}%</span>
          <span style={{ fontSize: '0.62rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Score</span>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>
            Decision: <span style={{ color: scoreColor }}>{decision}</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            {safetyDecision.reason}
          </div>
        </div>
      </div>

      {/* Multi-Signal Factor Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
        {[
          { label: 'Intent Signal', val: confidence_breakdown.intent_confidence ?? 1.0, weight: '25%' },
          { label: 'Field Match', val: confidence_breakdown.field_match ?? 0.95, weight: '40%' },
          { label: 'Semantic Value', val: confidence_breakdown.semantic_value_match ?? 0.92, weight: '30%' },
          { label: 'RAG Grounding', val: confidence_breakdown.rag_evidence ?? 0.8, weight: '5%' }
        ].map((f, i) => (
          <div key={i} style={{ background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
              <span>{f.label} ({f.weight})</span>
              <span style={{ fontWeight: 700, color: '#fff' }}>{Math.round(f.val * 100)}%</span>
            </div>
            <div style={{ height: '4px', width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.round(f.val * 100)}%`, background: 'var(--primary)', borderRadius: '2px' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Blocking Factors or Penalties */}
      {blocking_factors.length > 0 && (
        <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '6px', padding: '0.6rem 0.75rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-rose)', marginBottom: '0.25rem' }}>
            Active Guardrail Trigger:
          </div>
          {blocking_factors.map((bf, idx) => (
            <div key={idx} style={{ fontSize: '0.72rem', color: '#fecdd3' }}>
              • {bf}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
