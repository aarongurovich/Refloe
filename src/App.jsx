import { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabaseClient';
import './App.css';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, CartesianGrid, Legend, Radar, RadarChart, PolarGrid, PolarAngleAxis } from 'recharts';
import html2canvas from 'html2canvas';

const Icon = {
  Briefcase: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>,
  Zap: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>,
  TrendingUp: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
  CheckCircle: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  ArrowRight: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>,
  LogOut: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Inbox: () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v3a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-3l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>,
  Clock: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Sparkles: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>,
  MapPin: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>,
  DollarSign: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>,
  AlertCircle: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>,
  Calendar: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>,
  ChevronLeft: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>,
  ChevronRight: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>,
  ChevronUp: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>,
  ChevronDown: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>,
  Target: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  Search: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
};

const STATUS_CONFIG = {
  applied:    { label: 'Applied',    color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
  interview:  { label: 'Interview',  color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' },
  interviewing:{ label: 'Interview', color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' },
  offer:      { label: 'Offer',      color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
  rejected:   { label: 'Rejected',   color: '#f87171', bg: 'rgba(248,113,113,0.15)' },
  ghosted:    { label: 'Ghosted',    color: '#94a3b8', bg: 'rgba(148,163,184,0.15)' },
};

const PIE_COLORS = ['#60a5fa', '#a78bfa', '#34d399', '#fbbf24', '#f87171', '#38bdf8'];

const CustomColorTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const color = data.payload.color || data.color || data.fill || '#f0f4ff';
    return (
      <div style={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px', padding: '10px 14px', fontSize: '13px' }}>
        <span style={{ color: color, fontWeight: 600 }}>{data.payload.name || data.name}: {data.value}</span>
      </div>
    );
  }
  return null;
};

const isSimilarCompany = (name1, name2) => {
  if (!name1 || !name2) return false;
  const normalize = s => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
  const n1 = normalize(name1);
  const n2 = normalize(name2);
  
  if (n1 === n2) return true;
  
  const stopWords = ['inc', 'corp', 'llc', 'ltd', 'company', 'brands', 'group', 'the', 'co', 'technologies', 'solutions', 'global', 'careers', 'talent', 'team', 'usa', 'na', 'system', 'systems', 'network', 'networks'];
  
  const clean1 = n1.split(/\s+/).filter(w => !stopWords.includes(w) && w.length > 1);
  const clean2 = n2.split(/\s+/).filter(w => !stopWords.includes(w) && w.length > 1);
  
  if (clean1.length === 0 || clean2.length === 0) return false;
  
  const s1 = clean1.join(' ');
  const s2 = clean2.join(' ');
  
  if (s1 === s2) return true;
  
  if ((s1.startsWith(s2) || s2.startsWith(s1)) && Math.min(s1.length, s2.length) >= 3) return true;
  if (clean1[0] === clean2[0] && clean1[0].length >= 3) return true;
  if (` ${s1} `.includes(` ${s2} `) || ` ${s2} `.includes(` ${s1} `)) return true;
  if (clean1.length > clean2.length && clean1.slice(0, clean2.length).join(' ') === s2) return true;
  if (clean2.length > clean1.length && clean2.slice(0, clean1.length).join(' ') === s1) return true;

  return false;
};

function PrivacyPage({ onBack }) {
  return (
    <div className="legal-root">
      <nav className="hero-nav">
        <span className="nav-logo" onClick={onBack} style={{ cursor: 'pointer' }}>Refloe</span>
        <button className="nav-cta" onClick={onBack}><Icon.ChevronLeft /> Back</button>
      </nav>
      <div className="legal-container">
        <h1>Privacy Policy for Refloe</h1>
        <section>
          <h3>Introduction</h3>
          <p>Refloe provides an AI-powered job application tracking service. We are committed to protecting your personal data and your privacy.</p>
        </section>
        <section>
          <h3>Information We Collect</h3>
          <ul>
            <li><strong>Google User Data:</strong> When you connect your Gmail account, we request access to the <code>https://www.googleapis.com/auth/gmail.readonly</code> scope. This allows our serverless infrastructure to scan your inbox for job-related communications.</li>
            <li><strong>Profile Information:</strong> We collect your name and email address through Google and Microsoft identity services to manage your user account.</li>
          </ul>
        </section>
        <section>
          <h3>How We Use Your Data</h3>
          <ul>
            <li><strong>Automated Tracking:</strong> Our system scans for emails from the last 24 hours (or up to 3 months during initial setup) to detect job application updates.</li>
            <li><strong>AI Analysis:</strong> Relevant email content is processed via the OpenRouter API (using the Step-3.5-flash model) to extract company names, job titles, and application statuses.</li>
            <li><strong>Dashboard Visualization:</strong> Extracted data is stored in Supabase to populate your visual job pipeline.</li>
          </ul>
        </section>
        <section>
          <h3>Data Protection</h3>
          <p>Your data is stored securely using Supabase (PostgreSQL) and processed within AWS Lambda serverless infrastructure. We do not sell your personal information or email data to third parties.</p>
        </section>
        <section>
          <h3>User Rights</h3>
          <p>You may disconnect your email provider or delete your account and associated data at any time through the application settings.</p>
        </section>
      </div>
    </div>
  );
}

function TermsPage({ onBack }) {
  return (
    <div className="legal-root">
      <nav className="hero-nav">
        <span className="nav-logo" onClick={onBack} style={{ cursor: 'pointer' }}>Refloe</span>
        <button className="nav-cta" onClick={onBack}><Icon.ChevronLeft /> Back</button>
      </nav>
      <div className="legal-container">
        <h1>Terms of Service for Refloe</h1>
        <section>
          <h3>Service Description</h3>
          <p>Refloe is an automated tracking tool. By using the service, you authorize Refloe to access your designated email inbox to identify and organize job application data.</p>
        </section>
        <section>
          <h3>User Responsibilities</h3>
          <p>You are responsible for maintaining the security of your account. You must not use Refloe for any illegal activities or to violate the terms of service of your email provider (Google or Microsoft).</p>
        </section>
        <section>
          <h3>Limitations of Liability</h3>
          <p>Refloe uses AI for data extraction. While we strive for accuracy, we are not responsible for any errors in application tracking, missed deadlines, or incorrect status updates generated by the AI engine.</p>
        </section>
        <section>
          <h3>Infrastructure</h3>
          <p>The service relies on third-party providers including AWS, Supabase, and OpenRouter. Service availability is subject to the uptime of these providers.</p>
        </section>
        <section>
          <h3>Modifications</h3>
          <p>We reserve the right to modify these terms or the service at any time. Continued use of Refloe constitutes acceptance of updated terms.</p>
        </section>
      </div>
    </div>
  );
}

function HeroPage({ onGetStarted, onOutlookLogin, onPrivacy, onTerms, loading }) {
  const stats = [
    { value: '2 min', label: 'Average setup' },
    { value: '100%', label: 'Auto-tracked' },
    { value: '0', label: 'Manual entries' },
  ];

  return (
    <div className="hero-root">
      <div className="hero-bg">
        <div className="mesh-blob blob-1" />
        <div className="mesh-blob blob-2" />
        <div className="mesh-blob blob-3" />
        <div className="grid-overlay" />
      </div>

      <nav className="hero-nav">
        <span className="nav-logo">Refloe</span>
        <button className="nav-cta" onClick={onGetStarted} disabled={loading}>
          {loading ? 'Loading…' : 'Get Started'}
          <Icon.ArrowRight />
        </button>
      </nav>

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
          Connect Gmail or Outlook. Let AI do the work. Never lose track of an application again —
          Refloe scans your emails and builds your pipeline automatically.
        </p>

        <div className="hero-cta-group" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
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

            <button className="btn-hero-secondary" onClick={onOutlookLogin} disabled={loading} style={{ backgroundColor: '#2f2f2f', color: 'white', border: '1px solid #444', padding: '0.8rem 1.5rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: '500' }}>
              {loading ? (
                <span className="btn-loading">Verifying…</span>
              ) : (
                <>
                  <span>Sign in with Outlook</span>
                  <Icon.ArrowRight />
                </>
              )}
            </button>
          </div>
          <p className="cta-footnote">Free to use · No credit card required</p>
        </div>

        <div className="stats-row">
          {stats.map(s => (
            <div className="stat-item" key={s.label}>
              <span className="stat-value">{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      <footer className="hero-footer">
        <div className="footer-links">
          <button onClick={onPrivacy} className="footer-link">Privacy Policy</button>
          <button onClick={onTerms} className="footer-link">Terms of Service</button>
        </div>
        <p className="footer-copyright">© 2026 Refloe. All rights reserved.</p>
      </footer>
    </div>
  );
}

function HistoryPage({ onConfirm, loading }) {
  return (
    <div className="hero-root">
      <div className="hero-bg"><div className="grid-overlay" /></div>
      <section className="hero-section">
        <h1 className="hero-headline" style={{ fontSize: '2.5rem' }}>Import your history</h1>
        <p className="hero-sub">How many months of emails should Refloe scan to build your initial pipeline?</p>
        <div className="hero-cta-group" style={{ flexDirection: 'row', gap: '1rem', justifyContent: 'center' }}>
          {[1, 2, 3].map(m => (
            <button key={m} className="btn-hero-primary" onClick={() => onConfirm(m)} disabled={loading} style={{ padding: '1rem 2rem' }}>
              {m} Month{m > 1 ? 's' : ''}
            </button>
          ))}
        </div>
        {loading && <p className="scanning-text" style={{ marginTop: '2rem' }}><Icon.Sparkles /> Preparing your scan...</p>}
      </section>
    </div>
  );
}

function Dashboard({ session, onSignOut, isFetchingEmails }) {
  const [apps, setApps] = useState([]);
  const [loadingDb, setLoadingDb] = useState(true);
  
  // Filtering & Sorting State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'rawDate', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const fetchClassifications = async () => {
    setLoadingDb(true);
    const { data, error: dbError } = await supabase
      .from('ai_classifications')
      .select('*')
      .eq('user_id', session.id)
      .order('applied_date', { ascending: false, nullsFirst: false });

    if (!dbError && data) {
      const companyGroups = [];
      data.forEach(app => {
        const rawName = (app.company_name || 'Unknown').trim();
        const rawDateStr = app.applied_date || app.parsed_date;
        const appDate = rawDateStr ? new Date(rawDateStr) : new Date(0);
        
        const existingGroup = companyGroups.find(g => isSimilarCompany(g.company, rawName));
        
        if (!existingGroup) {
          companyGroups.push({
            id: app.id,
            company: rawName || 'Unknown Company',
            role: app.job_title || 'Position',
            status: app.status?.toLowerCase() || 'applied',
            rawDate: rawDateStr,
            earliestDate: appDate, 
            date: app.applied_date ? new Date(app.applied_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent',
            type: (app.role_type && app.role_type !== 'Unknown') ? app.role_type : 'Full-time',
            stage: app.specific_stage,
            location: app.location,
            salary: app.salary_estimate,
            nextAction: app.next_action,
            deadline: app.action_deadline ? new Date(app.action_deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null,
            summary: app.summary
          });
        } else {
          if (rawName.length < existingGroup.company.length && rawName.length >= 3) {
             existingGroup.company = rawName;
          }
          if (appDate < existingGroup.earliestDate && appDate.getTime() > 0) {
            existingGroup.earliestDate = appDate;
          }
          if ((!existingGroup.role || existingGroup.role === 'Position' || existingGroup.role === 'Unknown') && app.job_title && app.job_title !== 'Unknown') {
            existingGroup.role = app.job_title;
          }
          if ((!existingGroup.type || existingGroup.type === 'Full-time') && app.role_type && app.role_type !== 'Unknown') {
            existingGroup.type = app.role_type;
          }
          if (!existingGroup.location && app.location) {
            existingGroup.location = app.location;
          }
          if (!existingGroup.salary && app.salary_estimate) {
            existingGroup.salary = app.salary_estimate;
          }
          if (!existingGroup.summary && app.summary) {
            existingGroup.summary = app.summary;
          }
          if (!existingGroup.stage && app.specific_stage) {
            existingGroup.stage = app.specific_stage;
          }
        }
      });
      
      setApps(companyGroups);
    }
    setLoadingDb(false);
  };

  useEffect(() => {
    if (!session || !session.id) {
      setLoadingDb(false);
      return;
    }

    let isMounted = true;
    fetchClassifications();

    const channel = supabase
      .channel('db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ai_classifications', filter: `user_id=eq.${session.id}` },
        () => {
          if (isMounted) fetchClassifications();
        }
      ).subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [session?.id]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const { stats, statusData, roleData, timelineData, radarData, topTitlesData, actionItems, paginatedApps, totalPages } = useMemo(() => {
    const active = apps.filter(a => ['interview', 'interviewing'].includes(a.status));
    const offers = apps.filter(a => a.status === 'offer');
    
    const interviewRate = apps.length > 0 ? Math.round((active.length / apps.length) * 100) : 0;
    const offerRate = apps.length > 0 ? Math.round((offers.length / apps.length) * 100) : 0;
    
    const statusD = [
      { name: 'Applied', count: apps.filter(a => a.status === 'applied').length, color: '#60a5fa' },
      { name: 'Interview', count: active.length, color: '#a78bfa' },
      { name: 'Offer', count: offers.length, color: '#34d399' },
      { name: 'Rejected', count: apps.filter(a => a.status === 'rejected').length, color: '#f87171' }
    ];

    const rolesMap = {};
    apps.forEach(a => {
      const type = (a.type && a.type !== 'Unknown') ? a.type : 'Full-time';
      rolesMap[type] = (rolesMap[type] || 0) + 1;
    });
    const roleD = Object.keys(rolesMap).map((k, i) => ({ name: k, value: rolesMap[k], color: PIE_COLORS[i % PIE_COLORS.length] }));

    const timeMap = {};
    apps.forEach(a => {
      const d = a.earliestDate; 
      if (d && !isNaN(d.getTime()) && d.getTime() > 0) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!timeMap[key]) {
          timeMap[key] = { name: label, applications: 0, sortKey: key };
        }
        timeMap[key].applications++;
      }
    });
    const timeD = Object.values(timeMap).sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    // Generic Role Archetypes Map
    const radarMap = { 
      'Engineering & IT': 0, 
      'Sales & Marketing': 0, 
      'Mgmt & Product': 0, 
      'Design & Creative': 0, 
      'Finance & Admin': 0, 
      'Ops & Support': 0 
    };

    apps.forEach(a => {
      const t = (a.role || '').toLowerCase();
      if (/(engineer|developer|data|ai|machine|software|it\b|cloud|tech|backend|frontend|web|system|network)/.test(t)) radarMap['Engineering & IT']++;
      else if (/(sales|marketing|account|growth|sdr|bdr|ae|brand|seo|social|market)/.test(t)) radarMap['Sales & Marketing']++;
      else if (/(manager|product|strategy|director|vp|head|chief|consultant|president|founder)/.test(t)) radarMap['Mgmt & Product']++;
      else if (/(design|ux|ui|content|creative|writer|art|video|media|copy)/.test(t)) radarMap['Design & Creative']++;
      else if (/(finance|account|hr|legal|admin|talent|recruiter|financial|tax|audit|counsel)/.test(t)) radarMap['Finance & Admin']++;
      else radarMap['Ops & Support']++;
    });
    
    let maxRadar = 1;
    Object.values(radarMap).forEach(v => { if (v > maxRadar) maxRadar = v; });
    const radarD = Object.keys(radarMap).map(k => ({ subject: k, count: radarMap[k], fullMark: maxRadar }));

    const titleMap = {};
    apps.forEach(a => {
      let title = a.role || 'Unknown';
      if (title.length > 18) title = title.substring(0, 18) + '...';
      titleMap[title] = (titleMap[title] || 0) + 1;
    });
    const topTitlesD = Object.keys(titleMap)
      .map(k => ({ name: k, count: titleMap[k] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const topActionItems = apps
      .filter(a => {
        if (!a.nextAction || a.nextAction.toLowerCase().includes("continue job search")) return false;
        const appDate = new Date(a.rawDate || 0);
        return appDate >= sevenDaysAgo;
      })
      .sort((a, b) => new Date(b.rawDate || 0) - new Date(a.rawDate || 0))
      .slice(0, 8);

    let processedApps = [...apps];

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      processedApps = processedApps.filter(app => 
        (app.company && app.company.toLowerCase().includes(lower)) ||
        (app.role && app.role.toLowerCase().includes(lower)) ||
        (app.location && app.location.toLowerCase().includes(lower)) ||
        (app.status && app.status.toLowerCase().includes(lower))
      );
    }

    processedApps.sort((a, b) => {
      if (!sortConfig.key) return 0;
      
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];

      if (sortConfig.key === 'rawDate') {
        valA = new Date(valA || 0).getTime();
        valB = new Date(valB || 0).getTime();
      } else {
        valA = (valA || '').toString().toLowerCase();
        valB = (valB || '').toString().toLowerCase();
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginated = processedApps.slice(startIdx, startIdx + ITEMS_PER_PAGE);
    const totalP = Math.max(1, Math.ceil(processedApps.length / ITEMS_PER_PAGE));

    return {
      stats: { total: apps.length, active: active.length, interviewRate, offerRate },
      statusData: statusD,
      roleData: roleD,
      timelineData: timeD,
      radarData: radarD,
      topTitlesData: topTitlesD,
      actionItems: topActionItems,
      paginatedApps: paginated,
      totalPages: totalP
    };
  }, [apps, currentPage, searchTerm, sortConfig]);

  const handleShare = async () => {
    const element = document.getElementById('shareable-dashboard');
    const canvas = await html2canvas(element, { backgroundColor: '#0d1220', scale: 2 });
    const link = document.createElement('a');
    link.download = 'refloe-production-dashboard.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="dash-root">
      <main className="dash-main">
        <header className="dash-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="dash-title">Application Dashboard</h1>
            <p className="dash-sub">
              {isFetchingEmails ? <span className="scanning-text"><Icon.Sparkles /> AI is scanning your history...</span> : `${stats.total} unique companies tracked`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="nav-cta share-btn" onClick={handleShare}>
              <Icon.TrendingUp /> Export Report
            </button>
            <button className="nav-cta" onClick={onSignOut}>
              <Icon.LogOut /> Sign Out
            </button>
          </div>
        </header>

        {loadingDb ? (
          <div className="loading-state">Aggregating pipeline metrics...</div>
        ) : apps.length === 0 ? (
          <div className="empty-state">
            <Icon.Inbox />
            <h2>Awaiting Data Ingestion</h2>
          </div>
        ) : (
          <div className="pipeline-view" id="shareable-dashboard" style={{ padding: '1.5rem', borderRadius: '1rem', background: 'var(--bg)' }}>
            
            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-icon" style={{ background: 'rgba(96, 165, 250, 0.15)', color: '#60a5fa' }}><Icon.Briefcase /></div>
                <div className="kpi-data">
                  <span className="kpi-label">Total Applications</span>
                  <span className="kpi-val">{stats.total}</span>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon" style={{ background: 'rgba(167, 139, 250, 0.15)', color: '#a78bfa' }}><Icon.TrendingUp /></div>
                <div className="kpi-data">
                  <span className="kpi-label">Active Processes</span>
                  <span className="kpi-val">{stats.active}</span>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}><Icon.Target /></div>
                <div className="kpi-data">
                  <span className="kpi-label">Interview Rate</span>
                  <span className="kpi-val">{stats.interviewRate}%</span>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon" style={{ background: 'rgba(52, 211, 153, 0.15)', color: '#34d399' }}><Icon.CheckCircle /></div>
                <div className="kpi-data">
                  <span className="kpi-label">Offer Rate</span>
                  <span className="kpi-val">{stats.offerRate}%</span>
                </div>
              </div>
            </div>

            <div className="analytics-grid-prod">
              <div className="chart-container-prod">
                <h3 className="chart-title">Pipeline Funnel</h3>
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={statusData} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={85} tick={{fill: '#9ca3af', fontSize: 13}} />
                      <Tooltip content={<CustomColorTooltip />} cursor={{fill: 'rgba(255,255,255,0.03)'}} />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={28}>
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="chart-container-prod">
                <h3 className="chart-title">Role Distribution</h3>
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={roleData} cx="50%" cy="45%" innerRadius={65} outerRadius={85} paddingAngle={5} dataKey="value">
                        {roleData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px' }} itemStyle={{ color: '#f0f4ff' }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '13px', color: '#9ca3af', paddingTop: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="chart-container-prod">
                <h3 className="chart-title">Role Archetypes</h3>
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height={260}>
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                      <PolarGrid stroke="#374151" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                      <Radar name="Applications" dataKey="count" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.4} />
                      <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px' }} itemStyle={{ color: '#f0f4ff' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
                            

              <div className="chart-container-prod span-full">
                <h3 className="chart-title">Application Volume Over Time</h3>
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={timelineData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} minTickGap={20} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dx={-10} allowDecimals={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px' }} itemStyle={{ color: '#f0f4ff' }} />
                      <Area type="monotone" dataKey="applications" stroke="#60a5fa" strokeWidth={3} fillOpacity={1} fill="url(#colorApps)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {actionItems.length > 0 && (
              <div className="action-panel-prod">
                <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: '#fff' }}>
                  <Icon.AlertCircle /> Critical Action Items (Past 7 Days)
                </h3>
                <div className="action-grid">
                  {actionItems.map(item => (
                    <div className="action-item" key={item.id}>
                      <div className="action-item-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="action-company">{item.company}</span>
                        </div>
                        {item.deadline && <span className="action-date"><Icon.Calendar /> {item.deadline}</span>}
                      </div>
                      <p className="action-desc">{item.nextAction}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="table-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 className="chart-title" style={{ marginBottom: 0 }}>Application Master Log</h3>
                <div className="search-box">
                  <Icon.Search />
                  <input 
                    type="text" 
                    placeholder="Search roles, companies..." 
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1); 
                    }}
                  />
                </div>
              </div>
              
              <div className="table-container">
                <table className="prod-table">
                  <thead>
                    <tr>
                      <th onClick={() => handleSort('company')} className="sortable-th">
                        <div className="th-content">Company {sortConfig.key === 'company' && (sortConfig.direction === 'asc' ? <Icon.ChevronUp /> : <Icon.ChevronDown />)}</div>
                      </th>
                      <th onClick={() => handleSort('role')} className="sortable-th">
                        <div className="th-content">Role {sortConfig.key === 'role' && (sortConfig.direction === 'asc' ? <Icon.ChevronUp /> : <Icon.ChevronDown />)}</div>
                      </th>
                      <th onClick={() => handleSort('status')} className="sortable-th">
                        <div className="th-content">Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? <Icon.ChevronUp /> : <Icon.ChevronDown />)}</div>
                      </th>
                      <th onClick={() => handleSort('rawDate')} className="sortable-th">
                        <div className="th-content">Date {sortConfig.key === 'rawDate' && (sortConfig.direction === 'asc' ? <Icon.ChevronUp /> : <Icon.ChevronDown />)}</div>
                      </th>
                      <th onClick={() => handleSort('location')} className="sortable-th">
                        <div className="th-content">Location {sortConfig.key === 'location' && (sortConfig.direction === 'asc' ? <Icon.ChevronUp /> : <Icon.ChevronDown />)}</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedApps.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                          No applications found matching your search.
                        </td>
                      </tr>
                    ) : (
                      paginatedApps.map(app => {
                        const config = STATUS_CONFIG[app.status] || STATUS_CONFIG.applied;
                        return (
                          <tr key={app.id}>
                            <td className="font-medium text-white">{app.company}</td>
                            <td>
                              <div className="cell-flex-col">
                                <span>{app.role}</span>
                                <span className="sub-text">{app.type}</span>
                              </div>
                            </td>
                            <td>
                              <span className="status-badge-sm" style={{ backgroundColor: config.bg, color: config.color }}>
                                {config.label} {app.stage && `• ${app.stage}`}
                              </span>
                            </td>
                            <td className="sub-text">{app.date}</td>
                            <td className="sub-text">{app.location || '-'}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              
              {totalPages > 1 && (
                <div className="pagination">
                  <span className="page-info">Page {currentPage} of {totalPages}</span>
                  <div className="page-controls">
                    <button 
                      disabled={currentPage === 1} 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className="page-btn"
                    >
                      <Icon.ChevronLeft />
                    </button>
                    <button 
                      disabled={currentPage === totalPages} 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className="page-btn"
                    >
                      <Icon.ChevronRight />
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="watermark" style={{ display: 'none', textAlign: 'center', marginTop: '2rem', color: '#4f8ef7', fontWeight: 'bold' }}>
              Production Report - Generated by Refloe
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem('Refloe_profile');
    return saved ? JSON.parse(saved) : null;
  });
  const [legalView, setLegalView] = useState(null);
  const [tempAuth, setTempAuth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isFetchingEmails, setIsFetchingEmails] = useState(false);

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
              body: { code: response.code, action: 'google-login' }
            });
            
            if (funcError || data?.error) throw new Error(funcError?.message || data?.error);

            if (data.is_new_user) {
              setTempAuth(data);
            } else {
              if (data.session) {
                await supabase.auth.setSession({
                  access_token: data.session.access_token,
                  refresh_token: data.session.refresh_token
                });
              }
              setSession(data.user);
              localStorage.setItem('Refloe_profile', JSON.stringify(data.user));
            }

          } catch (err) {
            console.error("Auth Error:", err.message);
          } finally {
            setLoading(false);
          }
        }
      },
    });
    client.requestCode();
  };

  const handleOutlookLogin = () => {
    const client_id = import.meta.env.VITE_MICROSOFT_CLIENT_ID;
    const redirect_uri = import.meta.env.VITE_REDIRECT_URI;
    
    if (!client_id || !redirect_uri) {
      console.error("Missing Microsoft Client ID or Redirect URI in environment variables.");
      alert("Configuration Error: Missing Client ID or Redirect URI.");
      return;
    }

    const encoded_redirect = encodeURIComponent(redirect_uri);
    const scope = encodeURIComponent("openid profile email Mail.Read offline_access");
  
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${client_id}&response_type=code&redirect_uri=${encoded_redirect}&response_mode=query&scope=${scope}&prompt=consent`;
    const width = 600, height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(authUrl, "outlook_login", `width=${width},height=${height},left=${left},top=${top}`);
    
    if (!popup) {
      alert("Popup blocked. Please allow popups for this site.");
      return;
    }

    setLoading(true);

    const checkPayload = setInterval(async () => {
      try {
        if (popup.closed) {
          clearInterval(checkPayload);
          setLoading(false);
          return;
        }

        const currentUrl = popup.location.href;
        
        if (currentUrl && (currentUrl.includes("code=") || currentUrl.includes("error="))) {
          const codeMatch = currentUrl.match(/code=([^&]+)/);
          const errorMatch = currentUrl.match(/error=([^&]+)/);
          const errorDescMatch = currentUrl.match(/error_description=([^&]+)/);
          
          const code = codeMatch ? decodeURIComponent(codeMatch[1]) : null;
          const error = errorMatch ? decodeURIComponent(errorMatch[1]) : null;
          const errorDesc = errorDescMatch ? decodeURIComponent(errorDescMatch[1].replace(/\+/g, ' ')) : 'No description';
          
          popup.close();
          clearInterval(checkPayload);

          if (error) {
            console.error("Microsoft Auth Error:", error, errorDesc);
            alert(`Microsoft Sign-In Error: ${errorDesc}`);
            setLoading(false);
            return;
          }

          if (code) {
            const { data, error: funcError } = await supabase.functions.invoke('auth-handler', {
              body: { code, action: 'outlook-login' }
            });
            
            if (funcError || data?.error) {
              console.error("Auth Error:", funcError?.message || data?.error);
              setLoading(false);
              return;
            }

            if (data.is_new_user) {
              setTempAuth(data);
            } else {
              if (data.session) {
                await supabase.auth.setSession({
                  access_token: data.session.access_token,
                  refresh_token: data.session.refresh_token
                });
              }
              setSession(data.user);
              localStorage.setItem('Refloe_profile', JSON.stringify(data.user));
            }
            setLoading(false);
          }
        }
      } catch (e) { 
      }
    }, 500);
  };

  const handleConfirmHistory = async (months) => {
    setLoading(true);
    setIsFetchingEmails(true); 

    try {
      if (tempAuth.session) {
        await supabase.auth.setSession({
          access_token: tempAuth.session.access_token,
          refresh_token: tempAuth.session.refresh_token
        });
      }

      const activeUser = tempAuth.user;
      setSession(activeUser);
      localStorage.setItem('Refloe_profile', JSON.stringify(activeUser));
      setTempAuth(null); 
      setLoading(false); 
      
      supabase.functions.invoke('auth-handler', {
        body: { 
          action: 'trigger-scan', 
          userId: activeUser.id, 
          months: months 
        }
      }).then(({ error: scanError }) => {
          if (scanError) console.error("Background Scan Error:", scanError);
      }).catch(err => {
          console.error("Background scan invocation failed:", err);
      }).finally(() => {
          setIsFetchingEmails(false); 
      });

    } catch (err) {
      console.error("History Selection Error:", err.message);
      setLoading(false);
      setIsFetchingEmails(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('Refloe_profile');
    setSession(null);
    setTempAuth(null);
  };

  if (legalView === 'privacy') return <PrivacyPage onBack={() => setLegalView(null)} />;
  if (legalView === 'terms') return <TermsPage onBack={() => setLegalView(null)} />;

  if (session) {
    return (
      <Dashboard 
        session={session} 
        onSignOut={handleSignOut} 
        isFetchingEmails={isFetchingEmails} 
      />
    );
  }

  if (tempAuth) {
    return (
      <HistoryPage 
        onConfirm={handleConfirmHistory} 
        loading={loading} 
      />
    );
  }

  return (
    <HeroPage 
      onGetStarted={handleGetStarted} 
      onOutlookLogin={handleOutlookLogin}
      onPrivacy={() => setLegalView('privacy')}
      onTerms={() => setLegalView('terms')}
      loading={loading} 
    />
  );
}