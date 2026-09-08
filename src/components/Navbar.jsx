import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { FaTelegramPlane, FaInstagram, FaFacebookF, FaYoutube } from 'react-icons/fa';
import { FiX } from 'react-icons/fi';
import './Navbar.css';

export default function Navbar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* Lock body scroll when mega-menu is open */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const navLinks = [
    { id: 'about', path: '/about', label: t('nav.about') },
    { id: 'news', path: '/news', label: t('nav.news') },
    { id: 'education', path: '/education', label: t('nav.education') },
    { id: 'achievements', path: '/students', label: t('nav.achievements') },
    { id: 'studentlife', path: '/student-life', label: t('nav.studentlife') },
    { id: 'timetable', path: '/timetable', label: t('nav.timetable') },
    { id: 'admission', path: '/admission', label: t('nav.admission') },
    { id: 'gallery', path: '/gallery', label: t('nav.gallery') },
    { id: 'contact', path: '/contact', label: t('nav.contact') },
  ];

  const handleLinkClick = (e, path) => {
    if (location.pathname === path) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setMenuOpen(false);
  };

  const handleLogoClick = (e) => {
    if (location.pathname === '/') {
      if (e) e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setMenuOpen(false);
  };

  const isLinkActive = (link) => {
    if (location.pathname === link.path) return true;
    if (link.id === 'achievements' && (location.pathname === '/students' || location.pathname === '/achievements')) return true;
    if (link.id === 'studentlife' && location.pathname === '/student-life') return true;
    return false;
  };

  const leftLinks = navLinks.slice(0, 4);
  const rightLinks = navLinks.slice(4);

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="navbar__inner">
          {/* Hamburger (mobile) */}
          <button
            className={`navbar__hamburger ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span />
            <span />
            <span />
          </button>

          {/* Desktop Nav */}
          <div className="navbar__nav">
            <div className="navbar__links-left">
              {leftLinks.map((link) => (
                <Link
                  key={link.id}
                  to={link.path}
                  className={`navbar__link ${isLinkActive(link) ? 'active' : ''}`}
                  onClick={(e) => handleLinkClick(e, link.path)}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <Link
              to="/"
              className="navbar__logo-wrapper"
              onClick={handleLogoClick}
              aria-label="Home"
            >
              <img
                src="/images/logo.png"
                alt="Angren IMI Logo"
                className="navbar__logo"
              />
            </Link>

            <div className="navbar__links-right">
              {rightLinks.map((link) => (
                <Link
                  key={link.id}
                  to={link.path}
                  className={`navbar__link ${isLinkActive(link) ? 'active' : ''}`}
                  onClick={(e) => handleLinkClick(e, link.path)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Full-screen Mega Menu (used on mobile, accessible on all) */}
      <div className={`navbar__megamenu ${menuOpen ? 'open' : ''}`}>
        <div className="navbar__megamenu-header">
          <Link
            to="/"
            onClick={handleLogoClick}
          >
            <img
              src="/images/logo.png"
              alt="Logo"
              className="navbar__megamenu-logo"
            />
          </Link>
          <button className="navbar__megamenu-close" onClick={() => setMenuOpen(false)}>
            <FiX />
          </button>
        </div>

        <div className="navbar__megamenu-nav">
          {navLinks.map((link) => (
            <Link
              key={link.id}
              to={link.path}
              className={`navbar__megamenu-link ${isLinkActive(link) ? 'active' : ''}`}
              onClick={(e) => handleLinkClick(e, link.path)}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="navbar__megamenu-socials">
          <a href="https://t.me/AngrenIMUz" target="_blank" rel="noopener noreferrer" className="navbar__megamenu-social"><FaTelegramPlane /></a>
          <a href="https://www.instagram.com/angrenimuz" target="_blank" rel="noopener noreferrer" className="navbar__megamenu-social"><FaInstagram /></a>
          <a href="https://facebook.com/Angrenimuz" target="_blank" rel="noopener noreferrer" className="navbar__megamenu-social"><FaFacebookF /></a>
          <a href="https://youtube.com/@Angrenimuz" target="_blank" rel="noopener noreferrer" className="navbar__megamenu-social"><FaYoutube /></a>
        </div>
      </div>
    </>
  );
}

