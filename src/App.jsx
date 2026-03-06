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

      {/* Google sign-in button (hidden, used for rendering) */}
      <div id="googleBtn" style={{ display: 'none' }} />
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ session, onSignOut, isFetchingEmails, error }) {
  const [apps, setApps] = useState([]);
  const [loadingDb, setLoadingDb] = useState(true);

  useEffect(() => {
    if (!session || !session.id) {
      console.log("Waiting for session ID...");
      setLoadingDb(false);
      return;
    }

    let isMounted = true;
    console.log("Session ready, fetching data for:", session.id);

    const formatAppData = (data) => data.map(app => ({
      id: app.id,
      company: app.company_name || 'Unknown Company',
      role: app.job_title || 'Position',
      status: app.status?.toLowerCase() || 'applied',
      date: app.applied_date ? new Date(app.applied_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recent',
      type: app.role_type || 'Full-time'
    }));

    const fetchClassifications = async () => {
      setLoadingDb(true);
      const { data, error: dbError } = await supabase
        .from('ai_classifications')
        .select('*')
        .eq('user_id', session.id)
        .order('applied_date', { ascending: false });

      console.log("Supabase response:", { data, dbError });

      if (isMounted) {
        if (dbError) {
          console.error("Database fetch error:", dbError);
        } else if (data) {
          setApps(formatAppData(data));
        }
        setLoadingDb(false);
      }
    };

    fetchClassifications();

    const channel = supabase
      .channel('db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_classifications',
          filter: `user_id=eq.${session.id}`,
        },
        (payload) => {
          if (isMounted) {
            setApps((prev) => {
              const formattedNewApp = formatAppData([payload.new])[0];
              if (prev.some(app => app.id === formattedNewApp.id)) return prev;
              return [formattedNewApp, ...prev];
            });
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [session?.id]);

  const stats = {
    total: apps.length,
    interviews: apps.filter(a => a.status === 'interviewing' || a.status === 'interview').length,
    offers: apps.filter(a => a.status === 'offer').length
  };

  return (
    <div className="dash-root">
      <main className="dash-main">
        <header className="dash-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="dash-title">Live Pipeline</h1>
            <p className="dash-sub">
              {isFetchingEmails ? (
                <span className="scanning-text"><Icon.Sparkles /> AI is scanning your inbox...</span>
              ) : (
                `${stats.total} applications tracked`
              )}
            </p>
          </div>
          {/* Sign Out Button added here */}
          <button className="nav-cta" onClick={onSignOut} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Icon.LogOut />
            Sign Out
          </button>
        </header>

        {loadingDb ? (
          <div className="loading-state">Syncing your pipeline...</div>
        ) : apps.length === 0 ? (
          <div className="empty-state">
            <Icon.Inbox />
            <h2>Waiting for data...</h2>
            <p>Your AI scanner runs automatically. New applications will appear here in real-time.</p>
          </div>
        ) : (
          <div className="pipeline-view">
            <div className="summary-bar">
              <div className="summary-card"><span>Total</span> <strong>{stats.total}</strong></div>
              <div className="summary-card"><span>Interviews</span> <strong style={{color: STATUS_CONFIG.interview.color}}>{stats.interviews}</strong></div>
              <div className="summary-card"><span>Offers</span> <strong style={{color: STATUS_CONFIG.offer.color}}>{stats.offers}</strong></div>
            </div>

            <div className="app-grid">
              {apps.map(app => {
                const config = STATUS_CONFIG[app.status] || STATUS_CONFIG.applied;
                return (
                  <div className="app-card slide-in" key={app.id}>
                    <div className="app-card-header">
                      <div className="app-icon-box"><Icon.Briefcase /></div>
                      <div className="app-status-badge" style={{ backgroundColor: config.bg, color: config.color }}>
                        {config.label}
                      </div>
                    </div>
                    <div className="app-card-body">
                      <h3 className="app-company">{app.company}</h3>
                      <p className="app-role">{app.role}</p>
                    </div>
                    <div className="app-card-footer">
                      <div className="app-meta"><Icon.Clock /><span>{app.date}</span></div>
                      <div className="app-type">{app.type}</div>
                    </div>
                  </div>
                );
              })}
            </div>
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
  const [isFetchingEmails, setIsFetchingEmails] = useState(false);

  // 1. Google Auth Code Flow Trigger
  const handleGetStarted = () => {
    if (!window.google) return;

    const client = window.google.accounts.oauth2.initCodeClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      scope: 'openid email profile https://www.googleapis.com/auth/gmail.readonly',
      ux_mode: 'popup',
      access_type: 'offline', 
      prompt: 'consent',     
      callback: async (response) => {
        if (response.code) {
          setLoading(true);
          try {
            const { data, error: funcError } = await supabase.functions.invoke('auth-handler', {
              body: { 
                code: response.code, 
                action: 'google-login' 
              }
            });
            
            if (funcError) throw new Error(funcError.message);
            if (data?.error) throw new Error(data.error);

            // Re-added the Supabase session fix so your RLS policy allows data to load!
            if (data.session) {
               await supabase.auth.setSession({
                 access_token: data.session.access_token,
                 refresh_token: data.session.refresh_token
               });
            }

            setSession(data.user);
            localStorage.setItem('Refloe_profile', JSON.stringify(data.user));
          } catch (err) {
            setError(err.message);
          } finally {
            setLoading(false);
          }
        }
      },
    });

    client.requestCode();
  };

  const handleSignOut = async () => {
    // 1. Tell Supabase to destroy the session securely
    await supabase.auth.signOut();
    // 2. Clear out local storage
    localStorage.removeItem('Refloe_profile');
    // 3. Reset React state to push user back to HeroPage
    setSession(null);
  };

  const handleManualScan = () => {
    if (!window.google) return;
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/gmail.readonly',
      callback: async (tokenResponse) => {
        if (tokenResponse?.access_token) {
          setIsFetchingEmails(true);
          try {
            await supabase.functions.invoke('fetch-emails', {
              body: { accessToken: tokenResponse.access_token }
            });
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

  return session ? (
    <Dashboard
      session={session}
      onSignOut={handleSignOut}
      isFetchingEmails={isFetchingEmails}
      onFetchEmails={handleManualScan}
      error={error}
    />
  ) : (
    <HeroPage onGetStarted={handleGetStarted} loading={loading} />
  );
}