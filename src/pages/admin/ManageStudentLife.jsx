import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { validateMediaFile, generateSecureMediaFileName, sanitizeMediaUrl } from '../../utils/uploadSecurity';

/* Default fallback photos (same as in StudentLife.jsx) */
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

const SUPABASE_KEY = 'student_life_photos';

export default function ManageStudentLife() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState(null);
  const [alt, setAlt] = useState('');
  const [message, setMessage] = useState('');

  /* ---- Fetch ---- */
  const fetchPhotos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('site_data')
        .select('data')
        .eq('id', SUPABASE_KEY)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
        setPhotos(data.data);
      } else {
        // First time: seed with defaults
        setPhotos(DEFAULT_PHOTOS.map((src) => ({ src, alt: 'Maktab rasmi' })));
      }
    } catch (err) {
      console.error('Error fetching student life photos:', err);
      setPhotos(DEFAULT_PHOTOS.map((src) => ({ src, alt: 'Maktab rasmi' })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  /* ---- Save to DB ---- */
  const saveToDb = async (updatedPhotos) => {
    const { error } = await supabase
      .from('site_data')
      .upsert({ id: SUPABASE_KEY, data: updatedPhotos });
    if (error) throw error;
  };

  /* ---- Add Photo ---- */
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage("Xatolik: Iltimos, rasm fayl tanlang.");
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const validation = validateMediaFile(file);
      if (!validation.valid) {
        setMessage('Xatolik: ' + validation.error);
        setSaving(false);
        return;
      }

      const fileName = generateSecureMediaFileName(file.name);
      const filePath = `student-life/${fileName}`;

      let { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(filePath, file);

      if (uploadError && uploadError.message && uploadError.message.toLowerCase().includes('bucket not found')) {
        await supabase.storage.createBucket('gallery', { public: true });
        const retry = await supabase.storage.from('gallery').upload(filePath, file);
        uploadError = retry.error;
      }

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('gallery')
        .getPublicUrl(filePath);

      const newPhoto = {
        src: sanitizeMediaUrl(publicUrl),
        alt: (alt || 'Maktab hayoti rasmi').trim().slice(0, 200),
        path: filePath,
      };

      const updatedPhotos = [newPhoto, ...photos];
      await saveToDb(updatedPhotos);

      setPhotos(updatedPhotos);
      setAlt('');
      setFile(null);
      setMessage("Rasm muvaffaqiyatli qo'shildi!");

      const fileInput = document.getElementById('studentLifeFile');
      if (fileInput) fileInput.value = '';
    } catch (err) {
      console.error(err);
      if (err.message && err.message.toLowerCase().includes('row-level security')) {
        setMessage("Xatolik (RLS Policy): Supabase bazasida rasm saqlash uchun ruxsat yo'q.");
      } else {
        setMessage('Xatolik: ' + err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  /* ---- Delete Photo ---- */
  const handleDelete = async (indexToDelete) => {
    if (!window.confirm("Rostdan ham ushbu rasmni o'chirmoqchimisiz?")) return;

    setSaving(true);
    setMessage('');

    try {
      const photo = photos[indexToDelete];

      // Delete from storage if uploaded via admin
      if (photo.path) {
        await supabase.storage.from('gallery').remove([photo.path]);
      }

      const updatedPhotos = photos.filter((_, idx) => idx !== indexToDelete);
      await saveToDb(updatedPhotos);

      setPhotos(updatedPhotos);
      setMessage("Rasm o'chirildi.");
    } catch (err) {
      console.error(err);
      setMessage("Xatolik: O'chirishda xatolik yuz berdi.");
    } finally {
      setSaving(false);
    }
  };

  /* ---- Styles ---- */
  const s = {
    card: {
      backgroundColor: 'white',
      padding: '2rem',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      marginBottom: '2rem',
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      borderRadius: '4px',
      border: '1px solid #ccc',
      boxSizing: 'border-box',
    },
    btnPrimary: {
      width: '100%',
      padding: '0.75rem',
      backgroundColor: '#27ae60',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: saving ? 'not-allowed' : 'pointer',
      fontWeight: 'bold',
      fontSize: '0.95rem',
    },
    btnDelete: {
      backgroundColor: '#e74c3c',
      color: 'white',
      border: 'none',
      padding: '0.5rem 1rem',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '0.85rem',
      width: '90%',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: '1.25rem',
      marginTop: '1.5rem',
    },
    imgCard: {
      border: '1px solid #eee',
      borderRadius: '8px',
      overflow: 'hidden',
      paddingBottom: '0.75rem',
      textAlign: 'center',
      backgroundColor: '#fff',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    },
    imgWrap: {
      width: '100%',
      height: '150px',
      backgroundColor: '#f1f5f9',
      overflow: 'hidden',
    },
    img: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    },
    badge: {
      display: 'inline-block',
      backgroundColor: '#e2e8f0',
      color: '#475569',
      padding: '0.2rem 0.6rem',
      borderRadius: '12px',
      fontSize: '0.75rem',
      fontWeight: 'bold',
      margin: '0.5rem 0',
    },
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '3rem' }}>
      <h2>Maktab hayoti rasmlarini boshqarish</h2>
      <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
        Bu yerda "Maktab hayoti" bo'limidagi kollaj rasmlarini qo'shish va o'chirish mumkin. Rasmlar sahifada tasodifiy almashtiriladi.
      </p>

      {/* Message */}
      {message && (
        <div style={{
          padding: '1rem',
          marginBottom: '1rem',
          backgroundColor: message.startsWith('Xatolik') ? '#fee2e2' : '#dcfce7',
          color: message.startsWith('Xatolik') ? '#991b1b' : '#166534',
          borderRadius: '4px',
        }}>
          {message}
        </div>
      )}

      {/* Add Form */}
      <form onSubmit={handleAdd} style={{ ...s.card, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3>Yangi rasm qo'shish</h3>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Rasm tavsifi (ixtiyoriy):
          </label>
          <input
            type="text"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            placeholder="Masalan: Sport musobaqasi 2026"
            style={s.input}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Rasm fayli (*):
          </label>
          <input
            type="file"
            id="studentLifeFile"
            accept="image/*"
            onChange={(e) => setFile(e.target.files[0])}
            style={{ width: '100%' }}
          />
          <small style={{ color: '#64748b', display: 'block', marginTop: '4px' }}>
            Qo'llab-quvvatlanadi: JPG, PNG, WebP, GIF (maks. 10MB).
          </small>
        </div>
        <button type="submit" disabled={saving} style={s.btnPrimary}>
          {saving ? 'Yuklanmoqda...' : "Rasmni qo'shish"}
        </button>
      </form>

      {/* Photo Grid */}
      <h3>Mavjud rasmlar ({photos.length} ta)</h3>
      {loading ? (
        <p>Yuklanmoqda...</p>
      ) : (
        <div style={s.grid}>
          {photos.map((photo, index) => (
            <div key={index} style={s.imgCard}>
              <div style={s.imgWrap}>
                <img
                  src={photo.src}
                  alt={photo.alt || 'Rasm'}
                  style={s.img}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
              <div style={{ padding: '0 0.5rem' }}>
                {photo.path && (
                  <span style={s.badge}>Yuklangan</span>
                )}
                {!photo.path && (
                  <span style={{ ...s.badge, backgroundColor: '#dbeafe', color: '#1e40af' }}>Mahalliy</span>
                )}
                <p style={{ margin: '0.25rem 0 0.5rem', fontSize: '0.8rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {photo.alt || 'Tavsif yo\'q'}
                </p>
                <button
                  onClick={() => handleDelete(index)}
                  disabled={saving}
                  style={s.btnDelete}
                >
                  O'chirish
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
