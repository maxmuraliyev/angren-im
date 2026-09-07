import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { validateMediaFile, generateSecureMediaFileName, isVideoMedia } from '../../utils/uploadSecurity';
import galleryPhotos from '../../data/galleryPhotos';

export default function ManageGallery() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [category, setCategory] = useState('building');
  const [alt, setAlt] = useState('');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  const fetchPhotos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('site_data')
      .select('data')
      .eq('id', 'gallery')
      .single();

    if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
      setPhotos(data.data);
    } else {
      setPhotos(galleryPhotos || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  const handleAddPhoto = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage('Xatolik: Iltimos, rasm yoki video fayl tanlang.');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      // Security: Validate file type, extension, and size
      const validation = validateMediaFile(file);
      if (!validation.valid) {
        setMessage('Xatolik: ' + validation.error);
        setSaving(false);
        return;
      }

      const isVideo = isVideoMedia(file);
      const fileName = generateSecureMediaFileName(file.name);
      const filePath = isVideo ? `gallery/videos/${fileName}` : `gallery/${fileName}`;

      let { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(filePath, file);

      if (uploadError && uploadError.message && uploadError.message.toLowerCase().includes('bucket not found')) {
        await supabase.storage.createBucket('gallery', { public: true });
        const retry = await supabase.storage.from('gallery').upload(filePath, file);
        uploadError = retry.error;
        if (uploadError && uploadError.message && uploadError.message.toLowerCase().includes('bucket not found')) {
          throw new Error("Supabase Storage'da 'gallery' nomli korzinka (bucket) topilmadi.");
        }
      }

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('gallery')
        .getPublicUrl(filePath);

      const newMedia = {
        src: publicUrl,
        category,
        alt: alt || (isVideo ? 'Maktab videosi' : 'Maktab rasmi'),
        path: filePath,
        type: isVideo ? 'video' : 'image'
      };
      const updatedPhotos = [newMedia, ...photos];

      const { error: dbError } = await supabase
        .from('site_data')
        .upsert({ id: 'gallery', data: updatedPhotos });

      if (dbError) throw dbError;

      setPhotos(updatedPhotos);
      setAlt('');
      setFile(null);
      setMessage(isVideo ? "Video gallereyaga muvaffaqiyatli qo'shildi!" : "Rasm gallereyaga muvaffaqiyatli qo'shildi!");
      
      const fileInput = document.getElementById('galleryFile');
      if (fileInput) fileInput.value = '';
    } catch (err) {
      console.error(err);
      if (err.message && err.message.toLowerCase().includes('row-level security')) {
        setMessage("Xatolik (RLS Policy): Supabase bazasida rasm/video saqlash uchun ruxsat yo'q.");
      } else {
        setMessage('Xatolik: ' + err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (indexToDelete, filePath) => {
    if (!window.confirm("Rostdan ham ushbu media faylni o'chirmoqchimisiz?")) return;

    setSaving(true);
    setMessage('');

    try {
      // 1. Delete from Storage if it has a custom path in Supabase
      if (filePath) {
        await supabase.storage
          .from('gallery')
          .remove([filePath]);
      }

      // 2. Delete from Database array
      const updatedPhotos = photos.filter((_, idx) => idx !== indexToDelete);

      const { error: dbError } = await supabase
        .from('site_data')
        .upsert({ id: 'gallery', data: updatedPhotos });

      if (dbError) throw dbError;

      setPhotos(updatedPhotos);
      setMessage("Fayl gallereyadan o'chirildi.");
    } catch (err) {
      console.error(err);
      setMessage("Xatolik: O'chirishda xatolik yuz berdi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '3rem' }}>
      <h2>Manage Gallery (Gallereyani boshqarish)</h2>
      
      {message && (
        <div style={{ 
          padding: '1rem', 
          marginBottom: '1rem', 
          backgroundColor: message.startsWith('Xatolik') ? '#fee2e2' : '#dcfce7',
          color: message.startsWith('Xatolik') ? '#991b1b' : '#166534',
          borderRadius: '4px'
        }}>
          {message}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleAddPhoto} style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3>Yangi rasm yoki video qo'shish</h3>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Kategoriya:</label>
          <select 
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="building">Bino va maydon (Building)</option>
            <option value="classroom">Sinfxonalar (Classroom)</option>
            <option value="lab">Laboratoriyalar (Lab)</option>
            <option value="library">Kutubxona (Library)</option>
            <option value="cafeteria">Oshxona (Cafeteria)</option>
            <option value="sports">Sport (Sports)</option>
            <option value="events">Tadbirlar (Events)</option>
            <option value="olympiad">Olimpiadalar (Olympiad)</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Media tavsifi (Alt text):</label>
          <input 
            type="text" 
            value={alt} 
            onChange={(e) => setAlt(e.target.value)} 
            placeholder="Masalan: Fizika laboratoriyasi mashg'ulotlari videosi"
            style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Rasm yoki Video fayli (*):</label>
          <input 
            type="file" 
            id="galleryFile"
            accept="image/*,video/*"
            onChange={(e) => setFile(e.target.files[0])}
            style={{ width: '100%' }}
          />
          <small style={{ color: '#64748b', display: 'block', marginTop: '4px' }}>
            Qo'llab-quvvatlanadi: Rasm (JPG, PNG, WebP, GIF - maks. 10MB) va Video (MP4, WebM, OGG, MOV - maks. 50MB).
          </small>
        </div>
        <button 
          type="submit" 
          disabled={saving}
          style={{ 
            width: '100%',
            padding: '0.75rem', 
            backgroundColor: '#27ae60', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: saving ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {saving ? 'Yuklanmoqda va saqlanmoqda...' : "Faylni gallereyaga qo'shish"}
        </button>
      </form>

      <h3>Mavjud gallereya fayllari ({photos.length} ta)</h3>
      {loading ? (
        <p>Yuklanmoqda...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
          {photos.map((photo, index) => {
            const catMap = {
              building: 'Bino va maydon',
              classroom: 'Sinfxonalar',
              lab: 'Laboratoriyalar',
              library: 'Kutubxona',
              cafeteria: 'Oshxona',
              sports: 'Sport',
              events: 'Tadbirlar',
              olympiad: 'Olimpiadalar'
            };
            const displayCat = catMap[photo.category] || (photo.category && photo.category.toUpperCase());
            const isVideo = photo.type === 'video' || isVideoMedia(photo.src);

            return (
              <div key={index} style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden', paddingBottom: '1rem', textAlign: 'center', backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ position: 'relative', width: '100%', height: '160px', backgroundColor: '#000', overflow: 'hidden' }}>
                  {isVideo ? (
                    <>
                      <video src={photo.src} muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <span style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: 'rgba(0,0,0,0.7)', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        🎥 Video
                      </span>
                    </>
                  ) : (
                    <img src={photo.src} alt={photo.alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                </div>
                <div style={{ padding: '0.5rem' }}>
                  <span style={{ display: 'inline-block', backgroundColor: '#e2e8f0', color: '#475569', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    {displayCat}
                  </span>
                  <p style={{ margin: '0 0.5rem 1rem', fontSize: '0.9rem', color: '#333', minHeight: '35px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {photo.alt}
                  </p>
                  <button 
                    onClick={() => handleDelete(index, photo.path)}
                    disabled={saving}
                    style={{ backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem', width: '90%' }}
                  >
                    O'chirish
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
