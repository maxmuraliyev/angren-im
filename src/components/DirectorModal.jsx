import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiX, FiUser } from 'react-icons/fi';
import { directorProfile } from '../data/directorProfile';
import './DirectorModal.css';

export default function DirectorModal({ isOpen, onClose }) {
  const { i18n } = useTranslation();
  const isUz = !i18n.language || i18n.language.startsWith('uz');
  const [imgError, setImgError] = useState(false);
  const closeButtonRef = useRef(null);

  // Lock body scroll and set keyboard listeners when open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(focusTimer);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const role = isUz ? directorProfile.roleUz : directorProfile.roleEn;
  const institution = isUz ? directorProfile.institutionUz : directorProfile.institutionEn;
  const birthplace = isUz ? directorProfile.birthplaceUz : directorProfile.birthplaceEn;
  const education = isUz ? directorProfile.educationUz : directorProfile.educationEn;
  const biography = isUz ? directorProfile.biographyUz : directorProfile.biographyEn;
  const timeline = isUz ? directorProfile.timelineUz : directorProfile.timelineEn;
  const focusAreas = isUz ? directorProfile.focusAreasUz : directorProfile.focusAreasEn;

  return (
    <div 
      className="director-modal__backdrop" 
      onClick={onClose}
      role="presentation"
    >
      <div 
        className="director-modal__content" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="director-modal-title"
      >
        {/* Simple Editorial Header Bar */}
        <header className="director-modal__header">
          <h2 id="director-modal-title" className="director-modal__header-title">
            {isUz ? 'Direktor haqida' : 'About the Director'}
          </h2>
          <button
            className="director-modal__close-btn"
            onClick={onClose}
            ref={closeButtonRef}
            aria-label={isUz ? 'Yopish' : 'Close'}
          >
            <FiX />
          </button>
        </header>

        {/* Scrollable Modal Body */}
        <div className="director-modal__body">
          {/* Two-Column Introduction: Left Portrait (32%), Right Info (68%) */}
          <section className="director-modal__intro">
            <div className="director-modal__portrait-col">
              {!imgError ? (
                <img
                  src={directorProfile.portrait}
                  alt={directorProfile.name}
                  className="director-modal__portrait"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="director-modal__portrait-fallback" aria-label={directorProfile.name}>
                  <FiUser className="director-modal__fallback-icon" />
                  <span>NA</span>
                </div>
              )}
            </div>

            <div className="director-modal__info-col">
              <h3 className="director-modal__name">
                {directorProfile.name}
              </h3>
              <p className="director-modal__role">
                {role}
              </p>
              <p className="director-modal__meta">
                {directorProfile.birthYear} • {birthplace} • {education}
              </p>

              <div className="director-modal__bio">
                {biography.map((paragraph, idx) => (
                  <p key={idx} className="director-modal__bio-paragraph">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </section>

          <hr className="director-modal__divider" />

          {/* Minimal Career Timeline */}
          <section className="director-modal__section">
            <h4 className="director-modal__section-title">
              {isUz ? 'Mehnat faoliyati' : 'Career Milestones'}
            </h4>

            <div className="director-modal__timeline">
              {timeline.map((item, idx) => (
                <div key={idx} className="director-modal__timeline-row">
                  <div className="director-modal__timeline-marker">
                    <span className="director-modal__timeline-dot" />
                    {idx < timeline.length - 1 && (
                      <span className="director-modal__timeline-line" />
                    )}
                  </div>
                  <div className="director-modal__timeline-content">
                    <span className="director-modal__timeline-year">{item.year}</span>
                    <h5 className="director-modal__timeline-heading">{item.title}</h5>
                    <p className="director-modal__timeline-desc">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <hr className="director-modal__divider" />

          {/* Leadership & Focus Areas (Faoliyat yo'nalishlari - 3 Editorial Columns) */}
          <section className="director-modal__section">
            <h4 className="director-modal__section-title">
              {isUz ? 'Faoliyat yo‘nalishlari' : 'Focus Areas'}
            </h4>

            <div className="director-modal__focus-columns">
              {focusAreas.map((item, idx) => (
                <div key={item.id} className="director-modal__focus-col">
                  <span className="director-modal__focus-num">0{idx + 1}</span>
                  <h5 className="director-modal__focus-heading">{item.title}</h5>
                  <p className="director-modal__focus-desc">{item.description}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Quiet Academic Footer */}
        <footer className="director-modal__footer">
          <span className="director-modal__footer-inst">
            {institution}
          </span>
          <button
            type="button"
            className="director-modal__footer-close"
            onClick={onClose}
          >
            {isUz ? 'Yopish' : 'Close'}
          </button>
        </footer>
      </div>
    </div>
  );
}
