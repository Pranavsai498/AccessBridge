import React, { useState, useEffect } from 'react';
import {
  Globe,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Code2,
  ShieldCheck,
  ShieldAlert,
  Camera,
  Layers,
  Activity,
  Terminal,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { fetchBrowserScreenshot, fetchA11yTree, fetchBrowserStatus } from '../api/client';

export default function BrowserPreview({
  engine = 'playwright',
  pageState,
  onSwitchEngine,
  onResetForm,
  onNavigate,
  isProcessing = false,
  traces = []
}) {
  const [activeView, setActiveView] = useState('form'); // 'form' | 'screenshot' | 'a11y' | 'dom' | 'tools'
  const [screenshotData, setScreenshotData] = useState(null);
  const [screenshotLoading, setScreenshotLoading] = useState(false);
  const [a11yTreeData, setA11yTreeData] = useState(null);
  const [a11yLoading, setA11yLoading] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [inputUrl, setInputUrl] = useState(pageState?.url || 'http://127.0.0.1:8080/index.html');
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    if (pageState?.url) {
      setInputUrl(pageState.url);
    }
  }, [pageState?.url]);

  const handleUrlSubmit = async (e) => {
    e?.preventDefault();
    if (!inputUrl || !onNavigate) return;
    setIsNavigating(true);
    try {
      await onNavigate(inputUrl.trim());
    } finally {
      setIsNavigating(false);
    }
  };

  const handleQuickNav = async (targetUrl) => {
    setInputUrl(targetUrl);
    if (!onNavigate) return;
    setIsNavigating(true);
    try {
      await onNavigate(targetUrl);
    } finally {
      setIsNavigating(false);
    }
  };

  const fields = pageState?.fields || [];
  const isConnected = fields.length > 0;
  const untrusted = pageState?.untrusted_content_detected;
  const isPlaywright = engine === 'playwright';

  // Load screenshot whenever pageState updates or screenshot view is selected
  useEffect(() => {
    if (activeView === 'screenshot' && isConnected) {
      loadScreenshot();
    }
  }, [activeView, pageState]);

  // Load A11y tree when tab selected
  useEffect(() => {
    if (activeView === 'a11y') {
      loadA11yTree();
    }
  }, [activeView]);

  const loadScreenshot = async () => {
    setScreenshotLoading(true);
    try {
      const data = await fetchBrowserScreenshot();
      if (data && data.screenshot) {
        setScreenshotData(data.screenshot);
        setConnectionError(null);
      }
    } catch (err) {
      console.warn('Screenshot fetch notice:', err);
    } finally {
      setScreenshotLoading(false);
    }
  };

  const loadA11yTree = async () => {
    setA11yLoading(true);
    try {
      const data = await fetchA11yTree();
      if (data && data.a11y_tree) {
        setA11yTreeData(data.a11y_tree);
      }
    } catch (err) {
      console.warn('A11y tree fetch notice:', err);
    } finally {
      setA11yLoading(false);
    }
  };

  const handleRetryConnection = async () => {
    setIsRetrying(true);
    try {
      const status = await fetchBrowserStatus();
      if (status && status.connected) {
        setConnectionError(null);
      } else {
        setConnectionError('Browser process is not responding to probe.');
      }
    } catch (err) {
      setConnectionError(err.message);
    } finally {
      setIsRetrying(false);
    }
  };

  // Filter MCP tool actions from traces
  const toolActions = traces?.filter(t => t.event_type === 'TOOL_CALL' || t.node === 'mcp_browser' || t.agent?.toLowerCase().includes('mcp')) || [];

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
      {/* Browser Chrome Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '0.85rem',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: '0.85rem',
          flexWrap: 'wrap',
          gap: '0.6rem'
        }}
      >
        {/* Left: Engine & Connection Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: 'var(--radius-sm)',
              background: isPlaywright ? 'rgba(56, 189, 248, 0.15)' : 'rgba(129, 140, 248, 0.15)',
              color: isPlaywright ? 'var(--primary)' : 'var(--accent-violet)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Globe style={{ width: 17, height: 17 }} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: isConnected ? 'var(--status-success)' : 'var(--status-danger)',
                  boxShadow: isConnected ? '0 0 8px var(--status-success)' : '0 0 8px var(--status-danger)'
                }}
              />
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
                LIVE BROWSER
              </span>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '0.1rem 0.45rem',
                  borderRadius: 'var(--radius-full)',
                  background: isConnected ? 'var(--status-success-bg)' : 'var(--status-danger-bg)',
                  color: isConnected ? 'var(--status-success)' : 'var(--status-danger)',
                  border: `1px solid ${isConnected ? 'var(--status-success-border)' : 'var(--status-danger-border)'}`
                }}
              >
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
              Driver: {isPlaywright ? 'Playwright Chromium' : 'Simulated In-Memory Engine'}
            </span>
          </div>
        </div>

        {/* Right Controls: View Switcher & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
          {/* View Mode Buttons */}
          <div
            style={{
              display: 'flex',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: 'var(--radius-sm)',
              padding: '2px',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <button
              type="button"
              onClick={() => setActiveView('form')}
              style={{
                padding: '0.3rem 0.55rem',
                borderRadius: 'var(--radius-xs)',
                fontSize: '0.7rem',
                fontWeight: 700,
                background: activeView === 'form' ? 'var(--primary)' : 'transparent',
                color: activeView === 'form' ? 'var(--text-inverse)' : 'var(--text-muted)',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Live Form
            </button>
            <button
              type="button"
              onClick={() => setActiveView('screenshot')}
              style={{
                padding: '0.3rem 0.55rem',
                borderRadius: 'var(--radius-xs)',
                fontSize: '0.7rem',
                fontWeight: 700,
                background: activeView === 'screenshot' ? 'var(--primary)' : 'transparent',
                color: activeView === 'screenshot' ? 'var(--text-inverse)' : 'var(--text-muted)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <Camera style={{ width: 11, height: 11 }} />
              Screenshot
            </button>
            <button
              type="button"
              onClick={() => setActiveView('a11y')}
              style={{
                padding: '0.3rem 0.55rem',
                borderRadius: 'var(--radius-xs)',
                fontSize: '0.7rem',
                fontWeight: 700,
                background: activeView === 'a11y' ? 'var(--primary)' : 'transparent',
                color: activeView === 'a11y' ? 'var(--text-inverse)' : 'var(--text-muted)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <Layers style={{ width: 11, height: 11 }} />
              A11y Tree
            </button>
            <button
              type="button"
              onClick={() => setActiveView('dom')}
              title="Inspect DOM JSON"
              style={{
                padding: '0.3rem 0.5rem',
                borderRadius: 'var(--radius-xs)',
                fontSize: '0.7rem',
                fontWeight: 700,
                background: activeView === 'dom' ? 'var(--primary)' : 'transparent',
                color: activeView === 'dom' ? 'var(--text-inverse)' : 'var(--text-muted)',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <Code2 style={{ width: 12, height: 12 }} />
            </button>
            <button
              type="button"
              onClick={() => setActiveView('tools')}
              title="View MCP Tool Activity"
              style={{
                padding: '0.3rem 0.5rem',
                borderRadius: 'var(--radius-xs)',
                fontSize: '0.7rem',
                fontWeight: 700,
                background: activeView === 'tools' ? 'var(--primary)' : 'transparent',
                color: activeView === 'tools' ? 'var(--text-inverse)' : 'var(--text-muted)',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <Activity style={{ width: 12, height: 12 }} />
            </button>
          </div>

          {/* Engine Selector */}
          <button
            type="button"
            onClick={() => onSwitchEngine(isPlaywright ? 'simulated' : 'playwright')}
            title="Switch browser automation engine"
            style={{
              padding: '0.35rem 0.6rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.7rem',
              fontWeight: 700,
              background: isPlaywright ? 'rgba(56, 189, 248, 0.12)' : 'rgba(129, 140, 248, 0.12)',
              color: isPlaywright ? 'var(--primary)' : 'var(--accent-violet)',
              border: `1px solid ${isPlaywright ? 'rgba(56, 189, 248, 0.3)' : 'rgba(129, 140, 248, 0.3)'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              cursor: 'pointer'
            }}
          >
            <Sliders style={{ width: 11, height: 11 }} />
            <span>{isPlaywright ? 'Playwright' : 'Simulated'}</span>
          </button>

          {/* Reset Button */}
          <button
            type="button"
            onClick={onResetForm}
            title="Reset form fields to clean state"
            style={{
              padding: '0.35rem 0.55rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.7rem',
              fontWeight: 600,
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              cursor: 'pointer'
            }}
          >
            <RefreshCw style={{ width: 11, height: 11 }} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Interactive Browser Address Bar & Quick Presets */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.75rem' }}>
        <form
          onSubmit={handleUrlSubmit}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.6rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(0, 0, 0, 0.45)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.74rem',
            fontFamily: 'var(--font-mono)'
          }}
        >
          <span style={{ color: 'var(--status-success)', display: 'flex', alignItems: 'center', gap: '0.2rem', flexShrink: 0 }}>
            <ShieldCheck style={{ width: 13, height: 13 }} />
          </span>
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="Enter target URL (e.g. https://www.w3.org/WAI/)"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            disabled={isNavigating || isProcessing}
            style={{
              padding: '0.25rem 0.65rem',
              borderRadius: 'var(--radius-xs)',
              background: 'var(--primary)',
              color: '#000',
              fontWeight: 700,
              fontSize: '0.68rem',
              border: 'none',
              cursor: isNavigating ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              flexShrink: 0
            }}
          >
            {isNavigating ? <RefreshCw className="animate-spin" style={{ width: 10, height: 10 }} /> : <ExternalLink style={{ width: 10, height: 10 }} />}
            <span>Go</span>
          </button>
        </form>

        {/* Quick-Preset Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.1rem' }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 }}>
            Quick Nav:
          </span>
          <button
            type="button"
            onClick={() => handleQuickNav('https://www.w3.org/WAI/')}
            style={{
              padding: '0.15rem 0.45rem',
              borderRadius: 'var(--radius-full)',
              background: pageState?.url?.includes('w3.org/WAI') ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${pageState?.url?.includes('w3.org/WAI') ? 'var(--primary)' : 'var(--border-subtle)'}`,
              color: pageState?.url?.includes('w3.org/WAI') ? 'var(--primary)' : 'var(--text-secondary)',
              fontSize: '0.67rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              whiteSpace: 'nowrap'
            }}
          >
            <span>🌐 W3C WAI Home</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickNav('https://www.w3.org/WAI/WCAG22/quickref/')}
            style={{
              padding: '0.15rem 0.45rem',
              borderRadius: 'var(--radius-full)',
              background: pageState?.url?.includes('quickref') ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${pageState?.url?.includes('quickref') ? 'var(--primary)' : 'var(--border-subtle)'}`,
              color: pageState?.url?.includes('quickref') ? 'var(--primary)' : 'var(--text-secondary)',
              fontSize: '0.67rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              whiteSpace: 'nowrap'
            }}
          >
            <span>♿ WCAG 2.2 Quickref</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickNav('http://127.0.0.1:8080/portal.html')}
            style={{
              padding: '0.15rem 0.45rem',
              borderRadius: 'var(--radius-full)',
              background: pageState?.url?.includes('portal.html') ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${pageState?.url?.includes('portal.html') ? 'var(--primary)' : 'var(--border-subtle)'}`,
              color: pageState?.url?.includes('portal.html') ? 'var(--primary)' : 'var(--text-secondary)',
              fontSize: '0.67rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              whiteSpace: 'nowrap'
            }}
          >
            <span>🏛 Global Opportunity Portal</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickNav('http://127.0.0.1:8080/index.html')}
            style={{
              padding: '0.15rem 0.45rem',
              borderRadius: 'var(--radius-full)',
              background: pageState?.url?.includes('8080/index') ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${pageState?.url?.includes('8080/index') ? 'var(--primary)' : 'var(--border-subtle)'}`,
              color: pageState?.url?.includes('8080/index') ? 'var(--primary)' : 'var(--text-secondary)',
              fontSize: '0.67rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              whiteSpace: 'nowrap'
            }}
          >
            <span>🎓 Fellowship Demo Form</span>
          </button>
        </div>
      </div>

      {/* Untrusted Prompt Injection Banner */}
      {untrusted && (
        <div
          style={{
            padding: '0.6rem 0.85rem',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--status-danger-bg)',
            border: '1px solid var(--status-danger-border)',
            color: 'var(--status-danger)',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.75rem'
          }}
        >
          <ShieldAlert style={{ width: 16, height: 16, flexShrink: 0 }} />
          <span>Security Alert: Prompt injection pattern detected in form text. Quarantined by InjectionDefense.</span>
        </div>
      )}

      {/* Main Viewport Container */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(0, 0, 0, 0.2)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Connection Failure Diagnostic State */}
        {!isConnected && (
          <div style={{ textAlign: 'center', padding: '2.5rem 1.5rem', margin: 'auto' }}>
            <AlertCircle style={{ width: 36, height: 36, margin: '0 auto 0.75rem', color: 'var(--status-danger)' }} />
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              BROWSER CONNECTION PENDING OR FAILED
            </h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto 1rem', lineHeight: 1.4 }}>
              {connectionError || 'Connecting to Playwright Chromium on 127.0.0.1:8080/index.html...'}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem' }}>
              <button
                type="button"
                onClick={handleRetryConnection}
                disabled={isRetrying}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: 'var(--primary)',
                  color: 'var(--text-inverse)',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {isRetrying ? 'Retrying...' : 'Retry Connection'}
              </button>
              <button
                type="button"
                onClick={() => onSwitchEngine('simulated')}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer'
                }}
              >
                Use Simulated Driver
              </button>
            </div>
          </div>
        )}

        {/* VIEW 1: LIVE FORM (Centerpiece Rendered UI) */}
        {isConnected && activeView === 'form' && (
          <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Form Title Banner */}
            <div
              style={{
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-sm)',
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(129, 140, 248, 0.05))',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Website Form
                </h4>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                  Discovered fields and live form controls
                </span>
              </div>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)'
                }}
              >
                {fields.filter(f => !!f.current_value && f.current_value !== 'none').length} of {fields.length} Completed
              </span>
            </div>

            {/* Rendered Inputs Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
              {fields.map((f) => {
                const isFilled = !!f.current_value && f.current_value !== 'none';
                const isFocused = f.is_focused;

                return (
                  <div
                    key={f.field_id}
                    style={{
                      padding: '0.75rem 0.9rem',
                      borderRadius: 'var(--radius-sm)',
                      background: isFocused
                        ? 'rgba(245, 158, 11, 0.12)'
                        : isFilled
                        ? 'rgba(16, 185, 129, 0.08)'
                        : 'var(--bg-surface-elevated)',
                      border: `1.5px solid ${
                        isFocused
                          ? 'var(--status-warning)'
                          : isFilled
                          ? 'rgba(16, 185, 129, 0.45)'
                          : 'var(--border-subtle)'
                      }`,
                      transition: 'all 0.2s ease',
                      boxShadow: isFocused ? '0 0 12px rgba(245, 158, 11, 0.25)' : 'none'
                    }}
                  >
                    {/* Label Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <label
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          color: isFocused ? 'var(--status-warning)' : 'var(--text-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                      >
                        <span>{f.label.replace('*', '').trim()}</span>
                        {f.required && (
                          <span style={{ color: 'var(--status-danger)', fontWeight: 900 }}>*</span>
                        )}
                      </label>

                      {isFilled && (
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            color: 'var(--status-success)',
                            background: 'var(--status-success-bg)',
                            padding: '0.1rem 0.4rem',
                            borderRadius: 'var(--radius-full)'
                          }}
                        >
                          <CheckCircle2 style={{ width: 11, height: 11 }} /> Filled
                        </span>
                      )}

                      {isFocused && (
                        <span
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            color: 'var(--status-warning)',
                            background: 'var(--status-warning-bg)',
                            padding: '0.1rem 0.4rem',
                            borderRadius: 'var(--radius-full)'
                          }}
                        >
                          ● Active Focus
                        </span>
                      )}
                    </div>

                    {/* Field Value Box Styled like a Real Browser Input */}
                    <div
                      style={{
                        padding: '0.45rem 0.65rem',
                        borderRadius: 'var(--radius-xs)',
                        background: 'rgba(0, 0, 0, 0.35)',
                        border: '1px solid var(--border-muted)',
                        fontSize: '0.75rem',
                        fontFamily: 'var(--font-mono)',
                        color: isFilled ? 'var(--text-primary)' : 'var(--text-dim)',
                        minHeight: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span>{isFilled ? f.current_value : (f.placeholder || `[ Enter ${f.label.replace('*', '').trim()} ]`)}</span>
                      {isFilled && (
                        <CheckCircle2 style={{ width: 13, height: 13, color: 'var(--status-success)', flexShrink: 0 }} />
                      )}
                    </div>

                    {/* Description / A11y Help Text */}
                    {f.help_text && (
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '0.3rem', lineHeight: 1.3 }}>
                        {f.help_text}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Form Submission Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--border-subtle)',
                marginTop: '0.5rem'
              }}
            >
              <button
                type="button"
                style={{
                  padding: '0.55rem 1.25rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  background: 'var(--primary)',
                  color: 'var(--text-inverse)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <span>Submit Application</span>
                <ChevronRight style={{ width: 14, height: 14 }} />
              </button>
            </div>
          </div>
        )}

        {/* VIEW 2: LIVE CHROMIUM SCREENSHOT */}
        {isConnected && activeView === 'screenshot' && (
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Real-time Playwright Chromium Canvas Snapshot
              </span>
              <button
                type="button"
                onClick={loadScreenshot}
                disabled={screenshotLoading}
                style={{
                  padding: '0.3rem 0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                <RefreshCw style={{ width: 11, height: 11 }} />
                <span>{screenshotLoading ? 'Capturing...' : 'Refresh'}</span>
              </button>
            </div>

            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#ffffff',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                border: '1px solid var(--border-muted)',
                minHeight: '380px'
              }}
            >
              {screenshotData ? (
                <img
                  src={`data:image/png;base64,${screenshotData}`}
                  alt="Live Playwright Chromium Screenshot"
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              ) : (
                <div style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
                  <Camera style={{ width: 32, height: 32, margin: '0 auto 0.5rem', opacity: 0.5 }} />
                  <p style={{ fontSize: '0.8rem', fontWeight: 600 }}>Capturing screenshot from Playwright...</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 3: ACCESSIBILITY TREE */}
        {isConnected && activeView === 'a11y' && (
          <div style={{ padding: '1rem', height: '100%', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>
                Chromium Accessibility Tree Snapshot (AXNode)
              </span>
              <button
                type="button"
                onClick={loadA11yTree}
                disabled={a11yLoading}
                style={{
                  padding: '0.3rem 0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer'
                }}
              >
                {a11yLoading ? 'Loading...' : 'Refresh Tree'}
              </button>
            </div>
            <pre
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: 'var(--accent-cyan)',
                lineHeight: 1.45,
                whiteSpace: 'pre-wrap',
                background: 'rgba(0, 0, 0, 0.4)',
                padding: '0.85rem',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              {a11yTreeData ? JSON.stringify(a11yTreeData, null, 2) : 'Loading accessibility tree from Playwright page...'}
            </pre>
          </div>
        )}

        {/* VIEW 4: DOM JSON */}
        {isConnected && activeView === 'dom' && (
          <div style={{ padding: '1rem', height: '100%', overflowY: 'auto' }}>
            <pre
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: 'var(--accent-cyan)',
                lineHeight: 1.4,
                whiteSpace: 'pre-wrap',
                background: 'rgba(0, 0, 0, 0.4)',
                padding: '0.85rem',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              {JSON.stringify(pageState, null, 2)}
            </pre>
          </div>
        )}

        {/* VIEW 5: MCP TOOL ACTIVITY */}
        {isConnected && activeView === 'tools' && (
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-dim)' }}>
                FastMCP Tool Execution Log
              </span>
              <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                {toolActions.length} recorded actions
              </span>
            </div>

            {toolActions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-dim)' }}>
                <Terminal style={{ width: 28, height: 28, margin: '0 auto 0.5rem', opacity: 0.5 }} />
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No tool calls yet.</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                  Tools trigger when user interacts with form fields.
                </p>
              </div>
            ) : (
              toolActions.map((t, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-xs)',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 style={{ width: 14, height: 14, color: 'var(--status-success)' }} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {t.event_type || 'browser_type'}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                    {t.latency_ms ? `${t.latency_ms} ms` : 'SUCCESS'}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
