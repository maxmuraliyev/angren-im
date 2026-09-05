import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { validateImageFile, generateSecureFileName } from '../../utils/uploadSecurity';
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
      setMessage('Xatolik: Iltimos, rasm yuklang.');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      // Security: Validate file type, extension, and size
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setMessage('Xatolik: ' + validation.error);
        setSaving(false);
        return;
      }

      const fileName = generateSecureFileName(file.name);
      const filePath = `gallery/${fileName}`;

      let { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(filePath, file);

      if (uploadError && uploadError.message && uploadError.message.toLowerCase().includes('bucket not found')) {
        await supabase.storage.createBucket('gallery', { public: true });
        const retry = await supabase.storage.from('gallery').upload(filePath, file);
        uploadError = retry.error;
        if (uploadError && uploadError.message && uploadError.message.toLowerCase().includes('bucket not found')) {
          throw new Error("Supabase Storage'da 'gallery' nomli korzinka (bucket) topilmadi. Iltimos, Supabase boshqaruv panelingizdan (Dashboard -> Storage -> New bucket) 'gallery' nomli Public bucket yarating yoki supabase_setup.sql faylidagi 6-bo'limni SQL Editor'da ishga tushiring.");
        }
      }

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('gallery')
        .getPublicUrl(filePath);

      const newPhoto = { src: publicUrl, category, alt: alt || 'Maktab rasmi', path: filePath };
      const updatedPhotos = [newPhoto, ...photos];

      const { error: dbError } = await supabase
        .from('site_data')
        .upsert({ id: 'gallery', data: updatedPhotos });

      if (dbError) throw dbError;

      setPhotos(updatedPhotos);
      setAlt('');
      setFile(null);
      setMessage("Rasm gallereyaga muvaffaqiyatli qo'shildi!");
      
      const fileInput = document.getElementById('galleryFile');
      if (fileInput) fileInput.value = '';
    } catch (err) {
      console.error(err);
      if (err.message && err.message.toLowerCase().includes('row-level security')) {
        setMessage("Xatolik (RLS Policy): Supabase bazasida rasm yuklash yoki saqlash uchun ruxsat yo'q. Iltimos, Supabase boshqaruv panelida (SQL Editor -> New query) loyihadagi yangilangan 'supabase_setup.sql' faylidagi kodni to'liq ko'chirib 'Run' qiling va Admin panelga qayta kirib ko'ring.");
      } else {
        setMessage('Xatolik: ' + err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (indexToDelete, filePath) => {
    if (!window.confirm("Haqiqatan ham bu rasmni gallereyadan o'chirmoqchimisiz?")) return;
    
    setSaving(true);
    try {
      if (filePath) {
        await supabase.storage.from('gallery').remove([filePath]);
      }

      const updatedPhotos = photos.filter((_, index) => index !== indexToDelete);
      
      const { error: dbError } = await supabase
        .from('site_data')
        .upsert({ id: 'gallery', data: updatedPhotos });

      if (dbError) throw dbError;

      setPhotos(updatedPhotos);
      setMessage("Rasm o'chirildi.");
    } catch (err) {
      console.error(err);
      setMessage('Xatolik: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h2>Gallereyani boshqarish (Manage Gallery)</h2>
      <p style={{ marginBottom: '2rem', color: '#666' }}>Yangi rasm qo'shish yoki mavjudlarini o'chirish. Ma'lumotlar avtomat ravishda Supabase bazasida saqlanadi.</p>
      
      {message && (
        <div style={{ padding: '1rem', marginBottom: '1rem', borderRadius: '4px', backgroundColor: message.includes('Xatolik') ? '#f8d7da' : '#d4edda', color: message.includes('Xatolik') ? '#721c24' : '#155724' }}>
          {message}
        </div>
      )}

      <form onSubmit={handleAddPhoto} style={{ display: 'grid', gap: '1rem', maxWidth: '500px', marginBottom: '3rem', padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Toifa (Kategoriya):</label>
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
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Rasm tavsifi (Alt text):</label>
          <input 
            type="text" 
            value={alt} 
            onChange={(e) => setAlt(e.target.value)} 
            placeholder="Masalan: Fizika laboratoriyasi mashg'ulotlari"
            style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Rasm fayli:</label>
          <input 
            type="file" 
            id="galleryFile"
            accept="image/*"
            onChange={(e) => setFile(e.target.files[0])}
            style={{ width: '100%' }}
          />
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
          {saving ? 'Yuklanmoqda va saqlanmoqda...' : "Rasm qo'shish"}
        </button>
      </form>

      <h3>Mavjud gallereya rasmlari ({photos.length} ta)</h3>
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
            return (
              <div key={index} style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden', paddingBottom: '1rem', textAlign: 'center', backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <img src={photo.src} alt={photo.alt} style={{ width: '100%', height: '160px', objectFit: 'cover', marginBottom: '0.5rem' }} />
                <span style={{ display: 'inline-block', backgroundColor: '#e2e8f0', color: '#475569', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  {displayCat}
                </span>
                <p style={{ margin: '0 0.5rem 1rem', fontSize: '0.9rem', color: '#333', minHeight: '35px' }}>{photo.alt}</p>
                <button 
                  onClick={() => handleDelete(index, photo.path)}
                  disabled={saving}
                  style={{ backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem' }}
                >
                  O'chirish
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
