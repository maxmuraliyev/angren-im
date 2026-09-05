import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';

const excelFilePath = path.resolve('./dars jadvali 2026.xlsx');
const outputPath = path.resolve('./src/data/timetable.json');

const dayMap = {
  'Du': 'Dushanba',
  'Se': 'Seshanba',
  'Ch': 'Chorshanba',
  'Pa': 'Payshanba',
  'Ju': 'Juma',
  'Sh': 'Shanba'
};

const sinfMap = {
  '5A': '5-sinf', '5B': '5-sinf',
  '6A': '6-sinf', '6B': '6-sinf',
  '7A': '7-sinf', '7B': '7-sinf', '7V': '7-sinf',
  '8A': '8-sinf', '8B': '8-sinf', '8V': '8-sinf', '8G': '8-sinf',
  '9A': '9-sinf', '9B': '9-sinf', '9V': '9-sinf',
  '10A': '10-sinf', '10B': '10-sinf', '10V': '10-sinf', '10G': '10-sinf',
  '11A': '11-sinf', '11B': '11-sinf', '11V': '11-sinf', '11G': '11-sinf', '11D': '11-sinf'
};

const cyrillicToLatinMap = {
  'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo', 'Ж': 'J',
  'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O',
  'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'X', 'Ц': 'S',
  'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sh', 'Ъ': "'", 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya',
  'Ў': "O'", 'Қ': 'Q', 'Ғ': "G'", 'Ҳ': 'H',
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'j',
  'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
  'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'x', 'ц': 's',
  'ч': 'ch', 'ш': 'sh', 'щ': 'sh', 'ъ': "'", 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
  'ў': "o'", 'қ': 'q', 'ғ': "g'", 'ҳ': 'h'
};

const transliterate = (text) => {
  if (!text) return text;
  return text.split('').map(char => cyrillicToLatinMap[char] || char).join('');
};

const subjectMap = {
  'tarbi': 'Tarbiya',
  'algeb': 'Algebra',
  'rus. t': 'Rus Tili',
  'rus.til': 'Rus Tili',
  'San. A': "San'at",
  'san.a': "San'at",
  'biolo': 'Biologiya',
  'jismo': 'Jismoniy Tarbiya',
  'Jismo': 'Jismoniy Tarbiya',
  'ix. b': 'Ixtisoslashtirilgan Biologiya',
  'adabi': 'Adabiyot',
  'geome': 'Geometriya',
  'infor': 'Informatika',
  'ona. t': 'Ona Tili',
  'ing. t': 'Ingliz Tili',
  'ing.til': 'Ingliz Tili',
  'ix. k': 'Ixtisoslashtirilgan Kimyo',
  'ix. f': 'Ixtisoslashtirilgan Fizika',
  'O`z. t': "O'zbek Tili",
  'CHQBT': 'CHQBT',
  'факул': 'Fakultativ',
  'Факул': 'Fakultativ',
  'tarix': 'Tarix',
  'kimyo': 'Kimyo',
  'geogr': 'Geografiya',
  'fizik': 'Fizika',
  'sienc': 'Science',
  'robot': 'Robototexnika'
};

try {
  const workbook = xlsx.readFile(excelFilePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData = xlsx.utils.sheet_to_json(sheet, { header: 1 });

  // Find header row (which contains classes like 5A, 5B)
  let classRowIdx = -1;
  for (let i = 0; i < Math.min(20, rawData.length); i++) {
    if (rawData[i] && rawData[i].includes('5A')) {
      classRowIdx = i;
      break;
    }
  }

  if (classRowIdx === -1) {
    throw new Error('Could not find header row with classes');
  }

  const classCols = [];
  const headerRow = rawData[classRowIdx];
  for (let col = 3; col < headerRow.length; col += 2) {
    const className = headerRow[col];
    if (className && sinfMap[className]) {
      classCols.push({ name: className, sinf: sinfMap[className], colIndex: col });
    }
  }

  const result = {};

  let currentDay = '';

  for (let i = classRowIdx + 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || row.length === 0) continue;

    // Check for day
    if (row[0] && typeof row[0] === 'string' && dayMap[row[0].trim()]) {
      currentDay = dayMap[row[0].trim()];
    }

    // Check if it's a lesson row (has a lesson number in col 1)
    const lessonNum = row[1];
    if (lessonNum && !isNaN(lessonNum) && currentDay) {
      const time = row[2] ? row[2].toString().trim() : '';
      const nextRow = i + 1 < rawData.length ? rawData[i + 1] : [];

      classCols.forEach(cls => {
        let subjectRaw = row[cls.colIndex] ? row[cls.colIndex].toString().trim() : '';
        const subject = subjectMap[subjectRaw] || subjectRaw;
        const room = row[cls.colIndex + 1] ? row[cls.colIndex + 1].toString().trim() : '';
        const teacherRaw = nextRow[cls.colIndex] ? nextRow[cls.colIndex].toString().trim() : '';
        const teacher = transliterate(teacherRaw);
        
        if (subject) {
          if (!result[cls.sinf]) result[cls.sinf] = {};
          if (!result[cls.sinf][currentDay]) result[cls.sinf][currentDay] = [];
          
          // Find or create class schedule within the day
          let classSchedule = result[cls.sinf][currentDay].find(c => c.class === cls.name);
          if (!classSchedule) {
            classSchedule = { class: cls.name, lessons: [] };
            result[cls.sinf][currentDay].push(classSchedule);
          }

          classSchedule.lessons.push({
            number: lessonNum,
            time: time,
            subject: subject,
            room: room,
            teacher: teacher
          });
        }
      });
    }
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`Timetable successfully parsed and saved to: ${outputPath}`);
} catch (error) {
  console.error("Error processing excel file:", error);
}
