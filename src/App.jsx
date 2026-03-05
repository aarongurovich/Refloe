import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './App.css';

export default function App() {
  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem('trackr_session');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    /* global google */
    const initializeGoogle = () => {
      if (!session && window.google) {
        google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleGoogleSignIn,
        });

        google.accounts.id.renderButton(
          document.getElementById("googleBtn"),
          { theme: "outline", size: "large", width: "100%", shape: "pill" }
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

      // Save user data and the secure JWT session token
      const sessionData = { ...data.user, sessionToken: data.sessionToken };
      localStorage.setItem('trackr_session', JSON.stringify(sessionData));
      setSession(sessionData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('trackr_session');
    setSession(null);
  };

  if (session) {
    return (
      <div className="app-container">
        <div className="glass-panel">
          <div className="header">
            <div className="logo-mark"></div>
            <h1 className="logo-text">TRACKR</h1>
          </div>
          <div className="profile-section">
            {session.avatar_url && (
              <img src={session.avatar_url} alt="Profile" className="avatar" />
            )}
            <p className="user-name">Welcome, {session.full_name || 'User'}</p>
            <p className="subtitle">{session.email}</p>
          </div>
          <button className="btn-primary" onClick={handleSignOut}>Sign Out</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="glass-panel">
        <div className="header">
          <div className="logo-mark"></div>
          <h1 className="logo-text">TRACKR</h1>
        </div>
        <div className="form-header">
          <h2>Sign In</h2>
          <p className="subtitle">Securely access your dashboard using Google.</p>
        </div>
        {error && <div className="error-box">{error}</div>}
        <div id="googleBtn"></div>
        {loading && <p className="loading-text">Verifying account...</p>}
      </div>
    </div>
  );
}