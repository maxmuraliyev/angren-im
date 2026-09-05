import React, { useState, useRef } from 'react';
import { supabase } from '../../supabase';
import { useNavigate } from 'react-router-dom';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 1000; // 1 minute lockout after MAX_ATTEMPTS

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Rate limiting state (persists across re-renders but not page reloads)
  const attemptsRef = useRef(0);
  const lockoutUntilRef = useRef(0);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!supabase) {
      setError("Supabase auth is not configured.");
      return;
    }

    // Security: Check lockout
    const now = Date.now();
    if (lockoutUntilRef.current > now) {
      const remainingSec = Math.ceil((lockoutUntilRef.current - now) / 1000);
      setError(`Juda ko'p urinish. ${remainingSec} soniyadan so'ng qayta urinib ko'ring.`);
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) throw error;
      
      // Success: reset attempts
      attemptsRef.current = 0;
      lockoutUntilRef.current = 0;
      navigate('/admin/dashboard');
    } catch (err) {
      // Security: Increment attempts and check for lockout
      attemptsRef.current += 1;

      if (attemptsRef.current >= MAX_ATTEMPTS) {
        lockoutUntilRef.current = Date.now() + LOCKOUT_DURATION_MS;
        attemptsRef.current = 0; // Reset counter, lockout timer handles the rest
        setError(`Juda ko'p muvaffaqiyatsiz urinish. 1 daqiqa kutib, qayta urinib ko'ring.`);
      } else {
        const remaining = MAX_ATTEMPTS - attemptsRef.current;
        // Security: Generic error message to prevent account enumeration
        setError(`Login yoki parol noto'g'ri. ${remaining} ta urinish qoldi.`);
      }

      console.error("Login failed"); // Don't log the actual error to console in production
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f4f7f6' }}>
      <div style={{ padding: '2rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Admin Login</h2>
        {error && <div style={{ color: '#991b1b', backgroundColor: '#fee2e2', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>{error}</div>}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
              required
              autoComplete="current-password"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              marginTop: '1rem', 
              padding: '0.75rem', 
              backgroundColor: '#0056b3', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: loading ? 'not-allowed' : 'pointer' 
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
