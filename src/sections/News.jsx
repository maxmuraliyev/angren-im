import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiCalendar, FiEye, FiShare2, FiX, FiCheck, FiHeart, FiPlay } from 'react-icons/fi';
import { supabase } from '../supabase';
import { isVideoMedia } from '../utils/uploadSecurity';
import './News.css';

export default function News() {
  const { t, i18n } = useTranslation();
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [copied, setCopied] = useState(false);

  const lang = i18n.language || 'uz';

  const [newsList, setNewsList] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchAdminNews = async () => {
      try {
        const { data, error } = await supabase
          .from('site_data')
          .select('data')
          .eq('id', 'news')
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error("Supabase news fetch error:", error);
        }

        if (isMounted && data && data.data && Array.isArray(data.data)) {
          setNewsList(data.data);
        }
      } catch (err) {
        console.error("Failed to load news from Supabase:", err);
      }
    };

    fetchAdminNews();
    return () => { isMounted = false; };
  }, []);

  const getArticleTitle = (art) => {
    if (!art || !art.title) return '';
    if (typeof art.title === 'object') {
      return art.title[lang] || art.title.uz || Object.values(art.title)[0] || '';
    }
    return art.title;
  };

  const getArticleContent = (art) => {
    if (!art) return [];
    if (art.content && typeof art.content === 'object' && !Array.isArray(art.content)) {
      return art.content[lang] || art.content.uz || [];
    }
    const rawContent = art.content || art.body || '';
    if (Array.isArray(rawContent)) return rawContent;
    if (typeof rawContent === 'string') {
      return rawContent.split('\n').filter(p => p.trim() !== '');
    }
    return [];
  };

  const getArticleBullets = (art) => {
    if (!art || !art.bullets) return null;
    if (typeof art.bullets === 'object' && !Array.isArray(art.bullets)) {
      return art.bullets[lang] || art.bullets.uz || null;
    }
    if (Array.isArray(art.bullets)) return art.bullets;
    return null;
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const isSelectedVideo = selectedArticle && (selectedArticle.mediaType === 'video' || isVideoMedia(selectedArticle.image));

  return (
    <section className="news section" id="news">
      <div className="container">
        <div className="section-header animate-in">
          <h2 className="section-title">{t('news.section_title') || (lang === 'uz' ? "Maktab Yangiliklari" : "School News")}</h2>
          <p className="section-subtitle">{t('news.section_subtitle') || (lang === 'uz' ? "Maktabimiz hayotida ro'y berayotgan eng so'nggi va muhim voqealar" : "The latest news and exciting highlights from our school community")}</p>
        </div>

        {/* Unified Responsive News Grid */}
        {newsList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748b' }}>
            <p style={{ fontSize: '1.1rem', margin: 0 }}>
              {lang === 'uz' ? "Hozircha e'lon qilingan yangiliklar yo'q." : "No published news articles yet."}
            </p>
          </div>
        ) : (
          <div className="news__grid">
            {newsList.map((art) => {
              const isCardVideo = art.mediaType === 'video' || isVideoMedia(art.image);
              return (
                <div className="news-card" key={art.id} onClick={() => setSelectedArticle(art)}>
                  <div className="news-card__img-wrap">
                    {isCardVideo ? (
                      <video
                        src={art.image}
                        muted
                        playsInline
                        preload="metadata"
                        className="news-card__media"
                      />
                    ) : (
                      <img
                        src={art.image}
                        alt={getArticleTitle(art)}
                        className="news-card__media"
                      />
                    )}
                    {isCardVideo && (
                      <span className="news-card__video-badge">
                        <FiPlay /> Video
                      </span>
                    )}
                  </div>
                  <div className="news-card__body">
                    <div className="news-card__badges">
                      <span className="news-card__badge">
                        <FiCalendar /> {art.date}
                      </span>
                      <span className="news-card__badge news-card__badge--views">
                        <FiEye /> {art.views || 0}
                      </span>
                      <span className="news-card__badge news-card__badge--likes">
                        <FiHeart /> {art.likes || 0}
                      </span>
                    </div>
                    <h3 className="news-card__title">{getArticleTitle(art)}</h3>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ============================================
          ARTICLE READER MODAL (Al-Beruniy Style)
          ============================================ */}
      {selectedArticle && (
        <div className="reader-modal__backdrop" onClick={() => setSelectedArticle(null)}>
          <div className="reader-modal__content" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button
              className="reader-modal__close"
              onClick={() => setSelectedArticle(null)}
              aria-label="Close modal"
            >
              <FiX />
            </button>

            {/* Top Banner (Image with overlay or Video player) */}
            {isSelectedVideo ? (
              <>
                <div className="reader-modal__banner reader-modal__banner--video">
                  <video
                    src={selectedArticle.image}
                    controls
                    autoPlay
                    playsInline
                    className="reader-modal__video"
                  />
                </div>
                <div className="reader-modal__video-title-wrap">
                  <h2 className="reader-modal__title reader-modal__title--video">{getArticleTitle(selectedArticle)}</h2>
                </div>
              </>
            ) : (
              <div className="reader-modal__banner">
                <img src={selectedArticle.image} alt={getArticleTitle(selectedArticle)} />
                <div className="reader-modal__banner-overlay">
                  <h2 className="reader-modal__title">{getArticleTitle(selectedArticle)}</h2>
                </div>
              </div>
            )}

            {/* Meta Bar */}
            <div className="reader-modal__meta">
              <div className="reader-modal__meta-left" style={{ flexWrap: 'wrap' }}>
                <span className="reader-modal__meta-pill">
                  <FiCalendar /> {selectedArticle.date}
                </span>
                <span className="reader-modal__meta-pill" style={{ background: '#e0f2fe', color: '#0369a1', borderColor: '#bae6fd' }}>
                  <FiEye /> {selectedArticle.views || 0} {t('news_misc.views', "ko'rishlar")}
                </span>
                <span className="reader-modal__meta-pill" style={{ background: '#ffe4e6', color: '#e11d48', borderColor: '#fecdd3' }}>
                  <FiHeart /> {selectedArticle.likes || 0} {t('news_misc.likes', "yoqdi")}
                </span>
              </div>
              <button className="reader-modal__share-btn" onClick={handleShare}>
                {copied ? <FiCheck /> : <FiShare2 />}
                {copied ? t('news_misc.copied', "Nusxalandi!") : t('news_misc.share', "Ulashish")}
              </button>
            </div>

            {/* Article Body Content */}
            <div className="reader-modal__body">
              {getArticleContent(selectedArticle).map((para, i) => (
                <p key={i}>{para}</p>
              ))}

              {/* Bullet Points with Emojis */}
              {getArticleBullets(selectedArticle) && (
                <ul>
                  {getArticleBullets(selectedArticle).map((b, i) => (
                    <li key={i}>
                      <span>{b.icon || '📌'}</span>
                      <div>{b.text || b}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
