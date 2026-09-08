import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useScrollAnimation } from './hooks/useAnimations';

/* Layout Components */
import TopBar from './components/TopBar';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

/* Page Sections */
import Hero from './sections/Hero';
import About from './sections/About';
import WhyUs from './sections/WhyUs';
import Education from './sections/Education';
import StudentLife from './sections/StudentLife';
import Admission from './sections/Admission';
import News from './sections/News';
import Gallery from './sections/Gallery';

/* Dedicated Pages */
import AboutPage from './pages/AboutPage';
import NewsPage from './pages/NewsPage';
import EducationPage from './pages/EducationPage';
import AdmissionPage from './pages/AdmissionPage';
import GalleryPage from './pages/GalleryPage';
import ContactPage from './pages/ContactPage';
import TimetablePage from './pages/TimetablePage';
import TeachersPage from './pages/TeachersPage';
import StudentsPage from './pages/StudentsPage';
import StudentLifePage from './pages/StudentLifePage';

/* Admin Components */
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRoute from './components/AdminRoute';
import { Navigate } from 'react-router-dom';

function Home() {
  return (
    <>
      <Hero />
      <About />
      <News />
      <WhyUs />
      <Education />
      <StudentLife />
      <Admission />
      <Gallery />
    </>
  );
}

function App() {
  const location = useLocation();

  /* Initialize scroll animations globally */
  useScrollAnimation();

  /* Re-run scroll observer after route changes / content updates */
  useEffect(() => {
    window.scrollTo(0, 0);

    const routeTitles = {
      '/': "Angren Ixtisoslashtirilgan Maktabi | Angren Specialized School",
      '/about': "Biz haqimizda | Angren IMI",
      '/news': "Yangiliklar | Angren IMI",
      '/education': "Ta'lim yo'nalishlari | Angren IMI",
      '/timetable': "Dars jadvali | Angren IMI",
      '/admission': "Qabul | Angren IMI",
      '/gallery': "Galereya | Angren IMI",
      '/contact': "Bog'lanish va Aloqa | Angren IMI",
      '/teachers': "O'qituvchilar jamoasi | Angren IMI",
      '/students': "O'quvchilar va Yutuqlar | Angren IMI",
      '/achievements': "O'quvchilar va Yutuqlar | Angren IMI",
      '/student-life': "Maktab hayoti | Angren IMI",
    };

    const routeDescriptions = {
      '/': "Angren shahar ixtisoslashtirilgan maktabi — zamonaviy STEM ta'limi, aniq va tabiiy fanlar, axborot texnologiyalari va chet tillariga ixtisoslashtirilgan davlat ta'lim muassasasi.",
      '/about': "Angren IMI tarixi, rahbariyat, o'qituvchilar jamoasi, ta'lim standartlari va maktab missiyasi haqida batafsil ma'lumot.",
      '/news': "Angren Ixtisoslashtirilgan Maktabi hayotida sodir bo'layotgan eng so'nggi yangiliklar, e'lonlar va qiziqarli voqealar.",
      '/education': "Maktabimizdagi ixtisoslashtirilgan STEM fanlar, matematika, fizika, informatika va zamonaviy ta'lim metodikasi.",
      '/timetable': "Angren IMI barcha sinflari va o'qituvchilarining haftalik dars jadvallari bilan tanishing.",
      '/admission': "Angren shahar ixtisoslashtirilgan maktabiga o'quvchilarni qabul qilish talablari, imtihonlar va hujjat topshirish tartibi.",
      '/gallery': "Maktab binosi, zamonaviy sinflar, laboratoriyalar, sport maydonchalari va tadbirlardan fotolavhalar.",
      '/contact': "Angren IMI ma'muriyati bilan bog'lanish: telefon raqamlar, elektron pochta, manzil va to'g'ridan-to'g'ri murojaat yuborish.",
      '/teachers': "Angren shahar ixtisoslashtirilgan maktabining tajribali va malakali pedagoglar jamoasi.",
      '/students': "O'quvchilarimizning xalqaro va respublika fan olimpiadalari, tanlovlar hamda musobaqalardagi yutuqlari.",
      '/achievements': "O'quvchilarimizning xalqaro va respublika fan olimpiadalari, tanlovlar hamda musobaqalardagi yutuqlari.",
      '/student-life': "Maktabimizdagi to'garaklar, sport musobaqalari, madaniy tadbirlar va o'quvchilarning qiziqarli maktab hayoti.",
    };

    if (routeTitles[location.pathname]) {
      document.title = routeTitles[location.pathname];
    }
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && routeDescriptions[location.pathname]) {
      metaDesc.setAttribute('content', routeDescriptions[location.pathname]);
    }

    const timer = setTimeout(() => {
      document.querySelectorAll('.animate-in').forEach((el) => {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add('visible');
              }
            });
          },
          { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
        );
        observer.observe(el);
      });
    }, 100);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className="app">
      {!isAdmin && <TopBar />}
      {!isAdmin && <Navbar />}

      <main>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/education" element={<EducationPage />} />
          <Route path="/timetable" element={<TimetablePage />} />
          <Route path="/admission" element={<AdmissionPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/teachers" element={<TeachersPage />} />
          <Route path="/students" element={<StudentsPage />} />
          <Route path="/achievements" element={<StudentsPage />} />
          <Route path="/student-life" element={<StudentLifePage />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route 
            path="/admin/dashboard/*" 
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } 
          />
        </Routes>
      </main>

      {!isAdmin && <Footer />}
    </div>
  );
}

export default App;

