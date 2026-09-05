import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiMonitor, FiAward, FiBookOpen, FiStar } from 'react-icons/fi';
import './WhyUs.css';

export default function WhyUs() {
  const { t } = useTranslation();
  const [activeIdx, setActiveIdx] = useState(0);

  const items = [
    {
      id: 'item1',
      icon: <FiMonitor />,
      image: '/images/classrooms/dars1.jpg',
    },
    {
      id: 'item2',
      icon: <FiAward />,
      image: '/images/library/Kutubxona 1.jpg',
    },
    {
      id: 'item3',
      icon: <FiBookOpen />,
      image: '/images/building/Kirish.jpg',
    },
    {
      id: 'item4',
      icon: <FiStar />,
      image: '/images/classrooms/dars3.jpg',
    },
  ];

  /* Auto-play carousel every 4.5 seconds */
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % items.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [items.length]);

  return (
    <section className="whyus section" id="whyus">
      <div className="container">
        <div className="section-header animate-in">
          <h2 className="section-title">{t('whyus.section_title')}</h2>
          <p className="section-subtitle">{t('whyus.section_subtitle')}</p>
        </div>

        <div className="whyus__grid">
          {/* Left: Features List (Carousel Tabs) */}
          <div className="whyus__list animate-in">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className={`whyus__item ${activeIdx === idx ? 'active' : ''}`}
                onClick={() => setActiveIdx(idx)}
              >
                {/* Active progress indicator */}
                {activeIdx === idx && <div className="whyus__item-progress" key={activeIdx} />}
                
                <div className="whyus__icon-wrap">{item.icon}</div>
                <div>
                  <h3 className="whyus__item-title">{t(`whyus.${item.id}_title`)}</h3>
                  <p className="whyus__item-desc">{t(`whyus.${item.id}_desc`)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Carousel Image Display */}
          <div className="whyus__image animate-in">
            {items.map((item, idx) => (
              <img
                key={item.id}
                src={item.image}
                alt={t(`whyus.${item.id}_title`)}
                className={activeIdx === idx ? 'active' : ''}
              />
            ))}
          </div>
        </div>

        {/* Mobile dots */}
        <div className="whyus__dots">
          {items.map((_, idx) => (
            <button
              key={idx}
              className={`whyus__dot ${activeIdx === idx ? 'active' : ''}`}
              onClick={() => setActiveIdx(idx)}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
