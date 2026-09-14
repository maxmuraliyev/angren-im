import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

// In-memory sliding window rate limiter per IP to avoid spam
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_LOGS_PER_MINUTE = 15;
const ipLogHistory = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  if (ipLogHistory.size > 1000) {
    for (const [key, timestamps] of ipLogHistory.entries()) {
      const valid = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
      if (valid.length === 0) ipLogHistory.delete(key);
      else ipLogHistory.set(key, valid);
    }
  }

  const timestamps = ipLogHistory.get(ip) || [];
  const recent = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);

  if (recent.length >= MAX_LOGS_PER_MINUTE) {
    return true;
  }

  recent.push(now);
  ipLogHistory.set(ip, recent);
  return false;
}

export default async function handler(req, res) {
  // CORS & method check
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Extract client IP
  const forwardedFor = req.headers['x-forwarded-for'];
  const clientIp = (forwardedFor ? forwardedFor.split(',')[0].trim() : null) ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    '127.0.0.1';

  if (isRateLimited(clientIp)) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  const body = req.body || {};
  const {
    deviceType,
    browser,
    os,
    userAgent,
    screenResolution,
    language,
    visitedUrl,
    referrer,
  } = body;

  // Ignore admin page visits from public stats
  if (visitedUrl && visitedUrl.startsWith('/admin')) {
    return res.status(200).json({ skipped: true, reason: 'Admin path ignored' });
  }

  // Geolocation from Vercel headers or body fallback
  const vercelCountry = req.headers['x-vercel-ip-country'] || null;
  const vercelCity = req.headers['x-vercel-ip-city'] ? decodeURIComponent(req.headers['x-vercel-ip-city']) : null;

  const country = vercelCountry || body.country || null;
  const city = vercelCity || body.city || null;

  const logEntry = {
    ip_address: clientIp,
    device_type: deviceType ? String(deviceType).slice(0, 50) : 'Desktop',
    browser: browser ? String(browser).slice(0, 100) : 'Unknown',
    os: os ? String(os).slice(0, 100) : 'Unknown',
    user_agent: userAgent ? String(userAgent).slice(0, 500) : null,
    screen_resolution: screenResolution ? String(screenResolution).slice(0, 50) : null,
    language: language ? String(language).slice(0, 30) : null,
    visited_url: visitedUrl ? String(visitedUrl).slice(0, 300) : '/',
    referrer: referrer ? String(referrer).slice(0, 200) : 'Direct',
    country: country ? String(country).slice(0, 100) : null,
    city: city ? String(city).slice(0, 100) : null,
  };

  if (!supabase) {
    return res.status(200).json({ success: false, warning: 'Supabase credentials missing', entry: logEntry });
  }

  try {
    const { error } = await supabase.from('visitor_logs').insert([logEntry]);
    if (error) {
      console.error('Error inserting visitor log into Supabase:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true, ip: clientIp });
  } catch (err) {
    console.error('Visitor tracking exception:', err);
    return res.status(500).json({ error: err.message });
  }
}
