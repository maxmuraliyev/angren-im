import { useTranslation } from 'react-i18next';
import { FaInstagram, FaTelegramPlane, FaFacebookF, FaYoutube } from 'react-icons/fa';
import './Footer.css';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="footer" id="contact">
      {/* Social Subscribe Section — matching newuu.uz */}
      <div className="footer__subscribe">
        <div className="footer__subscribe-inner">
          {/* Left: Text */}
          <div className="footer__subscribe-text">
            <h2 className="footer__subscribe-title">
              {t('footer.subscribe_title')}{' '}
              <span>{t('footer.subscribe_highlight')}</span>
            </h2>
            <p className="footer__subscribe-desc">{t('footer.subscribe_desc')}</p>
          </div>

          {/* Right: Phone mockups in a row */}
          <div className="footer__social-phones">
            <a href="https://www.instagram.com/angrenimuz" target="_blank" rel="noopener noreferrer" className="footer__phone">
              <img src="/images/social/Instagram.jpg" alt="Instagram" />
              <div className="footer__phone-label instagram">
                <FaInstagram /> Instagram
              </div>
            </a>

            <a href="https://t.me/AngrenIMUz" target="_blank" rel="noopener noreferrer" className="footer__phone">
              <img src="/images/social/Telegram.jpg" alt="Telegram" />
              <div className="footer__phone-label telegram">
                <FaTelegramPlane /> Telegram
              </div>
            </a>

            <a href="https://facebook.com/Angrenimuz" target="_blank" rel="noopener noreferrer" className="footer__phone">
              <img src="/images/social/facebook.jpg" alt="Facebook" />
              <div className="footer__phone-label facebook">
                <FaFacebookF /> Facebook
              </div>
            </a>

            <a href="https://youtube.com/@Angrenimuz" target="_blank" rel="noopener noreferrer" className="footer__phone">
              <img src="/images/social/youtube.jpg" alt="YouTube" />
              <div className="footer__phone-label youtube">
                <FaYoutube /> YouTube
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="footer__contact">
        <div className="footer__contact-grid">
          {/* Brand */}
          <div className="footer__brand">
            <div className="footer__logo-wrap">
              <img src="/images/logo.png" alt="Logo" className="footer__logo" />
              <div className="footer__brand-title">
                Angren shahar<br />ixtisoslashtirilgan<br />maktabi
              </div>
            </div>
            <p className="footer__brand-tagline">{t('footer.school_tagline')}</p>
          </div>

          {/* Contact Details — 2 columns */}
          <div className="footer__info-col">
            <div className="footer__info-item">
              <a href="tel:+998941257979" className="footer__info-value">{t('topbar.phone')}</a>
              <span className="footer__info-label">{t('footer.phone_label')}</span>
            </div>
            <div className="footer__info-item">
              <a href="mailto:info@angren-im.uz" className="footer__info-value">{t('topbar.email')}</a>
              <span className="footer__info-label">{t('footer.email_label')}</span>
            </div>
            <div className="footer__info-item" style={{ gridColumn: 'span 2' }}>
              <span className="footer__info-value">{t('footer.address')}</span>
              <span className="footer__info-label">{t('footer.address_label')}</span>
            </div>
          </div>

          {/* Map */}
          <div className="footer__map-col">
            <div className="footer__map">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3009.6!2d70.0882!3d41.0338!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x38afed6f7c6e0001%3A0xc546e5a2bfbd2c3!2sAngren!5e0!3m2!1sen!2s!4v1719842600000"
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="School Location"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="footer__bottom">
        <span>{t('footer.copyright')}</span>
      </div>
    </footer>
  );
}
