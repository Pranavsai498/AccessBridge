import React from 'react';
import {
  MessageSquare,
  Sliders,
  Globe,
  BookOpen,
  Edit3,
  ShieldCheck,
  Lock,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import AgentNode from './AgentNode';

const AGENTS = [
  {
    id: 'intake',
    stepNumber: 1,
    name: 'Intake Agent',
    role: 'Extracts user intent, detects ambiguities & urgency',
    icon: MessageSquare,
    desc: 'Guards against silent assumptions'
  },
  {
    id: 'profile',
    stepNumber: 2,
    name: 'Profile Agent',
    role: 'Applies cognitive & motor accessibility directives',
    icon: Sliders,
    desc: 'Adapts vocabulary & pace'
  },
  {
    id: 'web_understanding',
    stepNumber: 3,
    name: 'Web Understanding',
    role: 'Inspects DOM, ARIA accessibility tree & field roles',
    icon: Globe,
    desc: 'Queries Playwright FastMCP'
  },
  {
    id: 'rag',
    stepNumber: 4,
    name: 'RAG Knowledge',
    role: 'Retrieves grounded WCAG 2.2 & COGA guidelines',
    icon: BookOpen,
    desc: 'ChromaDB vector search'
  },
  {
    id: 'form_interaction',
    stepNumber: 5,
    name: 'Form Action Agent',
    role: 'Translates natural responses to type-safe actions',
    icon: Edit3,
    desc: 'Converts words to values'
  },
  {
    id: 'verification',
    stepNumber: 6,
    name: 'Verification Agent',
    role: 'Validates format, field match & reversibility',
    icon: ShieldCheck,
    desc: 'Pre-flight integrity check'
  },
  {
    id: 'safety',
    stepNumber: 7,
    name: 'Safety & Confidence',
    role: 'Multi-factor confidence scoring & risk gating',
    icon: Lock,
    desc: 'Automated state routing'
  }
];

export default function AgentGraph({
  activeAgentId = 'intake',
  safetyDecision = null,
  isProcessing = false
}) {
  const getAgentStatus = (agentIndex, agentId) => {
    const activeIndex = AGENTS.findIndex(a => a.id === activeAgentId);
    if (isProcessing) {
      if (agentIndex === activeIndex) return 'running';
      if (agentIndex < activeIndex) return 'completed';
      return 'standby';
    }
    if (safetyDecision?.decision === 'BLOCK' && agentId === 'safety') return 'blocked';
    if (safetyDecision) return 'completed';
    return agentIndex === 0 ? 'standby' : 'standby';
  };

  return (
    <div className="panel" style={{ padding: '1.5rem', background: 'var(--bg-surface)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary)' }} />
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              LangGraph Multi-Agent Orchestration Workflow
            </h3>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            7 specialized agents collaborating across a shared typed state machine with deterministic safety gating.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '0.25rem 0.65rem',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(56, 189, 248, 0.12)',
              color: 'var(--primary)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              fontFamily: 'var(--font-mono)'
            }}
          >
            STATE MACHINE GRAPH
          </span>
        </div>
      </div>

      {/* Grid of 7 Agent Nodes */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1.5rem'
        }}
      >
        {AGENTS.map((agent, index) => {
          const status = getAgentStatus(index, agent.id);
          return (
            <AgentNode
              key={agent.id}
              stepNumber={agent.stepNumber}
              name={agent.name}
              role={agent.role}
              status={status}
              icon={agent.icon}
              details={agent.desc}
            />
          );
        })}
      </div>

      {/* State Router & Conditional Gating Terminals */}
      <div
        style={{
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(0, 0, 0, 0.35)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ArrowRight style={{ width: 14, height: 14, color: 'var(--primary)' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
              Deterministic State Router Terminals:
            </span>
          </div>

          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
            Active Route: <strong style={{ color: 'var(--text-primary)' }}>{safetyDecision?.decision || 'STANDBY'}</strong>
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.5rem' }}>
          {[
            {
              key: 'EXECUTE',
              label: 'EXECUTE ACTION',
              cond: 'Confidence ≥ 0.85 & Low Risk',
              color: 'var(--status-success)',
              bg: 'var(--status-success-bg)',
              border: 'var(--status-success-border)'
            },
            {
              key: 'REQUIRE_CONFIRMATION',
              label: 'REQUIRE CONFIRMATION',
              cond: 'High-Impact Action (Submit / Delete)',
              color: 'var(--status-warning)',
              bg: 'var(--status-warning-bg)',
              border: 'var(--status-warning-border)'
            },
            {
              key: 'ASK_CLARIFICATION',
              label: 'ASK CLARIFICATION',
              cond: 'Confidence < 0.85 or Ambiguity',
              color: 'var(--accent-cyan)',
              bg: 'rgba(6, 182, 212, 0.12)',
              border: 'rgba(6, 182, 212, 0.35)'
            },
            {
              key: 'BLOCK',
              label: 'BLOCK & ISOLATE',
              cond: 'Untrusted Instruction / Injection',
              color: 'var(--status-danger)',
              bg: 'var(--status-danger-bg)',
              border: 'var(--status-danger-border)'
            }
          ].map(route => {
            const isActive = safetyDecision?.decision === route.key;
            return (
              <div
                key={route.key}
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: isActive ? route.bg : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${isActive ? route.border : 'var(--border-subtle)'}`,
                  boxShadow: isActive ? `0 0 16px ${route.border}` : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: isActive ? route.color : 'var(--text-secondary)' }}>
                    {route.label}
                  </span>
                  {isActive && (
                    <span
                      style={{
                        fontSize: '0.6rem',
                        fontWeight: 800,
                        background: route.color,
                        color: 'var(--text-inverse)',
                        padding: '0.1rem 0.35rem',
                        borderRadius: 'var(--radius-xs)'
                      }}
                    >
                      TRIGGERED
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                  {route.cond}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
