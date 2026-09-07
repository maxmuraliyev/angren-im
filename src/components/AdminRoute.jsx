import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../supabase';

/**
 * Checks if an authenticated Supabase user has admin access.
 * If VITE_ADMIN_EMAILS is provided in .env (comma-separated), restricts to those emails.
 * Otherwise, any user created in the private Supabase Dashboard is authorized.
 */
export function isUserAdmin(user) {
  if (!user || !user.email) return false;
  const userEmail = user.email.trim().toLowerCase();

  const envEmails = import.meta.env.VITE_ADMIN_EMAILS
    ? import.meta.env.VITE_ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
    : [];

  // If specific admin emails are defined in .env, enforce that list
  if (envEmails.length > 0) {
    return envEmails.includes(userEmail) || userEmail === 'angrenimuz@gmail.com';
  }

  // Secure default-deny: only the primary admin email is permitted if no env whitelist is configured
  return userEmail === 'angrenimuz@gmail.com';
}

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
      if (user && isUserAdmin(user)) {
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
        if (user && isUserAdmin(user)) {
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
