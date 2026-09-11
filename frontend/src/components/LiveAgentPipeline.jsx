import React from 'react';
import {
  MessageSquare,
  UserCheck,
  Globe,
  BookOpen,
  Edit3,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  Clock,
  Sparkles
} from 'lucide-react';

export default function LiveAgentPipeline({
  activeAgent = 'intake',
  isProcessing = false,
  safetyDecision = null,
  activeProfile = null,
  fieldsCount = 7,
  ragSourcesCount = 0
}) {
  const isBlocked = safetyDecision?.decision === 'BLOCK';
  const isReview = safetyDecision?.decision === 'REQUIRE_CONFIRMATION';

  const stages = [
    {
      id: 'intake',
      name: 'INTAKE',
      icon: MessageSquare,
      summary: 'Intent identified',
      isActive: activeAgent === 'intake' && isProcessing,
      isDone: activeAgent !== 'intake' || (!isProcessing && !isBlocked)
    },
    {
      id: 'profile',
      name: 'ACCESSIBILITY',
      icon: UserCheck,
      summary: activeProfile?.name || 'Cognitive + Motor',
      isActive: activeAgent === 'profile' && isProcessing,
      isDone: ['web_understanding', 'rag', 'form_interaction', 'verification', 'safety'].includes(activeAgent) || !isProcessing
    },
    {
      id: 'web_understanding',
      name: 'WEB DOM',
      icon: Globe,
      summary: `${fieldsCount} form fields`,
      isActive: activeAgent === 'web_understanding' && isProcessing,
      isDone: ['rag', 'form_interaction', 'verification', 'safety'].includes(activeAgent) || !isProcessing
    },
    {
      id: 'rag',
      name: 'RAG GROUNDING',
      icon: BookOpen,
      summary: ragSourcesCount > 0 ? `${ragSourcesCount} WCAG sources` : 'Rules referenced',
      isActive: activeAgent === 'rag' && isProcessing,
      isDone: ['form_interaction', 'verification', 'safety'].includes(activeAgent) || !isProcessing
    },
    {
      id: 'form_interaction',
      name: 'FORM ACTION',
      icon: Edit3,
      summary: 'Mapped input to DOM',
      isActive: activeAgent === 'form_interaction' && isProcessing,
      isDone: ['verification', 'safety'].includes(activeAgent) || !isProcessing
    },
    {
      id: 'verification',
      name: 'VERIFY',
      icon: CheckCircle2,
      summary: isProcessing && activeAgent === 'verification' ? 'Checking mapping...' : 'Field verified',
      isActive: activeAgent === 'verification' && isProcessing,
      isDone: activeAgent === 'safety' || !isProcessing
    },
    {
      id: 'safety',
      name: 'SAFETY GATE',
      icon: ShieldAlert,
      summary: isBlocked ? 'Action Blocked' : (isReview ? 'Review Required' : 'Action Allowed'),
      isActive: activeAgent === 'safety' && isProcessing,
      isDone: !isProcessing,
      isError: isBlocked,
      isWarning: isReview
    }
  ];

  return (
    <div
      role="region"
      aria-label="Live Agent Activity Pipeline"
      style={{
        padding: '0.85rem 1.25rem',
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <Sparkles style={{ width: 14, height: 14, color: 'var(--primary)' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
            Agent Execution Pipeline
          </span>
        </div>
        <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
          {isProcessing ? '● Step Active' : (isBlocked ? '⛔ Blocked by Safety' : '✓ Pipeline Idle / Ready')}
        </span>
      </div>

      {/* Horizontal Pipeline Sequence */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          overflowX: 'auto',
          paddingBottom: '0.2rem',
          gap: '0.4rem'
        }}
      >
        {stages.map((st, idx) => {
          const Icon = st.icon;
          const isCurrent = st.isActive;

          return (
            <React.Fragment key={st.id}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.4rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  background: isCurrent
                    ? 'rgba(56, 189, 248, 0.15)'
                    : st.isError
                    ? 'rgba(239, 68, 68, 0.12)'
                    : st.isWarning
                    ? 'rgba(245, 158, 11, 0.12)'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${
                    isCurrent
                      ? 'var(--primary)'
                      : st.isError
                      ? 'var(--status-danger)'
                      : st.isWarning
                      ? 'var(--status-warning)'
                      : 'var(--border-subtle)'
                  }`,
                  flexShrink: 0,
                  transition: 'all 0.2s ease'
                }}
              >
                <div
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: 'var(--radius-xs)',
                    background: isCurrent
                      ? 'var(--primary)'
                      : st.isError
                      ? 'var(--status-danger)'
                      : 'rgba(255, 255, 255, 0.08)',
                    color: isCurrent || st.isError ? 'var(--text-inverse)' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Icon style={{ width: 12, height: 12 }} />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: isCurrent ? 'var(--primary)' : 'var(--text-primary)' }}>
                      {st.name}
                    </span>
                    {st.isDone && !isCurrent && !st.isError && (
                      <span style={{ fontSize: '0.65rem', color: 'var(--status-success)', fontWeight: 900 }}>✓</span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-dim)', display: 'block', whiteSpace: 'nowrap' }}>
                    {st.summary}
                  </span>
                </div>
              </div>

              {idx < stages.length - 1 && (
                <ArrowRight style={{ width: 13, height: 13, color: 'var(--text-dim)', flexShrink: 0 }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
