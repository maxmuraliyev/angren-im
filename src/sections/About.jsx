import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FiArrowRight } from 'react-icons/fi';
import { useCountUp } from '../hooks/useAnimations';
import { directorProfile } from '../data/directorProfile';
import DirectorModal from '../components/DirectorModal';
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
  const { t, i18n } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isUz = !i18n.language || i18n.language.startsWith('uz');

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
            alt="Ixtisoslashtirilgan ta'lim muassasalari agentligi"
            className="about__agency-logo"
          />
          <span className="about__agency-text">
            Ixtisoslashtirilgan ta'lim muassasalari agentligi
          </span>
        </div>

        <div className="about__grid">
          {/* Director card */}
          <div className="about__director animate-in">
            <div className="about__director-img-wrapper">
              <img
                src={directorProfile.portrait}
                alt={directorProfile.name}
                className="about__director-img"
                onError={(e) => {
                  e.currentTarget.src = '/images/direktor.jpg';
                }}
              />
            </div>

            <h3 className="about__director-name">{directorProfile.name}</h3>
            <div className="about__director-badge">
              <span>{isUz ? directorProfile.roleUz : directorProfile.roleEn}</span>
            </div>

            <div className="about__director-body">
              <p className="about__director-greeting">
                {isUz ? directorProfile.greetingUz : directorProfile.greetingEn}
              </p>
              <p className="about__director-text">
                {isUz ? directorProfile.shortIntroUz : directorProfile.shortIntroEn}
              </p>
            </div>

            <button
              type="button"
              className="about__director-action-btn"
              onClick={() => setIsModalOpen(true)}
              aria-haspopup="dialog"
              aria-label={isUz ? "Direktor haqida batafsil ma'lumot" : "More details about the director"}
            >
              <span>{isUz ? 'Direktor haqida' : 'About Director'}</span>
              <span className="about__director-arrow" aria-hidden="true">→</span>
            </button>
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

      {/* Expandable Director Profile Modal */}
      <DirectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </section>
  );
}
