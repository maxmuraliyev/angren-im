import React from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';

const DashboardHome = () => <div><h2>Dashboard Home</h2><p>Welcome to the admin panel. Select an option from the sidebar to manage content.</p></div>;
import ManageTimetable from './ManageTimetable';
import ManageGallery from './ManageGallery';
import ManageTeachers from './ManageTeachers';
import ManageStudents from './ManageStudents';
import ManageEvents from './ManageEvents';
import ManageSettings from './ManageSettings';

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
          <Route path="/timetable" element={<ManageTimetable />} />
          <Route path="/events" element={<ManageEvents />} />
          <Route path="/teachers" element={<ManageTeachers />} />
          <Route path="/students" element={<ManageStudents />} />
          <Route path="/gallery" element={<ManageGallery />} />
          <Route path="/settings" element={<ManageSettings />} />
        </Routes>
      </div>
    </div>
  );
}
