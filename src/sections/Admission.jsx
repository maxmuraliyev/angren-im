import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiExternalLink, FiCheckCircle, FiBook } from 'react-icons/fi';
import { supabase } from '../supabase';
import './Admission.css';

export default function Admission() {
  const { t } = useTranslation();
  const [admissionActive, setAdmissionActive] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      const { data, error } = await supabase
        .from('site_data')
        .select('data')
        .eq('id', 'settings')
        .single();
      
      if (!error && data && data.data && typeof data.data.admissionActive !== 'undefined') {
        setAdmissionActive(data.data.admissionActive);
      }
    }
    fetchSettings();
  }, []);

  return (
    <section className="admission section" id="admission">
      <div className="container">
        <div className="section-header animate-in">
          <h2 className="section-title">{t('admission.section_title')}</h2>
          <p className="section-subtitle">{t('admission.section_subtitle')}</p>
        </div>

        <div className="admission__grid">
          {/* Left: Timeline */}
          <div className="admission__timeline animate-in">
            <div className="admission__step stagger-1">
              <div className="admission__step-dot">1</div>
              <div className="admission__step-content">
                <h3 className="admission__step-title">{t('admission.step1_title')}</h3>
                <p className="admission__step-desc">{t('admission.step1_desc')}</p>
              </div>
            </div>
            
            <div className="admission__step stagger-2">
              <div className="admission__step-dot">2</div>
              <div className="admission__step-content">
                <h3 className="admission__step-title">{t('admission.step2_title')}</h3>
                <p className="admission__step-desc">{t('admission.step2_desc')}</p>
              </div>
            </div>
            
            <div className="admission__step stagger-3">
              <div className="admission__step-dot">3</div>
              <div className="admission__step-content">
                <h3 className="admission__step-title">{t('admission.step3_title')}</h3>
                <p className="admission__step-desc">{t('admission.step3_desc')}</p>
              </div>
            </div>
            
            <div className="admission__step stagger-4">
              <div className="admission__step-dot">4</div>
              <div className="admission__step-content">
                <h3 className="admission__step-title">{t('admission.step4_title')}</h3>
                <p className="admission__step-desc">{t('admission.step4_desc')}</p>
              </div>
            </div>
          </div>

          {/* Right: Info Cards */}
          <div className="admission__info animate-in">
            <div className="admission__card">
              <FiBook className="admission__card-icon" />
              <h3 className="admission__card-title">{t('admission.grades_title')}</h3>
              <p className="admission__card-text">{t('admission.grades_text')}</p>
            </div>
            
            <div className="admission__card">
              <FiCheckCircle className="admission__card-icon" />
              <h3 className="admission__card-title">{t('admission.free_title')}</h3>
              <p className="admission__card-text">{t('admission.free_text')}</p>
            </div>

            {admissionActive ? (
              <a
                href="https://my.gov.uz/uz/service/854"
                target="_blank"
                rel="noopener noreferrer"
                className="admission__apply-btn"
              >
                {t('admission.apply_btn')}
                <FiExternalLink />
              </a>
            ) : (
              <button
                className="admission__apply-btn disabled"
                disabled
              >
                {t('admission.apply_next_cohort_btn', 'Keyingi qabul')}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
