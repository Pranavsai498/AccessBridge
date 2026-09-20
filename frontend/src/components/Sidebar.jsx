import React from 'react';
import {
  LayoutDashboard,
  MessageSquareCode,
  GitBranch,
  Globe,
  BookOpen,
  ShieldAlert,
  PlaySquare,
  BarChart3,
  History,
  X
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  onSelectTab,
  isMobileOpen = false,
  onCloseMobile,
  taskStarted = false,
  isProcessing = false,
  isBrowserConnected = true,
  citationsCount = 0,
  safetyDecision = null,
  tracesCount = 0
}) {
  const safetyBadge = safetyDecision?.decision === 'BLOCK'
    ? 'Blocked'
    : safetyDecision?.decision === 'REQUIRE_CONFIRMATION'
    ? 'Review'
    : 'Protected';

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, badge: 'Home' },
    { id: 'live_task', label: 'Live Task', icon: MessageSquareCode, badge: taskStarted ? 'Active' : 'Ready' },
    { id: 'agent_flow', label: 'Agent Flow', icon: GitBranch, badge: isProcessing ? 'Running' : '7 stages' },
    { id: 'browser', label: 'Browser Preview', icon: Globe, badge: isBrowserConnected ? 'Connected' : 'Offline' },
    { id: 'grounding', label: 'Grounding & RAG', icon: BookOpen, badge: citationsCount > 0 ? `${citationsCount} sources` : 'Ready' },
    { id: 'safety', label: 'Safety Center', icon: ShieldAlert, badge: safetyBadge },
    { id: 'scenarios', label: 'Demo Scenarios', icon: PlaySquare, badge: '5 Scenarios' },
    { id: 'evaluation', label: 'Evaluation', icon: BarChart3, badge: '25 tests' },
    { id: 'traces', label: 'Audit Trail', icon: History, badge: `${tracesCount} events` }
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 90
          }}
        />
      )}

      <aside
        className={`app-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}
        style={{
          width: '240px',
          backgroundColor: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '1.25rem 0.75rem',
          flexShrink: 0
        }}
      >
        <div>
          {/* Mobile Header with Close Button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.5rem 1rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '0.75rem' }} className="sidebar-mobile-header">
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)' }}>
              Navigation Menu
            </span>
            <button
              type="button"
              onClick={onCloseMobile}
              style={{ background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}
            >
              <X style={{ width: 18, height: 18 }} />
            </button>
          </div>

          <div style={{ padding: '0 0.5rem', marginBottom: '0.6rem' }}>
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--text-dim)'
              }}
            >
              WORKSPACE SECTIONS
            </span>
          </div>

          {/* Navigation Links */}
          <nav aria-label="Main Application Navigation" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectTab(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: isActive ? 'var(--bg-surface-elevated)' : 'transparent',
                    color: isActive ? '#ffffff' : 'var(--text-secondary)',
                    border: isActive ? '1px solid var(--border-muted)' : '1px solid transparent',
                    boxShadow: isActive ? 'var(--shadow-subtle)' : 'none',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <Icon
                      style={{
                        width: 16,
                        height: 16,
                        color: isActive ? 'var(--primary)' : 'var(--text-muted)'
                      }}
                      aria-hidden="true"
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      style={{
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        padding: '0.1rem 0.4rem',
                        borderRadius: 'var(--radius-full)',
                        background: isActive ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                        color: isActive ? 'var(--primary)' : 'var(--text-dim)',
                        border: `1px solid ${isActive ? 'rgba(56, 189, 248, 0.3)' : 'var(--border-subtle)'}`,
                        fontFamily: 'var(--font-mono)'
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Info Card */}
        <div
          style={{
            padding: '0.85rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--status-success)' }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Hackathon Ready
            </span>
          </div>
          <p style={{ fontSize: '0.68rem', color: 'var(--text-dim)', lineHeight: 1.35, margin: 0 }}>
            LangGraph • FastMCP • ChromaDB • Playwright
          </p>
        </div>
      </aside>
    </>
  );
}
