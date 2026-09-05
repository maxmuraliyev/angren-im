export const TEACHER_CATEGORIES = [
  { id: 'management', label: "Ma'muriyat va Maslahatchilar", icon: '' },
  { id: 'matematika', label: 'Matematika', icon: '' },
  { id: 'informatika', label: 'Informatika', icon: '' },
  { id: 'robototexnika', label: 'Robototexnika', icon: '' },
  { id: 'fizika', label: 'Fizika', icon: '' },
  { id: 'kimyo', label: 'Kimyo', icon: '' },
  { id: 'biologiya', label: 'Biologiya', icon: '' },
  { id: 'science', label: 'Science', icon: '' },
  { id: 'geografiya', label: 'Geografiya', icon: '' },
  { id: 'tarix', label: 'Tarix', icon: '' },
  { id: 'tarbiya', label: 'Tarbiya', icon: '' },
  { id: 'ona_tili_adabiyot', label: 'Ona tili va Adabiyot', icon: '' },
  { id: 'ozbek_tili', label: "O'zbek tili", icon: '' },
  { id: 'rus_tili', label: 'Rus tili', icon: '' },
  { id: 'ingliz_tili', label: 'Ingliz tili', icon: '' },
  { id: 'jismoniy_tarbiya', label: 'Jismoniy tarbiya', icon: '' },
  { id: 'chqbt', label: 'CHQBT', icon: '' },
  { id: 'sanat', label: "San'at", icon: '' },
  { id: 'musiqa', label: 'Musiqa', icon: '' },
  { id: 'other', label: 'Boshqa fanlar', icon: '' }
];

export function getTeacherCategory(teacher) {
  if (teacher && teacher.category && teacher.category !== 'all') {
    let cat = teacher.category;
    // Map older or legacy category codes to our current exact IDs
    if (cat === 'math' || cat === 'algebra' || cat === 'geometriya') cat = 'matematika';
    if (cat === 'biology' || cat === 'ixt_biologiya') cat = 'biologiya';
    if (cat === 'physics' || cat === 'ixt_fizika') cat = 'fizika';
    if (cat === 'chemistry' || cat === 'ixt_kimyo') cat = 'kimyo';
    if (cat === 'languages' || cat === 'ona_tili' || cat === 'adabiyot') cat = 'ona_tili_adabiyot';
    if (cat === 'history' || cat === 'huquq') cat = 'tarix';
    if (cat === 'sports') cat = 'jismoniy_tarbiya';
    if (cat === 'primary' || cat === 'boshlangich' || cat === 'texnologiya' || cat === 'mehnat' || cat === 'fakultativ' || cat === 'nemis_tili' || cat === 'fransuz_tili') {
      cat = ''; // Reset deleted category so it falls through to keyword inspection or 'other'
    }

    // Only return if it is a currently active ID in TEACHER_CATEGORIES
    if (cat && TEACHER_CATEGORIES.some(c => c.id === cat)) {
      return cat;
    }
  }
  
  const roleLower = ((teacher && teacher.role) || '').toLowerCase();
  
  // Management
  if (roleLower.includes('direktor') || roleLower.includes('rahbar') || roleLower.includes('maslaxat') || roleLower.includes('maslahat') || roleLower.includes('zamani') || roleLower.includes('o\'rinbosar') || roleLower.includes('zavuch') || roleLower.includes('menejer') || roleLower.includes('kotib') || roleLower.includes('psixolog')) return 'management';
  
  // Math & Tech
  if (roleLower.includes('robototexnika')) return 'robototexnika';
  if (roleLower.includes('informatika') || roleLower.includes('kompyuter') || roleLower.includes('it')) return 'informatika';
  if (roleLower.includes('matematika') || roleLower.includes('algebra') || roleLower.includes('geometriya')) return 'matematika';
  
  // Sciences
  if (roleLower.includes('fizika')) return 'fizika';
  if (roleLower.includes('kimyo')) return 'kimyo';
  if (roleLower.includes('biologiya')) return 'biologiya';
  if (roleLower.includes('science') || roleLower.includes('tabiiy')) return 'science';
  if (roleLower.includes('geografiya')) return 'geografiya';
  
  // Humanities & Languages
  if (roleLower.includes('tarix')) return 'tarix';
  if (roleLower.includes('tarbiya') || roleLower.includes('manaviyat') || roleLower.includes('ma\'naviyat')) return 'tarbiya';
  if (roleLower.includes('ingliz')) return 'ingliz_tili';
  if (roleLower.includes('rus')) return 'rus_tili';
  if (roleLower.includes('o\'zbek tili') || roleLower.includes('ozbek tili') || roleLower.includes('o‘zbek tili')) return 'ozbek_tili';
  if (roleLower.includes('ona tili') || roleLower.includes('adabiyot') || roleLower.includes('til')) return 'ona_tili_adabiyot';
  
  // Sports, Arts, Military
  if (roleLower.includes('jismoniy') || roleLower.includes('sport')) return 'jismoniy_tarbiya';
  if (roleLower.includes('chqbt') || roleLower.includes('chaqiriq') || roleLower.includes('harbiy')) return 'chqbt';
  if (roleLower.includes('san\'at') || roleLower.includes('sanat') || roleLower.includes('chizmachilik') || roleLower.includes('rasm')) return 'sanat';
  if (roleLower.includes('musiqa') || roleLower.includes('qo\'shiq')) return 'musiqa';
  
  return 'other';
}
