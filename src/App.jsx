import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './App.css';

// ─── tiny lucide-style inline SVGs ────────────────────────────────────────────
const Icon = {
  Briefcase: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
    </svg>
  ),
  Mail: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  ),
  Zap: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>
    </svg>
  ),
  TrendingUp: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
    </svg>
  ),
  CheckCircle: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  ArrowRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
    </svg>
  ),
  LogOut: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  Inbox: () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v3a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-3l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
    </svg>
  ),
  Building: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>
    </svg>
  ),
  Clock: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Sparkles: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
    </svg>
  ),
};

const STATUS_CONFIG = {
  applied:    { label: 'Applied',    color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  interview:  { label: 'Interview',  color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  offer:      { label: 'Offer',      color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  rejected:   { label: 'Rejected',   color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  ghosted:    { label: 'Ghosted',    color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
};

// ─── Hero / Landing page ──────────────────────────────────────────────────────
function HeroPage({ onGetStarted, loading }) {
  const features = [
    { icon: <Icon.Mail />, title: 'Email Scanning', desc: 'AI reads your inbox and auto-detects every job-related email instantly.' },
    { icon: <Icon.Zap />,  title: 'Smart Extraction', desc: 'Company, role, status and dates are pulled automatically — no manual entry.' },
    { icon: <Icon.TrendingUp />, title: 'Visual Pipeline', desc: 'See every application\'s journey from applied to offer in a clean dashboard.' },
  ];

  const stats = [
    { value: '2 min', label: 'Average setup' },
    { value: '100%', label: 'Auto-tracked' },
    { value: '0', label: 'Manual entries' },
  ];

  return (
    <div className="hero-root">
      {/* Animated background mesh */}
      <div className="hero-bg">
        <div className="mesh-blob blob-1" />
        <div className="mesh-blob blob-2" />
        <div className="mesh-blob blob-3" />
        <div className="grid-overlay" />
      </div>

      {/* Nav */}
      <nav className="hero-nav">
        <span className="nav-logo">Refloe</span>
        <button className="nav-cta" onClick={onGetStarted} disabled={loading}>
          {loading ? 'Loading…' : 'Get Started'}
          <Icon.ArrowRight />
        </button>
      </nav>

      {/* Hero section */}
      <section className="hero-section">
        <div className="hero-badge">
          <Icon.Sparkles />
          <span>AI-Powered Job Tracking</span>
        </div>

        <h1 className="hero-headline">
          Your job search,<br />
          <span className="headline-accent">on autopilot.</span>
        </h1>

        <p className="hero-sub">
          Connect Gmail. Let AI do the work. Never lose track of an application again —
          Refloe scans your emails and builds your pipeline automatically.
        </p>

        <div className="hero-cta-group">
          <button className="btn-hero-primary" onClick={onGetStarted} disabled={loading}>
            {loading ? (
              <span className="btn-loading">Verifying…</span>
            ) : (
              <>
                <span>Sign in with Google</span>
                <Icon.ArrowRight />
              </>
            )}
          </button>
          <p className="cta-footnote">Free to use · No credit card required</p>
        </div>

        {/* Stats row */}
        <div className="stats-row">
          {stats.map(s => (
            <div className="stat-item" key={s.label}>
              <span className="stat-value">{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Feature cards */}
      <section className="features-section">
        <div className="features-grid">
          {features.map(f => (
            <div className="feature-card" key={f.title}>
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Google sign-in button (hidden, used for rendering) */}
      <div id="googleBtn" style={{ display: 'none' }} />
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ session, onSignOut, emails, isFetchingEmails, onFetchEmails, error }) {
  const [view, setView] = useState('pipeline'); // 'pipeline' | 'raw'

  // Parse emails into application cards (mocked structure; real AI output would match)
  const apps = emails
    ? emails.map((e, i) => ({
        id: i,
        company: e.company || e.from?.split('@')[1]?.split('.')[0] || 'Unknown',
        role: e.role || e.subject || 'Position',
        status: e.status || 'applied',
        date: e.date ? new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—',
        snippet: e.snippet || '',
      }))
    : [];

  const grouped = Object.fromEntries(
    Object.keys(STATUS_CONFIG).map(k => [k, apps.filter(a => a.status === k)])
  );

  const firstName = session.email?.split('@')[0] ?? 'there';

  return (
    <div className="dash-root">
      <div className="dash-bg">
        <div className="mesh-blob blob-1" style={{ opacity: 0.3 }} />
        <div className="mesh-blob blob-2" style={{ opacity: 0.2 }} />
      </div>

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">Refloe</div>
        <nav className="sidebar-nav">
          <button
            className={`sidebar-link ${view === 'pipeline' ? 'active' : ''}`}
            onClick={() => setView('pipeline')}
          >
            <Icon.Briefcase /> Pipeline
          </button>
          <button
            className={`sidebar-link ${view === 'raw' ? 'active' : ''}`}
            onClick={() => setView('raw')}
          >
            <Icon.Mail /> Raw Emails
          </button>
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">{session.email?.[0]?.toUpperCase()}</div>
            <span className="user-email">{session.email}</span>
          </div>
          <button className="sign-out-btn" onClick={onSignOut} title="Sign out">
            <Icon.LogOut />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="dash-main">
        {/* Top bar */}
        <header className="dash-header">
          <div>
            <h1 className="dash-title">
              {view === 'pipeline' ? 'Your Pipeline' : 'Email Scanner'}
            </h1>
            <p className="dash-sub">
              {view === 'pipeline'
                ? `${apps.length} application${apps.length !== 1 ? 's' : ''} tracked`
                : `Scan Gmail to detect job applications`}
            </p>
          </div>
          <button
            className="btn-scan"
            onClick={onFetchEmails}
            disabled={isFetchingEmails}
          >
            {isFetchingEmails ? (
              <><span className="spin">⟳</span> Scanning…</>
            ) : (
              <><Icon.Zap /> Scan Emails</>
            )}
          </button>
        </header>

        {error && <div className="error-banner">{error}</div>}

        {/* Empty state */}
        {!emails && !isFetchingEmails && (
          <div className="empty-state">
            <div className="empty-icon"><Icon.Inbox /></div>
            <h2 className="empty-title">Ready to track</h2>
            <p className="empty-desc">
              Hit <strong>Scan Emails</strong> and Refloe's AI will comb through your Gmail,
              extract every job application, and build your pipeline automatically.
            </p>
            <div className="empty-checks">
              {['Detects applications, rejections & offers', 'Extracts company, role & dates', 'Zero manual data entry'].map(t => (
                <span key={t} className="empty-check"><Icon.CheckCircle /> {t}</span>
              ))}
            </div>
          </div>
        )}

        {isFetchingEmails && (
          <div className="scanning-state">
            <div className="scan-pulse" />
            <p className="scan-text">AI is reading your emails…</p>
            <p className="scan-sub">This may take a moment</p>
          </div>
        )}

        {/* Pipeline view */}
        {emails && view === 'pipeline' && (
          <div className="pipeline-view">
            {/* Summary chips */}
            <div className="summary-bar">
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <div className="summary-chip" key={key} style={{ borderColor: cfg.color + '40', background: cfg.bg }}>
                  <span className="chip-dot" style={{ background: cfg.color }} />
                  <span className="chip-count" style={{ color: cfg.color }}>{grouped[key]?.length ?? 0}</span>
                  <span className="chip-label">{cfg.label}</span>
                </div>
              ))}
            </div>

            {/* Application cards */}
            {apps.length === 0 ? (
              <p style={{ color: 'var(--muted)', textAlign: 'center', marginTop: '3rem' }}>
                No job applications detected in the scanned emails.
              </p>
            ) : (
              <div className="app-grid">
                {apps.map(app => {
                  const cfg = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.applied;
                  return (
                    <div className="app-card" key={app.id}>
                      <div className="app-card-top">
                        <div className="app-company-icon">
                          {app.company[0]?.toUpperCase()}
                        </div>
                        <div className="app-card-info">
                          <p className="app-company">
                            <Icon.Building /> {app.company}
                          </p>
                          <p className="app-role">{app.role}</p>
                        </div>
                        <span className="app-status-badge" style={{ color: cfg.color, background: cfg.bg }}>
                          {cfg.label}
                        </span>
                      </div>
                      {app.snippet && (
                        <p className="app-snippet">{app.snippet}</p>
                      )}
                      <p className="app-date"><Icon.Clock /> {app.date}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Raw emails view */}
        {emails && view === 'raw' && (
          <div className="raw-view">
            <pre className="raw-json">{JSON.stringify(emails, null, 2)}</pre>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem('Refloe_profile');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [emails, setEmails] = useState(null);
  const [isFetchingEmails, setIsFetchingEmails] = useState(false);

  useEffect(() => {
    /* global google */
    const initializeGoogle = () => {
      if (!session && window.google) {
        google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleGoogleSignIn,
        });
        google.accounts.id.renderButton(
          document.getElementById('googleBtn'),
          { theme: 'outline', size: 'large', width: '100', shape: 'pill' }
        );
      }
    };
    if (window.google) {
      initializeGoogle();
    } else {
      const script = document.querySelector('script[src*="gsi/client"]');
      if (script) script.addEventListener('load', initializeGoogle);
    }
  }, [session]);

  const handleGoogleSignIn = async (response) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: funcError } = await supabase.functions.invoke('auth-handler', {
        body: { idToken: response.credential, action: 'google-login' }
      });
      if (funcError) throw new Error(funcError.message);
      if (data?.error) throw new Error(data.error);
      const profileData = { ...data.user };
      localStorage.setItem('Refloe_profile', JSON.stringify(profileData));
      setSession(profileData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.functions.invoke('sign-out');
    } catch (err) {
      console.error(err);
    } finally {
      localStorage.removeItem('Refloe_profile');
      setSession(null);
      setEmails(null);
    }
  };

  const handleConnectGmail = () => {
    if (!window.google) return;
    setError(null);
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/gmail.readonly',
      callback: async (tokenResponse) => {
        if (tokenResponse?.access_token) {
          setIsFetchingEmails(true);
          try {
            const { data, error } = await supabase.functions.invoke('fetch-emails', {
              body: { accessToken: tokenResponse.access_token }
            });
            if (error) throw new Error(error.message);
            if (data?.emails) setEmails(data.emails);
          } catch (err) {
            setError(err.message);
          } finally {
            setIsFetchingEmails(false);
          }
        }
      },
    });
    client.requestAccessToken();
  };

  // Trigger Google sign-in from hero CTA
  const handleGetStarted = () => {
    if (window.google) {
      google.accounts.id.prompt();
    }
  };

  if (session) {
    return (
      <Dashboard
        session={session}
        onSignOut={handleSignOut}
        emails={emails}
        isFetchingEmails={isFetchingEmails}
        onFetchEmails={handleConnectGmail}
        error={error}
      />
    );
  }

  return <HeroPage onGetStarted={handleGetStarted} loading={loading} />;
}
