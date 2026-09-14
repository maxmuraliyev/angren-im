import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabase';
import {
  FaSync,
  FaDownload,
  FaTrash,
  FaDesktop,
  FaMobileAlt,
  FaTabletAlt,
  FaCopy,
  FaSearch,
  FaCheck,
  FaChartBar,
  FaGlobeAmericas,
  FaTimes,
} from 'react-icons/fa';

export default function ManageStatistics() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deviceFilter, setDeviceFilter] = useState('ALL');
  const [dateRange, setDateRange] = useState('ALL'); // 'ALL', 'TODAY', 'WEEK', 'MONTH'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [copiedIp, setCopiedIp] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Fetch visitor logs from Supabase
  const fetchLogs = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      if (!supabase) {
        setStatusMessage({ type: 'error', text: 'Supabase ulanishi topilmadi.' });
        return;
      }

      const { data, error } = await supabase
        .from('visitor_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) {
        throw error;
      }

      setLogs(data || []);
      setStatusMessage(null);
    } catch (err) {
      console.error('Error fetching visitor logs:', err);
      setStatusMessage({
        type: 'error',
        text: `Xatolik yuz berdi: ${err.message}. Iltimos, Supabase'da 'visitor_logs' jadvali mavjudligini tekshiring.`,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Filter logs by date range, search query, and device type
  const filteredLogs = useMemo(() => {
    const now = new Date();

    return logs.filter((log) => {
      // 1. Date Range Filter
      if (dateRange !== 'ALL') {
        const logDate = new Date(log.created_at);
        if (dateRange === 'TODAY') {
          const isToday =
            logDate.getDate() === now.getDate() &&
            logDate.getMonth() === now.getMonth() &&
            logDate.getFullYear() === now.getFullYear();
          if (!isToday) return false;
        } else if (dateRange === 'WEEK') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (logDate < sevenDaysAgo) return false;
        } else if (dateRange === 'MONTH') {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (logDate < thirtyDaysAgo) return false;
        }
      }

      // 2. Device Filter
      if (deviceFilter !== 'ALL' && log.device_type !== deviceFilter) {
        return false;
      }

      // 3. Search Query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const ip = (log.ip_address || '').toLowerCase();
        const city = (log.city || '').toLowerCase();
        const country = (log.country || '').toLowerCase();
        const browser = (log.browser || '').toLowerCase();
        const os = (log.os || '').toLowerCase();
        const url = (log.visited_url || '').toLowerCase();

        return (
          ip.includes(q) ||
          city.includes(q) ||
          country.includes(q) ||
          browser.includes(q) ||
          os.includes(q) ||
          url.includes(q)
        );
      }

      return true;
    });
  }, [logs, dateRange, deviceFilter, searchTerm]);

  // Overall Statistics Calculations
  const stats = useMemo(() => {
    const total = filteredLogs.length;
    const uniqueIps = new Set(filteredLogs.map((l) => l.ip_address).filter(Boolean)).size;

    const now = new Date();
    const todayCount = filteredLogs.filter((l) => {
      const d = new Date(l.created_at);
      return (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    }).length;

    // Devices
    let mobileCount = 0;
    let desktopCount = 0;
    let tabletCount = 0;

    const browserMap = {};
    const osMap = {};
    const countryMap = {};
    const daysMap = {};

    // Prepare last 7 days chart buckets
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric' });
      daysMap[key] = 0;
    }

    filteredLogs.forEach((l) => {
      if (l.device_type === 'Mobile') mobileCount++;
      else if (l.device_type === 'Tablet') tabletCount++;
      else desktopCount++;

      // Browser
      const b = (l.browser || 'Unknown').split(' ')[0];
      browserMap[b] = (browserMap[b] || 0) + 1;

      // OS
      const o = (l.os || 'Unknown').split(' ')[0];
      osMap[o] = (osMap[o] || 0) + 1;

      // Country
      const c = l.country || 'Noma\'lum';
      countryMap[c] = (countryMap[c] || 0) + 1;

      // Daily trend (last 7 days)
      const logDate = new Date(l.created_at);
      const dayKey = logDate.toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric' });
      if (daysMap[dayKey] !== undefined) {
        daysMap[dayKey]++;
      }
    });

    const mobilePercent = total > 0 ? Math.round((mobileCount / total) * 100) : 0;
    const desktopPercent = total > 0 ? Math.round((desktopCount / total) * 100) : 0;
    const tabletPercent = total > 0 ? Math.round((tabletCount / total) * 100) : 0;

    return {
      total,
      uniqueIps,
      todayCount,
      mobileCount,
      desktopCount,
      tabletCount,
      mobilePercent,
      desktopPercent,
      tabletPercent,
      topBrowsers: Object.entries(browserMap).sort((a, b) => b[1] - a[1]).slice(0, 4),
      topOS: Object.entries(osMap).sort((a, b) => b[1] - a[1]).slice(0, 4),
      topCountries: Object.entries(countryMap).sort((a, b) => b[1] - a[1]).slice(0, 4),
      dailyTrend: Object.entries(daysMap),
    };
  }, [filteredLogs]);

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  // Helper: Copy IP to clipboard
  const handleCopyIp = (ip) => {
    if (!ip) return;
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  // Helper: Format Date & Relative Time
  const formatDateTime = (timestamp) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    const dateStr = date.toLocaleString('uz-UZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const diffMinutes = Math.floor((Date.now() - date.getTime()) / (60 * 1000));
    let relativeStr = '';
    if (diffMinutes < 1) relativeStr = 'hozirgina';
    else if (diffMinutes < 60) relativeStr = `${diffMinutes} daq. oldin`;
    else if (diffMinutes < 1440) relativeStr = `${Math.floor(diffMinutes / 60)} soat oldin`;
    else relativeStr = `${Math.floor(diffMinutes / 1440)} kun oldin`;

    return { full: dateStr, relative: relativeStr };
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      alert('Eksport qilish uchun ma\'lumot yo\'q.');
      return;
    }

    const headers = ['Vaqt', 'IP Manzil', 'Davlat', 'Shahar', 'Qurilma', 'Brauzer', 'OT', 'Kirgan Sahifa', 'Ekran', 'Referrer'];
    const rows = filteredLogs.map((l) => [
      `"${new Date(l.created_at).toISOString()}"`,
      `"${l.ip_address || ''}"`,
      `"${l.country || ''}"`,
      `"${l.city || ''}"`,
      `"${l.device_type || ''}"`,
      `"${l.browser || ''}"`,
      `"${l.os || ''}"`,
      `"${l.visited_url || ''}"`,
      `"${l.screen_resolution || ''}"`,
      `"${l.referrer || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `visitor_statistics_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Clear all visitor logs (Admin action)
  const handleClearLogs = async () => {
    setClearing(true);
    try {
      if (!supabase) throw new Error('Supabase topilmadi');
      const { error } = await supabase.from('visitor_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;

      setLogs([]);
      setShowClearConfirm(false);
      setStatusMessage({ type: 'success', text: 'Barcha tashriflar tarixi muvaffaqiyatli tozalandi.' });
    } catch (err) {
      console.error('Error clearing logs:', err);
      setStatusMessage({ type: 'error', text: `Tozalashda xatolik: ${err.message}` });
    } finally {
      setClearing(false);
    }
  };

  // Max count for daily trend bars
  const maxTrend = Math.max(...stats.dailyTrend.map(([, count]) => count), 1);

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', color: '#1e293b' }}>
      {/* Header Section */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h2 style={{ margin: '0 0 0.3rem', fontSize: '1.6rem', color: '#0f172a' }}>
            📊 Tashriflar Statistikasi
          </h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>
            Saytga tashrif buyurgan foydalanuvchilar, ularning IP manzili, qurilmasi va tashrif vaqti.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => fetchLogs(true)}
            disabled={refreshing || loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1rem',
              backgroundColor: '#00357A',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              fontWeight: '500',
              fontSize: '0.9rem',
              boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
            }}
          >
            <FaSync style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            {refreshing ? 'Yangilanmoqda...' : 'Yangilash'}
          </button>

          <button
            onClick={handleExportCSV}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1rem',
              backgroundColor: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '0.9rem',
              boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
            }}
          >
            <FaDownload />
            Eksport (CSV)
          </button>

          <button
            onClick={() => setShowClearConfirm(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1rem',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '0.9rem',
              boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
            }}
          >
            <FaTrash />
            Tozalash
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {statusMessage && (
        <div
          style={{
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            borderRadius: '8px',
            backgroundColor: statusMessage.type === 'error' ? '#fef2f2' : '#f0fdf4',
            color: statusMessage.type === 'error' ? '#991b1b' : '#166534',
            border: `1px solid ${statusMessage.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{statusMessage.text}</span>
          <button
            onClick={() => setStatusMessage(null)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            <FaTimes />
          </button>
        </div>
      )}

      {/* Date Range Selector Pills */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          backgroundColor: 'white',
          padding: '0.4rem',
          borderRadius: '8px',
          width: 'fit-content',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        {[
          { id: 'ALL', label: 'Barcha davr' },
          { id: 'TODAY', label: 'Bugun' },
          { id: 'WEEK', label: 'So\'nggi 7 kun' },
          { id: 'MONTH', label: 'So\'nggi 30 kun' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setDateRange(item.id);
              setCurrentPage(1);
            }}
            style={{
              padding: '0.45rem 0.9rem',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: dateRange === item.id ? '#00357A' : 'transparent',
              color: dateRange === item.id ? 'white' : '#64748b',
              fontWeight: dateRange === item.id ? '600' : '500',
              cursor: 'pointer',
              fontSize: '0.85rem',
              transition: 'all 0.2s ease',
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* 4 Summary Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          marginBottom: '1.75rem',
        }}
      >
        <div
          style={{
            backgroundColor: 'white',
            padding: '1.25rem',
            borderRadius: '10px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
            borderLeft: '4px solid #00357A',
          }}
        >
          <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.3rem' }}>
            Jami tashriflar
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#0f172a' }}>
            {stats.total.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '0.4rem' }}>
            Sayt bo'ylab barcha kirishlar
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'white',
            padding: '1.25rem',
            borderRadius: '10px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
            borderLeft: '4px solid #0284c7',
          }}
        >
          <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.3rem' }}>
            Yagona foydalanuvchilar (IP)
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#0f172a' }}>
            {stats.uniqueIps.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#0284c7', marginTop: '0.4rem' }}>
            Turli xil IP manzillar soni
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'white',
            padding: '1.25rem',
            borderRadius: '10px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
            borderLeft: '4px solid #10b981',
          }}
        >
          <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.3rem' }}>
            Bugungi tashriflar
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#0f172a' }}>
            {stats.todayCount.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.4rem' }}>
            So'nggi 24 soat ichida
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'white',
            padding: '1.25rem',
            borderRadius: '10px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
            borderLeft: '4px solid #8b5cf6',
          }}
        >
          <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.3rem' }}>
            Qurilmalar nisbati
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.3rem' }}>
            <span>💻 {stats.desktopPercent}%</span>
            <span style={{ color: '#94a3b8' }}>/</span>
            <span>📱 {stats.mobilePercent}%</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.4rem' }}>
            Kompyuter vs Mobil foydalanuvchilar
          </div>
        </div>
      </div>

      {/* Analytics Visual Breakdown Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.25rem',
          marginBottom: '1.75rem',
        }}
      >
        {/* Daily Trend Chart (CSS Bar Chart) */}
        <div
          style={{
            backgroundColor: 'white',
            padding: '1.25rem',
            borderRadius: '10px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
          }}
        >
          <h4 style={{ margin: '0 0 1rem', fontSize: '1rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaChartBar color="#00357A" /> So'nggi 7 kunlik faollik
          </h4>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '140px', gap: '0.5rem', paddingTop: '1rem' }}>
            {stats.dailyTrend.map(([day, count]) => {
              const heightPercent = Math.round((count / maxTrend) * 100);
              return (
                <div
                  key={day}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    height: '100%',
                    justifyContent: 'flex-end',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#00357A', marginBottom: '4px' }}>
                    {count}
                  </span>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '32px',
                      height: `${Math.max(heightPercent, 4)}%`,
                      backgroundColor: count > 0 ? '#00357A' : '#e2e8f0',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.4s ease',
                    }}
                    title={`${day}: ${count} ta tashrif`}
                  />
                  <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '6px', textAlign: 'center' }}>
                    {day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Device Breakdown */}
        <div
          style={{
            backgroundColor: 'white',
            padding: '1.25rem',
            borderRadius: '10px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
          }}
        >
          <h4 style={{ margin: '0 0 1rem', fontSize: '1rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaDesktop color="#0284c7" /> Qurilma turlari
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FaDesktop color="#0284c7" /> Kompyuter (Desktop)
                </span>
                <span style={{ fontWeight: '600' }}>{stats.desktopCount} ({stats.desktopPercent}%)</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${stats.desktopPercent}%`, height: '100%', backgroundColor: '#0284c7' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FaMobileAlt color="#10b981" /> Mobil (Mobile)
                </span>
                <span style={{ fontWeight: '600' }}>{stats.mobileCount} ({stats.mobilePercent}%)</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${stats.mobilePercent}%`, height: '100%', backgroundColor: '#10b981' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FaTabletAlt color="#8b5cf6" /> Planshet (Tablet)
                </span>
                <span style={{ fontWeight: '600' }}>{stats.tabletCount} ({stats.tabletPercent}%)</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${stats.tabletPercent}%`, height: '100%', backgroundColor: '#8b5cf6' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Top Browsers & Systems */}
        <div
          style={{
            backgroundColor: 'white',
            padding: '1.25rem',
            borderRadius: '10px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
          }}
        >
          <h4 style={{ margin: '0 0 1rem', fontSize: '1rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaGlobeAmericas color="#059669" /> Brauzerlar & Operatsion Tizimlar
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b', marginBottom: '0.5rem' }}>
                Top Brauzerlar:
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.85rem' }}>
                {stats.topBrowsers.length > 0 ? (
                  stats.topBrowsers.map(([name, count]) => (
                    <li key={name} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <span style={{ color: '#334155' }}>{name}</span>
                      <span style={{ fontWeight: '600', color: '#0f172a' }}>{count}</span>
                    </li>
                  ))
                ) : (
                  <li style={{ color: '#94a3b8' }}>Ma'lumot yo'q</li>
                )}
              </ul>
            </div>

            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b', marginBottom: '0.5rem' }}>
                Top OT (OS):
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.85rem' }}>
                {stats.topOS.length > 0 ? (
                  stats.topOS.map(([name, count]) => (
                    <li key={name} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <span style={{ color: '#334155' }}>{name}</span>
                      <span style={{ fontWeight: '600', color: '#0f172a' }}>{count}</span>
                    </li>
                  ))
                ) : (
                  <li style={{ color: '#94a3b8' }}>Ma'lumot yo'q</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Table Container */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '10px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
          overflow: 'hidden',
          marginBottom: '2rem',
        }}
      >
        {/* Table Search and Filters Toolbar */}
        <div
          style={{
            padding: '1.25rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '240px' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
              <FaSearch
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                }}
              />
              <input
                type="text"
                placeholder="IP, shahar, brauzer, sahifa bo'yicha izlash..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem 0.6rem 2.3rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <select
              value={deviceFilter}
              onChange={(e) => {
                setDeviceFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: '0.6rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
                backgroundColor: 'white',
                color: '#334155',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">Barcha qurilmalar</option>
              <option value="Desktop">Kompyuter (Desktop)</option>
              <option value="Mobile">Mobil (Mobile)</option>
              <option value="Tablet">Planshet (Tablet)</option>
            </select>

            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{
                padding: '0.6rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
                backgroundColor: 'white',
                color: '#334155',
                cursor: 'pointer',
              }}
            >
              <option value={10}>10 tadan</option>
              <option value={25}>25 tadan</option>
              <option value={50}>50 tadan</option>
              <option value={100}>100 tadan</option>
            </select>
          </div>
        </div>

        {/* Logs Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '0.9rem 1rem', fontWeight: '600' }}>Vaqt</th>
                <th style={{ padding: '0.9rem 1rem', fontWeight: '600' }}>IP Manzil</th>
                <th style={{ padding: '0.9rem 1rem', fontWeight: '600' }}>Joylashuv</th>
                <th style={{ padding: '0.9rem 1rem', fontWeight: '600' }}>Qurilma / OT</th>
                <th style={{ padding: '0.9rem 1rem', fontWeight: '600' }}>Brauzer</th>
                <th style={{ padding: '0.9rem 1rem', fontWeight: '600' }}>Kirgan sahifa</th>
                <th style={{ padding: '0.9rem 1rem', fontWeight: '600', textAlign: 'center' }}>Batafsil</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                    Yuklanmoqda...
                  </td>
                </tr>
              ) : paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                    Hech qanday tashrif ma'lumotlari topilmadi.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => {
                  const { full, relative } = formatDateTime(log.created_at);
                  const isCopied = copiedIp === log.ip_address;

                  return (
                    <tr
                      key={log.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* Time */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: '500', color: '#0f172a' }}>{full}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{relative}</div>
                      </td>

                      {/* IP Address */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <code
                            style={{
                              backgroundColor: '#f1f5f9',
                              padding: '0.2rem 0.4rem',
                              borderRadius: '4px',
                              fontFamily: 'monospace',
                              fontSize: '0.85rem',
                              color: '#00357A',
                            }}
                          >
                            {log.ip_address || '127.0.0.1'}
                          </code>
                          <button
                            onClick={() => handleCopyIp(log.ip_address)}
                            title="IP dan nusxa olish"
                            style={{
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              color: isCopied ? '#10b981' : '#94a3b8',
                              padding: '2px',
                            }}
                          >
                            {isCopied ? <FaCheck size={12} /> : <FaCopy size={12} />}
                          </button>
                        </div>
                      </td>

                      {/* Location */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {log.country || log.city ? (
                          <div>
                            <span style={{ fontWeight: '500', color: '#1e293b' }}>
                              {log.country || 'O\'zbekiston'}
                            </span>
                            {log.city && (
                              <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block' }}>
                                {log.city}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Noma'lum</span>
                        )}
                      </td>

                      {/* Device & OS */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {log.device_type === 'Mobile' ? (
                            <FaMobileAlt color="#10b981" />
                          ) : log.device_type === 'Tablet' ? (
                            <FaTabletAlt color="#8b5cf6" />
                          ) : (
                            <FaDesktop color="#0284c7" />
                          )}
                          <div>
                            <span style={{ fontWeight: '500', color: '#334155' }}>
                              {log.os || 'Unknown OS'}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>
                              {log.device_type}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Browser */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            backgroundColor: '#e0f2fe',
                            color: '#0369a1',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            fontWeight: '500',
                          }}
                        >
                          {log.browser || 'Unknown'}
                        </span>
                      </td>

                      {/* Visited URL */}
                      <td style={{ padding: '0.85rem 1rem', maxWidth: '200px' }}>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontSize: '0.85rem',
                            color: '#0f172a',
                            backgroundColor: '#f8fafc',
                            padding: '0.2rem 0.4rem',
                            borderRadius: '4px',
                            border: '1px solid #e2e8f0',
                            display: 'inline-block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '100%',
                          }}
                          title={log.visited_url}
                        >
                          {log.visited_url || '/'}
                        </span>
                      </td>

                      {/* Actions / View Details */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <button
                          onClick={() => setSelectedLog(log)}
                          style={{
                            backgroundColor: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            borderRadius: '4px',
                            padding: '0.35rem 0.75rem',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            color: '#334155',
                            fontWeight: '500',
                          }}
                        >
                          Ko'rish
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.85rem',
            color: '#64748b',
          }}
        >
          <div>
            Jami <strong>{filteredLogs.length}</strong> tadan{' '}
            <strong>
              {filteredLogs.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-
              {Math.min(currentPage * pageSize, filteredLogs.length)}
            </strong>{' '}
            tasi ko'rsatilmoqda
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '4px',
                border: '1px solid #cbd5e1',
                backgroundColor: 'white',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage === 1 ? 0.5 : 1,
              }}
            >
              Oldingi
            </button>

            <span style={{ margin: '0 0.5rem', fontWeight: '500', color: '#1e293b' }}>
              {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage >= totalPages}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '4px',
                border: '1px solid #cbd5e1',
                backgroundColor: 'white',
                cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                opacity: currentPage >= totalPages ? 0.5 : 1,
              }}
            >
              Keyingi
            </button>
          </div>
        </div>
      </div>

      {/* Visitor Detail Modal */}
      {selectedLog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          onClick={() => setSelectedLog(null)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '10px',
              maxWidth: '600px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>Tashrif Tafsilotlari</h3>
              <button
                onClick={() => setSelectedLog(null)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1.1rem', color: '#64748b' }}
              >
                <FaTimes />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
              <div style={{ fontWeight: '600', color: '#64748b' }}>IP Manzil:</div>
              <div><code>{selectedLog.ip_address}</code></div>

              <div style={{ fontWeight: '600', color: '#64748b' }}>Vaqti:</div>
              <div>{new Date(selectedLog.created_at).toLocaleString('uz-UZ')}</div>

              <div style={{ fontWeight: '600', color: '#64748b' }}>Joylashuv:</div>
              <div>{[selectedLog.city, selectedLog.country].filter(Boolean).join(', ') || 'Noma\'lum'}</div>

              <div style={{ fontWeight: '600', color: '#64748b' }}>Qurilma turi:</div>
              <div>{selectedLog.device_type}</div>

              <div style={{ fontWeight: '600', color: '#64748b' }}>Operatsion tizim:</div>
              <div>{selectedLog.os}</div>

              <div style={{ fontWeight: '600', color: '#64748b' }}>Brauzer:</div>
              <div>{selectedLog.browser}</div>

              <div style={{ fontWeight: '600', color: '#64748b' }}>Kirgan sahifasi:</div>
              <div><code>{selectedLog.visited_url}</code></div>

              <div style={{ fontWeight: '600', color: '#64748b' }}>Ekran o'lchami:</div>
              <div>{selectedLog.screen_resolution || 'Noma\'lum'}</div>

              <div style={{ fontWeight: '600', color: '#64748b' }}>Til:</div>
              <div>{selectedLog.language || 'Noma\'lum'}</div>

              <div style={{ fontWeight: '600', color: '#64748b' }}>Referrer (Manba):</div>
              <div>{selectedLog.referrer || 'To\'g\'ridan-to\'g\'ri (Direct)'}</div>

              <div style={{ fontWeight: '600', color: '#64748b' }}>User Agent:</div>
              <div
                style={{
                  fontSize: '0.8rem',
                  color: '#475569',
                  backgroundColor: '#f8fafc',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  wordBreak: 'break-all',
                }}
              >
                {selectedLog.user_agent || 'Noma\'lum'}
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
              <button
                onClick={() => setSelectedLog(null)}
                style={{
                  backgroundColor: '#00357A',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.5rem 1.25rem',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Logs Confirmation Modal */}
      {showClearConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          onClick={() => !clearing && setShowClearConfirm(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '10px',
              maxWidth: '450px',
              width: '100%',
              padding: '1.5rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 0.5rem', color: '#dc2626' }}>Tashriflar tarixini tozalash</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Haqiqatan ham barcha tashriflar yozuvlarini o'chirib tashlamoqchimisiz? Ushbu amalni qaytarib bo'lmaydi.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setShowClearConfirm(false)}
                disabled={clearing}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  cursor: clearing ? 'not-allowed' : 'pointer',
                  color: '#475569',
                }}
              >
                Bekor qilish
              </button>
              <button
                onClick={handleClearLogs}
                disabled={clearing}
                style={{
                  padding: '0.5rem 1rem',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  fontWeight: '500',
                  cursor: clearing ? 'not-allowed' : 'pointer',
                }}
              >
                {clearing ? 'Tozalanmoqda...' : 'Ha, tozalansin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
