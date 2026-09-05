import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { validateImageFile, generateSecureFileName } from '../../utils/uploadSecurity';

export default function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  const fetchStudents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('site_data')
      .select('data')
      .eq('id', 'students')
      .single();

    if (data && data.data && Array.isArray(data.data)) {
      setStudents(data.data);
    } else {
      setStudents([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!name || !file) {
      setMessage("Error: Iltimos, o'quvchi ismini yozing va rasm yuklang.");
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      // Security: Validate file type, extension, and size
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setMessage('Error: ' + validation.error);
        setSaving(false);
        return;
      }

      // 1. Upload image
      const fileName = generateSecureFileName(file.name);
      const filePath = `students/${fileName}`;

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

      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('gallery')
        .getPublicUrl(filePath);

      // 3. Update database
      const newStudent = { name, text: text || '', title: name, src: publicUrl, path: filePath };
      const updatedStudents = [...students, newStudent];

      const { error: dbError } = await supabase
        .from('site_data')
        .upsert({ id: 'students', data: updatedStudents });

      if (dbError) throw dbError;

      setStudents(updatedStudents);
      setName('');
      setText('');
      setFile(null);
      setMessage("O'quvchi muvaffaqiyatli qo'shildi!");
      
      // Reset file input
      document.getElementById('studentFile').value = '';
    } catch (err) {
      console.error(err);
      if (err.message && err.message.toLowerCase().includes('row-level security')) {
        setMessage("Xatolik (RLS Policy): Supabase bazasida rasm yuklash yoki saqlash uchun ruxsat yo'q. Iltimos, Supabase boshqaruv panelida (SQL Editor -> New query) loyihadagi yangilangan 'supabase_setup.sql' faylidagi kodni to'liq ko'chirib 'Run' qiling va Admin panelga qayta kirib ko'ring.");
      } else {
        setMessage('Error: ' + err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (indexToDelete, filePath) => {
    if (!window.confirm('Haqiqatan ham bu rasmni o\'chirmoqchimisiz?')) return;
    
    setSaving(true);
    try {
      if (filePath) {
        await supabase.storage.from('gallery').remove([filePath]);
      }

      const updatedStudents = students.filter((_, index) => index !== indexToDelete);
      
      const { error: dbError } = await supabase
        .from('site_data')
        .upsert({ id: 'students', data: updatedStudents });

      if (dbError) throw dbError;

      setStudents(updatedStudents);
      setMessage('Rasm o\'chirildi.');
    } catch (err) {
      console.error(err);
      setMessage('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h2>Manage Students</h2>
      <p style={{ marginBottom: '2rem', color: '#666' }}>O'quvchilar hayotidan lavhalar qo'shish yoki o'chirish.</p>
      
      {message && (
        <div style={{ padding: '1rem', marginBottom: '1rem', backgroundColor: message.includes('Error') ? '#fdecea' : '#e8f5e9', color: message.includes('Error') ? '#c62828' : '#2e7d32', borderRadius: '4px' }}>
          {message}
        </div>
      )}

      <form onSubmit={handleAddStudent} style={{ display: 'grid', gap: '1rem', marginBottom: '3rem', maxWidth: '500px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>O'quvchining ismi (F.I.Sh.)</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }}
            placeholder="Masalan: Alisher Navoiy"
            required
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Matn (Izoh yoki ma'lumot)</label>
          <textarea 
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc', minHeight: '80px', fontFamily: 'inherit' }}
            placeholder="Masalan: Xalqaro matematika olimpiadasi g'olibasi..."
            required
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Rasm</label>
          <input 
            type="file" 
            id="studentFile"
            accept="image/*"
            onChange={(e) => setFile(e.target.files[0])}
            required
          />
        </div>
        <button 
          type="submit" 
          disabled={saving}
          style={{ 
            padding: '0.75rem', 
            backgroundColor: '#27ae60', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: saving ? 'not-allowed' : 'pointer' 
          }}
        >
          {saving ? 'Saqlanmoqda...' : "Qo'shish"}
        </button>
      </form>

      <h3>Mavjud O'quvchilar</h3>
      {loading ? (
        <p>Yuklanmoqda...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem', marginTop: '1rem' }}>
          {students.map((student, index) => (
            <div key={index} style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden', paddingBottom: '1rem', textAlign: 'center', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <img src={student.src} alt={student.name || student.title} style={{ width: '100%', height: '160px', objectFit: 'cover', marginBottom: '0.5rem' }} />
              <h4 style={{ margin: '0.5rem 0.5rem 0.3rem', color: '#00357A', fontSize: '1.1rem' }}>{student.name || student.title}</h4>
              {student.text && <p style={{ margin: '0 0.75rem 1rem', fontSize: '0.88rem', color: '#555', lineHeight: '1.4', maxHeight: '60px', overflow: 'hidden' }}>{student.text}</p>}
              <button 
                onClick={() => handleDelete(index, student.path)}
                disabled={saving}
                style={{ backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}
              >
                O'chirish
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
