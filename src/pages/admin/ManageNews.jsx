import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabase';
import { validateMediaFile, generateSecureMediaFileName, isVideoMedia } from '../../utils/uploadSecurity';

export default function ManageNews() {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [titleUz, setTitleUz] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [date, setDate] = useState('');
  const [contentUz, setContentUz] = useState('');
  const [contentEn, setContentEn] = useState('');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  // Edit mode tracking
  const [editingId, setEditingId] = useState(null);
  const [existingImage, setExistingImage] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  // Live media preview for newly selected file
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  // Helper to format today's date as DD.MM.YYYY
  const getTodayFormatted = () => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const fetchNews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('site_data')
        .select('data')
        .eq('id', 'news')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching news from Supabase:", error);
      }

      if (data && data.data && Array.isArray(data.data)) {
        setNewsList(data.data);
      } else {
        setNewsList([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    setDate(getTodayFormatted());
  }, []);

  const resetForm = () => {
    setTitleUz('');
    setTitleEn('');
    setDate(getTodayFormatted());
    setContentUz('');
    setContentEn('');
    setFile(null);
    setPreviewUrl(null);
    setEditingId(null);
    setExistingImage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleStartEdit = (article) => {
    setEditingId(article.id);
    setTitleUz(typeof article.title === 'object' ? (article.title.uz || '') : article.title || '');
    setTitleEn(typeof article.title === 'object' ? (article.title.en || '') : '');
    setDate(article.date || getTodayFormatted());

    const getRawContent = (field) => {
      if (!field) return '';
      if (Array.isArray(field)) return field.join('\n\n');
      return String(field);
    };

    if (article.content && typeof article.content === 'object' && !Array.isArray(article.content)) {
      setContentUz(getRawContent(article.content.uz));
      setContentEn(getRawContent(article.content.en));
    } else {
      setContentUz(getRawContent(article.content || article.body));
      setContentEn('');
    }

    setExistingImage(article.image || '');
    setFile(null);
    setPreviewUrl(null);
    setMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!titleUz.trim()) {
      setMessage("Error: Yangilik sarlavhasi (O'zbekcha) majburiy.");
      return;
    }

    if (!contentUz.trim()) {
      setMessage("Error: Yangilik matni (O'zbekcha) majburiy.");
      return;
    }

    if (!file && !existingImage) {
      setMessage("Error: Iltimos, yangilik uchun rasm yoki video tanlang (*). Fayl yuklash majburiy.");
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      let mediaUrl = existingImage;
      let mediaPath = editingId ? (newsList.find(n => n.id === editingId)?.mediaPath || null) : null;

      // 1. Upload new media (image or video) if provided
      if (file) {
        const validation = validateMediaFile(file);
        if (!validation.valid) {
          setMessage('Error: ' + validation.error);
          setSaving(false);
          return;
        }

        const fileName = generateSecureMediaFileName(file.name);
        const filePath = `news/${fileName}`;
        mediaPath = filePath;

        let { error: uploadError } = await supabase.storage
          .from('gallery')
          .upload(filePath, file);

        // Auto-create bucket if missing
        if (uploadError && uploadError.message && uploadError.message.toLowerCase().includes('bucket not found')) {
          await supabase.storage.createBucket('gallery', { public: true });
          const retry = await supabase.storage.from('gallery').upload(filePath, file);
          uploadError = retry.error;
        }

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('gallery')
          .getPublicUrl(filePath);

        mediaUrl = urlData.publicUrl;
      }

      const isVideo = isVideoMedia(file ? file.name : mediaUrl);

      // Convert content to paragraph arrays
      const parseParagraphs = (txt) => {
        return txt
          .split('\n')
          .map(p => p.trim())
          .filter(p => p.length > 0);
      };

      // Generate random views (500-1500) and random likes (50-150) for new posts
      const randomViews = Math.floor(Math.random() * (1500 - 500 + 1)) + 500;
      const randomLikes = Math.floor(Math.random() * (150 - 50 + 1)) + 50;

      const articleObj = {
        id: editingId || `news-${Date.now()}`,
        date: date.trim() || getTodayFormatted(),
        views: editingId ? (newsList.find(n => n.id === editingId)?.views ?? randomViews) : randomViews,
        likes: editingId ? (newsList.find(n => n.id === editingId)?.likes ?? randomLikes) : randomLikes,
        image: mediaUrl,
        mediaPath: mediaPath,
        mediaType: isVideo ? 'video' : 'image',
        title: titleEn.trim() ? { uz: titleUz.trim(), en: titleEn.trim() } : titleUz.trim(),
        content: titleEn.trim() || contentEn.trim() 
          ? { uz: parseParagraphs(contentUz), en: parseParagraphs(contentEn) }
          : parseParagraphs(contentUz),
        created_at: new Date().toISOString()
      };

      let updatedList = [];
      if (editingId) {
        // Edit mode: replace article
        updatedList = newsList.map(item => item.id === editingId ? { ...item, ...articleObj } : item);
      } else {
        // Add mode: prepend to list
        updatedList = [articleObj, ...newsList];
      }

      const { error: upsertError } = await supabase
        .from('site_data')
        .upsert({ id: 'news', data: updatedList });

      if (upsertError) throw upsertError;

      setNewsList(updatedList);
      setMessage(editingId ? "Yangilik muvaffaqiyatli tahrirlandi!" : "Yangi yangilik muvaffaqiyatli qo'shildi!");
      resetForm();

    } catch (error) {
      console.error("Error saving news:", error);
      setMessage("Error: Saqlashda xatolik: " + (error.message || error));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (idToDelete) => {
    if (!window.confirm("Rostdan ham ushbu yangilikni o'chirmoqchimisiz?")) return;

    setSaving(true);
    setMessage('');

    try {
      const itemToDelete = newsList.find(item => item.id === idToDelete);

      // Delete media file from Supabase storage if available
      if (itemToDelete) {
        const pathToDel = itemToDelete.mediaPath || (
          itemToDelete.image && itemToDelete.image.includes('/gallery/')
            ? decodeURIComponent(itemToDelete.image.split('/gallery/').pop())
            : null
        );
        if (pathToDel) {
          try {
            await supabase.storage.from('gallery').remove([pathToDel]);
          } catch (storageErr) {
            console.warn("Could not delete media file from storage:", storageErr);
          }
        }
      }

      const updatedList = newsList.filter(item => item.id !== idToDelete);

      const { error } = await supabase
        .from('site_data')
        .upsert({ id: 'news', data: updatedList });

      if (error) throw error;

      setNewsList(updatedList);
      if (editingId === idToDelete) {
        resetForm();
      }
      setMessage("Yangilik muvaffaqiyatli o'chirildi.");
    } catch (error) {
      console.error("Error deleting news:", error);
      setMessage("Error: O'chirishda xatolik yuz berdi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h2 style={{ marginBottom: '1.5rem', color: '#1e293b' }}>Manage News (Yangiliklarni boshqarish)</h2>

      {message && (
        <div style={{
          padding: '1rem',
          marginBottom: '1.5rem',
          backgroundColor: message.startsWith('Error') ? '#fee2e2' : '#dcfce7',
          color: message.startsWith('Error') ? '#991b1b' : '#166534',
          borderRadius: '6px',
          fontWeight: '500'
        }}>
          {message}
        </div>
      )}

      {/* Form Card */}
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        marginBottom: '2.5rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, color: '#0f172a' }}>
            {editingId ? "Yangilikni tahrirlash" : "Yangi yangilik yozish"}
          </h3>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              style={{
                backgroundColor: '#94a3b8',
                color: 'white',
                border: 'none',
                padding: '0.4rem 0.8rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              Bekor qilish (Yangi qo'shish rejimiga o'tish)
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Title UZ */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 'bold', color: '#334155' }}>
              Sarlavha (O'zbekcha) (*)
            </label>
            <input
              type="text"
              value={titleUz}
              onChange={(e) => setTitleUz(e.target.value)}
              placeholder="Masalan: Maktabimiz o'quvchilari olimpiadada g'olib bo'ldi"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '1rem', boxSizing: 'border-box' }}
            />
          </div>

          {/* Title EN */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 'bold', color: '#334155' }}>
              Sarlavha (Inglizcha - Ixtiyoriy)
            </label>
            <input
              type="text"
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              placeholder="Title in English (Optional)"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '1rem', boxSizing: 'border-box' }}
            />
          </div>

          {/* Date */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 'bold', color: '#334155' }}>
              Sana (kun.oy.yil)
            </label>
            <input
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="07.09.2026"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '1rem', boxSizing: 'border-box' }}
            />
          </div>

          {/* Content UZ */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 'bold', color: '#334155' }}>
              Yangilik matni (O'zbekcha) (*)
            </label>
            <textarea
              rows="6"
              value={contentUz}
              onChange={(e) => setContentUz(e.target.value)}
              placeholder="Yangilik haqida to'liq matn. Har bir xatboshini (abzats) yangi qatordan yozing."
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '1rem', boxSizing: 'border-box', resize: 'vertical' }}
            />
          </div>

          {/* Content EN */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 'bold', color: '#334155' }}>
              Yangilik matni (Inglizcha - Ixtiyoriy)
            </label>
            <textarea
              rows="5"
              value={contentEn}
              onChange={(e) => setContentEn(e.target.value)}
              placeholder="Full article content in English (Optional)."
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '1rem', boxSizing: 'border-box', resize: 'vertical' }}
            />
          </div>

          {/* Media Upload (Image or Video) */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 'bold', color: '#334155' }}>
              Rasm yoki Video (*)
            </label>

            {/* If editing and keeping existing media without new upload */}
            {editingId && existingImage && !file && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                {isVideoMedia(existingImage) ? (
                  <video
                    src={existingImage}
                    muted
                    style={{ width: '90px', height: '60px', objectFit: 'cover', borderRadius: '4px', backgroundColor: '#000' }}
                  />
                ) : (
                  <img
                    src={existingImage}
                    alt="Current"
                    style={{ width: '90px', height: '60px', objectFit: 'cover', borderRadius: '4px' }}
                  />
                )}
                <div>
                  <span style={{ fontSize: '0.85rem', color: '#1e293b', fontWeight: 'bold', display: 'block' }}>
                    Hozirgi {isVideoMedia(existingImage) ? '🎬 Video' : '🖼️ Rasm'} saqlanmoqda
                  </span>
                  <small style={{ color: '#64748b' }}>
                    Yangi fayl tanlasangiz, avvalgisi yangisiga almashtiriladi.
                  </small>
                </div>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,video/*"
              required={!editingId && !existingImage}
              onChange={(e) => setFile(e.target.files[0] || null)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
            />
            <small style={{ color: '#64748b', display: 'block', marginTop: '4px' }}>
              Qo'llab-quvvatlanadi: Rasm (JPG, PNG, WebP maks 10MB) yoki Video (MP4, WebM, MOV maks 50MB). Fayl yuklash majburiy (*).
            </small>

            {/* Live Media Preview when user chooses a new file */}
            {file && previewUrl && (
              <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: isVideoMedia(file) ? '#0284c7' : '#15803d' }}>
                    {isVideoMedia(file) ? '🎬 Tanlangan Video:' : '🖼️ Tanlangan Rasm:'} {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                      padding: '2px 6px'
                    }}
                  >
                    ✕ Bekor qilish
                  </button>
                </div>
                {isVideoMedia(file) ? (
                  <video
                    src={previewUrl}
                    controls
                    style={{ maxWidth: '100%', maxHeight: '260px', borderRadius: '4px', backgroundColor: '#000', display: 'block' }}
                  />
                ) : (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    style={{ maxWidth: '100%', maxHeight: '260px', borderRadius: '4px', objectFit: 'contain', display: 'block' }}
                  />
                )}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={saving}
            style={{
              backgroundColor: editingId ? '#0284c7' : '#00357A',
              color: 'white',
              padding: '0.85rem 1.5rem',
              border: 'none',
              borderRadius: '6px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontSize: '1rem',
              width: '100%',
              transition: 'background-color 0.2s'
            }}
          >
            {saving ? 'Saqlanmoqda...' : editingId ? 'Yangilikni yangilash' : "Yangilikni chop etish"}
          </button>
        </form>
      </div>

      {/* Existing News List */}
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#0f172a' }}>
          Mavjud yangiliklar ro'yxati ({newsList.length})
        </h3>

        {loading ? (
          <p style={{ color: '#64748b' }}>Yuklanmoqda...</p>
        ) : newsList.length === 0 ? (
          <p style={{ color: '#64748b' }}>Hozircha admin orqali qo'shilgan yangiliklar yo'q. Yuqoridagi forma orqali yangi yangilik qo'shishingiz mumkin.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {newsList.map((item) => {
              const itemTitle = typeof item.title === 'object' ? (item.title.uz || item.title.en) : item.title;
              const rawBody = item.content || item.body || '';
              const snippet = Array.isArray(rawBody) ? rawBody[0] : (typeof rawBody === 'object' && rawBody.uz ? (Array.isArray(rawBody.uz) ? rawBody.uz[0] : rawBody.uz) : String(rawBody));
              const isVideo = item.mediaType === 'video' || isVideoMedia(item.image);

              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.25rem',
                    padding: '1rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    backgroundColor: editingId === item.id ? '#f0f9ff' : 'white'
                  }}
                >
                  {isVideo ? (
                    <div style={{ position: 'relative', width: '90px', height: '70px', flexShrink: 0, borderRadius: '4px', overflow: 'hidden', backgroundColor: '#000' }}>
                      <video
                        src={item.image}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        muted
                        playsInline
                      />
                      <span style={{
                        position: 'absolute',
                        bottom: '3px',
                        left: '3px',
                        background: 'rgba(0,0,0,0.75)',
                        color: 'white',
                        fontSize: '0.65rem',
                        fontWeight: 'bold',
                        padding: '1px 5px',
                        borderRadius: '3px'
                      }}>
                        ▶ Video
                      </span>
                    </div>
                  ) : (
                    <img
                      src={item.image || '/images/events/foto1.jpg'}
                      alt={itemTitle}
                      style={{ width: '90px', height: '70px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }}
                    />
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '1.05rem', color: '#1e293b' }}>
                      {itemTitle}
                    </h4>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'inline-block', marginBottom: '0.35rem' }}>
                      📅 {item.date}
                    </span>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {snippet}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                    <button
                      onClick={() => handleStartEdit(item)}
                      disabled={saving}
                      style={{
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        padding: '0.45rem 0.85rem',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: '500'
                      }}
                    >
                      Tahrirlash
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={saving}
                      style={{
                        backgroundColor: '#ef4444',
                        color: 'white',
                        padding: '0.45rem 0.85rem',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: '500'
                      }}
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
    </div>
  );
}
