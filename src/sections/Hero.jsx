import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiUserCheck, FiClipboard, FiChevronRight } from 'react-icons/fi';
import './Hero.css';

export default function Hero() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 72;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <section className="hero" id="hero">
      <div className="hero__bg">
        <img src="/images/building/Kirish.jpg" alt="Angren IMI School Building" />
      </div>
      <div className="hero__overlay" />

      <div className="hero__content">
        <div className="hero__content-inner">
          <h1 className="hero__title">{t('hero.title')}</h1>
          <p className="hero__subtitle">{t('hero.subtitle')}</p>
        </div>
      </div>

      <div className="hero__cards">
        <div className="hero__card" onClick={() => navigate('/students')}>
          <div className="hero__card-icon"><FiUsers /></div>
          <div className="hero__card-text">
            <h3>{t('hero.card_students')}</h3>
            <p>{t('hero.card_students_desc')}</p>
          </div>
          <FiChevronRight className="hero__card-arrow" />
        </div>
        <div className="hero__card" onClick={() => navigate('/teachers')}>
          <div className="hero__card-icon"><FiUserCheck /></div>
          <div className="hero__card-text">
            <h3>{t('hero.card_teachers')}</h3>
            <p>{t('hero.card_teachers_desc')}</p>
          </div>
          <FiChevronRight className="hero__card-arrow" />
        </div>
        <div className="hero__card" onClick={() => scrollTo('admission')}>
          <div className="hero__card-icon"><FiClipboard /></div>
          <div className="hero__card-text">
            <h3>{t('hero.card_admission')}</h3>
            <p>{t('hero.card_admission_desc')}</p>
          </div>
          <FiChevronRight className="hero__card-arrow" />
        </div>
      </div>
    </section>
  );
}
