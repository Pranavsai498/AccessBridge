import React from 'react';

export default function LiveBrowserFrame({ engine, pageState, onSwitchEngine, onResetForm }) {
  const fields = pageState?.fields || [];

  return (
    <div className="glass-panel" style={{ padding: '1.25rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Live Form Inspection
          </h4>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
            Target: Current website form
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            onClick={() => onSwitchEngine(engine === 'playwright' ? 'simulated' : 'playwright')}
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '0.35rem 0.75rem',
              borderRadius: '6px',
              background: engine === 'playwright' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(129, 140, 248, 0.2)',
              color: engine === 'playwright' ? 'var(--primary)' : 'var(--accent-violet)',
              border: `1px solid ${engine === 'playwright' ? 'var(--primary)' : 'var(--accent-violet)'}`
            }}
          >
            Engine: {engine === 'playwright' ? '🌐 Real Browser (Playwright)' : '⚡ Simulated Form'}
          </button>

          <button
            onClick={onResetForm}
            title="Reset form fields"
            style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              padding: '0.35rem 0.6rem',
              borderRadius: '6px',
              background: 'rgba(255,255,255,0.06)',
              color: 'var(--text-muted)'
            }}
          >
            ↺ Reset
          </button>
        </div>
      </div>

      {/* Form DOM Fields Visual Inspector */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
        {fields.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-subtle)', padding: '2rem 0', fontSize: '0.82rem' }}>
            Connecting to browser DOM...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {fields.map(f => {
              const isFilled = !!f.current_value && f.current_value !== 'none';
              const isFocused = f.is_focused;
              return (
                <div
                  key={f.field_id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '6px',
                    background: isFocused ? 'rgba(245, 158, 11, 0.1)' : (isFilled ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.02)'),
                    border: `1px solid ${isFocused ? 'var(--focus-ring)' : (isFilled ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.06)')}`,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff' }}>{f.label}</span>
                      {f.required && <span style={{ color: 'var(--accent-rose)', fontSize: '0.75rem' }}>*</span>}
                      {f.is_ambiguous && (
                        <span style={{ fontSize: '0.62rem', background: 'rgba(245,158,11,0.2)', color: 'var(--accent-amber)', padding: '0.1rem 0.35rem', borderRadius: '3px' }}>
                          Ambiguous
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)' }}>
                      #{f.field_id} • type: {f.type}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    {isFilled ? (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                        {String(f.current_value)}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', fontStyle: 'italic' }}>
                        [unfilled]
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
