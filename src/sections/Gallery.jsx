import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiZoomIn, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { supabase } from '../supabase';
import galleryPhotos from '../data/galleryPhotos';
import './Gallery.css';

export default function Gallery() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('all');
  const [lightbox, setLightbox] = useState({ isOpen: false, currentIndex: 0 });
  const [photos, setPhotos] = useState(galleryPhotos || []);

  useEffect(() => {
    async function fetchGallery() {
      try {
        const { data, error } = await supabase
          .from('site_data')
          .select('data')
          .eq('id', 'gallery')
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
          setPhotos(data.data);
        }
      } catch (err) {
        console.error("Error fetching gallery:", err);
      }
    }
    fetchGallery();
  }, []);

  const categories = [
    { id: 'all', label: 'gallery.filter_all' },
    { id: 'building', label: 'gallery.filter_building' },
    { id: 'classroom', label: 'gallery.filter_classroom' },
    { id: 'lab', label: 'gallery.filter_lab' },
    { id: 'library', label: 'gallery.filter_library' },
    { id: 'cafeteria', label: 'gallery.filter_cafeteria' },
    { id: 'sports', label: 'gallery.filter_sports' },
    { id: 'events', label: 'gallery.filter_events' },
    { id: 'olympiad', label: 'gallery.filter_olympiad' },
  ];

  const filteredPhotos = filter === 'all'
    ? photos
    : photos.filter(photo => photo.category === filter);

  const openLightbox = (index) => {
    setLightbox({ isOpen: true, currentIndex: index });
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightbox({ isOpen: false, currentIndex: 0 });
    document.body.style.overflow = '';
  };

  const nextImg = (e) => {
    e?.stopPropagation();
    setLightbox(prev => ({
      ...prev,
      currentIndex: (prev.currentIndex + 1) % filteredPhotos.length
    }));
  };

  const prevImg = (e) => {
    e?.stopPropagation();
    setLightbox(prev => ({
      ...prev,
      currentIndex: (prev.currentIndex - 1 + filteredPhotos.length) % filteredPhotos.length
    }));
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lightbox.isOpen) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextImg();
      if (e.key === 'ArrowLeft') prevImg();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightbox.isOpen, filteredPhotos.length]);

  return (
    <section className="gallery section" id="gallery">
      <div className="container">
        <div className="section-header animate-in">
          <h2 className="section-title">{t('gallery.section_title')}</h2>
          <p className="section-subtitle">{t('gallery.section_subtitle')}</p>
        </div>

        {/* Filters */}
        <div className="gallery__filters animate-in">
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`gallery__filter-btn ${filter === cat.id ? 'active' : ''}`}
              onClick={() => setFilter(cat.id)}
            >
              {t(cat.label)}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="gallery__grid animate-in">
          {filteredPhotos.map((photo, index) => {
            const spanClass =
              filteredPhotos.length > 4 && index < filteredPhotos.length - 2
                ? index % 7 === 0
                  ? 'gallery__item--wide'
                  : index % 7 === 3
                  ? 'gallery__item--tall'
                  : ''
                : '';

            return (
              <div
                key={`${photo.src}-${index}`}
                className={`gallery__item ${spanClass}`.trim()}
                onClick={() => openLightbox(index)}
              >
                <img src={photo.src} alt={photo.alt} loading="lazy" />
                <div className="gallery__item-overlay">
                  <FiZoomIn className="gallery__item-icon" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lightbox */}
      <div
        className={`gallery__lightbox ${lightbox.isOpen ? 'open' : ''}`}
        onClick={closeLightbox}
      >
        <button className="gallery__lightbox-close" onClick={closeLightbox}>
          <FiX />
        </button>
        
        {lightbox.isOpen && (
          <div className="gallery__lightbox-content" onClick={e => e.stopPropagation()}>
            <img
              src={filteredPhotos[lightbox.currentIndex].src}
              alt="Gallery Preview"
              className="gallery__lightbox-img"
            />
            
            {filteredPhotos.length > 1 && (
              <>
                <button className="gallery__lightbox-prev" onClick={prevImg}>
                  <FiChevronLeft />
                </button>
                <button className="gallery__lightbox-next" onClick={nextImg}>
                  <FiChevronRight />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
