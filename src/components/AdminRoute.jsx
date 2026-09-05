import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../supabase';

/**
 * Security: Admin email whitelist.
 * Only users whose email is in this list can access the admin panel.
 * Move this to an environment variable or Supabase app_metadata for scalability.
 */
const ADMIN_EMAILS = [
  'angrenimuz@gmail.com',
  // Add other admin emails here
];

export default function AdminRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!supabase) {
      console.error("Supabase is not initialized.");
      setLoading(false);
      return;
    }

    // Check initial session AND verify admin role
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null;
      if (user && ADMIN_EMAILS.includes(user.email?.toLowerCase())) {
        setAuthorized(true);
      } else {
        setAuthorized(false);
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const user = session?.user ?? null;
        if (user && ADMIN_EMAILS.includes(user.email?.toLowerCase())) {
          setAuthorized(true);
        } else {
          setAuthorized(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  if (!authorized) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
