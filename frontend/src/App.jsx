import React, { useState, useEffect } from 'react';
import { 
  Building2, MessageSquare, AlertTriangle, ShieldCheck, LogIn, LogOut, 
  Send, UserPlus, MapPin, CheckCircle, Clock, FileText, Bot, X, Sparkles, Filter 
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('warga'); // 'warga' | 'admin'
  const [token, setToken] = useState(localStorage.getItem('govsmart_token') || '');
  const [userRole, setUserRole] = useState(localStorage.getItem('govsmart_role') || '');
  const [userEmail, setUserEmail] = useState(localStorage.getItem('govsmart_email') || '');
  
  // Auth Modal State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regNik, setRegNik] = useState('');
  const [authError, setAuthError] = useState('');

  // Warga Form State
  const [judul, setJudul] = useState('');
  const [isiLaporan, setIsiLaporan] = useState('');
  const [lat, setLat] = useState('');
  const [long, setLong] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Reports Data State
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [departments, setDepartments] = useState([]);

  // Admin Audit & Update Modal State
  const [selectedReport, setSelectedReport] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [auditLogs, setAuditLogs] = useState([]);
  const [showAuditModal, setShowAuditModal] = useState(false);

  // Super Admin Register State
  const [adminNip, setAdminNip] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');

  // AI Chatbot Widget State
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatPrompt, setChatPrompt] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'ai', text: 'Halo! Saya Asisten AI GovSmart. Ada yang bisa saya bantu terkait perizinan UMKM/NIB atau panduan layanan publik?' }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // Fetch Reports & Departments
  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch('/api/v1/reports/', { headers });
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingReports(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/v1/departments/');
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchReports();
    fetchDepartments();
  }, [token]);

  // Auth Handlers
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const formData = new URLSearchParams();
      formData.append('username', loginEmail);
      formData.append('password', loginPassword);

      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Login gagal');
      }

      const data = await res.json();
      localStorage.setItem('govsmart_token', data.access_token);
      setToken(data.access_token);
      
      // Determine user role via /me
      const profileRes = await fetch('/api/v1/admin/me', {
        headers: { 'Authorization': `Bearer ${data.access_token}` }
      });
      if (profileRes.ok) {
        const profile = await profileRes.json();
        localStorage.setItem('govsmart_role', profile.role);
        localStorage.setItem('govsmart_email', profile.email);
        setUserRole(profile.role);
        setUserEmail(profile.email);
      }

      setShowAuthModal(false);
    } catch (e) {
      setAuthError(e.message);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail,
          nik_or_nip: regNik,
          password: loginPassword
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Registrasi gagal');
      }

      // Auto login after register
      setAuthMode('login');
      alert('Registrasi berhasil! Silakan login.');
    } catch (e) {
      setAuthError(e.message);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken('');
    setUserRole('');
    setUserEmail('');
  };

  // Submit Report Handler
  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!token) {
      setShowAuthModal(true);
      return;
    }
    setSubmitting(true);
    setSubmitSuccess(null);

    try {
      const body = {
        judul,
        isi_laporan: isiLaporan,
        lat: lat ? parseFloat(lat) : null,
        long: long ? parseFloat(long) : null
      };

      const res = await fetch('/api/v1/reports/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Gagal mengirim laporan');
      }

      const data = await res.json();
      setSubmitSuccess(data);
      setJudul('');
      setIsiLaporan('');
      setLat('');
      setLong('');
      fetchReports();
    } catch (e) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Status Update Handler
  const handleUpdateStatus = async (reportId) => {
    try {
      const res = await fetch(`/api/v1/reports/${reportId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Gagal memperbarui status');
      }

      fetchReports();
      setSelectedReport(null);
      alert('Status laporan berhasil diperbarui!');
    } catch (e) {
      alert(e.message);
    }
  };

  // Fetch Audit Logs
  const handleViewAuditLogs = async (report) => {
    setSelectedReport(report);
    setShowAuditModal(true);
    try {
      const res = await fetch(`/api/v1/admin/audit-logs/${report.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Super Admin Create Admin Dinas
  const handleCreateAdminDinas = async (e) => {
    e.preventDefault();
    setAdminSuccess('');
    try {
      const res = await fetch('/api/v1/admin/admin-dinas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nip: adminNip,
          email: adminEmail,
          password: adminPassword
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Gagal membuat akun admin');
      }

      setAdminSuccess(`Akun Admin Dinas (${adminEmail}) berhasil dibuat!`);
      setAdminNip('');
      setAdminEmail('');
      setAdminPassword('');
    } catch (e) {
      alert(e.message);
    }
  };

  // AI Chatbot Handler
  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatPrompt.trim()) return;

    const userMsg = chatPrompt;
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatPrompt('');
    setChatLoading(true);

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/v1/chat/', {
        method: 'POST',
        headers,
        body: JSON.stringify({ prompt: userMsg })
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => [...prev, { role: 'ai', text: data.response }]);
      } else {
        setChatMessages(prev => [...prev, { role: 'ai', text: 'Maaf, terjadi kesalahan saat menghubungi server AI.' }]);
      }
    } catch (e) {
      setChatMessages(prev => [...prev, { role: 'ai', text: 'Koneksi terganggu. Silakan coba beberapa saat lagi.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div>
      {/* Navbar */}
      <header className="navbar">
        <div className="brand-logo">
          <Sparkles className="w-6 h-6 text-cyan-400" />
          <span>GovSmart AI</span>
        </div>

        <nav className="nav-links">
          <button 
            className={`nav-btn ${activeTab === 'warga' ? 'active' : ''}`}
            onClick={() => setActiveTab('warga')}
          >
            <MessageSquare size={16} /> Portal Warga
          </button>

          {(userRole === 'admin' || userRole === 'super_admin') && (
            <button 
              className={`nav-btn ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              <ShieldCheck size={16} /> Dasbor Aparatur
            </button>
          )}

          {token ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{userEmail} ({userRole})</span>
              <button className="nav-btn" onClick={handleLogout} style={{ color: '#fb7185' }}>
                <LogOut size={16} /> Keluar
              </button>
            </div>
          ) : (
            <button className="nav-btn nav-btn-primary" onClick={() => setShowAuthModal(true)}>
              <LogIn size={16} /> Masuk / Daftar
            </button>
          )}
        </nav>
      </header>

      {/* Main Content */}
      <main className="app-container">
        {activeTab === 'warga' && (
          <div>
            {/* Hero Section */}
            <section style={{ textAlign: 'center', margin: '2rem 0 3rem 0' }}>
              <div className="badge badge-normal" style={{ marginBottom: '1rem' }}>
                <Sparkles size={12} /> Powered by AI Smart Routing & Emergency Classifier
              </div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '1rem' }}>
                Layanan Pengaduan & Informasi Publik Kabupaten Lamongan
              </h1>
              <p style={{ color: 'var(--text-muted)', maxWidth: '680px', margin: '0 auto', fontSize: '1.05rem' }}>
                Sampaikan aspirasi dan keluhan fasilitas umum secara cepat. AI GovSmart akan memetakan laporan Anda ke Dinas terkait dan mendeteksi kondisi darurat secara otomatis.
              </p>
            </section>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              {/* Form Pengaduan */}
              <div className="glass-panel" style={{ padding: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText className="text-cyan-400" /> Buat Pengaduan Baru
                </h2>

                {submitSuccess && (
                  <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                    <div style={{ fontWeight: 700, color: '#34d399', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckCircle size={18} /> Laporan Diterima & Teranalisis AI!
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Urgency AI: <span className={`badge badge-${submitSuccess.urgensi}`}>{submitSuccess.urgensi}</span>
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmitReport}>
                  <div className="form-group">
                    <label className="form-label">Judul Pengaduan</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Contoh: Jalan berlubang dan ambruk di Babat" 
                      value={judul}
                      onChange={(e) => setJudul(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Isi Detail Laporan</label>
                    <textarea 
                      className="form-textarea" 
                      rows={5} 
                      placeholder="Jelaskan lokasi rinci, kondisi, dan bahaya yang ditimbulkan..." 
                      value={isiLaporan}
                      onChange={(e) => setIsiLaporan(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Latitude (Opsional)</label>
                      <input 
                        type="number" 
                        step="any" 
                        className="form-input" 
                        placeholder="-7.1123" 
                        value={lat}
                        onChange={(e) => setLat(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Longitude (Opsional)</label>
                      <input 
                        type="number" 
                        step="any" 
                        className="form-input" 
                        placeholder="112.1554" 
                        value={long}
                        onChange={(e) => setLong(e.target.value)}
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="nav-btn nav-btn-primary" 
                    style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', padding: '0.85rem' }}
                    disabled={submitting}
                  >
                    <Send size={18} /> {submitting ? 'Menganalisis AI & Kirim...' : 'Kirim Pengaduan'}
                  </button>
                </form>
              </div>

              {/* Feed Laporan Publik */}
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock className="text-cyan-400" /> Daftar Pengaduan Publik (Urutan Prioritas AI)
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {reports.map((report) => (
                    <div key={report.id} className="glass-panel" style={{ padding: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <span className={`badge badge-${report.urgensi}`}>
                          {report.urgensi === 'darurat' && <AlertTriangle size={12} />}
                          {report.urgensi}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          Status: <strong style={{ color: 'var(--accent-cyan)' }}>{report.status}</strong>
                        </span>
                      </div>

                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                        {report.judul}
                      </h3>
                      <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
                        {report.isi_laporan}
                      </p>

                      <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between' }}>
                        <span><Building2 size={12} style={{ display: 'inline' }} /> Dinas ID: {report.dept_id || 'AI Auto-Routing'}</span>
                        <span>{new Date(report.created_at).toLocaleDateString('id-ID')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Admin / Aparatur */}
        {activeTab === 'admin' && (userRole === 'admin' || userRole === 'super_admin') && (
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '2rem' }}>
              Dasbor Manajemen & Penanganan Pengaduan
            </h1>

            {/* Super Admin Panel */}
            {userRole === 'super_admin' && (
              <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <UserPlus className="text-cyan-400" /> Registrasi Akun Admin Dinas Baru (Super Admin Access)
                </h2>

                {adminSuccess && <p style={{ color: '#34d399', fontSize: '0.85rem', marginBottom: '1rem' }}>{adminSuccess}</p>}

                <form onSubmit={handleCreateAdminDinas} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">NIP Aparatur</label>
                    <input type="text" className="form-input" placeholder="198505052010011005" value={adminNip} onChange={(e)=>setAdminNip(e.target.value)} required />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Email Dinas</label>
                    <input type="email" className="form-input" placeholder="admin.pu@lamongan.go.id" value={adminEmail} onChange={(e)=>setAdminEmail(e.target.value)} required />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Password</label>
                    <input type="password" className="form-input" placeholder="••••••••" value={adminPassword} onChange={(e)=>setAdminPassword(e.target.value)} required />
                  </div>
                  <button type="submit" className="nav-btn nav-btn-primary" style={{ padding: '0.75rem 1.25rem' }}>Buat Akun</button>
                </form>
              </div>
            )}

            {/* Table Reports */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Semua Pengaduan Masuk</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem' }}>ID</th>
                    <th style={{ padding: '0.75rem' }}>Urgensi AI</th>
                    <th style={{ padding: '0.75rem' }}>Judul Laporan</th>
                    <th style={{ padding: '0.75rem' }}>Status</th>
                    <th style={{ padding: '0.75rem' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.75rem' }}>#{r.id}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span className={`badge badge-${r.urgensi}`}>{r.urgensi}</span>
                      </td>
                      <td style={{ padding: '0.75rem', fontWeight: 600 }}>{r.judul}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{ color: r.status === 'selesai' ? '#34d399' : '#fbbf24', fontWeight: 700 }}>{r.status}</span>
                      </td>
                      <td style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                        <button 
                          className="nav-btn" 
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                          onClick={() => { setSelectedReport(r); setNewStatus(r.status); }}
                        >
                          Ubah Status
                        </button>
                        <button 
                          className="nav-btn" 
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderColor: 'var(--accent-cyan)' }}
                          onClick={() => handleViewAuditLogs(r)}
                        >
                          Audit Log
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modal Status Update */}
      {selectedReport && !showAuditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
              Pembaruan Status Laporan #{selectedReport.id}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              {selectedReport.judul}
            </p>
            <div className="form-group">
              <label className="form-label">Status Baru</label>
              <select className="form-select" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                <option value="menunggu">Menunggu</option>
                <option value="diproses">Diproses</option>
                <option value="selesai">Selesai</option>
                <option value="ditolak">Ditolak</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="nav-btn" onClick={() => setSelectedReport(null)}>Batal</button>
              <button className="nav-btn nav-btn-primary" onClick={() => handleUpdateStatus(selectedReport.id)}>Simpan Status</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Audit Log */}
      {showAuditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Riwayat Audit Log #{selectedReport?.id}</h3>
              <button className="nav-btn" onClick={() => setShowAuditModal(false)}><X size={16} /></button>
            </div>
            <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {auditLogs.map((log) => (
                <div key={log.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', borderLeft: '3px solid var(--accent-cyan)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Oleh User ID #{log.admin_id} &bull; {new Date(log.created_at).toLocaleString('id-ID')}
                  </div>
                  <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                    Status: <span style={{ textDecoration: 'line-through' }}>{log.status_lama || 'baru'}</span> &rarr; <strong>{log.status_baru}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Auth */}
      {showAuthModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                {authMode === 'login' ? 'Masuk ke GovSmart' : 'Daftar Akun Warga'}
              </h3>
              <button className="nav-btn" onClick={() => setShowAuthModal(false)}><X size={16} /></button>
            </div>

            {authError && <p style={{ color: '#fb7185', fontSize: '0.85rem', marginBottom: '1rem' }}>{authError}</p>}

            <form onSubmit={authMode === 'login' ? handleLogin : handleRegister}>
              {authMode === 'register' && (
                <div className="form-group">
                  <label className="form-label">NIK (16 Digit Nomor Induk Kependudukan)</label>
                  <input type="text" className="form-input" placeholder="3524010101950001" value={regNik} onChange={(e)=>setRegNik(e.target.value)} required />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" placeholder="nama@email.com" value={loginEmail} onChange={(e)=>setLoginEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input type="password" className="form-input" placeholder="••••••••" value={loginPassword} onChange={(e)=>setLoginPassword(e.target.value)} required />
              </div>

              <button type="submit" className="nav-btn nav-btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', padding: '0.75rem' }}>
                {authMode === 'login' ? 'Masuk' : 'Daftar Sekarang'}
              </button>
            </form>

            <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {authMode === 'login' ? (
                <span>Belum punya akun? <button style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', fontWeight: 700 }} onClick={() => setAuthMode('register')}>Daftar Akun Warga</button></span>
              ) : (
                <span>Sudah punya akun? <button style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', fontWeight: 700 }} onClick={() => setAuthMode('login')}>Masuk</button></span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating AI Chatbot Widget */}
      {!showChatbot && (
        <button className="chatbot-trigger" onClick={() => setShowChatbot(true)} title="Tanya AI Chatbot Perizinan">
          <Bot size={28} />
        </button>
      )}

      {showChatbot && (
        <div className="chat-window">
          <div className="chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
              <Bot size={20} className="text-cyan-400" />
              <span>AI Chatbot GovSmart</span>
            </div>
            <button className="nav-btn" style={{ padding: '0.2rem' }} onClick={() => setShowChatbot(false)}>
              <X size={16} />
            </button>
          </div>

          <div className="chat-body">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`chat-msg ${msg.role === 'user' ? 'chat-msg-user' : 'chat-msg-ai'}`}>
                {msg.text}
              </div>
            ))}
            {chatLoading && <div className="chat-msg chat-msg-ai">Sedang memproses...</div>}
          </div>

          <form onSubmit={handleSendChat} style={{ padding: '0.75rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Tanyakan perizinan UMKM/NIB..." 
              value={chatPrompt}
              onChange={(e) => setChatPrompt(e.target.value)}
              style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
            />
            <button type="submit" className="nav-btn nav-btn-primary" style={{ padding: '0.5rem 0.75rem' }}>
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
