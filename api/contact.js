export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { name, contact, subject, message } = req.body;

  // Basic validation & existence check
  if (!name || !contact || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Type validation and length limits to prevent DoS/payload exhaustion
  if (
    typeof name !== 'string' || name.length > 100 ||
    typeof contact !== 'string' || contact.length > 100 ||
    (subject && (typeof subject !== 'string' || subject.length > 200)) ||
    typeof message !== 'string' || message.length > 3000
  ) {
    return res.status(400).json({ error: 'Invalid input format or length exceeded' });
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

  const safeName = escapeHtml(name);
  const safeContact = escapeHtml(contact);
  const safeSubject = escapeHtml(subject || 'Kiritilmagan');
  const safeMessage = escapeHtml(message);

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
