import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabase';
import { validateImageFile, generateSecureFileName } from '../../utils/uploadSecurity';
import { TEACHER_CATEGORIES } from '../../data/teacherCategories';

export default function ManageTeachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [category, setCategory] = useState('matematika');
  const [phone, setPhone] = useState('');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  
  // New state for editing
  const [editingIndex, setEditingIndex] = useState(null);
  const fileInputRef = useRef(null);

  const fetchTeachers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('site_data')
      .select('data')
      .eq('id', 'teachers')
      .single();

    if (data && data.data && Array.isArray(data.data)) {
      setTeachers(data.data);
    } else {
      setTeachers([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    
    // In edit mode, file is optional. In add mode, file is required.
    if (!name || !role || (editingIndex === null && !file)) {
      setMessage('Error: Iltimos, barcha majburiy maydonlarni to\'ldiring.');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      let publicUrl = '';
      let filePath = '';

      if (file) {
        // Security: Validate file type, extension, and size
        const validation = validateImageFile(file);
        if (!validation.valid) {
          setMessage('Error: ' + validation.error);
          setSaving(false);
          return;
        }

        // 1. Upload new image to Supabase Storage
        const fileName = generateSecureFileName(file.name);
        filePath = `teachers/${fileName}`;

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

        // 2. Get public URL
        const { data: urlData } = supabase.storage
          .from('gallery')
          .getPublicUrl(filePath);
          
        publicUrl = urlData.publicUrl;
      } else if (editingIndex !== null) {
        // Keep existing photo if no new file is uploaded
        publicUrl = teachers[editingIndex].src;
        filePath = teachers[editingIndex].path;
      }

      // 3. Update database
      const newTeacher = { name, role, category, phone: phone || '', src: publicUrl, path: filePath };
      let updatedTeachers;

      if (editingIndex !== null) {
        // Edit mode
        updatedTeachers = [...teachers];
        updatedTeachers[editingIndex] = newTeacher;
      } else {
        // Add mode
        updatedTeachers = [...teachers, newTeacher];
      }

      const { error: dbError } = await supabase
        .from('site_data')
        .upsert({ id: 'teachers', data: updatedTeachers });

      if (dbError) throw dbError;

      setTeachers(updatedTeachers);
      resetForm();
      setMessage(editingIndex !== null ? 'O\'qituvchi ma\'lumotlari yangilandi!' : 'O\'qituvchi muvaffaqiyatli qo\'shildi!');
      
    } catch (err) {
      console.error(err);
      if (err.message && err.message.toLowerCase().includes('row-level security')) {
        setMessage("Xatolik (RLS Policy): Supabase bazasida rasm yuklash yoki saqlash uchun ruxsat yo'q.");
      } else {
        setMessage('Error: ' + err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (index) => {
    const t = teachers[index];
    setName(t.name || '');
    setRole(t.role || '');
    setCategory(t.category || 'matematika');
    setPhone(t.phone || '');
    setFile(null);
    setEditingIndex(index);
    setMessage('');
    
    // Clear file input visually
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setName('');
    setRole('');
    setCategory('matematika');
    setPhone('');
    setFile(null);
    setEditingIndex(null);
    setMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (indexToDelete, filePath) => {
    if (!window.confirm('Haqiqatan ham bu o\'qituvchini o\'chirmoqchimisiz?')) return;
    
    setSaving(true);
    try {
      // Delete from storage if possible
      if (filePath) {
        await supabase.storage.from('gallery').remove([filePath]);
      }

      const updatedTeachers = teachers.filter((_, index) => index !== indexToDelete);
      
      const { error: dbError } = await supabase
        .from('site_data')
        .upsert({ id: 'teachers', data: updatedTeachers });

      if (dbError) throw dbError;

      setTeachers(updatedTeachers);
      setMessage('O\'qituvchi o\'chirildi.');
      
      // If we were editing this teacher, reset form
      if (editingIndex === indexToDelete) {
        resetForm();
      } else if (editingIndex > indexToDelete) {
        setEditingIndex(editingIndex - 1);
      }
      
    } catch (err) {
      console.error(err);
      setMessage('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h2>Manage Teachers</h2>
      <p style={{ marginBottom: '2rem', color: '#666' }}>Yangi o'qituvchi qo'shish, o'zgartirish yoki o'chirish.</p>
      
      {message && (
        <div style={{ padding: '1rem', marginBottom: '1rem', backgroundColor: message.includes('Error') ? '#fdecea' : '#e8f5e9', color: message.includes('Error') ? '#c62828' : '#2e7d32', borderRadius: '4px' }}>
          {message}
        </div>
      )}

      <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '3rem', maxWidth: '600px' }}>
        <h3 style={{ marginTop: 0 }}>{editingIndex !== null ? 'O\'qituvchini Tahrirlash' : 'Yangi O\'qituvchi Qo\'shish'}</h3>
        <form onSubmit={handleAddTeacher} style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Ism va Familiya</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }}
              placeholder="Masalan: Jasur Xasanov"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Fani / Lavozimi</label>
            <input 
              type="text" 
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }}
              placeholder="Masalan: Matematika o'qituvchisi"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Fan bo'limi (Kategoriya)</label>
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              {TEACHER_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>📞 Telefon raqami (ixtiyoriy)</label>
            <input 
              type="text" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }}
              placeholder="Masalan: +998 90 123 45 67"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Rasm {editingIndex !== null && <span style={{ color: '#666', fontWeight: 'normal' }}>(Rasm o'zgarmasa, bo'sh qoldiring)</span>}
            </label>
            <input 
              type="file" 
              ref={fileInputRef}
              accept="image/*"
              onChange={(e) => setFile(e.target.files[0])}
            />
            {editingIndex !== null && teachers[editingIndex]?.src && !file && (
              <div style={{ marginTop: '0.5rem' }}>
                <img src={teachers[editingIndex].src} alt="Current" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button 
              type="submit" 
              disabled={saving}
              style={{ 
                flex: 1,
                padding: '0.75rem', 
                backgroundColor: '#27ae60', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: saving ? 'not-allowed' : 'pointer',
                fontWeight: 'bold'
              }}
            >
              {saving ? 'Saqlanmoqda...' : (editingIndex !== null ? 'O\'zgarishlarni Saqlash' : 'Qo\'shish')}
            </button>
            
            {editingIndex !== null && (
              <button 
                type="button" 
                onClick={resetForm}
                disabled={saving}
                style={{ 
                  flex: 1,
                  padding: '0.75rem', 
                  backgroundColor: '#94a3b8', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Bekor qilish
              </button>
            )}
          </div>
        </form>
      </div>

      <h3>Mavjud O'qituvchilar</h3>
      {loading ? (
        <p>Yuklanmoqda...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
          {teachers.map((teacher, index) => (
            <div key={index} style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden', paddingBottom: '1rem', textAlign: 'center', backgroundColor: editingIndex === index ? '#f0f9ff' : 'white' }}>
              <img src={teacher.src} alt={teacher.name} style={{ width: '100%', height: '220px', objectFit: 'cover', marginBottom: '0.5rem' }} />
              <h4 style={{ margin: '0.5rem' }}>{teacher.name}</h4>
              <p style={{ margin: '0 0.5rem 0.3rem', fontSize: '0.9rem', color: '#666' }}>{teacher.role}</p>
              {teacher.phone && (
                <p style={{ margin: '0 0.5rem 0.8rem', fontSize: '0.85rem', color: '#27ae60', fontWeight: 'bold' }}>📞 {teacher.phone}</p>
              )}
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem', padding: '0 0.5rem' }}>
                <button 
                  onClick={() => handleEditClick(index)}
                  disabled={saving}
                  style={{ flex: 1, backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '0.5rem', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Tahrirlash
                </button>
                <button 
                  onClick={() => handleDelete(index, teacher.path)}
                  disabled={saving}
                  style={{ flex: 1, backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '0.5rem', borderRadius: '4px', cursor: 'pointer' }}
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
