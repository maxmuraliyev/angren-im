import React, { useState } from 'react';
import { supabase } from '../../supabase';
import * as XLSX from 'xlsx';

export default function ManageTimetable() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setLoading(true);
        setMessage('');

        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // We use raw:false to keep dates/times as strings if formatted as such
        const jsonRaw = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
        
        // 1. Find Header Row
        let headerRowIndex = -1;
        for (let i = 0; i < jsonRaw.length; i++) {
          const row = jsonRaw[i];
          if (row && row.includes('Kun') && row.includes('Vaqt')) {
            headerRowIndex = i;
            break;
          }
        }

        if (headerRowIndex === -1) {
          throw new Error("Jadval tuzilishi noto'g'ri. 'Kun' va 'Vaqt' sarlavhalari topilmadi.");
        }

        const headerRow = jsonRaw[headerRowIndex];
        
        // 2. Identify Classes and their column indices
        const classCols = [];
        for (let col = 3; col < headerRow.length; col++) {
          const cell = headerRow[col];
          if (cell && typeof cell === 'string') {
            const trimmed = cell.trim();
            // Match classes like "5A", "10V", "11 D", etc.
            const match = trimmed.match(/^(\d+)[A-ZА-Яa-zа-я]/i);
            if (match) {
              classCols.push({ 
                className: trimmed.replace(/\s/g, ''), // Normalize "11 D" to "11D"
                col: col, 
                grade: match[1] 
              });
            }
          }
        }

        if (classCols.length === 0) {
          throw new Error("Sinf nomlari (masalan: 5A, 6B) sarlavhalar qatoridan topilmadi.");
        }

        // 3. Parse Lessons Data
        const timetableData = {};
        let currentDay = '';
        const dayMap = {
          'Du': 'Dushanba',
          'Se': 'Seshanba',
          'Ch': 'Chorshanba',
          'Pa': 'Payshanba',
          'Ju': 'Juma',
          'Sh': 'Shanba'
        };

        for (let i = headerRowIndex + 1; i < jsonRaw.length; i += 2) {
          const row = jsonRaw[i];
          const nextRow = jsonRaw[i + 1];
          if (!row || !nextRow) break;
          
          let dayRaw = row[0];
          if (dayRaw && typeof dayRaw === 'string') {
            dayRaw = dayRaw.trim();
            for (const [key, value] of Object.entries(dayMap)) {
              if (dayRaw.startsWith(key)) {
                currentDay = value;
                break;
              }
            }
          }
          
          if (!currentDay) continue;

          // Some rows might not have a lesson number if they are empty padding, check this
          const lessonRaw = row[1];
          if (!lessonRaw) continue;
          
          const lessonNumber = parseInt(lessonRaw.toString().trim(), 10);
          if (isNaN(lessonNumber)) continue;
          
          const time = row[2] ? String(row[2]).trim() : '';

          classCols.forEach(({ className, col, grade }) => {
            const groupKey = `${grade}-sinf`;
            
            let subject = row[col] ? String(row[col]).trim() : '';
            let room = row[col + 1] ? String(row[col + 1]).trim() : ''; // Next column is room
            let teacher = nextRow[col] ? String(nextRow[col]).trim() : ''; // Next row same col is teacher
            
            if (!subject) return; // Empty lesson

            // Initialize structure
            if (!timetableData[groupKey]) timetableData[groupKey] = {};
            if (!timetableData[groupKey][currentDay]) timetableData[groupKey][currentDay] = [];
            
            let classDayData = timetableData[groupKey][currentDay].find(c => c.class === className);
            if (!classDayData) {
              classDayData = { class: className, lessons: [] };
              timetableData[groupKey][currentDay].push(classDayData);
            }
            
            classDayData.lessons.push({
              number: lessonNumber,
              time,
              subject,
              room,
              teacher
            });
          });
        }

        // 4. Save to Database
        const { error } = await supabase
          .from('site_data')
          .upsert({ id: 'timetable', data: timetableData });

        if (error) throw error;
        
        setMessage("Dars jadvali Excel fayldan muvaffaqiyatli o'qildi va saytga yuklandi!");
      } catch (err) {
        console.error(err);
        setMessage("Xatolik: " + err.message);
      } finally {
        setLoading(false);
        // Reset file input
        e.target.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Manage Timetable (Excel orqali)</h2>
      <div style={{ marginBottom: '1.5rem', color: '#666', lineHeight: 1.6 }}>
        Maktabning umumiy dars jadvalini yangilash uchun tegishli <strong>.xlsx</strong> faylini yuklang.<br/>
        <em>Eslatma: Faylda "Kun", "#", "Vaqt" sarlavhalari hamda sinf nomlari (5A, 5B) ko'rsatilgan qator (skelet) bo'lishi shart.</em>
        
        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f0f9ff', borderLeft: '4px solid #0ea5e9', borderRadius: '4px' }}>
          <strong>Yordam:</strong> Jadvalning qanday tuzilganini ko'rish uchun maxsus qolip (skelet) faylini yuklab olishingiz mumkin. Keyingi jadvallarni shu fayldan andoza olib tuzing:
          <br />
          <a 
            href="/assets/dars_jadvali_namuna.xlsx" 
            download="Dars_jadvali_Namuna.xlsx"
            style={{ display: 'inline-block', marginTop: '0.5rem', color: '#0ea5e9', fontWeight: 'bold', textDecoration: 'none' }}
          >
            📥 Namuna (Skelet) faylini yuklab olish
          </a>
        </div>
      </div>
      
      {message && (
        <div style={{ padding: '1rem', marginBottom: '1.5rem', backgroundColor: message.includes('Xatolik') ? '#fdecea' : '#e8f5e9', color: message.includes('Xatolik') ? '#c62828' : '#2e7d32', borderRadius: '4px' }}>
          {message}
        </div>
      )}

      <div style={{ border: '2px dashed #ccc', padding: '2rem', borderRadius: '8px', textAlign: 'center', backgroundColor: '#f9fafb' }}>
        <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 'bold', fontSize: '1.2rem', color: '#00357A' }}>
          Excel (.xlsx) faylini tanlang
        </label>
        <input 
          type="file" 
          accept=".xlsx, .xls" 
          onChange={handleFileUpload} 
          disabled={loading}
          style={{ padding: '1rem', cursor: 'pointer' }}
        />
        {loading && <div style={{ marginTop: '1rem', color: '#666', fontWeight: 'bold' }}>Fayl o'qilmoqda va bazaga yozilmoqda, kuting...</div>}
      </div>
    </div>
  );
}
