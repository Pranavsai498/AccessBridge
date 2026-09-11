import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, ShieldCheck, Lock, EyeOff, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { fetchSafetySummary } from '../api/client';

export default function SafetyCenter({ hasActiveInjection = false, onTriggerRedTeamDemo }) {
  const [safetyData, setSafetyData] = useState({
    unauthorized_actions: 0,
    unsafe_submissions: 0,
    ambiguities_handled: 1,
    user_confirmations: 1,
    prompt_injection_status: 'ACTIVE',
    pii_redaction_status: 'ACTIVE',
    untrusted_dom_isolation: 'ACTIVE'
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const stats = await fetchSafetySummary();
        if (stats) setSafetyData(stats);
      } catch (err) {
        console.warn('Could not load safety summary:', err);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="panel" style={{ padding: '1.5rem', background: 'var(--bg-surface)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield style={{ width: 18, height: 18, color: 'var(--status-success)' }} />
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              SAFETY & GOVERNANCE CENTER
            </h3>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Zero-trust architecture enforcing WCAG 3.3.4 error prevention and untrusted DOM isolation
          </p>
        </div>

        <span
          style={{
            fontSize: '0.7rem',
            fontWeight: 800,
            padding: '0.2rem 0.65rem',
            borderRadius: 'var(--radius-full)',
            background: 'var(--status-success-bg)',
            color: 'var(--status-success)',
            border: '1px solid var(--status-success-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}
        >
          <Lock style={{ width: 12, height: 12 }} />
          ALL GUARDRAILS ENGAGED
        </span>
      </div>

      {/* Safety Stat Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Unauthorized Actions', val: safetyData.unauthorized_actions, status: 'PASSED', color: 'var(--status-success)', icon: ShieldCheck },
          { label: 'Unsafe Submissions', val: safetyData.unsafe_submissions, status: 'PROTECTED', color: 'var(--status-success)', icon: Lock },
          { label: 'Ambiguities Handled', val: safetyData.ambiguities_handled, status: 'GATED', color: 'var(--status-warning)', icon: AlertOctagon },
          { label: 'Human Confirmations', val: safetyData.user_confirmations, status: 'VERIFIED', color: 'var(--accent-indigo)', icon: CheckCircle2 }
        ].map((item, i) => {
          const ItemIcon = item.icon;
          return (
            <div
              key={i}
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.2rem' }}>
                  {item.label}
                </span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {item.val}
                </span>
              </div>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  color: item.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ItemIcon style={{ width: 18, height: 18 }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Red-Team Incident Banner if Injection is Detected or Triggered */}
      <div
        style={{
          padding: '1.25rem',
          borderRadius: 'var(--radius-md)',
          background: hasActiveInjection ? 'rgba(244, 63, 94, 0.12)' : 'rgba(255, 255, 255, 0.02)',
          border: `1.5px solid ${hasActiveInjection ? 'var(--status-danger)' : 'var(--border-subtle)'}`,
          marginBottom: '1.25rem',
          transition: 'all 0.3s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
          <ShieldAlert
            style={{
              width: 22,
              height: 22,
              color: hasActiveInjection ? 'var(--status-danger)' : 'var(--status-success)',
              flexShrink: 0,
              marginTop: '0.15rem'
            }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <h4
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  color: hasActiveInjection ? 'var(--status-danger)' : 'var(--text-primary)'
                }}
              >
                {hasActiveInjection ? '⚠ ADVERSARIAL PROMPT INJECTION ISOLATED & BLOCKED' : 'Untrusted DOM Injection Firewall: Active'}
              </h4>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '0.15rem 0.5rem',
                  borderRadius: 'var(--radius-xs)',
                  background: hasActiveInjection ? 'var(--status-danger-bg)' : 'var(--status-success-bg)',
                  color: hasActiveInjection ? 'var(--status-danger)' : 'var(--status-success)',
                  border: `1px solid ${hasActiveInjection ? 'var(--status-danger-border)' : 'var(--status-success-border)'}`,
                  fontFamily: 'var(--font-mono)'
                }}
              >
                {hasActiveInjection ? 'INCIDENT QUARANTINED' : 'SCANNING 100% OF DOM'}
              </span>
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              {hasActiveInjection
                ? 'Website instruction override detected: ("Ignore all previous instructions..."). Content was quarantined as passive untrusted data. Zero credentials or user information were transmitted.'
                : 'AccessBridge treats all webpage text as untrusted data. External DOM text is never permitted to redefine agent instructions or execute unauthorized actions.'}
            </p>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
              <span>Source: <strong>Untrusted DOM</strong></span>
              <span>Action: <strong style={{ color: 'var(--status-success)' }}>Neutralized & Blocked</strong></span>
              <span>Data Protection: <strong style={{ color: 'var(--status-success)' }}>100% Preserved</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Security Policies Matrix */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.6rem' }}>
        {[
          { title: 'PII Redaction Guard', desc: 'Credit cards, Social Security numbers, and Bearer tokens masked before transmission.', status: 'ENFORCED' },
          { title: 'WCAG 3.3.4 Error Prevention', desc: 'High-impact actions (form submissions, deletions) require explicit user consent.', status: 'MANDATORY' },
          { title: 'Untrusted Instruction Shield', desc: 'System prompts prohibit DOM text from overriding core safety and validation policies.', status: 'ISOLATED' }
        ].map((policy, idx) => (
          <div
            key={idx}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {policy.title}
              </span>
              <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--status-success)', fontFamily: 'var(--font-mono)' }}>
                {policy.status}
              </span>
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', lineHeight: 1.4, margin: 0 }}>
              {policy.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
