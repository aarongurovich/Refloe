import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './App.css';

export default function App() {
  const [session, setSession] = useState(() => {
    // Only store non-sensitive profile data (name, email, avatar) in localStorage
    const saved = localStorage.getItem('trackr_profile');
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
      // Supabase invoke will now receive the Set-Cookie header from the server
      const { data, error: funcError } = await supabase.functions.invoke('auth-handler', {
        body: { idToken: response.credential, action: 'google-login' }
      });

      if (funcError) throw new Error(funcError.message);
      if (data?.error) throw new Error(data.error);

      // Save user profile data ONLY. The sessionToken is handled as an HttpOnly cookie by the browser.
      const profileData = { ...data.user };
      localStorage.setItem('trackr_profile', JSON.stringify(profileData));
      setSession(profileData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    // Clear profile from storage
    localStorage.removeItem('trackr_profile');
    setSession(null);
    // Note: To clear the HttpOnly cookie, you should call a backend 'logout' function
    // that returns a Set-Cookie header with an expired date.
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