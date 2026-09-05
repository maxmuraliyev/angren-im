import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useCountUp } from '../hooks/useAnimations';
import './About.css';

function StatCounter({ target, label }) {
  const ref = useRef(null);
  useCountUp(ref, target, 2000);

  return (
    <div className="about__stat">
      <div className="about__stat-number" ref={ref}>0+</div>
      <div className="about__stat-label">{label}</div>
    </div>
  );
}

export default function About() {
  const { t } = useTranslation();

  return (
    <section className="about section" id="about">
      <div className="container">
        <div className="section-header animate-in">
          <h2 className="section-title">{t('about.section_title')}</h2>
          <p className="section-subtitle">{t('about.section_subtitle')}</p>
        </div>

        {/* Agency badge */}
        <div className="about__agency animate-in">
          <img
            src="/images/agentlik.svg"
            alt="Ixtisoslashtirilgan maktablar agentligi"
            className="about__agency-logo"
          />
          <span className="about__agency-text">
            Ixtisoslashtirilgan maktablar agentligi
          </span>
        </div>

        <div className="about__grid">
          {/* Director card */}
          <div className="about__director animate-in">
            <div className="about__director-img-wrapper">
              <img
                src="/images/staff/direktor.jpg"
                alt={t('about.director_name')}
                className="about__director-img"
              />
              <div className="about__director-ring" />
            </div>
            <h3 className="about__director-greeting">{t('about.director_greeting')}</h3>
            <p className="about__director-text">{t('about.director_text')}</p>
            <p className="about__director-name">{t('about.director_name')}</p>
            <p className="about__director-title">Direktor</p>
          </div>

          {/* Mission + Stats */}
          <div className="about__info animate-in">
            <h3 className="about__mission-title">{t('about.mission_title')}</h3>
            <p className="about__mission-text">{t('about.mission_text')}</p>

            <div className="about__stats">
              <StatCounter target={500} label={t('about.stat_students')} />
              <StatCounter target={50} label={t('about.stat_teachers')} />
              <StatCounter target={10} label={t('about.stat_years')} />
              <StatCounter target={25} label={t('about.stat_subjects')} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
