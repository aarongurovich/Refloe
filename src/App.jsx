// src/App.jsx
import { useState } from 'react';
import { supabase } from './supabaseClient';
import './App.css';

export default function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    const action = isLogin ? 'login' : 'signup';

    try {
      // Calling the Edge Function. The ANON_KEY is used only as a router/identifier.
      const { data, error: funcError } = await supabase.functions.invoke('auth-handler', {
        body: { email, password, action }
      });

      if (funcError) throw new Error(funcError.message);
      if (data?.error) throw new Error(data.error);

      setSession({ user: data.user });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (session) {
    return (
      <div className="app-container">
        <div className="glass-panel">
          <div className="header">
            <h1 className="logo-text">TRACKR Dashboard</h1>
          </div>
          <p style={{ textAlign: 'center', marginBottom: '1rem' }}>
            Logged in as: {session.user.email}
          </p>
          <button className="btn-primary" onClick={() => setSession(null)}>
            Sign Out
          </button>
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
          <h2>{isLogin ? 'Welcome back' : 'Create an account'}</h2>
          <p className="subtitle">
            {isLogin ? 'Enter your details to access your dashboard.' : 'Start tracking your job applications today.'}
          </p>
        </div>
        
        <form className="auth-form" onSubmit={handleAuth}>
          {error && <div style={{ color: '#ef4444', fontSize: '0.875rem', textAlign: 'center', padding: '10px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>{error}</div>}
          
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input 
              id="email" 
              type="email" 
              placeholder="name@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input 
              id="password" 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          {!isLogin && (
            <div className="input-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input 
                id="confirmPassword" 
                type="password" 
                placeholder="••••••••" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required 
              />
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="divider">
          <span>or</span>
        </div>

        <p className="toggle-prompt">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button type="button" className="btn-link" onClick={() => { setIsLogin(!isLogin); setError(null); }}>
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
}