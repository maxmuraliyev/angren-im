import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabase';
import localTimetableData from '../data/timetable.json';
import './TimetablePage.css';

export default function TimetablePage() {
  const { t, i18n } = useTranslation();
  const sinflar = ['5-sinf', '6-sinf', '7-sinf', '8-sinf', '9-sinf', '10-sinf', '11-sinf'];
  const kunlar = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];

  const [activeSinf, setActiveSinf] = useState('5-sinf');
  const [activeKun, setActiveKun] = useState('Dushanba');
  const [timetableData, setTimetableData] = useState(localTimetableData || {});
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch timetable
        const { data: ttData, error: ttError } = await supabase
          .from('site_data')
          .select('data')
          .eq('id', 'timetable')
          .single();

        if (!ttError && ttData && ttData.data && Object.keys(ttData.data).length > 0) {
          setTimetableData(ttData.data);
        } else if (ttError && ttError.code !== 'PGRST116') {
          console.error("Timetable fetch error:", ttError);
        }

        // Fetch events
        const { data: evData, error: evError } = await supabase
          .from('site_data')
          .select('data')
          .eq('id', 'events')
          .single();

        if (!evError && evData && evData.data && Array.isArray(evData.data)) {
          const now = new Date();
          const upcoming = evData.data.filter(e => new Date(e.datetime) > now);
          // Sort events by date ascending (closest first)
          upcoming.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
          setEvents(upcoming);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const getDayData = () => {
    return timetableData[activeSinf]?.[activeKun] || [];
  };

  const dayData = getDayData();

  return (
    <div className="timetable-page">
      <div className="timetable-header animate-in">
        <h1 className="timetable-title">{t('nav.timetable')}</h1>
        <p className="timetable-subtitle">{t('timetable.subtitle', 'Sinf va kunni tanlang')}</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>{t('timetable.loading', 'Dars jadvali yuklanmoqda...')}</div>
      ) : (
        <>
          {events.length > 0 && (
            <div className="upcoming-events-section animate-in">
              <h2 className="events-section-title">{t('events.title', 'Bo\'lajak tadbirlar')}</h2>
              <div className="events-grid">
                {events.map(ev => (
                  <div key={ev.id} className="event-card">
                    {ev.src && (
                      <div className="event-image-wrap">
                        <img src={ev.src} alt={ev.name} className="event-image" />
                      </div>
                    )}
                    <div className="event-info">
                      <div className="event-date">
                        {(() => {
                          const d = new Date(ev.datetime);
                          const day = d.getDate();
                          const time = d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
                          const uzMonths = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
                          const enMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                          const monthName = i18n.language === 'en' ? enMonths[d.getMonth()] : uzMonths[d.getMonth()];
                          return `${day} ${monthName} ${time}`;
                        })()}
                      </div>
                      <h3 className="event-name">{ev.name}</h3>
                      <p className="event-text">{ev.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="timetable-filters animate-in">
        <div className="filter-group">
          <h3 className="filter-label">{t('timetable.grade', 'Sinf:')}</h3>
          <div className="filter-buttons">
            {sinflar.map((sinf) => (
              <button
                key={sinf}
                className={`filter-btn ${activeSinf === sinf ? 'active' : ''}`}
                onClick={() => setActiveSinf(sinf)}
              >
                {sinf}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <h3 className="filter-label">{t('timetable.day', 'Kun:')}</h3>
          <div className="filter-buttons kun-buttons">
            {kunlar.map((kun) => (
              <button
                key={kun}
                className={`filter-btn kun-btn ${activeKun === kun ? 'active' : ''}`}
                onClick={() => setActiveKun(kun)}
              >
                {t(`days.${kun}`, kun)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="timetable-content animate-in">
        {dayData.length === 0 ? (
          <div className="timetable-empty">{t('timetable.empty', 'Bu kun uchun dars jadvali kiritilmagan.')}</div>
        ) : (
          <div className="timetable-classes-grid">
            {dayData.map((clsData) => (
              <div key={clsData.class} className="class-schedule-card">
                <div className="class-schedule-header">
                  <h2>{clsData.class}</h2>
                </div>
                <div className="class-schedule-body">
                  <div className="table-header">
                    <span className="th-num">{t('timetable.col_num', '#')}</span>
                    <span className="th-time">{t('timetable.col_time', 'Vaqt')}</span>
                    <span className="th-subject">{t('timetable.col_subject', 'Fan')}</span>
                    <span className="th-room">{t('timetable.col_room', 'Xona')}</span>
                    <span className="th-teacher">{t('timetable.col_teacher', "O'qituvchi")}</span>
                  </div>
                  <div className="table-rows">
                    {clsData.lessons.map((lesson, idx) => {
                      const renderSplit = (text) => {
                        if (!text) return '-';
                        const parts = text.split('|');
                        if (parts.length === 1) return text.trim() || '-';
                        return (
                          <div className="split-group">
                            <div className="group-1">{parts[0].trim() || '-'}</div>
                            <div className="group-2">{parts[1].trim() || '-'}</div>
                          </div>
                        );
                      };

                      return (
                        <div key={idx} className="table-row">
                          <span className="td-num">{lesson.number || idx + 1}</span>
                          <span className="td-time">{lesson.time}</span>
                          <span className="td-subject">{lesson.subject}</span>
                          <span className="td-room">{renderSplit(lesson.room)}</span>
                          <span className="td-teacher">{renderSplit(lesson.teacher)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
}
