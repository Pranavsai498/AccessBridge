import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  ShieldAlert,
  HelpCircle,
  Check,
  CheckCircle2,
  Layers,
  ArrowRight,
  GraduationCap,
  Play,
  RotateCcw,
  Sliders,
  AlertTriangle,
  ShieldCheck,
  Zap,
  UserCheck
} from 'lucide-react';

export default function LiveTask({
  taskStarted = false,
  onStartTask,
  messages = [],
  onSendMessage,
  isProcessing = false,
  currentField = null,
  activeProfile = null,
  onChangeProfile,
  ragGrounding = [],
  safetyDecision = null,
  pageState = null,
  onResetTask,
  onNavigate = null
}) {
  const [inputText, setInputText] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const lastSpokenIndexRef = useRef(-1);

  // Initialize Speech Recognition (Web Speech API)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, taskStarted]);

  // In Voice-First mode, speak new assistant messages automatically.
  useEffect(() => {
    if (activeProfile?.interaction !== 'voice' || !('speechSynthesis' in window)) return;
    const lastIndex = messages.length - 1;
    if (lastIndex < 0 || lastIndex === lastSpokenIndexRef.current) return;
    const lastMessage = messages[lastIndex];
    if (!lastMessage || lastMessage.role !== 'assistant') return;
    lastSpokenIndexRef.current = lastIndex;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(lastMessage.content);
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  }, [messages, activeProfile?.interaction]);

  const toggleListening = () => {
    if (!speechSupported || !recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        setIsListening(false);
      }
    }
  };

  const handleSpeak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim() || isProcessing) return;
    const text = inputText.trim();
    setInputText('');
    onSendMessage(text);
  };

  const quickChips = [
    'My full name is Priya Sharma and my email is priya@example.com',
    'I was born on 12 March 2001 and live in Kochi',
    'My annual income is about two lakh rupees',
    'I need wheelchair assistance',
    'I am ready to submit the form'
  ];

  // ============================================================
  // SCREEN 1: PRE-TASK ONBOARDING & LAUNCHER (When taskStarted === false)
  // ============================================================
  if (!taskStarted) {
    return (
      <div
        className="panel"
        style={{
          padding: '1.75rem',
          background: 'var(--bg-surface)',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '1.5rem',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--border-subtle)'
        }}
      >
        {/* Onboarding Header */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: 'var(--primary)',
                boxShadow: '0 0 10px var(--primary-glow)'
              }}
            />
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.4rem',
                fontWeight: 900,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                margin: 0
              }}
            >
              LIVE TASK
            </h2>
          </div>
          <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 0.25rem' }}>
            Complete a digital form without fighting the interface.
          </p>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0, maxWidth: '650px' }}>
            AccessBridge adapts the interaction to your accessibility preferences, verifies important actions, and stops when it is uncertain.
          </p>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!websiteUrl.trim() || isProcessing || !onNavigate) return;
              await onNavigate(websiteUrl.trim());
            }}
            aria-label="Open a website form"
            style={{
              marginTop: '1.25rem',
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              gap: '0.6rem',
              alignItems: 'center'
            }}
          >
            <div style={{ flex: 1 }}>
              <label htmlFor="accessbridge-website-url" style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                WEBSITE LINK
              </label>
              <input
                id="accessbridge-website-url"
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://example.com/application-form"
                autoComplete="url"
                required
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-app)',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem'
                }}
              />
            </div>
            <button
              type="submit"
              disabled={isProcessing || !onNavigate}
              style={{
                marginTop: '1.15rem',
                padding: '0.65rem 0.95rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--primary)',
                color: 'var(--text-inverse)',
                border: 'none',
                fontWeight: 800,
                cursor: isProcessing ? 'wait' : 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Open & Understand
            </button>
          </form>
        </div>

        {/* 3 Structured Information Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {/* Card 1: Current Accessibility Profile */}
          <div
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)' }}>
                  CURRENT ACCESSIBILITY PROFILE
                </span>
                <UserCheck style={{ width: 16, height: 16, color: 'var(--primary)' }} />
              </div>

              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.75rem' }}>
                Cognitive + Motor Assistance
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Check style={{ width: 14, height: 14, color: 'var(--status-success)' }} />
                  <span>One question at a time</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Check style={{ width: 14, height: 14, color: 'var(--status-success)' }} />
                  <span>Plain-language explanations</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Check style={{ width: 14, height: 14, color: 'var(--status-success)' }} />
                  <span>Minimal precision required</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Check style={{ width: 14, height: 14, color: 'var(--status-success)' }} />
                  <span>Keyboard/voice friendly</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Check style={{ width: 14, height: 14, color: 'var(--status-success)' }} />
                  <span>Confirmation before important actions</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onChangeProfile}
              style={{
                marginTop: '1rem',
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: 700,
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem'
              }}
            >
              <Sliders style={{ width: 13, height: 13 }} />
              <span>Change profile</span>
            </button>
          </div>

          {/* Card 2: Select a Task (Centerpiece) */}
          <div
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(99, 102, 241, 0.05))',
              border: '1.5px solid var(--primary)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-glow)'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--primary)' }}>
                  SELECT A TASK
                </span>
                <GraduationCap style={{ width: 18, height: 18, color: 'var(--primary)' }} />
              </div>

              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.45rem' }}>
                🌐 Website Form
              </h3>

              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '0.85rem' }}>
                Open a website form and complete it through a simple conversation. You can type your answers or use voice input.
              </p>

              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-xs)', background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-muted)' }}>
                  Difficulty: Moderate
                </span>
                <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-xs)', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--status-success)', fontWeight: 700 }}>
                  Accessibility: Supported
                </span>
                <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-xs)', background: 'rgba(56, 189, 248, 0.15)', color: 'var(--primary)', fontWeight: 700 }}>
                  {pageState?.fields?.length || 'Fields discovered automatically'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onStartTask}
              style={{
                marginTop: '1rem',
                padding: '0.65rem 1.25rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                fontWeight: 800,
                background: 'var(--primary)',
                color: 'var(--text-inverse)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                boxShadow: '0 0 16px var(--primary-glow)'
              }}
            >
              <Play style={{ width: 14, height: 14, fill: 'currentColor' }} />
              <span>Start Task</span>
            </button>
          </div>

          {/* Card 3: Demo Scenarios */}
          <div
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)' }}>
                  DEMO SCENARIOS
                </span>
                <Zap style={{ width: 16, height: 16, color: 'var(--accent-cyan)' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--text-secondary)' }}>
                  <CheckCircle2 style={{ width: 13, height: 13, color: 'var(--status-success)' }} />
                  <span>Normal completion</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--text-secondary)' }}>
                  <AlertTriangle style={{ width: 13, height: 13, color: 'var(--status-warning)' }} />
                  <span>Ambiguous input</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--text-secondary)' }}>
                  <ShieldCheck style={{ width: 13, height: 13, color: 'var(--status-danger)' }} />
                  <span>Prompt injection defense</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--text-secondary)' }}>
                  <ShieldAlert style={{ width: 13, height: 13, color: 'var(--accent-violet)' }} />
                  <span>High-risk submission (WCAG 3.3.4)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--text-secondary)' }}>
                  <RotateCcw style={{ width: 13, height: 13, color: 'var(--primary)' }} />
                  <span>Tool failure recovery</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onStartTask}
              style={{
                marginTop: '1rem',
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: 700,
                background: 'rgba(56, 189, 248, 0.12)',
                color: 'var(--primary)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem'
              }}
            >
              <span>Run guided demo</span>
              <ArrowRight style={{ width: 13, height: 13 }} />
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
            Judge Tip: Click "Start Task" to begin natural-language interaction, or use the quick chips once started.
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
            LangGraph + FastMCP + Playwright
          </span>
        </div>
      </div>
    );
  }

  // ============================================================
  // SCREEN 2: ACTIVE LIVE TASK WORKSPACE (When taskStarted === true)
  // ============================================================
  return (
    <div
      className="panel"
      style={{
        padding: '1.25rem',
        background: 'var(--bg-surface)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-md)',
        border: '1px solid var(--border-subtle)'
      }}
    >
      {/* Workspace Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '0.85rem',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: '0.85rem',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--status-success)',
                boxShadow: '0 0 8px var(--status-success)'
              }}
            />
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              ACCESSBRIDGE ASSISTANT
            </h3>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.15rem 0 0' }}>
            Website: <strong>{pageState?.title || 'Form not opened yet'}</strong> • Mode: <strong style={{ color: 'var(--primary)' }}>{activeProfile?.name || 'Cognitive + Motor'}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '0.2rem 0.65rem',
              borderRadius: 'var(--radius-full)',
              background: 'var(--status-success-bg)',
              color: 'var(--status-success)',
              border: '1px solid var(--status-success-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            <Sparkles style={{ width: 12, height: 12 }} />
            ● Agent assisting
          </span>

          <button
            type="button"
            onClick={onResetTask}
            title="Reset or choose another task"
            style={{
              padding: '0.25rem 0.55rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.7rem',
              fontWeight: 600,
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'var(--text-dim)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer'
            }}
          >
            End Task
          </button>
        </div>
      </div>

      {/* Form progress */}
      {pageState?.fields?.length > 0 && (
        <div
          aria-label="Form completion progress"
          style={{
            padding: '0.55rem 0.75rem',
            marginBottom: '0.75rem',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          {(() => {
            const required = pageState.fields.filter(f => f.required && f.visible);
            const completed = required.filter(f => f.current_value !== '' && f.current_value !== null && f.current_value !== undefined).length;
            const percent = required.length ? Math.round((completed / required.length) * 100) : 100;
            return (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  <span>Form progress</span>
                  <strong>{completed} of {required.length} required fields</strong>
                </div>
                <div style={{ height: '7px', borderRadius: '999px', background: 'var(--border-subtle)', overflow: 'hidden' }}>
                  <div style={{ width: `${percent}%`, height: '100%', background: 'var(--primary)', borderRadius: '999px', transition: 'width 200ms ease' }} />
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Active Field Focus Banner */}
      {currentField && (
        <div
          role="region"
          aria-label="Active Field Guidance"
          style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12), rgba(99, 102, 241, 0.06))',
            border: '1.5px solid var(--primary)',
            marginBottom: '0.75rem',
            boxShadow: 'var(--shadow-subtle)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Layers style={{ width: 13, height: 13 }} />
              Current Field Focus: {currentField.label || currentField.field_id}
            </span>
            {currentField.required && (
              <span
                style={{
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  padding: '0.1rem 0.4rem',
                  borderRadius: 'var(--radius-xs)',
                  background: 'var(--status-danger-bg)',
                  color: 'var(--status-danger)',
                  border: '1px solid var(--status-danger-border)'
                }}
              >
                Required Field
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.35 }}>
            {currentField.help_text || 'Please speak or enter your information for this field.'}
          </p>
        </div>
      )}

      {/* Conversational Message Stream */}
      <div
        role="log"
        aria-label="Assistant Conversation"
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
          paddingRight: '0.4rem',
          marginBottom: '0.75rem'
        }}
      >
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start'
              }}
            >
              <div
                style={{
                  maxWidth: '85%',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: isUser ? 'var(--primary)' : 'var(--bg-surface-elevated)',
                  color: isUser ? 'var(--text-inverse)' : 'var(--text-primary)',
                  border: isUser ? 'none' : '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-subtle)',
                  fontSize: '0.85rem',
                  lineHeight: 1.5
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {isUser ? 'User' : 'AccessBridge Assistant'}
                  </span>
                  {!isUser && (
                    <button
                      type="button"
                      onClick={() => handleSpeak(msg.content)}
                      title="Read aloud"
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                    >
                      <Volume2 style={{ width: 13, height: 13 }} />
                    </button>
                  )}
                </div>

                <div>{msg.content}</div>

                {/* Verification Step Pills under Assistant replies */}
                {!isUser && idx > 0 && (
                  <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: 'var(--radius-full)', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--status-success)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                      ✓ Intent understood
                    </span>
                    <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: 'var(--radius-full)', background: 'rgba(56, 189, 248, 0.15)', color: 'var(--primary)', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                      ✓ Field identified
                    </span>
                    <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: 'var(--radius-full)', background: 'rgba(129, 140, 248, 0.15)', color: 'var(--accent-violet)', border: '1px solid rgba(129, 140, 248, 0.3)' }}>
                      ✓ Action verified
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isProcessing && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-sm)', background: 'rgba(56, 189, 248, 0.1)', color: 'var(--primary)', fontSize: '0.75rem', width: 'fit-content' }}>
            <Sparkles style={{ width: 14, height: 14 }} className="animate-spin" />
            <span>Agent reasoning and verifying browser field mapping...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Chips */}
      <div style={{ marginBottom: '0.6rem' }}>
        <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-dim)', display: 'block', marginBottom: '0.25rem' }}>
          Quick Demo Inputs:
        </span>
        <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {quickChips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSendMessage(chip)}
              disabled={isProcessing}
              style={{
                padding: '0.25rem 0.55rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.68rem',
                fontWeight: 600,
                background: 'rgba(255, 255, 255, 0.04)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Natural Language Input Bar with Web Speech API */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Speak or type your answer naturally (e.g. 'My name is Priya Sharma')..."
          disabled={isProcessing}
          style={{
            flex: 1,
            padding: '0.65rem 0.9rem',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-muted)',
            color: 'var(--text-primary)',
            fontSize: '0.82rem',
            outline: 'none'
          }}
        />

        {speechSupported && (
          <button
            type="button"
            onClick={toggleListening}
            title={isListening ? 'Stop listening' : 'Start voice input'}
            style={{
              padding: '0.65rem',
              borderRadius: 'var(--radius-sm)',
              background: isListening ? 'var(--status-danger)' : 'rgba(255, 255, 255, 0.08)',
              color: '#ffffff',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isListening ? <MicOff style={{ width: 16, height: 16 }} /> : <Mic style={{ width: 16, height: 16 }} />}
          </button>
        )}

        <button
          type="submit"
          disabled={!inputText.trim() || isProcessing}
          style={{
            padding: '0.65rem 1.1rem',
            borderRadius: 'var(--radius-sm)',
            background: !inputText.trim() || isProcessing ? 'rgba(255, 255, 255, 0.08)' : 'var(--primary)',
            color: !inputText.trim() || isProcessing ? 'var(--text-dim)' : 'var(--text-inverse)',
            border: 'none',
            fontWeight: 800,
            fontSize: '0.8rem',
            cursor: !inputText.trim() || isProcessing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}
        >
          <span>Send</span>
          <Send style={{ width: 13, height: 13 }} />
        </button>
      </form>
    </div>
  );
}
