import React from 'react';
import {
  Brain,
  Eye,
  Hand,
  Mic,
  ShieldCheck,
  Zap,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Layers,
  FileCheck2
} from 'lucide-react';
import MetricCard from './MetricCard';
import AccessibilityProfileCard from './AccessibilityProfileCard';

const PRESET_PROFILES = [
  {
    id: 'cognitive_motor',
    name: 'Cognitive + Motor',
    icon: Brain,
    description: 'One question at a time, plain language, minimal precision required, high safety confirmations.',
    features: ['One Step at a Time', 'Plain Language', 'Extra Confirmations', 'Low Precision'],
    profile: {
      visual: 'standard',
      motor: 'limited_mouse_control',
      cognitive: 'simplified_language',
      interaction: 'multimodal',
      confirm_before_submit: true,
      one_field_at_a_time: true,
      high_contrast: false
    }
  },
  {
    id: 'low_vision',
    name: 'Low Vision',
    icon: Eye,
    description: 'Enlarged typography, high-contrast palette, descriptive ARIA labels, and screen-reader ready guidance.',
    features: ['High Contrast (AAA)', 'Large Typography', 'Descriptive ARIA', 'Audio Reader'],
    profile: {
      visual: 'high_contrast',
      motor: 'standard',
      cognitive: 'standard',
      interaction: 'text',
      confirm_before_submit: true,
      one_field_at_a_time: false,
      high_contrast: true
    }
  },
  {
    id: 'motor_assist',
    name: 'Motor Assistance',
    icon: Hand,
    description: 'Generous interactive hitboxes, voice-first input, and keyboard navigation with zero double-click traps.',
    features: ['Large Click Targets', 'Keyboard First', 'Voice Dictation', 'Zero Timing Traps'],
    profile: {
      visual: 'standard',
      motor: 'limited_mouse_control',
      cognitive: 'standard',
      interaction: 'voice',
      confirm_before_submit: true,
      one_field_at_a_time: true,
      high_contrast: false
    }
  },
  {
    id: 'voice_first',
    name: 'Voice-First Assistant',
    icon: Mic,
    description: 'Hands-free conversational completion with spoken field explanations and explicit verbal confirmation.',
    features: ['Hands-Free Voice STT', 'Spoken Guidance TTS', 'Conversational Pace', 'Voice Confirm'],
    profile: {
      visual: 'standard',
      motor: 'tremor_assistance',
      cognitive: 'simplified_language',
      interaction: 'voice',
      confirm_before_submit: true,
      one_field_at_a_time: true,
      high_contrast: false
    }
  }
];

export default function OverviewView({
  activeProfile,
  onSelectProfile,
  safetyDecision,
  pageState,
  onLaunchLiveTask
}) {
  const confidenceScore = safetyDecision ? `${Math.round(safetyDecision.composite_confidence * 100)}%` : '94%';
  const riskStatus = safetyDecision ? `Risk: ${safetyDecision.risk_level}` : 'Protected';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Hero Section */}
      <section
        className="panel-elevated"
        style={{
          padding: '2rem 2.25rem',
          background: 'linear-gradient(135deg, var(--bg-surface-elevated) 0%, var(--bg-surface) 100%)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '820px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)', marginBottom: '1rem' }}>
            <Sparkles style={{ width: 14, height: 14, color: 'var(--primary)' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Autonomous Agentic Accessibility Layer
            </span>
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2.25rem',
              fontWeight: 900,
              color: 'var(--text-primary)',
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              marginBottom: '0.75rem'
            }}
          >
            Complete digital forms without fighting the interface.
          </h1>

          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem', maxWidth: '720px' }}>
            AccessBridge is an agentic accessibility layer that adapts digital interactions to how a person sees, moves, reads, and communicates — while verifying every important action with grounded knowledge and multi-signal confidence checks.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={onLaunchLiveTask}
              style={{
                padding: '0.75rem 1.4rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--primary)',
                color: 'var(--text-inverse)',
                fontWeight: 800,
                fontSize: '0.85rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                boxShadow: '0 0 20px var(--primary-glow)'
              }}
            >
              <span>Launch Live Task Workspace</span>
              <ArrowRight style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>
      </section>

      {/* Dynamic Metric Cards */}
      <section aria-label="System Metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
        <MetricCard
          title="ACTIVE TASK"
          value="Website Form"
          subtext="Paste any supported web form URL to begin"
          icon={FileCheck2}
          badge="Live Target"
          badgeVariant="success"
          accentColor="var(--primary)"
        />
        <MetricCard
          title="AGENT STATUS"
          value="7 Agents"
          subtext="LangGraph State Machine Orchestrated"
          icon={Layers}
          badge="Synchronized"
          badgeVariant="success"
          accentColor="var(--accent-indigo)"
        />
        <MetricCard
          title="CONFIDENCE"
          value={confidenceScore}
          subtext="Multi-Signal Composite Formula"
          icon={Zap}
          badge={safetyDecision?.decision || 'Allowed'}
          badgeVariant="success"
          accentColor="var(--status-success)"
        />
        <MetricCard
          title="SAFETY GATE"
          value={riskStatus}
          subtext="Untrusted DOM Isolation & Injection Shield"
          icon={ShieldCheck}
          badge="Protected"
          badgeVariant="success"
          accentColor="var(--status-success)"
        />
      </section>

      {/* Product Story: Problem / Solution / Safety / Agentic Difference */}
      <section aria-label="Product Principles">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
          {[
            {
              title: 'THE PROBLEM',
              color: 'var(--status-danger)',
              text: 'Digital forms assume every user interacts in the same way, creating impenetrable barriers for people with disabilities.'
            },
            {
              title: 'THE SOLUTION',
              color: 'var(--primary)',
              text: 'AccessBridge adapts the interface to the user’s preferences rather than forcing the user to struggle with hostile websites.'
            },
            {
              title: 'THE SAFETY PROMISE',
              color: 'var(--status-warning)',
              text: 'When uncertain, the system halts and asks for clarification instead of making catastrophic assumptions on official documents.'
            },
            {
              title: 'THE AGENTIC DIFFERENCE',
              color: 'var(--accent-indigo)',
              text: '7 specialized agents inspect DOM, retrieve grounded WCAG 2.2 guidance, verify integrity, and execute real browser operations.'
            }
          ].map((story, idx) => (
            <div
              key={idx}
              className="panel"
              style={{
                padding: '1.25rem',
                borderLeft: `3px solid ${story.color}`,
                background: 'var(--bg-surface)'
              }}
            >
              <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: story.color, display: 'block', marginBottom: '0.4rem' }}>
                {story.title}
              </span>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                {story.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW ACCESSBRIDGE WORKS: 6-Step Workflow */}
      <section aria-labelledby="how_it_works_title">
        <div style={{ marginBottom: '1rem' }}>
          <h2 id="how_it_works_title" style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            HOW ACCESSBRIDGE WORKS
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
            Six-step autonomous agentic workflow ensuring accuracy, grounding, and human agency.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem' }}>
          {[
            { step: '01', title: 'Understand the user', desc: 'Captures motor, cognitive, and sensory preferences without stigma.' },
            { step: '02', title: 'Understand the interface', desc: 'Inspects real browser DOM, extracting interactive inputs and constraints.' },
            { step: '03', title: 'Retrieve trusted guidance', desc: 'Anchors decisions in authoritative W3C WCAG 2.2 and COGA guidelines via RAG.' },
            { step: '04', title: 'Plan the action', desc: 'Translates natural conversational responses into verified DOM actions.' },
            { step: '05', title: 'Verify', desc: 'Calculates multi-signal confidence and halts on ambiguity or format mismatch.' },
            { step: '06', title: 'Execute safely', desc: 'Executes via FastMCP Playwright automation or requests human confirmation for high-impact actions.' }
          ].map((item, idx) => (
            <div
              key={idx}
              className="panel"
              style={{
                padding: '1.1rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <span style={{ fontSize: '1.1rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--primary)', display: 'block', marginBottom: '0.35rem' }}>
                {item.step}
              </span>
              <h3 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                {item.title}
              </h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.45, margin: 0 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Accessibility Profile Selector Section */}
      <section aria-labelledby="a11y_mode_title">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 id="a11y_mode_title" style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              YOUR ACCESSIBILITY MODE
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              AccessBridge adapts explanation complexity, step pacing, and interaction format to your needs.
            </p>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
            Active Profile: <strong style={{ color: 'var(--primary)' }}>{activeProfile?.name}</strong>
          </span>
        </div>

        <div
          role="radiogroup"
          aria-label="Select Accessibility Interaction Profile"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '0.75rem'
          }}
        >
          {PRESET_PROFILES.map((preset) => (
            <AccessibilityProfileCard
              key={preset.id}
              profile={preset}
              isSelected={activeProfile?.id === preset.id}
              onSelect={onSelectProfile}
              icon={preset.icon}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
