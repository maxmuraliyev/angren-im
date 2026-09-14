import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { detectDevice } from '../utils/deviceDetector';
import { supabase } from '../supabase';

const THROTTLE_MS = 2 * 60 * 1000; // 2 minutes throttle for the same page in the same session

export function useVisitorTracker() {
  const location = useLocation();

  useEffect(() => {
    // 1. Never track admin routes
    if (location.pathname.startsWith('/admin')) {
      return;
    }

    // 2. Prevent rapid duplicate logging for the same path
    const now = Date.now();
    const storageKey = `visited_${location.pathname}`;
    const lastVisit = sessionStorage.getItem(storageKey);

    if (lastVisit && now - parseInt(lastVisit, 10) < THROTTLE_MS) {
      return;
    }

    sessionStorage.setItem(storageKey, String(now));

    // 3. Collect device metadata
    const deviceInfo = detectDevice();
    const payload = {
      deviceType: deviceInfo.deviceType,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      userAgent: deviceInfo.userAgent,
      screenResolution: deviceInfo.screenResolution,
      language: deviceInfo.language,
      visitedUrl: location.pathname,
      referrer: deviceInfo.referrer,
    };

    const recordVisit = async () => {
      try {
        // Attempt primary path: serverless API route (captures real server-side IP)
        const response = await fetch('/api/track-visit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          return;
        }
      } catch {
        // Fall through to client fallback (e.g. in local Vite development)
      }

      // Client Fallback: If /api/track-visit is unavailable (e.g. local dev),
      // fetch public IP via ipapi and insert directly into Supabase.
      try {
        let clientIp = '127.0.0.1';
        let country = null;
        let city = null;

        try {
          const ipRes = await fetch('https://ipapi.co/json/');
          if (ipRes.ok) {
            const ipData = await ipRes.json();
            clientIp = ipData.ip || '127.0.0.1';
            country = ipData.country_name || null;
            city = ipData.city || null;
          }
        } catch {
          // If ipapi is unreachable or blocked by adblock, proceed with fallback IP
        }

        if (supabase) {
          await supabase.from('visitor_logs').insert([
            {
              ip_address: clientIp,
              device_type: payload.deviceType,
              browser: payload.browser,
              os: payload.os,
              user_agent: payload.userAgent,
              screen_resolution: payload.screenResolution,
              language: payload.language,
              visited_url: payload.visitedUrl,
              referrer: payload.referrer,
              country,
              city,
            },
          ]);
        }
      } catch (err) {
        // Silent error - user experience should never be interrupted
        console.debug('Visitor tracking note:', err?.message);
      }
    };

    // Run asynchronously
    recordVisit();
  }, [location.pathname]);
}
