import { useTranslation } from 'react-i18next';
import { FiPhone, FiMail } from 'react-icons/fi';
import { FaTelegramPlane, FaInstagram, FaFacebookF, FaYoutube } from 'react-icons/fa';
import './TopBar.css';

export default function TopBar() {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
  };

  const currentLang = i18n.language?.substring(0, 2) || 'uz';

  return (
    <div className="topbar">
      <div className="topbar__inner">
        {/* Left: Contact Info */}
        <div className="topbar__contact">
          <a href="tel:+998941257979" className="topbar__contact-item">
            <FiPhone />
            <span>{t('topbar.phone')}</span>
          </a>
          <div className="topbar__divider" />
          <a href="mailto:info@angren-im.uz" className="topbar__contact-item">
            <FiMail />
            <span>{t('topbar.email')}</span>
          </a>
        </div>

        {/* Right: Socials + Language */}
        <div className="topbar__right">
          <div className="topbar__socials">
            <a
              href="https://t.me/AngrenIMUz"
              target="_blank"
              rel="noopener noreferrer"
              className="topbar__social-link"
              aria-label="Telegram"
            >
              <FaTelegramPlane />
            </a>
            <a
              href="https://www.instagram.com/angrenimuz"
              target="_blank"
              rel="noopener noreferrer"
              className="topbar__social-link"
              aria-label="Instagram"
            >
              <FaInstagram />
            </a>
            <div className="topbar__social-sep" />
            <a
              href="https://facebook.com/Angrenimuz"
              target="_blank"
              rel="noopener noreferrer"
              className="topbar__social-link"
              aria-label="Facebook"
            >
              <FaFacebookF />
            </a>
            <a
              href="https://youtube.com/@Angrenimuz"
              target="_blank"
              rel="noopener noreferrer"
              className="topbar__social-link"
              aria-label="YouTube"
            >
              <FaYoutube />
            </a>
          </div>

          {/* Language Switcher */}
          <div className="topbar__lang">
            <button
              className={`topbar__lang-btn ${currentLang === 'uz' ? 'active' : ''}`}
              onClick={() => changeLanguage('uz')}
            >
              <img
                src="/images/flags/uz.svg"
                alt="O'zbek"
                className="topbar__lang-flag"
              />
              {t('lang.uz')}
            </button>
            <button
              className={`topbar__lang-btn ${currentLang === 'en' ? 'active' : ''}`}
              onClick={() => changeLanguage('en')}
            >
              <img
                src="/images/flags/gb.svg"
                alt="English"
                className="topbar__lang-flag"
              />
              {t('lang.en')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
