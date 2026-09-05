import { useTranslation } from 'react-i18next';
import { FiPieChart, FiCpu, FiMonitor, FiFeather, FiGlobe } from 'react-icons/fi';
import './Education.css';

export default function Education() {
  const { t } = useTranslation();

  const subjects = [
    {
      id: 'math',
      icon: <FiPieChart />,
      image: '/images/classrooms/dars1.jpg',
    },
    {
      id: 'physics',
      icon: <FiCpu />,
      image: '/images/labs/Fizika 6.jpg',
    },
    {
      id: 'it',
      icon: <FiMonitor />,
      image: '/images/labs/Komp 1.jpg',
    },
    {
      id: 'biology',
      icon: <FiFeather />,
      image: '/images/labs/Biologiya 1.jpg',
    },
    {
      id: 'languages',
      icon: <FiGlobe />,
      image: '/images/classrooms/dars3.jpg',
    },
  ];

  return (
    <section className="education section" id="education">
      <div className="container">
        <div className="section-header animate-in">
          <h2 className="section-title">{t('education.section_title')}</h2>
          <p className="section-subtitle">{t('education.section_subtitle')}</p>
        </div>

        <div className="education__grid">
          {subjects.map((subj, index) => (
            <div className={`education__card animate-in stagger-${(index % 4) + 1}`} key={subj.id}>
              <div className="education__bg">
                <img src={subj.image} alt={t(`education.${subj.id}_title`)} />
              </div>
              <div className="education__overlay" />
              <div className="education__content">
                <div className="education__icon">{subj.icon}</div>
                <h3 className="education__card-title">{t(`education.${subj.id}_title`)}</h3>
                <p className="education__card-desc">{t(`education.${subj.id}_desc`)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
