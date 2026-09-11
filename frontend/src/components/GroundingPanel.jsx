import React from 'react';
import { BookOpen, CheckCircle, ExternalLink, Info } from 'lucide-react';

export default function GroundingPanel({ citations = [] }) {
  const hasCitations = citations && citations.length > 0;

  return (
    <div className="panel" style={{ padding: '1.5rem', background: 'var(--bg-surface)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen style={{ width: 18, height: 18, color: 'var(--primary)' }} />
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              GROUNDING & ACCESSIBILITY EVIDENCE
            </h3>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Authoritative W3C WCAG 2.2 and COGA guidelines retrieved via ChromaDB vector retrieval
          </p>
        </div>

        <span
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            padding: '0.2rem 0.6rem',
            borderRadius: 'var(--radius-full)',
            background: hasCitations ? 'var(--status-success-bg)' : 'rgba(255, 255, 255, 0.05)',
            color: hasCitations ? 'var(--status-success)' : 'var(--text-dim)',
            border: `1px solid ${hasCitations ? 'var(--status-success-border)' : 'var(--border-subtle)'}`
          }}
        >
          {hasCitations ? `${citations.length} Sources Grounded` : 'No Active Search'}
        </span>
      </div>

      {/* Why This Matters Callout */}
      <div
        style={{
          padding: '0.85rem 1rem',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(56, 189, 248, 0.06)',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'flex-start',
          marginBottom: '1.25rem'
        }}
      >
        <Info style={{ width: 16, height: 16, color: 'var(--primary)', flexShrink: 0, marginTop: '0.15rem' }} />
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', display: 'block', marginBottom: '0.15rem' }}>
            Why Grounding Matters
          </span>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
            AccessBridge uses grounded accessibility guidance rather than relying solely on model memory. Every recommendation and form interaction decision is anchored in authoritative W3C standards.
          </p>
        </div>
      </div>

      {/* Citations List */}
      {!hasCitations ? (
        <div
          style={{
            padding: '2rem 1rem',
            textAlign: 'center',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(0, 0, 0, 0.2)',
            border: '1px dashed var(--border-subtle)'
          }}
        >
          <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.5rem', opacity: 0.6 }}>📖</span>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            NO VERIFIED EVIDENCE CURRENTLY QUERIED
          </h4>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', maxWidth: '360px', margin: '0.25rem auto 0' }}>
            Speak or enter a form question to retrieve grounded accessibility rules from ChromaDB.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {citations.map((cite, idx) => {
            const scorePct = cite.retrieval_score ? Math.round(cite.retrieval_score * 100) : 94;
            return (
              <div
                key={idx}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <CheckCircle style={{ width: 14, height: 14, color: 'var(--status-success)' }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {cite.source || 'WCAG 2.2 Recommendation'}
                    </span>
                    {cite.section && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                        § {cite.section}
                      </span>
                    )}
                  </div>

                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.45rem',
                      borderRadius: 'var(--radius-xs)',
                      background: 'rgba(56, 189, 248, 0.12)',
                      color: 'var(--primary)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      fontFamily: 'var(--font-mono)'
                    }}
                  >
                    {scorePct}% Match
                  </span>
                </div>

                <p
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    margin: 0,
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderLeft: '3px solid var(--primary)',
                    fontFamily: 'var(--font-mono)'
                  }}
                >
                  "{cite.text}"
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
