import React from 'react';
import { 
  Clock, 
  Bell, 
  Tv, 
  Sliders, 
  ShieldCheck, 
  Printer, 
  Calendar,
  Volume2,
  Sparkles,
  Layers
} from 'lucide-react';
import { DayType, SchoolConfig, WeekRotationType, WEEK_ROTATION_CONFIG } from '../types/schedule';
import { bellPlayer } from '../utils/audio';

interface HeaderProps {
  config: SchoolConfig;
  currentTime: Date;
  currentDay: DayType | 'MINGGU' | 'SABTU';
  isSimulated: boolean;
  activeView: 'status-table' | 'today' | 'original' | 'teachers' | 'rooms' | 'admin';
  setActiveView: (view: 'status-table' | 'today' | 'original' | 'teachers' | 'rooms' | 'admin') => void;
  openTvMode: () => void;
  openSimulationModal: () => void;
  openAdminModal: () => void;
  isAdminLoggedIn: boolean;
  onLogoutAdmin: () => void;
  activeWeek?: WeekRotationType;
  onToggleActiveWeek?: (week?: WeekRotationType) => void;
  cloudSyncStatus?: 'connected' | 'connecting' | 'offline';
}

export const Header: React.FC<HeaderProps> = ({
  config,
  currentTime,
  currentDay,
  isSimulated,
  activeView,
  setActiveView,
  openTvMode,
  openSimulationModal,
  openAdminModal,
  isAdminLoggedIn,
  onLogoutAdmin,
  activeWeek = 'NORMADA_10_PRODUKTIF_11',
  onToggleActiveWeek,
  cloudSyncStatus = 'connected',
}) => {
  const handleRingBell = () => {
    bellPlayer.playSchoolChime();
  };

  const handlePrint = () => {
    window.print();
  };

  const formatTime = (d: Date) => {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  };

  const dayNamesIndo: Record<string, string> = {
    SENIN: 'Senin',
    SELASA: 'Selasa',
    RABU: 'Rabu',
    KAMIS: 'Kamis',
    JUMAT: 'Jumat',
    SABTU: 'Sabtu',
    MINGGU: 'Minggu',
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs no-print">
      {/* Top Bar Announcement / Running Text */}
      <div className="bg-emerald-800 text-emerald-50 text-xs px-4 py-1.5 overflow-hidden flex items-center justify-between border-b border-emerald-900/30">
        <div className="flex items-center gap-2 shrink-0 font-semibold tracking-wide uppercase">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Info Sekolah:</span>
        </div>
        <div className="overflow-hidden whitespace-nowrap ml-3 w-full">
          <div className="animate-ticker font-medium text-emerald-100 text-xs inline-block">
            {config.runningAnnouncement}
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-3 shrink-0 pl-4 text-emerald-200 text-xs font-mono">
          <span>{config.academicYear}</span>
        </div>
      </div>

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Logo & School Branding */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-green-900 text-white flex items-center justify-center shadow-md shadow-emerald-700/20 ring-2 ring-emerald-500/20 shrink-0">
              {/* Stylized School Crest / Emblem */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-black tracking-tighter">SMKN 1</span>
                <span className="text-[9px] font-bold text-emerald-200">TGS</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>{config.schoolName}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                    REAL-TIME
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border flex items-center gap-1 shadow-2xs ${
                    cloudSyncStatus === 'connected'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : cloudSyncStatus === 'connecting'
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-slate-100 text-slate-600 border-slate-300'
                  }`} title="Database tersinkronisasi otomatis antara mode pengembangan, versi rilis/publish, dan Mode TV">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      cloudSyncStatus === 'connected' ? 'bg-emerald-500 animate-ping' : cloudSyncStatus === 'connecting' ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'
                    }`}></span>
                    <span>{cloudSyncStatus === 'connected' ? 'Cloud Sync (Dev & Publish)' : cloudSyncStatus === 'connecting' ? 'Menghubungkan Cloud...' : 'Lokal / Offline'}</span>
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-500 font-medium line-clamp-1" title={config.schoolAddress || 'Jl. KH. Abdul Majid No.09, Krajan 2, Tegalsari, Kec. Tegalsari, Kabupaten Banyuwangi'}>
                {config.schoolAddress || 'Jl. KH. Abdul Majid No.09, Krajan 2, Tegalsari, Kec. Tegalsari, Kabupaten Banyuwangi'}
              </p>
            </div>
          </div>

          {/* Real-time Clock & Action Controls */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 justify-between md:justify-end">
            
            {/* Live Clock Card */}
            <div className="flex items-center gap-2.5 bg-slate-100 border border-slate-200/80 px-3 py-1.5 rounded-xl shadow-2xs">
              <div className="relative">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-600"></span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-base font-bold text-slate-900 tracking-tight">
                    {formatTime(currentTime)}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 bg-white px-1 py-0.2 rounded border border-slate-200">
                    WIB
                  </span>
                </div>
                <div className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                  <span className="font-semibold text-emerald-700">{dayNamesIndo[currentDay] || currentDay}</span>
                  {isSimulated && (
                    <span className="text-[9px] bg-amber-100 text-amber-800 px-1 rounded font-bold">
                      SIMULASI
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-1.5">
              {/* Play Bell Chime */}
              <button
                onClick={handleRingBell}
                title="Bunyikan Bel Sekolah"
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
              >
                <Bell className="w-3.5 h-3.5 text-emerald-600 animate-wiggle" />
                <span className="hidden sm:inline">Bel</span>
              </button>

              {/* Time Simulation */}
              <button
                onClick={openSimulationModal}
                title="Atur / Simulasikan Waktu & Hari"
                className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  isSimulated 
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs' 
                    : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Uji Waktu</span>
              </button>

              {/* TV Mode / Kiosk Display */}
              <button
                onClick={openTvMode}
                title="Buka Mode TV Layar Penuh (Smartboard / Digital Signage)"
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors"
              >
                <Tv className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Mode TV</span>
              </button>

              {/* Print */}
              <button
                onClick={handlePrint}
                title="Cetak Jadwal Pelajaran"
                className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Cetak</span>
              </button>

              {/* Admin Portal Toggle & Login Menu */}
              {isAdminLoggedIn ? (
                <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-lg p-0.5">
                  <button
                    onClick={() => setActiveView(activeView === 'admin' ? 'status-table' : 'admin')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                      activeView === 'admin'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-white text-emerald-900 hover:bg-emerald-100 shadow-2xs'
                    }`}
                    title="Buka / Tutup Portal Admin"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{activeView === 'admin' ? 'Portal Admin' : 'Menu Admin'}</span>
                  </button>
                  <button
                    onClick={onLogoutAdmin}
                    title="Logout & Kunci Sesi Admin"
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1.5 rounded-md transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={openAdminModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white transition-all shadow-xs"
                  title="Menu Login Petugas / Admin SMKN 1 Tegalsari"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Login Admin</span>
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Active Week Rotation Bar (Normada 10 vs Produktif 11) */}
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
              <Layers className="w-3.5 h-3.5 text-emerald-700" />
              Siklus Pekan KBM:
            </span>

            <div className="inline-flex p-1 bg-slate-100/90 border border-slate-200/90 rounded-xl shadow-2xs">
              <button
                type="button"
                onClick={() => onToggleActiveWeek && onToggleActiveWeek('NORMADA_10_PRODUKTIF_11')}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${
                  activeWeek === 'NORMADA_10_PRODUKTIF_11'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-emerald-800 hover:bg-emerald-50'
                }`}
                title="Pekan Normada 10 & Produktif 11 (Kelas 10: Teori Normada, Kelas 11: Praktik Produktif)"
              >
                <span className={`w-2 h-2 rounded-full ${activeWeek === 'NORMADA_10_PRODUKTIF_11' ? 'bg-emerald-300 animate-pulse' : 'bg-slate-400'}`}></span>
                <span>Pekan Normada 10 & Produktif 11</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleActiveWeek && onToggleActiveWeek('PRODUKTIF_10_NORMADA_11')}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${
                  activeWeek === 'PRODUKTIF_10_NORMADA_11'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-amber-800 hover:bg-amber-50'
                }`}
                title="Pekan Produktif 10 & Normada 11 (Kelas 10: Praktik Produktif, Kelas 11: Teori Normada)"
              >
                <span className={`w-2 h-2 rounded-full ${activeWeek === 'PRODUKTIF_10_NORMADA_11' ? 'bg-amber-200 animate-pulse' : 'bg-slate-400'}`}></span>
                <span>Pekan Produktif 10 & Normada 11</span>
              </button>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-500 font-medium">
            {activeWeek === 'NORMADA_10_PRODUKTIF_11' ? (
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-lg font-semibold">
                📘 Kls 10: Teori/Normada &nbsp;•&nbsp; 🍳 Kls 11: Praktik Produktif
              </span>
            ) : (
              <span className="bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-lg font-semibold">
                🍳 Kls 10: Praktik Produktif &nbsp;•&nbsp; 📘 Kls 11: Teori/Normada
              </span>
            )}
          </div>
        </div>

        {/* Navigation Tabs (Dashboard Publik) */}
        {activeView !== 'admin' && (
          <nav className="flex items-center space-x-1 sm:space-x-2 mt-3 pt-2.5 border-t border-slate-100 overflow-x-auto text-xs font-medium">
            <button
              onClick={() => setActiveView('status-table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                activeView === 'status-table'
                  ? 'bg-emerald-700 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Tabel Status (Terlaksana, Berlangsung, Terjadwal)</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-extrabold border border-emerald-300">
                Live
              </span>
            </button>

            <button
              onClick={() => setActiveView('today')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                activeView === 'today'
                  ? 'bg-emerald-700 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Timeline Hari Ini</span>
            </button>

            <button
              onClick={() => setActiveView('original')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                activeView === 'original'
                  ? 'bg-emerald-700 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Tabel Matriks Lengkap (Format Asli)</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-amber-400 text-amber-950 font-bold">
                Foto
              </span>
            </button>

            <button
              onClick={() => setActiveView('teachers')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                activeView === 'teachers'
                  ? 'bg-emerald-700 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Daftar Guru & Kode (BIG3, MT7, dll)</span>
            </button>

            <button
              onClick={() => setActiveView('rooms')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                activeView === 'rooms'
                  ? 'bg-emerald-700 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Penggunaan Ruangan & Lapangan</span>
            </button>

            {/* Menu Admin Login / Panel Button */}
            {isAdminLoggedIn ? (
              <button
                onClick={() => setActiveView('admin')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ml-auto border font-bold bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                title="Buka Portal Kelola Admin"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Panel Admin (Aktif)</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              </button>
            ) : (
              <button
                onClick={openAdminModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ml-auto text-emerald-800 hover:bg-emerald-50 border border-emerald-300 font-bold bg-white"
                title="Buka Menu Login Petugas / Admin Kurikulum"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>Menu Login Admin</span>
              </button>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};
