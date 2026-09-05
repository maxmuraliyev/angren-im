import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

export default function ManageSettings() {
  const [admissionActive, setAdmissionActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('site_data')
      .select('data')
      .eq('id', 'settings')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error(error);
    }

    if (data && data.data) {
      if (typeof data.data.admissionActive !== 'undefined') {
        setAdmissionActive(data.data.admissionActive);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (newStatus) => {
    setSaving(true);
    setMessage('');

    try {
      const updatedData = { admissionActive: newStatus };

      const { error: upsertError } = await supabase
        .from('site_data')
        .upsert({ id: 'settings', data: updatedData });

      if (upsertError) throw upsertError;

      setAdmissionActive(newStatus);
      setMessage("Sozlamalar muvaffaqiyatli saqlandi!");

    } catch (error) {
      console.error(error);
      setMessage("Error: Saqlashda xatolik yuz berdi: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>Manage Site Settings</h2>
      
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
        <h3>Qabul mavsumi holati (Admission Season)</h3>
        <p style={{ color: '#666', marginBottom: '1.5rem' }}>
          Maktabga o'quvchilarni qabul qilish ochiq yoki yopiq ekanligini belgilang. Agar yopiq qilib belgilasangiz, saytdagi "Ariza topshirish" tugmasi ishlamaydi va o'rnida "Keyingi qabul" yozuvi paydo bo'ladi.
        </p>
        
        {loading ? (
          <p>Yuklanmoqda...</p>
        ) : (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button 
              onClick={() => handleSave(true)}
              disabled={saving}
              style={{ 
                backgroundColor: admissionActive ? '#16a34a' : '#e5e7eb', 
                color: admissionActive ? 'white' : '#374151', 
                padding: '0.75rem 1.5rem', 
                border: 'none', 
                borderRadius: '4px',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                flex: 1
              }}
            >
              Qabul Ochiq (Active)
            </button>
            <button 
              onClick={() => handleSave(false)}
              disabled={saving}
              style={{ 
                backgroundColor: !admissionActive ? '#dc2626' : '#e5e7eb', 
                color: !admissionActive ? 'white' : '#374151', 
                padding: '0.75rem 1.5rem', 
                border: 'none', 
                borderRadius: '4px',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                flex: 1
              }}
            >
              Qabul Yopiq (Closed)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
