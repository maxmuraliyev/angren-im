/**
 * Device and browser detection utility for visitor analytics.
 */

export function detectDevice() {
  if (typeof window === 'undefined') {
    return {
      deviceType: 'Unknown',
      browser: 'Unknown',
      os: 'Unknown',
      userAgent: '',
      screenResolution: '',
      language: '',
      referrer: '',
    };
  }

  const ua = window.navigator.userAgent || '';
  const screenResolution = `${window.screen.width || 0}x${window.screen.height || 0}`;
  const language = window.navigator.language || window.navigator.userLanguage || 'uz';
  const referrer = document.referrer ? new URL(document.referrer, window.location.origin).hostname : 'Direct';

  // 1. Detect Device Type
  let deviceType = 'Desktop';
  const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk)/i.test(ua);
  const isMobile = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|windows phone|xda|xiino/i.test(ua);

  if (isTablet) {
    deviceType = 'Tablet';
  } else if (isMobile || (window.innerWidth <= 768 && 'ontouchstart' in window)) {
    deviceType = 'Mobile';
  }

  // 2. Detect Operating System
  let os = 'Unknown OS';
  if (/windows phone/i.test(ua)) {
    os = 'Windows Phone';
  } else if (/win/i.test(ua)) {
    if (/nt 10.0/i.test(ua)) os = 'Windows 10/11';
    else if (/nt 6.3/i.test(ua)) os = 'Windows 8.1';
    else if (/nt 6.2/i.test(ua)) os = 'Windows 8';
    else if (/nt 6.1/i.test(ua)) os = 'Windows 7';
    else os = 'Windows';
  } else if (/android/i.test(ua)) {
    const match = ua.match(/android\s([0-9\.]+)/i);
    os = match ? `Android ${match[1]}` : 'Android';
  } else if (/ipad/i.test(ua)) {
    const match = ua.match(/os\s([0-9_]+)/i);
    os = match ? `iPadOS ${match[1].replace(/_/g, '.')}` : 'iPadOS';
  } else if (/iphone|ipod/i.test(ua)) {
    const match = ua.match(/os\s([0-9_]+)/i);
    os = match ? `iOS ${match[1].replace(/_/g, '.')}` : 'iOS';
  } else if (/macintosh|mac os x/i.test(ua)) {
    os = 'macOS';
  } else if (/cros/i.test(ua)) {
    os = 'ChromeOS';
  } else if (/linux/i.test(ua)) {
    os = 'Linux';
  }

  // 3. Detect Browser
  let browser = 'Unknown Browser';
  if (/edg([ea]|ios)?\/([0-9\.]+)/i.test(ua)) {
    const match = ua.match(/edg([ea]|ios)?\/([0-9\.]+)/i);
    browser = `Edge ${match ? match[2].split('.')[0] : ''}`.trim();
  } else if (/samsungbrowser\/([0-9\.]+)/i.test(ua)) {
    const match = ua.match(/samsungbrowser\/([0-9\.]+)/i);
    browser = `Samsung Internet ${match ? match[1].split('.')[0] : ''}`.trim();
  } else if (/opera|opr\/([0-9\.]+)/i.test(ua)) {
    const match = ua.match(/opr\/([0-9\.]+)/i);
    browser = `Opera ${match ? match[1].split('.')[0] : ''}`.trim();
  } else if (/chrome|crios\/([0-9\.]+)/i.test(ua) && !/edg/i.test(ua) && !/opr/i.test(ua)) {
    const match = ua.match(/(?:chrome|crios)\/([0-9\.]+)/i);
    browser = `Chrome ${match ? match[1].split('.')[0] : ''}`.trim();
  } else if (/firefox|fxios\/([0-9\.]+)/i.test(ua)) {
    const match = ua.match(/(?:firefox|fxios)\/([0-9\.]+)/i);
    browser = `Firefox ${match ? match[1].split('.')[0] : ''}`.trim();
  } else if (/version\/([0-9\.]+).+safari/i.test(ua)) {
    const match = ua.match(/version\/([0-9\.]+)/i);
    browser = `Safari ${match ? match[1].split('.')[0] : ''}`.trim();
  } else if (/safari/i.test(ua)) {
    browser = 'Safari';
  }

  return {
    deviceType,
    browser,
    os,
    userAgent: ua.slice(0, 500),
    screenResolution,
    language: language.slice(0, 30),
    referrer: referrer.slice(0, 100),
  };
}
