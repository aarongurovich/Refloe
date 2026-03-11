import { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabaseClient';
import './App.css';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, CartesianGrid, Legend,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ComposedChart, Line
} from 'recharts';
import html2canvas from 'html2canvas';
import { BrowserRouter, Routes, Route, useNavigate, Link } from 'react-router-dom';

// ── Icons ────────────────────────────────────────────────────────────────────

const Ico = {
  Briefcase: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>,
  TrendUp: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Arrow: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>,
  LogOut: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Inbox: () => <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v3a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-3l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>,
  Cal: () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Alert: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  Spark: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>,
  ChevL: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  ChevR: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  ChevU: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>,
  ChevD: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  Target: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  Search: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Download: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Mail: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
  Shield: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Moon: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  Sun: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
};

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS = {
  applied:      { label: 'Applied',    color: 'var(--tag-applied-color)',    bg: 'var(--tag-applied-bg)',    border: 'var(--tag-applied-border)'    },
  interview:    { label: 'Interview',  color: 'var(--tag-interview-color)',  bg: 'var(--tag-interview-bg)',  border: 'var(--tag-interview-border)'  },
  interviewing: { label: 'Interview',  color: 'var(--tag-interview-color)',  bg: 'var(--tag-interview-bg)',  border: 'var(--tag-interview-border)'  },
  offer:        { label: 'Offer',      color: 'var(--tag-offer-color)',      bg: 'var(--tag-offer-bg)',      border: 'var(--tag-offer-border)'      },
  rejected:     { label: 'Rejected',   color: 'var(--tag-rejected-color)',   bg: 'var(--tag-rejected-bg)',   border: 'var(--tag-rejected-border)'   },
  ghosted:      { label: 'Ghosted',    color: 'var(--tag-ghosted-color)',    bg: 'var(--tag-ghosted-bg)',    border: 'var(--tag-ghosted-border)'    },
};

const CHART_COLORS = ['#7c3aed', '#3b82f6', '#059669', '#f59e0b', '#ef4444', '#8b5cf6'];

// ── Tooltip ───────────────────────────────────────────────────────────────────

const ChartTip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  const color = d.payload?.color || d.fill || '#7c3aed';
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e2ec', borderRadius: 10, padding: '7px 12px', fontSize: 13, fontFamily: 'Figtree, sans-serif', boxShadow: '0 8px 24px rgba(10,10,20,0.1)' }}>
      <span style={{ color, fontWeight: 700 }}>{d.payload?.name || d.name}: {d.value}</span>
    </div>
  );
};

// ── Company matching ──────────────────────────────────────────────────────────

const isSimilarCompany = (a, b) => {
  if (!a || !b) return false;
  const norm = s => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
  const n1 = norm(a); const n2 = norm(b);
  if (n1 === n2) return true;
  const stop = ['inc','corp','llc','ltd','company','brands','group','the','co','technologies','solutions','global','careers','talent','team','usa','na','system','systems','network','networks'];
  const c1 = n1.split(/\s+/).filter(w => !stop.includes(w) && w.length > 1);
  const c2 = n2.split(/\s+/).filter(w => !stop.includes(w) && w.length > 1);
  if (!c1.length || !c2.length) return false;
  const s1 = c1.join(' '); const s2 = c2.join(' ');
  if (s1 === s2) return true;
  if ((s1.startsWith(s2) || s2.startsWith(s1)) && Math.min(s1.length, s2.length) >= 3) return true;
  if (c1[0] === c2[0] && c1[0].length >= 3) return true;
  if (` ${s1} `.includes(` ${s2} `) || ` ${s2} `.includes(` ${s1} `)) return true;
  return false;
};

// ── Ticker data ───────────────────────────────────────────────────────────────

const TICKER_ITEMS = [
  'AI-Powered Tracking', 'Gmail & Outlook', 'Zero Manual Entry',
  'Live Pipeline', 'Smart Classification', 'Instant Setup',
  'Interview Analytics', 'Offer Tracking', 'Application Intel',
];



// ── Dark mode ─────────────────────────────────────────────────────────────────

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('refloe_dark') === '1'; } catch { return false; }
  });
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    try { localStorage.setItem('refloe_dark', dark ? '1' : '0'); } catch {}
  }, [dark]);
  return [dark, () => setDark(d => !d)];
}

// ── Loading Screen ────────────────────────────────────────────────────────────

function LoadingScreen({ message = 'Verifying your account…' }) {
  const steps = [
    { label: 'Authenticating identity', delay: 0 },
    { label: 'Connecting to your inbox', delay: 0.4 },
    { label: 'Setting up your workspace', delay: 0.8 },
  ];
  return (
    <div className="loading-screen">
      <div className="loading-card">
        <div className="loading-logo">
          <div className="loading-mark">R</div>
          <span className="loading-wordmark">Refloe</span>
        </div>
        <div className="loading-spinner-wrap">
          <div className="loading-ring" />
          <div className="loading-ring loading-ring-2" />
        </div>
        <p className="loading-message">{message}</p>
        <div className="loading-steps">
          {steps.map((s, i) => (
            <div className="loading-step" key={i} style={{ animationDelay: `${s.delay}s` }}>
              <div className="loading-step-dot" style={{ animationDelay: `${s.delay + 0.2}s` }} />
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Nav ───────────────────────────────────────────────────────────────────────

function Nav({ onLogoClick, actions, dark, onToggleDark }) {
  return (
    <nav className="nav">
      <div className="nav-logo" onClick={onLogoClick}>
        <div className="nav-mark">R</div>
        Refloe
      </div>
      <div className="nav-spacer" />
      {actions}
      <button
        className="btn btn-ghost theme-toggle"
        onClick={onToggleDark}
        title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-label="Toggle dark mode"
      >
        {dark ? <Ico.Sun /> : <Ico.Moon />}
      </button>
    </nav>
  );
}

// ── Ticker ────────────────────────────────────────────────────────────────────

function Ticker() {
  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="ticker-wrap" aria-hidden="true">
      <div className="ticker-track">
        {doubled.map((t, i) => (
          <span className="ticker-item" key={i}>
            {t}
            <span className="ticker-sep">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Legal pages ───────────────────────────────────────────────────────────────

function PrivacyPage() {
  const [dark, toggleDark] = useDarkMode();
  const nav = useNavigate();
  return (
    <div className="legal-page">
      <Nav onLogoClick={() => nav('/')} dark={dark} onToggleDark={toggleDark} actions={<button className="btn btn-ghost" onClick={() => nav('/')}><Ico.ChevL /> Back</button>} />
      <div className="legal-wrap">
        <h1>Privacy Policy</h1>
        <section><h3>Introduction</h3><p>Refloe provides an AI-powered job application tracking service. We are committed to protecting your personal data and your privacy.</p></section>
        <section><h3>Information We Collect</h3><ul>
          <li><strong>Google User Data:</strong> We request the <code>https://www.googleapis.com/auth/gmail.readonly</code> scope to scan your inbox for job-related communications.</li>
          <li><strong>Profile Information:</strong> We collect your name and email address through Google and Microsoft identity services.</li>
        </ul></section>
        <section><h3>How We Use Your Data</h3><ul>
          <li><strong>Automated Tracking:</strong> Our system scans for emails to detect job application updates.</li>
          <li><strong>AI Analysis:</strong> Relevant email content is processed via the OpenRouter API to extract company names, job titles, and application statuses.</li>
          <li><strong>Dashboard:</strong> Extracted data is stored in Supabase to populate your visual job pipeline.</li>
        </ul></section>
        <section><h3>Data Protection</h3><p>Your data is stored securely using Supabase (PostgreSQL) and processed within AWS Lambda. We do not sell your personal information to third parties.</p></section>
        <section><h3>User Rights</h3><p>You may disconnect your email provider or delete your account at any time through the application settings.</p></section>
      </div>
    </div>
  );
}

function TermsPage() {
  const [dark, toggleDark] = useDarkMode();
  const nav = useNavigate();
  return (
    <div className="legal-page">
      <Nav onLogoClick={() => nav('/')} dark={dark} onToggleDark={toggleDark} actions={<button className="btn btn-ghost" onClick={() => nav('/')}><Ico.ChevL /> Back</button>} />
      <div className="legal-wrap">
        <h1>Terms of Service</h1>
        <section><h3>Service Description</h3><p>Refloe is an automated tracking tool. By using the service, you authorize Refloe to access your designated email inbox to identify and organize job application data.</p></section>
        <section><h3>User Responsibilities</h3><p>You are responsible for maintaining the security of your account and must not use Refloe for any illegal activities.</p></section>
        <section><h3>Limitations of Liability</h3><p>Refloe uses AI for data extraction. While we strive for accuracy, we are not responsible for errors in application tracking or missed deadlines.</p></section>
        <section><h3>Infrastructure</h3><p>The service relies on third-party providers including AWS, Supabase, and OpenRouter. Service availability is subject to the uptime of these providers.</p></section>
        <section><h3>Modifications</h3><p>We reserve the right to modify these terms at any time. Continued use of Refloe constitutes acceptance of updated terms.</p></section>
      </div>
    </div>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────

function HeroPage({ onGmail, onOutlook, loading, dark, onToggleDark }) {
  const steps = [
    { n: '01', title: 'Connect your inbox', desc: 'Link Gmail or Outlook in under 60 seconds. No forwarding rules.' },
    { n: '02', title: 'AI reads everything', desc: 'Every application email is classified, dated, and enriched automatically.' },
    { n: '03', title: 'Watch your pipeline', desc: 'Dashboard updates live as rejections, interviews, and offers arrive.' },
  ];

  const stats = [
    { n: '2 min', l: 'Setup time' },
    { n: '100%', l: 'Auto-tracked' },
    { n: '0',    l: 'Manual entries' },
  ];

  return (
    <div className="hero-root page">
      <Nav
        onLogoClick={() => {}}
        dark={dark}
        onToggleDark={onToggleDark}
        actions={
          <button className="btn btn-primary" onClick={onGmail} disabled={loading}>
            {loading ? <span className="btn-loading">Connecting…</span> : <><Ico.Mail /> Get started free</>}
          </button>
        }
      />
      <Ticker />

      <div className="hero-main">
        {/* Left */}
        <div className="hero-left">
          <div className="hero-kicker">
            <span className="kicker-dot" />
            AI-Powered Job Tracking
          </div>

          <h1 className="hero-h1">
            Your job search,<br />
            <em>on autopilot.</em>
          </h1>

          <p className="hero-p">
            Connect Gmail or Outlook and let AI handle the rest. Refloe scans your inbox,
            extracts every application, and builds your pipeline — automatically, in real time.
          </p>

          <div className="hero-btns">
            <button className="btn btn-primary btn-lg" onClick={onGmail} disabled={loading}>
              {loading ? <span className="btn-loading">Verifying…</span> : <><Ico.Mail /> Sign in with Gmail</>}
            </button>
            <button className="btn btn-secondary btn-lg" onClick={onOutlook} disabled={loading}>
              {loading ? <span className="btn-loading">Verifying…</span> : <><Ico.Mail /> Sign in with Outlook</>}
            </button>
          </div>

          <div className="hero-fine">
            <span><span className="check-icon"><Ico.Check /></span> Free to use</span>
            <span><span className="check-icon"><Ico.Check /></span> No credit card</span>
            <span><span className="check-icon"><Ico.Check /></span> Cancel anytime</span>
          </div>
        </div>

        {/* Right */}
        <div className="hero-right">
          <div className="hr-label">How it works</div>

          {steps.map(s => (
            <div className="step-card" key={s.n}>
              <div className="step-n">{s.n}</div>
              <div className="step-text">
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
              </div>
            </div>
          ))}

          <div className="stats-row">
            {stats.map(s => (
              <div className="stat-cell" key={s.l}>
                <div className="sc-n">{s.n}</div>
                <div className="sc-l">{s.l}</div>
              </div>
            ))}
          </div>

          <div className="secure-badge">
            <span className="secure-dot" />
            <Ico.Shield />
            Read-only access — your emails never leave your account
          </div>
        </div>
      </div>

      <footer className="hero-footer">
        <div className="footer-links">
          <Link to="/privacy" className="footer-link">Privacy Policy</Link>
          <Link to="/terms" className="footer-link">Terms of Service</Link>
        </div>
        <span className="footer-copy">© 2026 Refloe. All rights reserved.</span>
      </footer>
    </div>
  );
}

// ── History ───────────────────────────────────────────────────────────────────

function HistoryPage({ onConfirm, loading, dark, onToggleDark }) {
  const nav = useNavigate();
  return (
    <div className="history-page page">
      <Nav onLogoClick={() => nav('/')} dark={dark} onToggleDark={onToggleDark} actions={null} />
      <div className="history-box">
        <div className="history-icon-wrap"><Ico.Mail /></div>
        <h2 className="history-h">How far back<br /><em>should we look?</em></h2>
        <p className="history-sub">
          We'll scan your inbox and extract all job-related emails within your chosen window to build your initial pipeline.
        </p>
        <div className="history-opts">
          {[1, 2, 3].map(m => (
            <button key={m} className="history-opt" onClick={() => onConfirm(m)} disabled={loading}>
              <span className="ho-n">{m}</span>
              <span className="ho-l">Month{m > 1 ? 's' : ''}</span>
            </button>
          ))}
        </div>
        {loading && (
          <div className="scan-msg">
            <span className="scan-dot" />
            <Ico.Spark /> Preparing your scan…
          </div>
        )}
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

function Dashboard({ session, onSignOut, isFetchingEmails, dark, onToggleDark }) {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState({ key: 'rawDate', dir: 'desc' });
  const [page, setPage] = useState(1);
  const PER = 10;

  const fetchApps = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ai_classifications')
      .select('*')
      .eq('user_id', session.id)
      .order('applied_date', { ascending: false, nullsFirst: false });

    if (!error && data) {
      const groups = [];
      data.forEach(app => {
        const raw = (app.company_name || 'Unknown').trim();
        const dateStr = app.applied_date || app.parsed_date;
        const d = dateStr ? new Date(dateStr) : new Date(0);
        const ex = groups.find(g => isSimilarCompany(g.company, raw));
        if (!ex) {
          groups.push({
            id: app.id, company: raw, role: app.job_title || 'Position',
            status: app.status?.toLowerCase() || 'applied',
            rawDate: dateStr, earliest: d,
            date: app.applied_date ? new Date(app.applied_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent',
            type: (app.role_type && app.role_type !== 'Unknown') ? app.role_type : 'Full-time',
            stage: app.specific_stage, location: app.location,
            salary: app.salary_estimate, nextAction: app.next_action,
            deadline: app.action_deadline ? new Date(app.action_deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null,
            summary: app.summary,
          });
        } else {
          if (raw.length < ex.company.length && raw.length >= 3) ex.company = raw;
          if (d < ex.earliest && d.getTime() > 0) ex.earliest = d;
          if ((!ex.role || ex.role === 'Position') && app.job_title && app.job_title !== 'Unknown') ex.role = app.job_title;
          if (ex.type === 'Full-time' && app.role_type && app.role_type !== 'Unknown') ex.type = app.role_type;
          if (!ex.location && app.location) ex.location = app.location;
          if (!ex.summary && app.summary) ex.summary = app.summary;
          if (!ex.stage && app.specific_stage) ex.stage = app.specific_stage;
        }
      });
      setApps(groups);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!session?.id) { setLoading(false); return; }
    let mounted = true;
    fetchApps();
    const ch = supabase.channel('db')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ai_classifications', filter: `user_id=eq.${session.id}` },
        () => { if (mounted) fetchApps(); })
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(ch); };
  }, [session?.id]);

  const handleSort = k => setSort(s => ({ key: k, dir: s.key === k && s.dir === 'asc' ? 'desc' : 'asc' }));

  const derived = useMemo(() => {
    const active = apps.filter(a => ['interview','interviewing'].includes(a.status));
    const offers = apps.filter(a => a.status === 'offer');
    const iRate = apps.length ? Math.round(active.length / apps.length * 100) : 0;
    const oRate = apps.length ? Math.round(offers.length / apps.length * 100) : 0;

    const statusData = [
      { name: 'Applied',   count: apps.filter(a => a.status === 'applied').length,   color: '#3b82f6' },
      { name: 'Interview', count: active.length,                                      color: '#7c3aed' },
      { name: 'Offer',     count: offers.length,                                      color: '#059669' },
      { name: 'Rejected',  count: apps.filter(a => a.status === 'rejected').length,   color: '#ef4444' },
    ];

    const roleMap = {};
    apps.forEach(a => { const t = a.type || 'Full-time'; roleMap[t] = (roleMap[t]||0)+1; });
    const roleData = Object.entries(roleMap).map(([k,v],i) => ({ name:k, value:v, color: CHART_COLORS[i%CHART_COLORS.length] }));

    const tMap = {};
    apps.forEach(a => {
      const d = a.earliest;
      if (d && !isNaN(d.getTime()) && d.getTime() > 0) {
        const key = d.toISOString().slice(0,10);
        const lbl = d.toLocaleDateString('en-US',{month:'short',day:'numeric'});
        if (!tMap[key]) tMap[key] = { name:lbl, applications:0, _k:key };
        tMap[key].applications++;
      }
    });
    const timeData = Object.values(tMap).sort((a,b)=>a._k.localeCompare(b._k));

    const buckets = {'Engineering':0,'Sales & Mktg':0,'Product & Mgmt':0,'Design':0,'Finance & Ops':0,'Other':0};
    apps.forEach(a => {
      const t = (a.role||'').toLowerCase();
      if (/(engineer|developer|data|ai|software|backend|frontend|cloud|tech)/.test(t)) buckets['Engineering']++;
      else if (/(sales|marketing|growth|sdr|bdr|ae|brand|seo)/.test(t)) buckets['Sales & Mktg']++;
      else if (/(manager|product|director|vp|head|chief|strategy)/.test(t)) buckets['Product & Mgmt']++;
      else if (/(design|ux|ui|creative|writer|content)/.test(t)) buckets['Design']++;
      else if (/(finance|account|hr|legal|admin|recruiter|ops)/.test(t)) buckets['Finance & Ops']++;
      else buckets['Other']++;
    });
    let maxR = 1;
    Object.values(buckets).forEach(v => { if (v>maxR) maxR=v; });
    const radarData = Object.entries(buckets).map(([k,v])=>({subject:k,count:v,fullMark:maxR}));

    // Outcome trend: group by month, split by status bucket
    const monthMap = {};
    apps.forEach(a => {
      const d = a.earliest;
      if (!d || isNaN(d.getTime()) || d.getTime() === 0) return;
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      const lbl = d.toLocaleDateString('en-US',{month:'short',year:'2-digit'});
      if (!monthMap[key]) monthMap[key] = { name:lbl, _k:key, Applied:0, Interview:0, Offer:0, Rejected:0 };
      const st = a.status;
      if (st === 'applied')                              monthMap[key].Applied++;
      else if (st === 'interview' || st==='interviewing') monthMap[key].Interview++;
      else if (st === 'offer')                           monthMap[key].Offer++;
      else if (st === 'rejected')                        monthMap[key].Rejected++;
      else                                               monthMap[key].Applied++;
    });
    const outcomeTrend = Object.values(monthMap).sort((a,b)=>a._k.localeCompare(b._k));

    const now = new Date();
    const week = new Date(now.getTime()-7*86400000);
    const actionItems = apps
      .filter(a => a.nextAction && !a.nextAction.toLowerCase().includes('continue job search') && new Date(a.rawDate||0) >= week)
      .sort((a,b)=>new Date(b.rawDate||0)-new Date(a.rawDate||0))
      .slice(0,8);

    let rows = [...apps];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(a =>
        (a.company||'').toLowerCase().includes(q) ||
        (a.role||'').toLowerCase().includes(q) ||
        (a.location||'').toLowerCase().includes(q) ||
        (a.status||'').toLowerCase().includes(q)
      );
    }

    rows.sort((a,b) => {
      let vA = a[sort.key], vB = b[sort.key];
      if (sort.key==='rawDate') { vA=new Date(vA||0).getTime(); vB=new Date(vB||0).getTime(); }
      else { vA=(vA||'').toString().toLowerCase(); vB=(vB||'').toString().toLowerCase(); }
      return vA < vB ? (sort.dir==='asc'?-1:1) : vA > vB ? (sort.dir==='asc'?1:-1) : 0;
    });

    const start = (page-1)*PER;
    const paged = rows.slice(start, start+PER);
    const pages = Math.max(1, Math.ceil(rows.length/PER));

    return { kpis: { total:apps.length, active:active.length, iRate, oRate }, statusData, roleData, timeData, radarData, outcomeTrend, actionItems, paged, pages };
  }, [apps, search, sort, page]);

  const SortIco = ({k}) => sort.key===k ? (sort.dir==='asc'?<Ico.ChevU/>:<Ico.ChevD/>) : null;

  const handleExport = async () => {
    const el = document.getElementById('dash-capture');
    if (!el) return;
    const c = await html2canvas(el, {
      backgroundColor: '#f7f7f9', scale: window.devicePixelRatio||2,
      useCORS: true, allowTaint: true,
      onclone: doc => {
        const clone = doc.getElementById('dash-capture');
        if (clone) { clone.style.animation='none'; clone.style.opacity='1'; }
      },
    });
    const a = document.createElement('a');
    a.download = 'refloe-dashboard.png';
    a.href = c.toDataURL('image/png', 1.0);
    a.click();
  };

  const kpiCards = [
    { label: 'Total Applied',    val: derived.kpis.total,         icon: <Ico.Briefcase/>, color: 'var(--v-mid)',    bg: 'var(--v-pale)' },
    { label: 'Active Processes', val: derived.kpis.active,        icon: <Ico.TrendUp/>,   color: 'var(--s-blue)',   bg: 'var(--s-blue-bg)' },
    { label: 'Interview Rate',   val: `${derived.kpis.iRate}%`,   icon: <Ico.Target/>,    color: 'var(--s-amber)',  bg: 'var(--s-amber-bg)' },
    { label: 'Offer Rate',       val: `${derived.kpis.oRate}%`,   icon: <Ico.Check/>,     color: 'var(--s-green)',  bg: 'var(--s-green-bg)' },
  ];

  return (
    <div className="dash-page page">
      <Nav
        onLogoClick={() => {}}
        dark={dark}
        onToggleDark={onToggleDark}
        actions={
          <div className="dash-btns">
            <button className="btn btn-secondary" onClick={handleExport}><Ico.Download/> Export</button>
            <button className="btn btn-ghost" onClick={onSignOut}><Ico.LogOut/> Sign out</button>
          </div>
        }
      />

      <div className="dash-body">
        <div className="dash-head">
          <div>
            <div className="dash-title">Application Dashboard</div>
            <div className="dash-sub">
              {isFetchingEmails
                ? <span className="live-chip"><span className="live-dot"/><Ico.Spark/> AI scanning…</span>
                : <><span className="live-chip"><span className="live-dot"/> Live</span> · {derived.kpis.total} companies tracked</>
              }
            </div>
          </div>
          <div className="dash-btns" style={{display:'none'}} />
        </div>

        {loading ? (
          <div className="state-box"><div className="spinner"/><p>Loading your pipeline…</p></div>
        ) : apps.length === 0 ? (
          <div className="state-box">
            <div className="state-icon"><Ico.Inbox/></div>
            <h2>No applications yet</h2>
            <p>Refloe is monitoring your inbox. Your pipeline will appear here automatically as applications are detected.</p>
          </div>
        ) : (
          <div id="dash-capture" style={{display:'flex',flexDirection:'column',gap:'1.1rem'}}>

            {/* KPIs */}
            <div className="kpi-row">
              {kpiCards.map(k => (
                <div className="kpi-card" key={k.label}>
                  <div className="kpi-icon" style={{background:k.bg,color:k.color}}>{k.icon}</div>
                  <div className="kpi-data">
                    <div className="kpi-val">{k.val}</div>
                    <div className="kpi-lbl">{k.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="chart-grid">
              <div className="panel">
                <div className="panel-title">Pipeline Funnel</div>
                <div className="chart-body">
                  <ResponsiveContainer width="100%" height={230}>
                    <BarChart data={derived.statusData} layout="vertical" margin={{top:0,right:20,left:0,bottom:0}}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={78} tick={{fill:'var(--chart-tick)',fontSize:12,fontFamily:'Figtree'}} />
                      <Tooltip content={<ChartTip/>} cursor={{fill:'rgba(124,58,237,0.04)'}} />
                      <Bar dataKey="count" radius={[0,5,5,0]} barSize={22}>
                        {derived.statusData.map((e,i) => <Cell key={i} fill={e.color}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="panel">
                <div className="panel-title">Role Distribution</div>
                <div className="chart-body">
                  <ResponsiveContainer width="100%" height={230}>
                    <PieChart>
                      <Pie data={derived.roleData} cx="50%" cy="42%" innerRadius={58} outerRadius={80} paddingAngle={3} dataKey="value">
                        {derived.roleData.map((e,i) => <Cell key={i} fill={e.color} stroke="transparent"/>)}
                      </Pie>
                      <Tooltip contentStyle={{background:'var(--tooltip-bg)',border:'1px solid var(--tooltip-border)',borderRadius:10,fontFamily:'Figtree',color:'var(--ink)'}} itemStyle={{color:'var(--muted)'}} />
                      <Legend verticalAlign="bottom" height={32} iconType="circle" wrapperStyle={{fontSize:12,color:'var(--muted)',fontFamily:'Figtree',paddingTop:8}} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="panel">
                <div className="panel-title">Role Archetypes</div>
                <div className="chart-body">
                  <ResponsiveContainer width="100%" height={230}>
                    <RadarChart cx="50%" cy="50%" outerRadius="68%" data={derived.radarData}>
                      <PolarGrid stroke="var(--rule)" />
                      <PolarAngleAxis dataKey="subject" tick={{fill:'var(--chart-tick)',fontSize:11,fontFamily:'Figtree'}} />
                      <Radar dataKey="count" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.15} strokeWidth={1.5} />
                      <Tooltip contentStyle={{background:'var(--tooltip-bg)',border:'1px solid var(--tooltip-border)',borderRadius:10,fontFamily:'Figtree',color:'var(--ink)'}} itemStyle={{color:'var(--muted)'}} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="panel">
                <div className="panel-title">Monthly Outcome Breakdown</div>
                <div className="chart-body">
                  <ResponsiveContainer width="100%" height={230}>
                    <ComposedChart data={derived.outcomeTrend} margin={{top:8,right:20,left:-8,bottom:0}}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:'var(--chart-tick)',fontSize:11,fontFamily:'Figtree'}} dy={6} minTickGap={16} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill:'var(--chart-tick)',fontSize:11,fontFamily:'Figtree'}} dx={-4} allowDecimals={false} />
                      <Tooltip contentStyle={{background:'var(--tooltip-bg)',border:'1px solid var(--tooltip-border)',borderRadius:10,fontFamily:'Figtree',fontSize:13,color:'var(--ink)'}} itemStyle={{color:'var(--muted)'}} />
                      <Legend verticalAlign="top" height={28} iconType="circle" wrapperStyle={{fontSize:12,color:'var(--muted)',fontFamily:'Figtree',paddingBottom:8}} />
                      <Bar dataKey="Applied"   stackId="a" fill={dark ? '#1e3a6e' : '#bfdbfe'} radius={[0,0,0,0]} barSize={28} />
                      <Bar dataKey="Interview" stackId="a" fill={dark ? '#3d2c6e' : '#ddd6fe'} radius={[0,0,0,0]} barSize={28} />
                      <Bar dataKey="Rejected"  stackId="a" fill={dark ? '#5a1c1c' : '#fecaca'} radius={[0,0,0,0]} barSize={28} />
                      <Bar dataKey="Offer"     stackId="a" fill={dark ? '#134d38' : '#a7f3d0'} radius={[4,4,0,0]} barSize={28} />
                      <Line type="monotone" dataKey="Offer" stroke={dark ? '#34d399' : '#059669'} strokeWidth={2} dot={{ fill: dark ? '#34d399' : '#059669', r:3 }} activeDot={{ r:5 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="panel span2">
                <div className="panel-title">Application Volume Over Time</div>
                <div className="chart-body">
                  <ResponsiveContainer width="100%" height={230}>
                    <AreaChart data={derived.timeData} margin={{top:8,right:20,left:-8,bottom:0}}>
                      <defs>
                        <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:'var(--chart-tick)',fontSize:11,fontFamily:'Figtree'}} dy={6} minTickGap={20} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill:'var(--chart-tick)',fontSize:11,fontFamily:'Figtree'}} dx={-4} allowDecimals={false} />
                      <Tooltip contentStyle={{background:'var(--tooltip-bg)',border:'1px solid var(--tooltip-border)',borderRadius:10,fontFamily:'Figtree',color:'var(--ink)'}} itemStyle={{color:'var(--muted)'}} />
                      <Area type="monotone" dataKey="applications" stroke="#7c3aed" strokeWidth={2} fill="url(#ag)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Actions */}
            {derived.actionItems.length > 0 && (
              <div className="actions-panel">
                <div className="ap-title"><Ico.Alert/> Action Required — Past 7 Days</div>
                <div className="actions-grid">
                  {derived.actionItems.map(item => (
                    <div className="action-card" key={item.id}>
                      <div className="ac-top">
                        <span className="ac-co">{item.company}</span>
                        {item.deadline && <span className="ac-date"><Ico.Cal/> {item.deadline}</span>}
                      </div>
                      <p className="ac-desc">{item.nextAction}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Table */}
            <div className="table-panel">
              <div className="table-top">
                <div className="panel-title" style={{marginBottom:0}}>Application Log</div>
                <div className="search-bar">
                  <Ico.Search />
                  <input
                    type="text"
                    placeholder="Search companies, roles…"
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                  />
                </div>
              </div>

              <div className="table-scroll">
                <table className="dt">
                  <thead>
                    <tr>
                      {[{k:'company',l:'Company'},{k:'role',l:'Role'},{k:'status',l:'Status'},{k:'rawDate',l:'Date'},{k:'location',l:'Location'}].map(col => (
                        <th key={col.k} className="th-sort" onClick={() => handleSort(col.k)}>
                          <span className="th-inner">{col.l} <SortIco k={col.k}/></span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {derived.paged.length === 0 ? (
                      <tr><td colSpan={5} style={{textAlign:'center',padding:'2rem',color:'var(--faint)'}}>No results matching your search.</td></tr>
                    ) : derived.paged.map(app => {
                      const cfg = STATUS[app.status] || STATUS.applied;
                      return (
                        <tr key={app.id} title={app.summary||''}>
                          <td><span className="td-co">{app.company}</span></td>
                          <td>
                            <div className="td-role-wrap">
                              <span className="td-role-main">{app.role}</span>
                              <span className="td-role-type">{app.type}</span>
                            </div>
                          </td>
                          <td>
                            <span className="s-tag" style={{background:cfg.bg,color:cfg.color,borderColor:cfg.border}}>
                              {cfg.label}{app.stage ? ` · ${app.stage}` : ''}
                            </span>
                          </td>
                          <td><span className="td-sm">{app.date}</span></td>
                          <td><span className="td-sm">{app.location || '—'}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {derived.pages > 1 && (
                <div className="pagination">
                  <span className="pg-info">Page {page} of {derived.pages}</span>
                  <div className="pg-btns">
                    <button className="pg-btn" disabled={page===1} onClick={()=>setPage(p=>Math.max(1,p-1))}><Ico.ChevL/></button>
                    <button className="pg-btn" disabled={page===derived.pages} onClick={()=>setPage(p=>Math.min(derived.pages,p+1))}><Ico.ChevR/></button>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

function AppContent() {
  const [dark, toggleDark] = useDarkMode();
  const [session, setSession] = useState(() => {
    try { const s = localStorage.getItem('Refloe_profile'); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [tempAuth, setTempAuth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);

  const handleGmail = () => {
    if (!window.google) return;
    const client = window.google.accounts.oauth2.initCodeClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      scope: 'openid email profile https://www.googleapis.com/auth/gmail.readonly',
      ux_mode: 'popup', access_type: 'offline', prompt: 'consent',
      callback: async res => {
        if (!res.code) return;
        setLoading(true);
        try {
          const { data, error } = await supabase.functions.invoke('auth-handler', { body: { code: res.code, action: 'google-login' } });
          if (error || data?.error) throw new Error(error?.message || data?.error);
          if (data.is_new_user) { setTempAuth(data); }
          else {
            if (data.session) await supabase.auth.setSession({ access_token: data.session.access_token, refresh_token: data.session.refresh_token });
            setSession(data.user); localStorage.setItem('Refloe_profile', JSON.stringify(data.user));
          }
        } catch (e) { console.error('Auth:', e.message); }
        finally { setLoading(false); }
      },
    });
    client.requestCode();
  };

  const handleOutlook = () => {
    const cid = import.meta.env.VITE_MICROSOFT_CLIENT_ID;
    const ruri = import.meta.env.VITE_REDIRECT_URI;
    if (!cid || !ruri) { alert('Configuration Error: Missing Client ID or Redirect URI.'); return; }
    const url = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${cid}&response_type=code&redirect_uri=${encodeURIComponent(ruri)}&response_mode=query&scope=${encodeURIComponent('openid profile email Mail.Read offline_access')}&prompt=consent`;
    const w=600,h=700;
    const popup = window.open(url,'ms_login',`width=${w},height=${h},left=${window.screenX+(window.outerWidth-w)/2},top=${window.screenY+(window.outerHeight-h)/2}`);
    if (!popup) { alert('Popup blocked.'); return; }
    setLoading(true);
    const iv = setInterval(async () => {
      try {
        if (popup.closed) { clearInterval(iv); setLoading(false); return; }
        const cu = popup.location.href;
        if (!cu || (!cu.includes('code=') && !cu.includes('error='))) return;
        const cm = cu.match(/code=([^&]+)/);
        popup.close(); clearInterval(iv);
        if (!cm) { setLoading(false); return; }
        const { data, error } = await supabase.functions.invoke('auth-handler', { body: { code: decodeURIComponent(cm[1]), action: 'outlook-login' } });
        if (error || data?.error) { console.error(error?.message||data?.error); setLoading(false); return; }
        if (data.is_new_user) { setTempAuth(data); }
        else {
          if (data.session) await supabase.auth.setSession({ access_token: data.session.access_token, refresh_token: data.session.refresh_token });
          setSession(data.user); localStorage.setItem('Refloe_profile', JSON.stringify(data.user));
        }
        setLoading(false);
      } catch (_) {}
    }, 500);
  };

  const handleConfirm = async months => {
    setLoading(true); setScanning(true);
    try {
      if (tempAuth.session) await supabase.auth.setSession({ access_token: tempAuth.session.access_token, refresh_token: tempAuth.session.refresh_token });
      const user = tempAuth.user;
      localStorage.setItem('Refloe_profile', JSON.stringify(user));
      setSession(user); setTempAuth(null); setLoading(false);
      supabase.functions.invoke('auth-handler', { body: { action: 'trigger-scan', userId: user.id, months } })
        .catch(console.error)
        .finally(() => setScanning(false));
    } catch (e) { console.error(e.message); setLoading(false); setScanning(false); }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('Refloe_profile');
    setSession(null); setTempAuth(null);
  };

  if (loading) return <LoadingScreen message={tempAuth ? 'Setting up your workspace…' : 'Verifying your account…'} />;
  if (tempAuth) return <HistoryPage onConfirm={handleConfirm} loading={loading} dark={dark} onToggleDark={toggleDark} />;
  if (session)  return <Dashboard session={session} onSignOut={handleSignOut} isFetchingEmails={scanning} dark={dark} onToggleDark={toggleDark} />;

  return (
    <Routes>
      <Route path="/"        element={<HeroPage onGmail={handleGmail} onOutlook={handleOutlook} loading={loading} dark={dark} onToggleDark={toggleDark} />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms"   element={<TermsPage />} />
      <Route path="*"        element={<HeroPage onGmail={handleGmail} onOutlook={handleOutlook} loading={loading} dark={dark} onToggleDark={toggleDark} />} />
    </Routes>
  );
}

export default function App() {
  return <BrowserRouter><AppContent /></BrowserRouter>;
}
