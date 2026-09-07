import React, { useState } from 'react';
import { supabase } from '../../supabase';
import { useNavigate } from 'react-router-dom';
import { isUserAdmin } from '../../components/AdminRoute';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 1000; // 1 minute lockout after MAX_ATTEMPTS
const STORAGE_KEY_ATTEMPTS = '_admin_login_attempts';
const STORAGE_KEY_LOCKOUT = '_admin_lockout_until';

function getStoredAttempts() {
  try {
    const val = parseInt(sessionStorage.getItem(STORAGE_KEY_ATTEMPTS) || '0', 10);
    return isNaN(val) ? 0 : val;
  } catch {
    return 0;
  }
}

function getStoredLockout() {
  try {
    const val = parseInt(sessionStorage.getItem(STORAGE_KEY_LOCKOUT) || '0', 10);
    return isNaN(val) ? 0 : val;
  } catch {
    return 0;
  }
}

function setStoredAttempts(attempts) {
  try {
    sessionStorage.setItem(STORAGE_KEY_ATTEMPTS, String(attempts));
  } catch {}
}

function setStoredLockout(timestamp) {
  try {
    sessionStorage.setItem(STORAGE_KEY_LOCKOUT, String(timestamp));
  } catch {}
}

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!supabase) {
      setError("Supabase auth is not configured.");
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Email va parolni kiriting.");
      return;
    }

    if (trimmedEmail.length > 100 || password.length > 128) {
      setError("Kiritilgan ma'lumotlar uzunligi ruxsat etilgan me'yordan oshdi.");
      return;
    }

    // Security: Check persistent lockout
    const now = Date.now();
    const lockoutUntil = getStoredLockout();
    if (lockoutUntil > now) {
      const remainingSec = Math.ceil((lockoutUntil - now) / 1000);
      setError(`Juda ko'p urinish. ${remainingSec} soniyadan so'ng qayta urinib ko'ring.`);
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: password,
      });

      if (error) throw error;

      // Verify admin authorization
      if (data?.user && !isUserAdmin(data.user)) {
        await supabase.auth.signOut();
        setError(`Ushbu email (${data.user.email}) admin ro'yxatida yo'q. Faqat admin huquqi berilgan email orqali kirish mumkin.`);
        return;
      }
      
      // Success: reset attempts & lockout
      setStoredAttempts(0);
      setStoredLockout(0);
      navigate('/admin/dashboard');
    } catch (err) {
      console.error("Login failed:", err);

      const nextAttempts = getStoredAttempts() + 1;

      if (nextAttempts >= MAX_ATTEMPTS) {
        setStoredLockout(Date.now() + LOCKOUT_DURATION_MS);
        setStoredAttempts(0);
        setError(`Juda ko'p muvaffaqiyatsiz urinish. 1 daqiqa kutib, qayta urinib ko'ring.`);
      } else {
        setStoredAttempts(nextAttempts);
        const remaining = MAX_ATTEMPTS - nextAttempts;
        const msg = err.message || '';

        if (msg.toLowerCase().includes('email not confirmed')) {
          setError(`Email hali tasdiqlanmagan (Email not confirmed). Supabase Dashboard -> Authentication -> Users bo'limida foydalanuvchi qatoridagi uchta nuqtani (...) bosib "Confirm user" tugmasini bosing.`);
        } else if (msg.toLowerCase().includes('invalid login credentials')) {
          setError(`Login yoki parol noto'g'ri. (${remaining} ta urinish qoldi)`);
        } else {
          setError(`${msg || "Kirishda xatolik yuz berdi"}. (${remaining} ta urinish qoldi)`);
        }
      }
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
              maxLength={100}
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
              maxLength={128}
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
