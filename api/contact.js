// Sliding-window in-memory rate limiter per IP
// Window: 10 minutes (600,000 ms), Max 5 requests per IP
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;
const ipRequestHistory = new Map();

// Periodic cleanup of expired rate limit entries
function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [ip, timestamps] of ipRequestHistory.entries()) {
    const validTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
    if (validTimestamps.length === 0) {
      ipRequestHistory.delete(ip);
    } else {
      ipRequestHistory.set(ip, validTimestamps);
    }
  }
}

function isRateLimited(ip) {
  const now = Date.now();
  if (ipRequestHistory.size > 500) {
    cleanupRateLimitStore();
  }

  const timestamps = ipRequestHistory.get(ip) || [];
  const recentTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);

  if (recentTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  recentTimestamps.push(now);
  ipRequestHistory.set(ip, recentTimestamps);
  return false;
}

const ALLOWED_ORIGINS = [
  'https://angren-im.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Verify Content-Type
  const contentType = req.headers['content-type'] || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return res.status(415).json({ error: 'Unsupported Media Type: application/json required' });
  }

  // Verify Origin / Referer if present
  const origin = req.headers['origin'];
  const configuredOrigin = process.env.ALLOWED_ORIGIN?.replace(/\/$/, '');
  if (origin) {
    const isAllowed = ALLOWED_ORIGINS.includes(origin) || (configuredOrigin && origin === configuredOrigin);
    if (!isAllowed) {
      return res.status(403).json({ error: 'Forbidden: invalid origin' });
    }
  }

  // Rate limiting by client IP
  const forwardedFor = req.headers['x-forwarded-for'];
  const clientIp = (forwardedFor ? forwardedFor.split(',')[0].trim() : null) ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    '127.0.0.1';

  if (isRateLimited(clientIp)) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({ error: "Juda ko'p so'rov yuborildi. Iltimos, 10 daqiqadan so'ng qayta urinib ko'ring." });
  }

  // Body structure validation
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({ error: 'Invalid JSON body structure' });
  }

  const { name, contact, subject, message } = req.body;

  // Existence check
  if (!name || !contact || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Type validation and length bounds
  if (
    typeof name !== 'string' || name.trim().length === 0 || name.length > 100 ||
    typeof contact !== 'string' || contact.trim().length === 0 || contact.length > 100 ||
    (subject && (typeof subject !== 'string' || subject.length > 200)) ||
    typeof message !== 'string' || message.trim().length === 0 || message.length > 3000
  ) {
    return res.status(400).json({ error: 'Invalid input format or length bounds exceeded' });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // HTML escaping utility for Telegram to prevent HTML Injection / Parse errors
  const escapeHtml = (text) => {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const safeName = escapeHtml(name.trim());
  const safeContact = escapeHtml(contact.trim());
  const safeSubject = escapeHtml(subject ? subject.trim() : 'Kiritilmagan');
  const safeMessage = escapeHtml(message.trim());

  // Format the message
  const text = `
📩 <b>Yangi murojaat (Saytdan)</b>

👤 <b>Ism:</b> ${safeName}
📞 <b>Aloqa:</b> ${safeContact}
📝 <b>Mavzu:</b> ${safeSubject}

💬 <b>Xabar:</b>
${safeMessage}
  `.trim();

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      console.error('Telegram API error:', data);
      return res.status(500).json({ error: 'Failed to send message to Telegram' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
