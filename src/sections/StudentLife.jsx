import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabase';
import './StudentLife.css';

/* ---- Default fallback photos ---- */
const DEFAULT_PHOTOS = [
  '/images/events/foto.jpg',
  '/images/events/foto1.jpg',
  '/images/events/foto2.jpg',
  '/images/events/foto3.jpg',
  '/images/events/foto4.jpg',
  '/images/events/foto5.jpg',
  '/images/sports/sport1.jpg',
  '/images/sports/sport2.jpg',
  '/images/classrooms/dars1.jpg',
  '/images/classrooms/dars2.jpg',
  '/images/classrooms/dars3.jpg',
  '/images/labs/Biologiya 1.jpg',
  '/images/labs/Fizika 6.jpg',
  '/images/labs/Fizika 8.jpg',
  '/images/labs/Komp 1.jpg',
  '/images/labs/Komp2.jpg',
  '/images/library/Kutubxona 1.jpg',
  '/images/library/Kutubxona 2.jpg',
  '/images/library/Kutub xona 3.jpg',
  '/images/building/Kirish.jpg',
  '/images/building/bino.jpg',
  '/images/building/Stella 1.jpg',
  '/images/cafeteria/Oshxona 1.jpg',
  '/images/cafeteria/Oshxona 2.jpg',
];

const CELL_COUNT = 6;

/* Shuffle helper */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* Category definitions */
const CATEGORIES = [
  { id: 'events' },
  { id: 'sports' },
  { id: 'clubs' },
  { id: 'achievements' },
];

/**
 * A single collage cell with two <img> layers that crossfade.
 * When `src` changes, the new src loads into the "behind" layer,
 * then we swap which layer is front/behind.
 */
function CollageCell({ src }) {
  const [layers, setLayers] = useState({ front: src, behind: src });
  const [flipped, setFlipped] = useState(false);
  const prevSrc = useRef(src);

  useEffect(() => {
    if (src === prevSrc.current) return;
    prevSrc.current = src;

    // Load the behind layer first, then flip
    setLayers((prev) => ({ ...prev, behind: src }));
    const t = setTimeout(() => {
      setFlipped((f) => !f);
      // After transition, sync both layers
      const t2 = setTimeout(() => {
        setLayers({ front: src, behind: src });
        setFlipped(false);
      }, 1400);
      return () => clearTimeout(t2);
    }, 60);
    return () => clearTimeout(t);
  }, [src]);

  return (
    <div className="studentlife__cell">
      <img
        src={layers.front}
        alt=""
        className={flipped ? 'sl-behind' : 'sl-front'}
      />
      <img
        src={layers.behind}
        alt=""
        className={flipped ? 'sl-front' : 'sl-behind'}
      />
    </div>
  );
}

export default function StudentLife() {
  const { t } = useTranslation();
  const poolRef = useRef(DEFAULT_PHOTOS);
  const [photos, setPhotos] = useState(() => shuffle(DEFAULT_PHOTOS).slice(0, CELL_COUNT));

  /* Fetch admin-managed photos from Supabase */
  useEffect(() => {
    async function fetchPhotos() {
      try {
        if (!supabase) return;
        const { data, error } = await supabase
          .from('site_data')
          .select('data')
          .eq('id', 'student_life_photos')
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
          const urls = data.data.map((p) => p.src);
          poolRef.current = urls;
          setPhotos(shuffle(urls).slice(0, CELL_COUNT));
        }
      } catch (err) {
        console.error('Error fetching student life photos:', err);
      }
    }
    fetchPhotos();
  }, []);

  /* Randomly swap ONE cell every ~2.5s */
  const swap = useCallback(() => {
    const pool = poolRef.current;
    if (pool.length <= CELL_COUNT) return;
    setPhotos((prev) => {
      const idx = Math.floor(Math.random() * CELL_COUNT);
      const available = pool.filter((p) => !prev.includes(p));
      if (available.length === 0) return prev;
      const next = [...prev];
      next[idx] = available[Math.floor(Math.random() * available.length)];
      return next;
    });
  }, []);

  useEffect(() => {
    const id = setInterval(swap, 2500);
    return () => clearInterval(id);
  }, [swap]);

  return (
    <section className="studentlife section" id="studentlife">
      <div className="container">
        <div className="section-header animate-in">
          <h2 className="section-title">{t('studentlife.section_title')}</h2>
          <p className="section-subtitle">{t('studentlife.section_subtitle')}</p>
        </div>

        <div className="studentlife__layout animate-in">
          {/* Left: Category labels + descriptions */}
          <div className="studentlife__categories">
            {CATEGORIES.map((cat) => (
              <div className="studentlife__cat" key={cat.id}>
                <div className="studentlife__cat-name">
                  {t(`studentlife.tab_${cat.id}`)}
                </div>
                <div className="studentlife__cat-desc">
                  {t(`studentlife.${cat.id}_text`)}
                </div>
              </div>
            ))}
          </div>

          {/* Right: Asymmetric photo collage */}
          <div className="studentlife__collage">
            {photos.map((src, i) => (
              <CollageCell key={i} src={src} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
