import React from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';

import ManageTimetable from './ManageTimetable';
import ManageNews from './ManageNews';
import ManageEvents from './ManageEvents';
import ManageTeachers from './ManageTeachers';
import ManageStudents from './ManageStudents';
import ManageGallery from './ManageGallery';
import ManageStudentLife from './ManageStudentLife';
import ManageSettings from './ManageSettings';

const DashboardHome = () => (
  <div>
    <h2 style={{ marginBottom: '0.5rem', color: '#1e293b' }}>Dashboard Home</h2>
    <p style={{ color: '#64748b', marginBottom: '2rem' }}>Welcome to the admin panel. Select an option from the sidebar or choose a section below to manage content.</p>
    
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
      <Link to="/admin/dashboard/news" style={{ textDecoration: 'none', backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.06)', display: 'block', borderLeft: '4px solid #00357A' }}>
        <h3 style={{ margin: '0 0 0.5rem', color: '#0f172a' }}>📰 Manage News</h3>
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Publish, edit, or delete school news with photo and video uploads.</p>
      </Link>

      <Link to="/admin/dashboard/timetable" style={{ textDecoration: 'none', backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.06)', display: 'block', borderLeft: '4px solid #0284c7' }}>
        <h3 style={{ margin: '0 0 0.5rem', color: '#0f172a' }}>📅 Manage Timetable</h3>
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Update class schedules and shifts.</p>
      </Link>

      <Link to="/admin/dashboard/events" style={{ textDecoration: 'none', backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.06)', display: 'block', borderLeft: '4px solid #10b981' }}>
        <h3 style={{ margin: '0 0 0.5rem', color: '#0f172a' }}>🎉 Manage Events</h3>
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Post and organize upcoming school events.</p>
      </Link>

      <Link to="/admin/dashboard/teachers" style={{ textDecoration: 'none', backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.06)', display: 'block', borderLeft: '4px solid #f59e0b' }}>
        <h3 style={{ margin: '0 0 0.5rem', color: '#0f172a' }}>👨‍🏫 Manage Teachers</h3>
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Add, edit, or remove faculty and staff members.</p>
      </Link>

      <Link to="/admin/dashboard/students" style={{ textDecoration: 'none', backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.06)', display: 'block', borderLeft: '4px solid #8b5cf6' }}>
        <h3 style={{ margin: '0 0 0.5rem', color: '#0f172a' }}>🎓 Manage Students</h3>
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Highlight student achievements and olympiad winners.</p>
      </Link>

      <Link to="/admin/dashboard/gallery" style={{ textDecoration: 'none', backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.06)', display: 'block', borderLeft: '4px solid #ec4899' }}>
        <h3 style={{ margin: '0 0 0.5rem', color: '#0f172a' }}>🖼️ Manage Gallery</h3>
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Upload and manage school photo albums.</p>
      </Link>

      <Link to="/admin/dashboard/student-life" style={{ textDecoration: 'none', backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.06)', display: 'block', borderLeft: '4px solid #06b6d4' }}>
        <h3 style={{ margin: '0 0 0.5rem', color: '#0f172a' }}>🏫 Maktab hayoti</h3>
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Maktab hayoti kollaj rasmlarini boshqarish.</p>
      </Link>

      <Link to="/admin/dashboard/settings" style={{ textDecoration: 'none', backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.06)', display: 'block', borderLeft: '4px solid #64748b' }}>
        <h3 style={{ margin: '0 0 0.5rem', color: '#0f172a' }}>⚙️ Manage Settings</h3>
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Configure website preferences and toggles.</p>
      </Link>
    </div>
  </div>
);

export default function AdminDashboard() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
      navigate('/admin/login');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      {/* Sidebar */}
      <div style={{ width: '250px', backgroundColor: '#2c3e50', color: 'white', padding: '2rem 1rem', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ marginBottom: '2rem', textAlign: 'center' }}>Admin Panel</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ marginBottom: '1rem' }}>
            <Link to="/admin/dashboard" style={{ color: 'white', textDecoration: 'none', fontSize: '1.1rem' }}>Dashboard Home</Link>
          </li>
          <li style={{ marginBottom: '1rem' }}>
            <Link to="/admin/dashboard/news" style={{ color: 'white', textDecoration: 'none', fontSize: '1.1rem' }}>Manage News</Link>
          </li>
          <li style={{ marginBottom: '1rem' }}>
            <Link to="/admin/dashboard/timetable" style={{ color: 'white', textDecoration: 'none', fontSize: '1.1rem' }}>Manage Timetable</Link>
          </li>
          <li style={{ marginBottom: '1rem' }}>
            <Link to="/admin/dashboard/events" style={{ color: 'white', textDecoration: 'none', fontSize: '1.1rem' }}>Manage Events</Link>
          </li>
          <li style={{ marginBottom: '1rem' }}>
            <Link to="/admin/dashboard/teachers" style={{ color: 'white', textDecoration: 'none', fontSize: '1.1rem' }}>Manage Teachers</Link>
          </li>
          <li style={{ marginBottom: '1rem' }}>
            <Link to="/admin/dashboard/students" style={{ color: 'white', textDecoration: 'none', fontSize: '1.1rem' }}>Manage Students</Link>
          </li>
          <li style={{ marginBottom: '1rem' }}>
            <Link to="/admin/dashboard/gallery" style={{ color: 'white', textDecoration: 'none', fontSize: '1.1rem' }}>Manage Gallery</Link>
          </li>
          <li style={{ marginBottom: '1rem' }}>
            <Link to="/admin/dashboard/student-life" style={{ color: 'white', textDecoration: 'none', fontSize: '1.1rem' }}>Maktab hayoti</Link>
          </li>
          <li style={{ marginBottom: '1rem' }}>
            <Link to="/admin/dashboard/settings" style={{ color: 'white', textDecoration: 'none', fontSize: '1.1rem' }}>Manage Settings</Link>
          </li>
        </ul>
        <button 
          onClick={handleLogout}
          style={{ 
            marginTop: 'auto', 
            width: '100%', 
            padding: '0.75rem', 
            backgroundColor: '#e74c3c', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '2rem', backgroundColor: '#ecf0f1' }}>
        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/news" element={<ManageNews />} />
          <Route path="/timetable" element={<ManageTimetable />} />
          <Route path="/events" element={<ManageEvents />} />
          <Route path="/teachers" element={<ManageTeachers />} />
          <Route path="/students" element={<ManageStudents />} />
          <Route path="/gallery" element={<ManageGallery />} />
          <Route path="/student-life" element={<ManageStudentLife />} />
          <Route path="/settings" element={<ManageSettings />} />
        </Routes>
      </div>
    </div>
  );
}
