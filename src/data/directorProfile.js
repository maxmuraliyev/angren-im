/**
 * Centralized Director Profile Data Source
 * Angren shahar ixtisoslashtirilgan maktabi
 * 
 * NOTE: Strictly verified official/public information only.
 * Do not add unverified credentials, dates, or personal details.
 */

export const directorProfile = {
  name: 'Nazirov Abror Urinbayevich',
  roleUz: 'Maktab direktori',
  roleEn: 'School Director',
  institutionUz: 'Angren shahar ixtisoslashtirilgan maktabi',
  institutionEn: 'Angren Specialized School',
  portrait: '/images/staff/direktor.jpg',
  birthYear: '1984',
  birthplaceUz: 'Angren shahri, Toshkent viloyati',
  birthplaceEn: 'Angren city, Tashkent region',
  educationUz: 'Oliy ma’lumot',
  educationEn: 'Higher education',

  // Compact card greetings & summary
  greetingUz: "Hurmatli ota-onalar va o'quvchilar!",
  greetingEn: 'Dear parents and students!',
  shortIntroUz: "Angren shahar ixtisoslashtirilgan maktabi matematika, fizika, informatika va boshqa fanlar bo'yicha sifatli ta'lim berishga ixtisoslashgan davlat ta'lim muassasasi hisoblanadi.",
  shortIntroEn: 'Angren Specialized School is a state educational institution dedicated to providing advanced education in mathematics, physics, computer science, and other specialized disciplines.',

  // Full biography paragraphs
  biographyUz: [
    '1984-yilda Toshkent viloyati Angren shahrida tavallud topgan Nazirov Abror Urinbayevich oliy ma’lumotga ega. Ta’lim boshqaruvi sohasidagi faoliyatini rivojlantirib, Nurafshon shahridagi Prezident maktabida ijrochi direktor lavozimida faoliyat yuritgan. Keyinchalik Angren shahar ixtisoslashtirilgan maktabi direktori etib tayinlangan.'
  ],
  biographyEn: [
    'Born in 1984 in Angren, Tashkent region, Abror Urinbayevich Nazirov holds higher education. Developing his career in educational management, he served as Executive Director of the Presidential School in Nurafshon. Later, he was appointed Director of Angren Specialized School.'
  ],

  // Career milestones / timeline
  timelineUz: [
    {
      year: '1984',
      title: 'Tavallud',
      description: 'Angren shahrida tavallud topgan'
    },
    {
      year: 'Ta’lim',
      title: 'Oliy ma’lumot',
      description: 'Oliy ma’lumot olgan'
    },
    {
      year: 'Nurafshon',
      title: 'Prezident maktabi',
      description: 'Nurafshon shahridagi Prezident maktabida ijrochi direktor'
    },
    {
      year: 'Angren',
      title: 'Ixtisoslashtirilgan maktab',
      description: 'Angren shahar ixtisoslashtirilgan maktabi direktori'
    }
  ],
  timelineEn: [
    {
      year: '1984',
      title: 'Birth',
      description: 'Born in Angren, Tashkent region'
    },
    {
      year: 'Education',
      title: 'Higher Education',
      description: 'Completed higher education'
    },
    {
      year: 'Nurafshon',
      title: 'Presidential School',
      description: 'Executive Director at the Presidential School in Nurafshon'
    },
    {
      year: 'Angren',
      title: 'Specialized School',
      description: 'Appointed Director of Angren Specialized School'
    }
  ],

  // Leadership & Focus Areas (school mission-aligned)
  focusAreasUz: [
    {
      id: 'specialized-edu',
      title: 'Ixtisoslashtirilgan ta’lim',
      description: 'Matematika, fizika, informatika va boshqa fanlar bo‘yicha sifatli ta’lim muhitini rivojlantirish.'
    },
    {
      id: 'student-growth',
      title: 'O‘quvchi rivoji',
      description: 'O‘quvchilarning bilim, ko‘nikma va kelajakdagi imkoniyatlarini qo‘llab-quvvatlash.'
    },
    {
      id: 'collaboration',
      title: 'Jamoaviy hamkorlik',
      description: 'O‘qituvchilar, o‘quvchilar, ota-onalar va jamoatchilik bilan samarali hamkorlik.'
    }
  ],
  focusAreasEn: [
    {
      id: 'specialized-edu',
      title: 'Specialized Education',
      description: 'Fostering a high-quality educational environment in mathematics, physics, IT, and core sciences.'
    },
    {
      id: 'student-growth',
      title: 'Student Development',
      description: 'Empowering student knowledge, modern competencies, and future academic potential.'
    },
    {
      id: 'collaboration',
      title: 'Community Partnership',
      description: 'Effective collaboration among educators, students, parents, and the broader community.'
    }
  ]
};

export default directorProfile;
