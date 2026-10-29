/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  DEFAULT_SCHEDULE, 
  DEFAULT_TEACHERS, 
  DEFAULT_CLASSES, 
  DEFAULT_SCHOOL_CONFIG 
} from './data/defaultData';
import { 
  ScheduleSlot, 
  Teacher, 
  SchoolClass, 
  SchoolConfig, 
  DayType,
  WeekRotationType 
} from './types/schedule';
import { 
  getDayNameIndonesian, 
  calculateSlotStatus, 
  formatDateIndonesian, 
  timeStringToMinutes 
} from './utils/timeHelper';
import { bellPlayer } from './utils/audio';

import { Header } from './components/Header';
import { LiveHeroBanner } from './components/LiveHeroBanner';
import { OriginalTableView } from './components/OriginalTableView';
import { TodayScheduleView } from './components/TodayScheduleView';
import { StatusScheduleTableView } from './components/StatusScheduleTableView';
import { TeacherDirectoryView } from './components/TeacherDirectoryView';
import { RoomAvailabilityView } from './components/RoomAvailabilityView';
import { AdminPortal } from './components/AdminPortal';
import { TvDisplayMode } from './components/TvDisplayMode';
import { AdminLoginModal } from './components/AdminLoginModal';
import { TimeSimulationModal } from './components/TimeSimulationModal';

export default function App() {
  // Persistent State (with graceful v2 auto-upgrade for rotation weeks & Grade XI)
  const [schedule, setSchedule] = useState<ScheduleSlot[]>(() => {
    try {
      const saved = localStorage.getItem('smkn1_schedule_v2');
      if (saved) return JSON.parse(saved);
      const oldSaved = localStorage.getItem('smkn1_schedule_v1');
      if (oldSaved) {
        const parsed: ScheduleSlot[] = JSON.parse(oldSaved);
        if (parsed.some((s) => s.weekType)) {
          return parsed;
        }
      }
      return DEFAULT_SCHEDULE;
    } catch {
      return DEFAULT_SCHEDULE;
    }
  });

  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    try {
      const saved = localStorage.getItem('smkn1_teachers_v2');
      if (saved) return JSON.parse(saved);
      const oldSaved = localStorage.getItem('smkn1_teachers_v1');
      if (oldSaved) {
        const parsed: Teacher[] = JSON.parse(oldSaved);
        if (parsed.some((t) => t.code.startsWith('PROD'))) {
          return parsed;
        }
        return [...parsed, ...DEFAULT_TEACHERS.filter((t) => t.code.startsWith('PROD'))];
      }
      return DEFAULT_TEACHERS;
    } catch {
      return DEFAULT_TEACHERS;
    }
  });

  const [classes, setClasses] = useState<SchoolClass[]>(() => {
    try {
      const saved = localStorage.getItem('smkn1_classes_v2');
      if (saved) return JSON.parse(saved);
      const oldSaved = localStorage.getItem('smkn1_classes_v1');
      if (oldSaved) {
        const parsed: SchoolClass[] = JSON.parse(oldSaved);
        if (parsed.some((c) => c.grade === 'XI')) {
          return parsed;
        }
        return [...parsed, ...DEFAULT_CLASSES.filter((c) => c.grade === 'XI')];
      }
      return DEFAULT_CLASSES;
    } catch {
      return DEFAULT_CLASSES;
    }
  });

  const [config, setConfig] = useState<SchoolConfig>(() => {
    try {
      const saved = localStorage.getItem('smkn1_config_v1');
      return saved ? JSON.parse(saved) : DEFAULT_SCHOOL_CONFIG;
    } catch {
      return DEFAULT_SCHOOL_CONFIG;
    }
  });

  // Save to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('smkn1_schedule_v2', JSON.stringify(schedule));
      localStorage.setItem('smkn1_schedule_v1', JSON.stringify(schedule));
    } catch {}
  }, [schedule]);

  useEffect(() => {
    try {
      localStorage.setItem('smkn1_teachers_v2', JSON.stringify(teachers));
      localStorage.setItem('smkn1_teachers_v1', JSON.stringify(teachers));
    } catch {}
  }, [teachers]);

  useEffect(() => {
    try {
      localStorage.setItem('smkn1_classes_v2', JSON.stringify(classes));
      localStorage.setItem('smkn1_classes_v1', JSON.stringify(classes));
    } catch {}
  }, [classes]);

  useEffect(() => {
    try {
      localStorage.setItem('smkn1_config_v1', JSON.stringify(config));
    } catch {}
  }, [config]);

  // Active Week Rotation State (Pekan Normada 10 & Produktif 11 VS Pekan Produktif 10 & Normada 11)
  const [activeWeek, setActiveWeek] = useState<WeekRotationType>(() => {
    try {
      const saved = localStorage.getItem('smkn1_active_week_v1');
      if (saved === 'NORMADA_10_PRODUKTIF_11' || saved === 'PRODUKTIF_10_NORMADA_11') {
        return saved;
      }
      return config.activeWeek || 'NORMADA_10_PRODUKTIF_11';
    } catch {
      return 'NORMADA_10_PRODUKTIF_11';
    }
  });

  const handleToggleActiveWeek = (target?: WeekRotationType) => {
    const nextWeek: WeekRotationType = target 
      ? target 
      : activeWeek === 'NORMADA_10_PRODUKTIF_11' 
        ? 'PRODUKTIF_10_NORMADA_11' 
        : 'NORMADA_10_PRODUKTIF_11';
    setActiveWeek(nextWeek);
    setConfig((prev) => ({ ...prev, activeWeek: nextWeek }));
    try {
      localStorage.setItem('smkn1_active_week_v1', nextWeek);
    } catch {}
  };

  // Real-time Clock & Simulation State
  const [isSimulated, setIsSimulated] = useState<boolean>(false);
  const [simulatedTimeOffset, setSimulatedTimeOffset] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Navigation & Modal Views
  const [activeView, setActiveView] = useState<'status-table' | 'today' | 'original' | 'teachers' | 'rooms' | 'admin'>('status-table');
  const [isTvModeOpen, setIsTvModeOpen] = useState<boolean>(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('smkn1_admin_logged') === 'true';
  });
  const [isSimulationModalOpen, setIsSimulationModalOpen] = useState<boolean>(false);

  // Selected Day for filtering
  const initialDayName = getDayNameIndonesian(new Date());
  const validInitialDay: DayType = (initialDayName === 'MINGGU' || initialDayName === 'SABTU') 
    ? 'SENIN' 
    : initialDayName;
  const [selectedDay, setSelectedDay] = useState<DayType>(validInitialDay);

  // Clock Ticker: Updates every 1000ms
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      if (isSimulated) {
        setCurrentTime(new Date(now.getTime() + simulatedTimeOffset));
      } else {
        setCurrentTime(now);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isSimulated, simulatedTimeOffset]);

  // Real day computed from currentTime
  const currentRealDay = getDayNameIndonesian(currentTime);

  // Auto-sync selectedDay with currentRealDay when in live mode on weekdays
  useEffect(() => {
    if (currentRealDay !== 'MINGGU' && currentRealDay !== 'SABTU') {
      setSelectedDay(currentRealDay as DayType);
    }
  }, [currentRealDay]);

  // Compute status for the selected day / current time & active rotating week
  const statusResult = calculateSlotStatus(schedule, currentRealDay, currentTime, activeWeek);

  // Auto Bell: track previous slot to chime bell on period change
  const prevSlotIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (config.bellAudioEnabled && statusResult.currentSlot) {
      if (prevSlotIdRef.current && prevSlotIdRef.current !== statusResult.currentSlot.id) {
        // Period transitioned! Ring school chime
        bellPlayer.playSchoolChime();
      }
      prevSlotIdRef.current = statusResult.currentSlot.id;
    }
  }, [statusResult.currentSlot, config.bellAudioEnabled]);

  // Handlers for Simulation
  const handleApplySimulation = (targetDate: Date) => {
    const now = new Date();
    const offset = targetDate.getTime() - now.getTime();
    setSimulatedTimeOffset(offset);
    setIsSimulated(true);
    setCurrentTime(targetDate);
    const day = getDayNameIndonesian(targetDate);
    if (day !== 'MINGGU' && day !== 'SABTU') {
      setSelectedDay(day as DayType);
    }
  };

  const handleResetToLiveTime = () => {
    setIsSimulated(false);
    setSimulatedTimeOffset(0);
    const now = new Date();
    setCurrentTime(now);
    const day = getDayNameIndonesian(now);
    if (day !== 'MINGGU' && day !== 'SABTU') {
      setSelectedDay(day as DayType);
    }
  };

  // Reset to original photo default dataset
  const handleResetDefault = () => {
    setSchedule(DEFAULT_SCHEDULE);
    setTeachers(DEFAULT_TEACHERS);
    setClasses(DEFAULT_CLASSES);
    setConfig(DEFAULT_SCHOOL_CONFIG);
    localStorage.removeItem('smkn1_schedule_v1');
    localStorage.removeItem('smkn1_teachers_v1');
    localStorage.removeItem('smkn1_classes_v1');
    localStorage.removeItem('smkn1_config_v1');
    localStorage.removeItem('smkn1_staff_users_v1');
  };

  // Admin Login / Logout
  const handleLoginSuccess = () => {
    setIsAdminLoggedIn(true);
    localStorage.setItem('smkn1_admin_logged', 'true');
    setIsAdminModalOpen(false);
    setActiveView('admin');
  };

  const handleLogoutAdmin = () => {
    setIsAdminLoggedIn(false);
    localStorage.removeItem('smkn1_admin_logged');
    if (activeView === 'admin') {
      setActiveView('status-table');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      
      {/* Top Header & Navigation */}
      <Header
        config={config}
        currentTime={currentTime}
        currentDay={currentRealDay}
        isSimulated={isSimulated}
        activeView={activeView}
        setActiveView={setActiveView}
        openTvMode={() => setIsTvModeOpen(true)}
        openSimulationModal={() => setIsSimulationModalOpen(true)}
        openAdminModal={() => setIsAdminModalOpen(true)}
        isAdminLoggedIn={isAdminLoggedIn}
        onLogoutAdmin={handleLogoutAdmin}
        activeWeek={activeWeek}
        onToggleActiveWeek={handleToggleActiveWeek}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        
        {/* If in Admin Portal Mode */}
        {activeView === 'admin' ? (
          <AdminPortal
            schedule={schedule}
            setSchedule={setSchedule}
            teachers={teachers}
            setTeachers={setTeachers}
            classes={classes}
            setClasses={setClasses}
            config={config}
            setConfig={setConfig}
            onResetDefault={handleResetDefault}
            onExitAdmin={() => setActiveView('status-table')}
            onLogoutAdmin={handleLogoutAdmin}
            activeWeek={activeWeek}
            onToggleActiveWeek={handleToggleActiveWeek}
          />
        ) : (
          /* Public Dashboard Views */
          <div>
            {/* Live Real-Time Status Hero Banner */}
            <LiveHeroBanner
              statusResult={statusResult}
              selectedDay={selectedDay}
              setSelectedDay={setSelectedDay}
              classes={classes}
              teachers={teachers}
              currentRealDay={currentRealDay}
              isLiveDay={currentRealDay === selectedDay}
              activeView={activeView}
              setActiveView={setActiveView}
              activeWeek={activeWeek}
              onToggleActiveWeek={handleToggleActiveWeek}
            />

            {/* View Tab: Tabel Status KBM (Jam Ke, Kelas, Mapel, Guru, Ruang, Status) */}
            {activeView === 'status-table' && (
              <div>
                <StatusScheduleTableView
                  schedule={schedule}
                  teachers={teachers}
                  classes={classes}
                  selectedDay={selectedDay}
                  setSelectedDay={setSelectedDay}
                  currentDay={currentRealDay}
                  currentTime={currentTime}
                  onSelectTeacher={() => setActiveView('teachers')}
                  activeWeek={activeWeek}
                  onToggleActiveWeek={handleToggleActiveWeek}
                />
              </div>
            )}

            {/* View Tab 1: Hari Ini (Real-Time Cards & Timeline) */}
            {activeView === 'today' && (
              <div>
                <TodayScheduleView
                  schedule={schedule}
                  teachers={teachers}
                  classes={classes}
                  selectedDay={selectedDay}
                  currentDay={currentRealDay}
                  currentTime={currentTime}
                  onSelectTeacher={() => setActiveView('teachers')}
                  onSwitchToTableView={() => setActiveView('status-table')}
                  activeWeek={activeWeek}
                  onToggleActiveWeek={handleToggleActiveWeek}
                />
              </div>
            )}

            {/* View Tab 2: Format Matriks Lengkap (Persis Gambar) */}
            {activeView === 'original' && (
              <div>
                <OriginalTableView
                  schedule={schedule}
                  teachers={teachers}
                  classes={classes}
                  currentSlotId={statusResult.currentSlot?.id}
                  currentDay={currentRealDay}
                  filterDay="ALL"
                  activeWeek={activeWeek}
                  onToggleActiveWeek={handleToggleActiveWeek}
                />
              </div>
            )}

            {/* View Tab 3: Direktori Guru & Kode */}
            {activeView === 'teachers' && (
              <div>
                <TeacherDirectoryView
                  teachers={teachers}
                  schedule={schedule}
                  classes={classes}
                  currentDay={currentRealDay}
                  currentTime={currentTime}
                  activeWeek={activeWeek}
                />
              </div>
            )}

            {/* View Tab 4: Penggunaan Ruangan & Lapangan */}
            {activeView === 'rooms' && (
              <div>
                <RoomAvailabilityView
                  schedule={schedule}
                  classes={classes}
                  teachers={teachers}
                  selectedDay={selectedDay}
                  currentDay={currentRealDay}
                  currentTime={currentTime}
                  activeWeek={activeWeek}
                />
              </div>
            )}

          </div>
        )}

      </main>

      {/* School Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800 no-print text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-black text-xs">
                TGS
              </div>
              <div>
                <h5 className="font-extrabold text-white text-sm">SMK NEGERI 1 TEGALSARI</h5>
                <p className="text-[11px] text-slate-400">
                  Jl. KH. Syafa'at Blokagung, Karangdoro, Kec. Tegalsari, Kab. Banyuwangi, Jawa Timur
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-center md:text-right">
              <div className="text-[11px]">
                <span className="text-emerald-400 font-bold block">SMK BISA • SMK HEBAT</span>
                <span>Siap Kerja, Santun, Mandiri, Kreatif</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
            <div>
              © 2026 SMKN 1 Tegalsari. Aplikasi Jadwal Pelajaran Real-Time Digital.
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span>Kurikulum Merdeka</span>
              <span>•</span>
              {isAdminLoggedIn ? (
                <button
                  onClick={() => setActiveView('admin')}
                  className="text-emerald-400 hover:text-emerald-300 font-bold hover:underline flex items-center gap-1"
                >
                  ⚙️ Menu Admin (Aktif)
                </button>
              ) : (
                <button
                  onClick={() => setIsAdminModalOpen(true)}
                  className="text-emerald-400 hover:text-emerald-300 font-bold hover:underline flex items-center gap-1"
                >
                  🔐 Login Admin
                </button>
              )}
              <span>•</span>
              <button
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-slate-400 hover:text-white font-semibold transition-colors"
              >
                Kembali ke Atas ↑
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {isTvModeOpen && (
        <TvDisplayMode
          onClose={() => setIsTvModeOpen(false)}
          config={config}
          statusResult={statusResult}
          currentTime={currentTime}
          currentDay={currentRealDay}
          classes={classes}
          teachers={teachers}
          schedule={schedule}
          activeWeek={activeWeek}
          onToggleActiveWeek={handleToggleActiveWeek}
        />
      )}

      <AdminLoginModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <TimeSimulationModal
        isOpen={isSimulationModalOpen}
        onClose={() => setIsSimulationModalOpen(false)}
        isSimulated={isSimulated}
        simulatedTime={currentTime}
        onApplySimulation={handleApplySimulation}
        onResetToLiveTime={handleResetToLiveTime}
      />

    </div>
  );
}
