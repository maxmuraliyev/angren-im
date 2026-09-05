import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabase';
import './StudentsPage.css';

const TEXT_PREVIEW_LIMIT = 120;

function StudentModal({ student, onClose }) {
  const { t } = useTranslation();
  /* Close on backdrop click */
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  /* Close on Escape key */
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="student-modal-backdrop" onClick={handleBackdrop}>
      <div className="student-modal" role="dialog" aria-modal="true">
        <button className="student-modal-close" onClick={onClose} aria-label={t('students.close', 'Yopish')}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="student-modal-image-wrap">
          <img src={student.src} alt={student.name || student.title} className="student-modal-image" />
          <div className="student-modal-image-gradient" />
        </div>

        <div className="student-modal-body">
          <h2 className="student-modal-name">{student.name || student.title}</h2>
          {student.text && (
            <p className="student-modal-text">{student.text}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StudentsPage() {
  const { t } = useTranslation();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    async function fetchStudents() {
      try {
        const { data, error } = await supabase
          .from('site_data')
          .select('data')
          .eq('id', 'students')
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        
        if (data && data.data && Array.isArray(data.data)) {
          setStudents(data.data);
        }
      } catch (err) {
        console.error("Error fetching students:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchStudents();
  }, []);

  return (
    <div className="students-page">
      <div className="students-header animate-in">
        <h1 className="students-title">{t('hero.card_students')}</h1>
        <p className="students-subtitle">{t('hero.card_students_desc')}</p>
      </div>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>{t('students.loading', 'Yuklanmoqda...')}</div>
      ) : students.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>{t('students.empty', "Hozircha o'quvchilar rasmi qo'shilmagan.")}</div>
      ) : (
        <div className="students-masonry animate-in">
          {students.map((student, index) => {
            const text = student.text || '';
            const isLong = text.length > TEXT_PREVIEW_LIMIT;
            const preview = isLong ? text.slice(0, TEXT_PREVIEW_LIMIT).trimEnd() + '…' : text;

            return (
              <div className="student-item" key={index}>
                <div className="student-image-wrapper">
                  <img src={student.src} alt={student.name || student.title} className="student-image" loading="lazy" />
                </div>
                <div className="student-info">
                  <h3 className="student-name">{student.name || student.title}</h3>
                  {text && <p className="student-text">{preview}</p>}
                  <button
                    className="student-read-more"
                    onClick={() => setSelected(student)}
                    aria-label={`${t('students.read_more', "Ko'proq o'qi")}: ${student.name || student.title}`}
                  >
                    <span>{t('students.read_more', "Ko'proq o'qi")}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <StudentModal student={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
