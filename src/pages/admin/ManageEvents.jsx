import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { validateImageFile, generateSecureFileName } from '../../utils/uploadSecurity';

export default function ManageEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [datetime, setDatetime] = useState('');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('site_data')
      .select('data')
      .eq('id', 'events')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error(error);
    }

    if (data && data.data && Array.isArray(data.data)) {
      setEvents(data.data);
    } else {
      setEvents([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!name || !text || !datetime) {
      setMessage("Error: Barcha majburiy maydonlarni to'ldiring (Nomi, Matn, Sana/Vaqt).");
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      let imageUrl = null;

      // 1. Upload image if provided
      if (file) {
        // Security: Validate file type, extension, and size
        const validation = validateImageFile(file);
        if (!validation.valid) {
          setMessage('Error: ' + validation.error);
          setSaving(false);
          return;
        }

        const fileName = generateSecureFileName(file.name);
        const filePath = `events/${fileName}`;

        let { error: uploadError } = await supabase.storage
          .from('gallery')
          .upload(filePath, file);

        if (uploadError && uploadError.message && uploadError.message.toLowerCase().includes('bucket not found')) {
          await supabase.storage.createBucket('gallery', { public: true });
          const retry = await supabase.storage.from('gallery').upload(filePath, file);
          uploadError = retry.error;
        }

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('gallery')
          .getPublicUrl(filePath);

        imageUrl = urlData.publicUrl;
      }

      // 2. Add to existing events list
      const newEvent = {
        id: Date.now().toString(),
        name,
        text,
        datetime,
        src: imageUrl
      };

      const updatedEvents = [newEvent, ...events];

      const { error: upsertError } = await supabase
        .from('site_data')
        .upsert({ id: 'events', data: updatedEvents });

      if (upsertError) throw upsertError;

      setEvents(updatedEvents);
      setName('');
      setText('');
      setDatetime('');
      setFile(null);
      setMessage("Tadbir muvaffaqiyatli qo'shildi!");

    } catch (error) {
      console.error(error);
      setMessage("Error: Saqlashda xatolik yuz berdi: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (idToDelete) => {
    if (!window.confirm("Rostdan ham ushbu tadbirni o'chirmoqchimisiz?")) return;
    
    setSaving(true);
    setMessage('');

    try {
      const updatedEvents = events.filter(e => e.id !== idToDelete);
      
      const { error } = await supabase
        .from('site_data')
        .upsert({ id: 'events', data: updatedEvents });

      if (error) throw error;
      
      setEvents(updatedEvents);
      setMessage("Tadbir o'chirildi.");
    } catch (error) {
      console.error(error);
      setMessage("Error: O'chirishda xatolik yuz berdi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>Manage Upcoming Events</h2>
      
      {message && (
        <div style={{ 
          padding: '1rem', 
          marginBottom: '1rem', 
          backgroundColor: message.startsWith('Error') ? '#fee2e2' : '#dcfce7',
          color: message.startsWith('Error') ? '#991b1b' : '#166534',
          borderRadius: '4px'
        }}>
          {message}
        </div>
      )}

      <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
        <h3>Yangi tadbir qo'shish</h3>
        <form onSubmit={handleAddEvent}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Tadbir nomi (*)</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }}
              placeholder="Masalan: Kuzgi olimpiada"
            />
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Tadbir qachon o'tadi? (*)</label>
            <input 
              type="datetime-local" 
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <small style={{ color: '#666', display: 'block', marginTop: '4px' }}>Shu vaqt kelganida, tadbir saytdan avtomatik o'chadi.</small>
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Tadbir haqida ma'lumot (*)</label>
            <textarea 
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows="4"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc', resize: 'vertical' }}
              placeholder="Tadbir haqida qisqacha ma'lumot..."
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Rasm (Ixtiyoriy)</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => setFile(e.target.files[0])}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          <button 
            type="submit" 
            disabled={saving}
            style={{ 
              backgroundColor: '#00357A', 
              color: 'white', 
              padding: '0.75rem 1.5rem', 
              border: 'none', 
              borderRadius: '4px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              width: '100%'
            }}
          >
            {saving ? 'Saqlanmoqda...' : 'Tadbirni qo\'shish'}
          </button>
        </form>
      </div>

      <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h3>Mavjud Tadbirlar ro'yxati</h3>
        {loading ? (
          <p>Yuklanmoqda...</p>
        ) : events.length === 0 ? (
          <p>Hozircha tadbirlar yo'q.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {events.map((ev) => {
              const isPast = new Date(ev.datetime) < new Date();
              return (
                <div key={ev.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem', border: '1px solid #eee', borderRadius: '4px', backgroundColor: isPast ? '#f9fafb' : 'white' }}>
                  {ev.src && (
                    <img src={ev.src} alt={ev.name} style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px' }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 0.5rem 0' }}>
                      {ev.name}
                      {isPast && <span style={{ marginLeft: '10px', fontSize: '0.8rem', color: '#991b1b', backgroundColor: '#fee2e2', padding: '2px 6px', borderRadius: '4px' }}>Vaqti o'tgan</span>}
                    </h4>
                    <p style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.9rem' }}>Vaqt: {new Date(ev.datetime).toLocaleString('uz-UZ')}</p>
                    <p style={{ margin: '0 0 0.5rem 0' }}>{ev.text}</p>
                  </div>
                  <button 
                    onClick={() => handleDelete(ev.id)}
                    disabled={saving}
                    style={{ 
                      backgroundColor: '#ef4444', 
                      color: 'white', 
                      padding: '0.5rem 1rem', 
                      border: 'none', 
                      borderRadius: '4px',
                      cursor: saving ? 'not-allowed' : 'pointer'
                    }}
                  >
                    O'chirish
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
