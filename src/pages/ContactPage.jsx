import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiPhone, FiMail, FiMapPin, FiClock, FiSend, FiCheckCircle } from 'react-icons/fi';
import { FaTelegramPlane, FaInstagram, FaFacebookF, FaYoutube } from 'react-icons/fa';
import './ContactPage.css';

export default function ContactPage() {
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    subject: '',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.name && formData.contact && formData.message) {
      setLoading(true);
      setErrorMsg('');
      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        
        if (response.ok) {
          setSubmitted(true);
        } else {
          const data = await response.json();
          setErrorMsg(data.error || t('contact_page.err_server', "Xatolik yuz berdi. Iltimos keyinroq qayta urinib ko'ring."));
        }
      } catch (err) {
        setErrorMsg(t('contact_page.err_network', "Tarmoq xatosi. Iltimos internetingizni tekshiring."));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <section className="contact-page section">
      <div className="container">
        <div className="section-header animate-in">
          <h2 className="section-title">{t('nav.contact')}</h2>
          <p className="section-subtitle">{t('contact_page.subtitle', "Biz bilan bog'laning va savollaringizga javob oling")}</p>
        </div>

        <div className="contact-page__grid animate-in">
          {/* Left: Info Cards */}
          <div className="contact-page__info-list">
            <div className="contact-page__card">
              <div className="contact-page__card-icon"><FiPhone /></div>
              <h3 className="contact-page__card-title">{t('footer.phone_label')}</h3>
              <a href="tel:+998941257979" className="contact-page__card-value">{t('topbar.phone')}</a>
            </div>

            <div className="contact-page__card">
              <div className="contact-page__card-icon"><FiMail /></div>
              <h3 className="contact-page__card-title">{t('footer.email_label')}</h3>
              <a href="mailto:info@angren-im.uz" className="contact-page__card-value">{t('topbar.email')}</a>
            </div>

            <div className="contact-page__card">
              <div className="contact-page__card-icon"><FiMapPin /></div>
              <h3 className="contact-page__card-title">{t('footer.address_label')}</h3>
              <span className="contact-page__card-value">{t('footer.address')}</span>
            </div>

            <div className="contact-page__card">
              <div className="contact-page__card-icon"><FiClock /></div>
              <h3 className="contact-page__card-title">{t('contact_page.working_hours', "Ish vaqti")}</h3>
              <span className="contact-page__card-value">{t('contact_page.working_hours_val', "Dushanba - Shanba: 08:00 - 18:00")}</span>
            </div>

            <div className="contact-page__socials-box">
              <h3>{t('contact_page.socials_title', "Ijtimoiy tarmoqlarimiz")}</h3>
              <p>{t('contact_page.socials_desc', "Maktabimiz hayotini rasmiy sahifalarimizda kuzatib boring")}</p>
              <div className="contact-page__social-links">
                <a href="https://t.me/AngrenIMUz" target="_blank" rel="noopener noreferrer" className="contact-page__social-link"><FaTelegramPlane /></a>
                <a href="https://www.instagram.com/angrenimuz" target="_blank" rel="noopener noreferrer" className="contact-page__social-link"><FaInstagram /></a>
                <a href="https://facebook.com/Angrenimuz" target="_blank" rel="noopener noreferrer" className="contact-page__social-link"><FaFacebookF /></a>
                <a href="https://youtube.com/@Angrenimuz" target="_blank" rel="noopener noreferrer" className="contact-page__social-link"><FaYoutube /></a>
              </div>
            </div>
          </div>

          {/* Right: Interactive Form */}
          <div className="contact-page__form-container">
            {submitted ? (
              <div className="contact-page__success">
                <FiCheckCircle className="contact-page__success-icon" />
                <h3>{t('contact_page.success_title', "Xabaringiz muvaffaqiyatli yuborildi!")}</h3>
                <p>{t('contact_page.success_desc', "Murojaatingiz uchun rahmat. Ma'muriyat tez orada siz bilan bog'lanadi.")}</p>
                <button className="contact-page__success-btn" onClick={() => { setSubmitted(false); setFormData({ name: '', contact: '', subject: '', message: '' }); }}>
                  {t('contact_page.btn_resend', "Yana xabar yuborish")}
                </button>
              </div>
            ) : (
              <form className="contact-page__form" onSubmit={handleSubmit}>
                <h3 className="contact-page__form-title">{t('contact_page.form_title', "Savollar yoki takliflar bormi?")}</h3>
                <p className="contact-page__form-subtitle">{t('contact_page.form_subtitle', "Quyidagi shaklni to'ldiring va bizga xabar yo'llang")}</p>

                <div className="contact-page__form-group">
                  <label htmlFor="name">{t('contact_page.label_name', "Ismingiz *")}</label>
                  <input type="text" id="name" name="name" required value={formData.name} onChange={handleChange} placeholder={t('contact_page.placeholder_name', "To'liq ismingizni kiriting")} />
                </div>

                <div className="contact-page__form-group">
                  <label htmlFor="contact">{t('contact_page.label_contact', "Telefon raqam yoki Email *")}</label>
                  <input type="text" id="contact" name="contact" required value={formData.contact} onChange={handleChange} placeholder={t('contact_page.placeholder_contact', "+998 90 123 45 67 yoki email")} />
                </div>

                <div className="contact-page__form-group">
                  <label htmlFor="subject">{t('contact_page.label_subject', "Mavzu")}</label>
                  <input type="text" id="subject" name="subject" value={formData.subject} onChange={handleChange} placeholder={t('contact_page.placeholder_subject', "Murojaatingiz mavzusi")} />
                </div>

                <div className="contact-page__form-group">
                  <label htmlFor="message">{t('contact_page.label_message', "Xabaringiz *")}</label>
                  <textarea id="message" name="message" rows="4" required value={formData.message} onChange={handleChange} placeholder={t('contact_page.placeholder_message', "Batafsil xabaringizni yozing...")} />
                </div>

                {errorMsg && <div className="contact-page__error" style={{color: '#e74c3c', marginBottom: '1rem'}}>{errorMsg}</div>}

                <button type="submit" className="contact-page__submit-btn" disabled={loading}>
                  {loading ? t('contact_page.btn_sending', 'Yuborilmoqda...') : <><FiSend /> {t('contact_page.btn_send', 'Xabarni yuborish')}</>}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Map */}
        <div className="contact-page__map animate-in">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3009.6!2d70.0882!3d41.0338!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x38afed6f7c6e0001%3A0xc546e5a2bfbd2c3!2sAngren!5e0!3m2!1sen!2s!4v1719842600000"
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="School Location Map"
          />
        </div>
      </div>
    </section>
  );
}
