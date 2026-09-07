import React, { useState } from 'react';
import { supabase } from '../../supabase';
import * as XLSX from 'xlsx';

export default function ManageTimetable() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_EXTENSIONS = ['xlsx', 'xls'];
  const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 1. Validate file extension and size
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setMessage("Xatolik: Faqat .xlsx yoki .xls formatidagi Excel fayllar qabul qilinadi.");
      e.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setMessage("Xatolik: Excel fayl hajmi juda katta (maksimal: 5MB).");
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setLoading(true);
        setMessage('');

        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array', dense: true });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) throw new Error("Excel faylida sahifalar topilmadi.");

        const sheet = workbook.Sheets[sheetName];
        
        // We use raw:false to keep dates/times as strings if formatted as such
        const jsonRaw = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
        
        // Guard against excessively large sheets (DoS prevention)
        if (jsonRaw.length > 1000) {
          throw new Error("Jadval qatorlari soni me'yordan oshdi (maksimal: 1000 qator).");
        }

        // 1. Find Header Row
        let headerRowIndex = -1;
        for (let i = 0; i < Math.min(jsonRaw.length, 50); i++) {
          const row = jsonRaw[i];
          if (row && Array.isArray(row) && row.some(c => typeof c === 'string' && c.includes('Kun')) && row.some(c => typeof c === 'string' && c.includes('Vaqt'))) {
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
        for (let col = 3; col < Math.min(headerRow.length, 50); col++) {
          const cell = headerRow[col];
          if (cell && typeof cell === 'string') {
            const trimmed = cell.trim();
            // Match classes like "5A", "10V", "11 D", etc.
            const match = trimmed.match(/^(\d{1,2})[A-ZА-Яa-zа-я]/i);
            if (match) {
              const safeClassName = trimmed.replace(/[^a-zA-Z0-9А-Яа-я]/g, '').slice(0, 10);
              const safeGrade = match[1];
              if (!FORBIDDEN_KEYS.has(safeClassName)) {
                classCols.push({ 
                  className: safeClassName, 
                  col: col, 
                  grade: safeGrade 
                });
              }
            }
          }
        }

        if (classCols.length === 0) {
          throw new Error("Sinf nomlari (masalan: 5A, 6B) sarlavhalar qatoridan topilmadi.");
        }

        // 3. Parse Lessons Data (guarded against prototype pollution)
        const timetableData = Object.create(null);
        let currentDay = '';

        const normalizeDay = (dayRaw) => {
          if (!dayRaw || typeof dayRaw !== 'string') return '';
          const d = dayRaw.trim().toLowerCase();

          // 1. Dushanba / Monday / Понедельник
          if (d.startsWith('du') || d.startsWith('ду') || d.startsWith('пн') || d.startsWith('pon') || d.startsWith('mon')) {
            return 'Dushanba';
          }
          // 2. Seshanba / Tuesday / Вторник
          if (d.startsWith('se') || d.startsWith('се') || d.startsWith('вт') || d.startsWith('vtor') || d.startsWith('tue')) {
            return 'Seshanba';
          }
          // 3. Payshanba / Thursday / Четверг (evaluated before 'ch'/'ч' to prevent overlap)
          if (d.startsWith('pa') || d.startsWith('па') || d.startsWith('чт') || d.startsWith('chet') || d.startsWith('thu')) {
            return 'Payshanba';
          }
          // 4. Chorshanba / Wednesday / Среда
          if (d.startsWith('ch') || d.startsWith('ч') || d.startsWith('ср') || d.startsWith('sred') || d.startsWith('wed')) {
            return 'Chorshanba';
          }
          // 5. Juma / Friday / Пятница
          if (d.startsWith('ju') || d.startsWith('жу') || d.startsWith('пт') || d.startsWith('pyat') || d.startsWith('fri')) {
            return 'Juma';
          }
          // 6. Shanba / Saturday / Суббота
          if (d.startsWith('sh') || d.startsWith('ша') || d.startsWith('сб') || d.startsWith('sub') || d.startsWith('sat')) {
            return 'Shanba';
          }

          return '';
        };

        for (let i = headerRowIndex + 1; i < jsonRaw.length; i += 2) {
          const row = jsonRaw[i];
          const nextRow = jsonRaw[i + 1];
          if (!row || !nextRow) break;
          
          if (row[0]) {
            const detected = normalizeDay(String(row[0]));
            if (detected) {
              currentDay = detected;
            }
          }
          
          if (!currentDay || FORBIDDEN_KEYS.has(currentDay)) continue;

          const lessonRaw = row[1];
          if (!lessonRaw) continue;
          
          const lessonNumber = parseInt(lessonRaw.toString().trim(), 10);
          if (isNaN(lessonNumber) || lessonNumber < 1 || lessonNumber > 20) continue;
          
          const time = row[2] ? String(row[2]).trim().slice(0, 30) : '';

          classCols.forEach(({ className, col, grade }) => {
            const groupKey = `${grade}-sinf`;
            if (FORBIDDEN_KEYS.has(groupKey)) return;
            
            let subject = row[col] ? String(row[col]).trim().slice(0, 100) : '';
            let room = row[col + 1] ? String(row[col + 1]).trim().slice(0, 50) : '';
            let teacher = nextRow[col] ? String(nextRow[col]).trim().slice(0, 100) : '';
            
            if (!subject) return;

            // Initialize structure safely
            if (!Object.prototype.hasOwnProperty.call(timetableData, groupKey)) {
              timetableData[groupKey] = {};
            }
            if (!Object.prototype.hasOwnProperty.call(timetableData[groupKey], currentDay)) {
              timetableData[groupKey][currentDay] = [];
            }
            
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

        // Convert safe map to plain serializable object
        const plainTimetableData = JSON.parse(JSON.stringify(timetableData));

        // 4. Save to Database
        const { error } = await supabase
          .from('site_data')
          .upsert({ id: 'timetable', data: plainTimetableData });

        if (error) throw error;
        
        setMessage("Dars jadvali Excel fayldan muvaffaqiyatli o'qildi va saytga yuklandi!");
      } catch (err) {
        console.error(err);
        setMessage("Xatolik: " + (err.message || 'Faylni o\'qishda xatolik'));
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
