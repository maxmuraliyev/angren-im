import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabase';
import { TEACHER_CATEGORIES, getTeacherCategory } from '../data/teacherCategories';
import { FaPhoneAlt } from 'react-icons/fa';
import './TeachersPage.css';

function TeacherCard({ teacher, index = 0 }) {
  const style = {
    animationDelay: `${Math.min(index * 0.07, 0.35)}s`
  };

  // Sanitize phone strictly for tel: protocol (digits and leading plus only)
  const sanitizedTel = teacher?.phone ? String(teacher.phone).replace(/[^0-9+]/g, '') : '';
  const safeSrc = teacher?.src && /^(https?:\/\/|\/)/i.test(teacher.src) ? teacher.src : '';

  return (
    <div className="teacher-card card-pop-in" style={style}>
      <div className="teacher-image-wrapper">
        {safeSrc ? (
          <img src={safeSrc} alt={teacher.name || 'O\'qituvchi'} className="teacher-image" loading="lazy" />
        ) : (
          <div className="teacher-image-placeholder" style={{ width: '100%', height: '100%', backgroundColor: '#e2e8f0' }} />
        )}
      </div>
      <div className="teacher-info">
        <h3 className="teacher-name">{teacher.name}</h3>
        <p className="teacher-role-text">{teacher.role}</p>
        {sanitizedTel && (
          <a href={`tel:${sanitizedTel}`} className="teacher-phone-link" rel="noopener noreferrer">
            <FaPhoneAlt className="phone-icon" />
            <span>{teacher.phone}</span>
          </a>
        )}
      </div>
    </div>
  );
}

export default function TeachersPage() {
  const { t } = useTranslation();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    async function fetchTeachers() {
      try {
        const { data, error } = await supabase
          .from('site_data')
          .select('data')
          .eq('id', 'teachers')
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        
        if (data && data.data && Array.isArray(data.data)) {
          setTeachers(data.data);
        }
      } catch (err) {
        console.error("Error fetching teachers:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchTeachers();
  }, []);

  // Filter only categories that have at least one teacher
  const activeCategories = TEACHER_CATEGORIES.filter(cat =>
    teachers.some(t => getTeacherCategory(t) === cat.id)
  );

  return (
    <div className="teachers-page">
      <div className="teachers-header animate-in">
        <h1 className="teachers-title">{t('hero.card_teachers')}</h1>
        <p className="teachers-subtitle">{t('hero.card_teachers_desc')}</p>
      </div>
      
      {loading ? (
        <div className="teachers-loading">{t('teachers.loading', 'Yuklanmoqda...')}</div>
      ) : teachers.length === 0 ? (
        <div className="teachers-empty">
          <p>{t('teachers.empty', "Hozircha o'qituvchilar ma'lumotlari qo'shilmagan.")}</p>
        </div>
      ) : (
        <>
          {/* Filter tabs */}
          <div className="teachers-filters animate-in">
            <button
              className={`teachers-filter-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              {t('subjects.all', 'Barchasi')}
            </button>
            {activeCategories.map(cat => (
              <button
                key={cat.id}
                className={`teachers-filter-btn ${activeTab === cat.id ? 'active' : ''}`}
                onClick={() => setActiveTab(cat.id)}
              >
                <span>{t(`subjects.${cat.id}`, cat.label)}</span>
              </button>
            ))}
          </div>

          {/* Teacher sections or grid */}
          {activeTab === 'all' ? (
            <div key="all" className="teachers-sections tab-content-fade">
              {activeCategories.map(cat => {
                const catTeachers = teachers.filter(t => getTeacherCategory(t) === cat.id);
                if (catTeachers.length === 0) return null;
                return (
                  <div key={cat.id} className="teacher-section-group">
                    <div className="teacher-section-header">
                      <h2 className="teacher-section-title">
                        <span>{t(`subjects.${cat.id}`, cat.label)}</span>
                      </h2>
                      <div className="teacher-section-divider"></div>
                    </div>
                    <div className="teachers-grid">
                      {catTeachers.map((teacher, index) => (
                        <TeacherCard key={`${cat.id}-${index}`} teacher={teacher} index={index} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div key={activeTab} className="teachers-grid tab-content-fade">
              {teachers
                .filter(t => getTeacherCategory(t) === activeTab)
                .map((teacher, index) => (
                  <TeacherCard key={`${activeTab}-${index}`} teacher={teacher} index={index} />
                ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
