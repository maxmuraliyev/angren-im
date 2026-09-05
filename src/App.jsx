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

