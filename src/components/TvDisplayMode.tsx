import React, { useEffect, useState, useRef } from 'react';
import { 
  Tv, 
  Maximize, 
  Minimize, 
  X, 
  Clock, 
  MapPin, 
  User, 
  ArrowRight, 
  Coffee, 
  Flag, 
  Sparkles, 
  Award,
  Bell,
  Table,
  LayoutGrid,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Calendar,
  Layers,
  RotateCcw
} from 'lucide-react';
import { ScheduleSlot, SchoolClass, Teacher, SchoolConfig, DayType, WeekRotationType, WEEK_ROTATION_CONFIG } from '../types/schedule';
import { SlotStatusResult, formatTimeWithSeconds, formatDateIndonesian, timeStringToMinutes, DAYS_LIST } from '../utils/timeHelper';
import { bellPlayer } from '../utils/audio';

export type ScheduleItemStatus = 'Terlaksana' | 'Berlangsung' | 'Terjadwal';

export interface TvScheduleRow {
  id: string;
  slotId: string;
  day: DayType;
  periodDisplay: string;
  periodNum?: number | string;
  timeStart: string;
  timeEnd: string;
  classId: string;
  className: string;
  subject: string;
  teacherCode: string;
  teacherName: string;
  room: string;
  status: ScheduleItemStatus;
  type: string;
}

interface TvDisplayModeProps {
  onClose: () => void;
  config: SchoolConfig;
  statusResult: SlotStatusResult;
  currentTime: Date;
  currentDay: DayType | 'MINGGU' | 'SABTU';
  classes: SchoolClass[];
  teachers: Teacher[];
  schedule?: ScheduleSlot[];
  activeWeek?: WeekRotationType;
  onToggleActiveWeek?: (week?: WeekRotationType) => void;
}

export const TvDisplayMode: React.FC<TvDisplayModeProps> = ({
  onClose,
  config,
  statusResult,
  currentTime,
  currentDay,
  classes,
  teachers,
  schedule = [],
  activeWeek = 'NORMADA_10_PRODUKTIF_11',
  onToggleActiveWeek,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  
  const defaultDay: DayType = (currentDay === 'MINGGU' || currentDay === 'SABTU') ? 'SENIN' : currentDay;
  const [selectedDay, setSelectedDay] = useState<DayType>(defaultDay);

  // Automatically adapt selected day when current day shifts in real-time
  useEffect(() => {
    if (currentDay !== 'MINGGU' && currentDay !== 'SABTU') {
      setSelectedDay(currentDay);
    }
  }, [currentDay]);

  // Table Mode configuration: 'byClass' (rolling bergantian per kelas) | 'byPage30' (30 baris) | 'dual60' (60 baris)
  const [tableRollingType, setTableRollingType] = useState<'byClass' | 'byPage30' | 'dual60'>('byClass');
  const [tableClassIndex, setTableClassIndex] = useState<number>(0);
  const [currentSlide30, setCurrentSlide30] = useState<number>(0);
  const [tvFontSize, setTvFontSize] = useState<'large' | 'xl'>('large'); // Ukuran tulisan diperbesar untuk Mode TV

  // Card Mode rolling configuration
  const [cardBatchSize, setCardBatchSize] = useState<number>(2); // 2 kelas per layar secara bergantian
  const [cardSlideIndex, setCardSlideIndex] = useState<number>(0);
  const [isCardRolling, setIsCardRolling] = useState<boolean>(true);
  const [cardCountdown, setCardCountdown] = useState<number>(8);

  // Global Table Auto Rotate State
  const [isTableAutoRotate, setIsTableAutoRotate] = useState<boolean>(true);
  const [tableCountdown, setTableCountdown] = useState<number>(10);

  const { currentSlot, nextSlot, status, statusText, progressPercentage, timeRemainingFormatted } = statusResult;
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const isToday = currentDay === selectedDay;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === ' ') {
        handleManualNext();
      } else if (e.key === 'ArrowLeft') {
        handleManualPrev();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, viewMode, tableRollingType, classes.length]);

  const getTeacher = (code: string) => {
    return teachers.find((t) => t.code.toUpperCase() === code.toUpperCase());
  };

  // Convert schedule slots for selected day & active week into flat TV table rows
  const daySlots = schedule
    .filter((s) => s.day === selectedDay)
    .filter((s) => !activeWeek || !s.weekType || s.weekType === 'ALL' || s.weekType === activeWeek)
    .sort((a, b) => timeStringToMinutes(a.timeStart) - timeStringToMinutes(b.timeStart));

  const allTableRows: TvScheduleRow[] = [];

  daySlots.forEach((slot) => {
    const startMin = timeStringToMinutes(slot.timeStart);
    const endMin = timeStringToMinutes(slot.timeEnd);

    let rowStatus: ScheduleItemStatus = 'Terjadwal';
    if (isToday) {
      if (currentMinutes >= endMin) {
        rowStatus = 'Terlaksana';
      } else if (currentMinutes >= startMin && currentMinutes < endMin) {
        rowStatus = 'Berlangsung';
      } else {
        rowStatus = 'Terjadwal';
      }
    } else {
      const dayOrder = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT'];
      const currentDayIdx = dayOrder.indexOf(currentDay as string);
      const selectedDayIdx = dayOrder.indexOf(selectedDay);

      if (currentDayIdx !== -1 && selectedDayIdx !== -1) {
        rowStatus = selectedDayIdx < currentDayIdx ? 'Terlaksana' : 'Terjadwal';
      } else {
        rowStatus = 'Terjadwal';
      }
    }

    const periodDisplay = slot.periodNumber 
      ? `Jam ${slot.periodNumber}` 
      : slot.title || (slot.type === 'BREAK' ? 'Istirahat' : '-');

    if (slot.type === 'BREAK' || slot.type === 'UPACARA' || slot.type === 'ISTIGOSAH' || slot.type === 'EKSTRAKURIKULER') {
      classes.forEach((cls) => {
        const asg = slot.classes[cls.id];
        const teacherObj = asg?.teacherCode && asg.teacherCode !== '-' ? getTeacher(asg.teacherCode) : null;
        allTableRows.push({
          id: `${slot.id}-${cls.id}`,
          slotId: slot.id,
          day: slot.day,
          periodDisplay,
          periodNum: slot.periodNumber,
          timeStart: slot.timeStart,
          timeEnd: slot.timeEnd,
          classId: cls.id,
          className: cls.name,
          subject: asg?.subject || slot.title || slot.type,
          teacherCode: asg?.teacherCode || '-',
          teacherName: teacherObj ? teacherObj.name : '-',
          room: asg?.room || (slot.type === 'UPACARA' ? 'LAPANGAN' : slot.type === 'ISTIGOSAH' ? 'MASJID' : '-'),
          status: rowStatus,
          type: slot.type,
        });
      });
    } else {
      classes.forEach((cls) => {
        const asg = slot.classes[cls.id];
        if (!asg) return;
        const teacherObj = getTeacher(asg.teacherCode);
        allTableRows.push({
          id: `${slot.id}-${cls.id}`,
          slotId: slot.id,
          day: slot.day,
          periodDisplay,
          periodNum: slot.periodNumber,
          timeStart: slot.timeStart,
          timeEnd: slot.timeEnd,
          classId: cls.id,
          className: cls.name,
          subject: asg.subject,
          teacherCode: asg.teacherCode,
          teacherName: teacherObj ? teacherObj.name : asg.teacherCode,
          room: asg.room,
          status: rowStatus,
          type: slot.type,
        });
      });
    }
  });

  // Calculate pages for 30 rows
  const totalSlides30 = Math.max(1, Math.ceil(allTableRows.length / 30));

  // Card mode calculations
  const totalCardSlides = Math.max(1, Math.ceil(classes.length / cardBatchSize));
  const validCardSlide = Math.min(cardSlideIndex, totalCardSlides - 1);
  const visibleCardClasses = classes.slice(validCardSlide * cardBatchSize, (validCardSlide + 1) * cardBatchSize);

  // Table Auto-Rolling timer
  useEffect(() => {
    if (!isTableAutoRotate || viewMode !== 'table') return;

    const timer = setInterval(() => {
      setTableCountdown((prev) => {
        if (prev <= 1) {
          if (tableRollingType === 'byClass') {
            setTableClassIndex((curr) => (curr + 1) % classes.length);
          } else {
            setCurrentSlide30((curr) => (curr + 1) % totalSlides30);
          }
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTableAutoRotate, viewMode, tableRollingType, classes.length, totalSlides30]);

  // Card Mode Auto-Rolling timer
  useEffect(() => {
    if (!isCardRolling || viewMode !== 'card' || totalCardSlides <= 1) return;

    const timer = setInterval(() => {
      setCardCountdown((prev) => {
        if (prev <= 1) {
          setCardSlideIndex((curr) => (curr + 1) % totalCardSlides);
          return 8;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isCardRolling, viewMode, totalCardSlides]);

  const handleManualNext = () => {
    if (viewMode === 'table') {
      if (tableRollingType === 'byClass') {
        setTableClassIndex((curr) => (curr + 1) % classes.length);
      } else {
        setCurrentSlide30((curr) => (curr + 1) % totalSlides30);
      }
      setTableCountdown(10);
    } else {
      setCardSlideIndex((curr) => (curr + 1) % totalCardSlides);
      setCardCountdown(8);
    }
  };

  const handleManualPrev = () => {
    if (viewMode === 'table') {
      if (tableRollingType === 'byClass') {
        setTableClassIndex((curr) => (curr - 1 + classes.length) % classes.length);
      } else {
        setCurrentSlide30((curr) => (curr - 1 + totalSlides30) % totalSlides30);
      }
      setTableCountdown(10);
    } else {
      setCardSlideIndex((curr) => (curr - 1 + totalCardSlides) % totalCardSlides);
      setCardCountdown(8);
    }
  };

  // Active class for 'byClass' table rolling
  const activeRollingClass = classes[tableClassIndex % classes.length];
  const activeClassRows = activeRollingClass
    ? allTableRows.filter((r) => r.classId === activeRollingClass.id)
    : [];

  // Statistics
  const countBerlangsung = allTableRows.filter((r) => r.status === 'Berlangsung').length;
  const countTerjadwal = allTableRows.filter((r) => r.status === 'Terjadwal').length;
  const countTerlaksana = allTableRows.filter((r) => r.status === 'Terlaksana').length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-between overflow-hidden select-none font-sans">
      
      {/* Top Header of TV Display */}
      <header className="px-6 py-3.5 bg-slate-900/95 border-b border-emerald-500/20 flex items-center justify-between backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-800 text-white flex items-center justify-center font-black text-lg shadow-lg shadow-emerald-500/20 border border-emerald-400/30 shrink-0">
            TGS
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {config.schoolName}
              </h1>
              <span className="text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Database Real-Time Sinkron</span>
              </span>
            </div>
            <p className="text-xs text-emerald-300 font-medium truncate max-w-xl" title={config.schoolAddress || 'Jl. KH. Abdul Majid No.09, Krajan 2, Tegalsari, Kec. Tegalsari, Kabupaten Banyuwangi'}>
              {config.schoolAddress || 'Jl. KH. Abdul Majid No.09, Krajan 2, Tegalsari, Kec. Tegalsari, Kabupaten Banyuwangi'} • TA {config.academicYear}
            </p>
          </div>
        </div>

        {/* View Mode Toggle Pill & Day Tabs */}
        <div className="hidden lg:flex items-center gap-3 bg-slate-950/70 p-1.5 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'table'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Tabel TV Signage</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('card')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'card'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kartu Sesi (Rolling)</span>
            </button>
          </div>

          {/* Quick Day Selector for TV */}
          <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
            {DAYS_LIST.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => {
                  setSelectedDay(day);
                  setCurrentSlide30(0);
                  setTableClassIndex(0);
                  setTableCountdown(10);
                }}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-colors ${
                  selectedDay === day
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Active Week Rotation Badge in TV Header */}
          {activeWeek && (
            <button
              type="button"
              onClick={() => onToggleActiveWeek && onToggleActiveWeek()}
              className={`px-3 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border shadow-sm ${
                activeWeek === 'NORMADA_10_PRODUKTIF_11'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 hover:bg-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-400/40 hover:bg-amber-500/30'
              }`}
              title="Siklus Pekan KBM Aktif (Klik untuk ubah)"
            >
              <span>🔄</span>
              <span>{WEEK_ROTATION_CONFIG[activeWeek]?.shortTitle || activeWeek}</span>
            </button>
          )}
        </div>

        {/* Big Digital Clock & Controls */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="font-mono text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>{formatTimeWithSeconds(currentTime)}</span>
              <span className="text-xs sm:text-sm text-emerald-400 font-bold">WIB</span>
            </div>
            <div className="text-[11px] text-slate-400 font-semibold">
              {formatDateIndonesian(currentTime)}
            </div>
          </div>

          <div className="flex items-center gap-1.5 pl-3 border-l border-slate-700">
            <button
              onClick={() => bellPlayer.playSchoolChime()}
              title="Tes Bel Sekolah"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 transition-colors"
            >
              <Bell className="w-4 h-4" />
            </button>
            <button
              onClick={toggleFullscreen}
              title="Layar Penuh"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              title="Keluar Mode TV"
              className="p-2 rounded-xl bg-rose-900/40 hover:bg-rose-900 text-rose-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main TV Content Area */}
      <main className="flex-1 p-3 sm:p-5 flex flex-col overflow-hidden max-w-[1920px] mx-auto w-full">

        {viewMode === 'table' ? (
          /* ========================================================
             TV SIGNAGE TABLE VIEW WITH ROLLING PER KELAS & 30 BARIS
             ======================================================== */
          <div className="flex-1 flex flex-col justify-between overflow-hidden bg-slate-900/80 rounded-3xl border border-emerald-500/20 shadow-2xl backdrop-blur-md p-4">
            
            {/* Table Control Header Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-3.5 py-1 rounded-xl text-xs font-black bg-emerald-600 text-white shadow-xs flex items-center gap-1.5 tracking-wide">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>HARI {selectedDay}</span>
                </span>

                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span className="flex items-center gap-1 text-emerald-300 bg-emerald-950/60 px-2.5 py-0.5 rounded-lg border border-emerald-800/60">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>{countBerlangsung} Berlangsung</span>
                  </span>
                  <span className="flex items-center gap-1 text-blue-300 bg-blue-950/60 px-2.5 py-0.5 rounded-lg border border-blue-800/60">
                    <Clock className="w-3 h-3 text-blue-400" />
                    <span>{countTerjadwal} Terjadwal</span>
                  </span>
                  <span className="flex items-center gap-1 text-slate-400 bg-slate-800/60 px-2.5 py-0.5 rounded-lg border border-slate-700/60">
                    <CheckCircle2 className="w-3 h-3 text-slate-400" />
                    <span>{countTerlaksana} Selesai</span>
                  </span>
                </div>
              </div>

              {/* Mode Tampilan Rolling Table */}
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setTableRollingType('byClass');
                      setTableClassIndex(0);
                      setTableCountdown(10);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${
                      tableRollingType === 'byClass' 
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs ring-1 ring-emerald-400' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${tableRollingType === 'byClass' && isTableAutoRotate ? 'animate-spin' : ''}`} />
                    <span>🔄 Rolling Bergantian per Kelas</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTableRollingType('byPage30');
                      setCurrentSlide30(0);
                      setTableCountdown(10);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors ${
                      tableRollingType === 'byPage30' ? 'bg-emerald-700 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    30 Baris
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTableRollingType('dual60');
                      setCurrentSlide30(0);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors ${
                      tableRollingType === 'dual60' ? 'bg-emerald-700 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    60 Baris (Dual Kolom)
                  </button>
                </div>

                {/* Font Size Selector for TV */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  <span className="text-[11px] text-slate-400 px-1 font-medium">Huruf:</span>
                  <button
                    type="button"
                    onClick={() => setTvFontSize('large')}
                    className={`px-2 py-0.5 rounded-lg font-bold text-xs transition-colors ${
                      tvFontSize === 'large' ? 'bg-emerald-700 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Ukuran Tulisan Besar"
                  >
                    Besar
                  </button>
                  <button
                    type="button"
                    onClick={() => setTvFontSize('xl')}
                    className={`px-2 py-0.5 rounded-lg font-bold text-xs transition-colors ${
                      tvFontSize === 'xl' ? 'bg-emerald-700 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Ukuran Tulisan Ekstra Besar (Sangat Jelas dari Kejauhan)"
                  >
                    Ekstra Besar
                  </button>
                </div>

                {/* Auto Rotate Toggle & Countdown */}
                <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setIsTableAutoRotate(!isTableAutoRotate)}
                    className="p-1 rounded-md text-emerald-400 hover:bg-slate-800 transition-colors"
                    title={isTableAutoRotate ? 'Jeda Rolling Otomatis' : 'Aktifkan Rolling Otomatis'}
                  >
                    {isTableAutoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                  {isTableAutoRotate && (
                    <span className="font-mono text-[11px] text-emerald-300 font-bold">
                      {tableCountdown}s
                    </span>
                  )}
                </div>

                {/* Next/Prev Navigation */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleManualPrev}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Sebelumnya"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-mono text-xs px-2 font-bold text-slate-300">
                    {tableRollingType === 'byClass'
                      ? `${(tableClassIndex % classes.length) + 1} / ${classes.length}`
                      : `${currentSlide30 + 1} / ${totalSlides30}`}
                  </span>
                  <button
                    type="button"
                    onClick={handleManualNext}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Selanjutnya"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Active Class Highlight Banner if in 'byClass' Rolling Mode */}
            {tableRollingType === 'byClass' && activeRollingClass && (
              <div className="my-2.5 px-5 py-3 bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 rounded-2xl border-2 border-emerald-500/50 flex items-center justify-between shrink-0 shadow-lg">
                <div className="flex items-center gap-4">
                  <span className="px-4 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-base sm:text-xl tracking-wider uppercase shadow-md">
                    {activeRollingClass.name}
                  </span>
                  <span className="text-sm sm:text-base text-emerald-200 font-bold">
                    {activeRollingClass.department} • Ruang: {activeRollingClass.roomDefault || 'R.J1'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-slate-300 font-medium">Rombel:</span>
                  <span className="font-black text-emerald-300 text-sm sm:text-base">
                    {(tableClassIndex % classes.length) + 1} dari {classes.length} Kelas
                  </span>
                  {isTableAutoRotate && (
                    <span className="text-xs sm:text-sm text-emerald-300 font-mono font-bold bg-emerald-950/90 px-3 py-1 rounded-xl border border-emerald-700 shadow-xs">
                      Berganti dalam {tableCountdown}s
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* TV Table Content */}
            <div className="flex-1 overflow-hidden my-1">
              {allTableRows.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <Calendar className="w-12 h-12 text-slate-600 mb-3" />
                  <p className="text-lg font-bold text-slate-300">Belum ada data jadwal untuk hari {selectedDay}</p>
                  <p className="text-xs text-slate-500 mt-1">Silakan pilih hari lain atau muat jadwal di Menu Admin.</p>
                </div>
              ) : tableRollingType === 'byClass' ? (
                /* Mode 1: Rolling Bergantian per Rombel Kelas */
                <div className="h-full overflow-hidden flex flex-col border border-slate-800/80 rounded-2xl bg-slate-950/40">
                  {renderTvTable(activeClassRows, 1)}
                </div>
              ) : tableRollingType === 'dual60' ? (
                /* Mode 2: 60 Baris Dual Columns */
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 h-full overflow-hidden">
                  <div className="overflow-hidden flex flex-col border border-slate-800/80 rounded-2xl bg-slate-950/40">
                    {renderTvTable(allTableRows.slice(0, 30), 1)}
                  </div>
                  <div className="overflow-hidden flex flex-col border border-slate-800/80 rounded-2xl bg-slate-950/40">
                    {renderTvTable(allTableRows.slice(30, 60), 31)}
                  </div>
                </div>
              ) : (
                /* Mode 3: 30 Baris Standard */
                <div className="h-full overflow-hidden flex flex-col border border-slate-800/80 rounded-2xl bg-slate-950/40">
                  {renderTvTable(allTableRows.slice(currentSlide30 * 30, (currentSlide30 + 1) * 30), currentSlide30 * 30 + 1)}
                </div>
              )}
            </div>

            {/* Table Footer with Carousel Progress & Stats */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 shrink-0 gap-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {tableRollingType === 'byClass' ? (
                    <span>
                      Jadwal Lengkap Kelas <strong className="text-white font-bold">{activeRollingClass?.name}</strong> •{' '}
                      <strong className="text-emerald-400 font-mono">{activeClassRows.length}</strong> jam sesi pembelajaran
                    </span>
                  ) : (
                    <span>
                      Menampilkan baris <strong className="text-white font-mono">{currentSlide30 * 30 + 1}</strong> s/d{' '}
                      <strong className="text-white font-mono">
                        {Math.min((currentSlide30 + 1) * 30, allTableRows.length)}
                      </strong>{' '}
                      dari total <strong className="text-emerald-400 font-mono">{allTableRows.length}</strong> jadwal hari {selectedDay}
                    </span>
                  )}
                </span>
              </div>

              {/* Auto Slide Progress Indicator */}
              {isTableAutoRotate && (
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span>Rolling bergantian dalam:</span>
                  <div className="w-20 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-emerald-400 h-1.5 transition-all duration-1000"
                      style={{ width: `${(tableCountdown / 10) * 100}%` }}
                    />
                  </div>
                  <span className="font-mono font-bold text-white">{tableCountdown}s</span>
                </div>
              )}
            </div>

          </div>
        ) : (
          /* ========================================================
             CARD VIEW: ROLLING CAROUSEL ACROSS ALL CLASSES
             ======================================================== */
          <div className="flex-1 flex flex-col justify-between max-w-7xl mx-auto w-full overflow-hidden">
            
            {/* Status Pill & Rolling Bar Header */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <span className="px-4 py-1.5 rounded-full text-sm font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {statusText.toUpperCase()}
                </span>
                {currentSlot && (
                  <span className="text-lg font-mono text-slate-300 font-bold">
                    Pukul {currentSlot.timeStart} - {currentSlot.timeEnd} WIB
                  </span>
                )}
              </div>

              {/* Rolling Classes Indicator & Controls */}
              <div className="flex items-center gap-3 bg-slate-900 px-4 py-1.5 rounded-2xl border border-slate-800 shadow-md">
                <div className="flex items-center gap-2">
                  <RotateCcw className={`w-4 h-4 text-emerald-400 ${isCardRolling ? 'animate-spin' : ''}`} />
                  <span className="text-xs text-slate-300 font-bold">
                    Rolling Kelas: <strong className="text-emerald-300 font-mono">{validCardSlide * cardBatchSize + 1} - {Math.min((validCardSlide + 1) * cardBatchSize, classes.length)}</strong> dari <strong className="text-white font-mono">{classes.length}</strong> Rombel
                  </span>
                </div>

                <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsCardRolling(!isCardRolling)}
                    className="p-1 rounded-md text-emerald-400 hover:bg-slate-800 transition-colors"
                    title={isCardRolling ? 'Jeda Rolling Kelas' : 'Lanjutkan Rolling Kelas'}
                  >
                    {isCardRolling ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                  {isCardRolling && (
                    <span className="font-mono text-xs font-bold text-emerald-300">
                      {cardCountdown}s
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleManualPrev}
                    className="p-1 rounded-md text-slate-400 hover:text-white"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleManualNext}
                    className="p-1 rounded-md text-slate-400 hover:text-white"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {currentSlot && (
                  <div className="pl-3 border-l border-slate-800 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <span className="font-mono text-sm font-black text-emerald-300">{timeRemainingFormatted}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Bar of Current Period */}
            {currentSlot && (
              <div className="mb-4 shrink-0">
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700/50">
                  <div
                    className="bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 h-2.5 rounded-full transition-all duration-1000"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Big Cards of Ongoing Class Activities (Rotates smoothly 2 classes at a time) */}
            <div className="flex-1 flex flex-col justify-center overflow-hidden my-2">
              {currentSlot && (currentSlot.type === 'REGULAR' || currentSlot.type === 'DINIYAH') ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                  {visibleCardClasses.map((cls) => {
                    const assignment = currentSlot.classes[cls.id];
                    if (!assignment) return null;
                    const teacherObj = getTeacher(assignment.teacherCode);
                    const isDiniyah = currentSlot.type === 'DINIYAH' || assignment.subject.toUpperCase().includes('DINIYAH');

                    return (
                      <div
                        key={cls.id}
                        className={`p-6 sm:p-8 rounded-3xl border-2 transition-all shadow-2xl relative overflow-hidden flex flex-col justify-between ${
                          isDiniyah
                            ? 'bg-rose-950/40 border-pink-500/60'
                            : 'bg-emerald-950/40 border-emerald-500/50'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <span className="px-4 py-1.5 rounded-2xl bg-white/10 backdrop-blur-md text-base sm:text-lg font-black tracking-wider text-white border border-white/20 shadow-xs">
                              {cls.name}
                            </span>
                            <span className="flex items-center gap-1.5 text-sm sm:text-base font-extrabold text-emerald-300 bg-emerald-900/80 px-4 py-1.5 rounded-xl border border-emerald-400/30">
                              <MapPin className="w-4 h-4 text-emerald-400" />
                              {assignment.room}
                            </span>
                          </div>

                          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight my-4 leading-tight">
                            {assignment.subject}
                          </h2>
                        </div>

                        <div className="pt-4 border-t border-slate-700/60 flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white font-mono font-black text-lg flex items-center justify-center shrink-0 shadow-md">
                            {assignment.teacherCode}
                          </div>
                          <div>
                            <div className="text-base sm:text-lg font-bold text-white">
                              {teacherObj?.name || `Guru: ${assignment.teacherCode}`}
                            </div>
                            <div className="text-xs sm:text-sm text-emerald-300">
                              {teacherObj?.subject || 'Guru Pengampu'}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : currentSlot && currentSlot.type === 'BREAK' ? (
                <div className="bg-slate-900/80 border border-amber-500/40 rounded-3xl p-10 text-center max-w-2xl mx-auto shadow-2xl">
                  <div className="inline-flex p-4 rounded-3xl bg-amber-500/20 text-amber-300 mb-4">
                    <Coffee className="w-12 h-12" />
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">
                    {currentSlot.title || 'WAKTU ISTIRAHAT'}
                  </h2>
                  <p className="text-slate-300 text-base">
                    Siswa dapat beristirahat dan melaksanakan ibadah dengan tertib.
                  </p>
                </div>
              ) : currentSlot && currentSlot.type === 'UPACARA' ? (
                <div className="bg-red-950/40 border border-red-500/50 rounded-3xl p-10 text-center max-w-2xl mx-auto shadow-2xl">
                  <div className="inline-flex p-4 rounded-3xl bg-red-500/20 text-red-300 mb-4">
                    <Flag className="w-12 h-12" />
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">
                    UPACARA BENDERA
                  </h2>
                  <p className="text-slate-300 text-base">
                    Seluruh siswa di Lapangan Utama SMKN 1 Tegalsari.
                  </p>
                </div>
              ) : currentSlot && currentSlot.type === 'ISTIGOSAH' ? (
                <div className="bg-cyan-950/40 border border-cyan-400/50 rounded-3xl p-10 text-center max-w-2xl mx-auto shadow-2xl">
                  <div className="inline-flex p-4 rounded-3xl bg-cyan-500/20 text-cyan-300 mb-4">
                    <Sparkles className="w-12 h-12" />
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">
                    ISTIGOSAH BERSAMA JUMAT PAGI
                  </h2>
                  <p className="text-slate-300 text-base">
                    Doa bersama dan pembinaan akhlak mulia seluruh warga SMKN 1 Tegalsari.
                  </p>
                </div>
              ) : (
                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-10 text-center max-w-2xl mx-auto">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">{statusText}</h2>
                  <p className="text-slate-400 text-sm">
                    Sistem akan otomatis memperbarui tampilan saat jam pelajaran baru dimulai.
                  </p>
                </div>
              )}
            </div>

            {/* Next Session Preview Footer */}
            {nextSlot && (
              <div className="mt-4 bg-slate-900/70 rounded-2xl p-3 sm:p-4 border border-slate-800 flex flex-wrap items-center justify-between text-xs sm:text-sm shrink-0 gap-2">
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-emerald-400" />
                  <span className="font-extrabold text-white">Sesi Selanjutnya:</span>
                  <span className="font-semibold text-emerald-300">
                    {nextSlot.title || (nextSlot.periodNumber ? `Jam ke-${nextSlot.periodNumber}` : 'Sesi Lanjutan')} ({nextSlot.timeStart} - {nextSlot.timeEnd})
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs font-medium text-slate-300">
                  {visibleCardClasses.map((c) => {
                    const a = nextSlot.classes[c.id];
                    if (!a) return null;
                    return (
                      <span key={c.id}>
                        <strong className="text-white">{c.name}:</strong> {a.subject} ({a.room})
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}

      </main>

      {/* Bottom Running Ticker */}
      <footer className="bg-emerald-950 text-white py-2.5 px-6 border-t border-emerald-700/60 flex items-center overflow-hidden shrink-0">
        <div className="bg-emerald-800 text-emerald-200 px-3 py-1 rounded-lg text-xs font-black shrink-0 tracking-wider uppercase mr-4 shadow-xs">
          PENGUMUMAN
        </div>
        <div className="overflow-hidden whitespace-nowrap w-full">
          <div className="animate-ticker text-xs sm:text-sm font-semibold tracking-wide inline-block text-emerald-100">
            {config.schoolName} ({config.schoolAddress || 'Jl. KH. Abdul Majid No.09, Krajan 2, Tegalsari, Kec. Tegalsari, Kabupaten Banyuwangi'}) • {config.runningAnnouncement}
          </div>
        </div>
      </footer>

    </div>
  );

  // Helper renderer for TV Signage table with enlarged text sizes for high visibility
  function renderTvTable(rows: TvScheduleRow[], startingNumber: number) {
    if (rows.length === 0) {
      return (
        <div className="p-8 text-center text-sm text-slate-400 font-medium">
          Tidak ada baris jadwal pada slide ini.
        </div>
      );
    }

    const isXL = tvFontSize === 'xl';

    return (
      <div className="overflow-x-auto flex-1 h-full">
        <table className="w-full text-left border-collapse h-full">
          <thead>
            <tr className={`bg-emerald-900 text-white font-black uppercase tracking-wider border-b-2 border-emerald-600/70 ${
              isXL ? 'text-sm sm:text-base py-3 px-4' : 'text-xs sm:text-sm py-2.5 px-3.5'
            }`}>
              <th className="py-2.5 px-3 text-center w-12">No</th>
              <th className={`py-2.5 px-3 text-center ${isXL ? 'w-36' : 'w-32'}`}>Jam & Waktu</th>
              <th className={`py-2.5 px-3 ${isXL ? 'w-36' : 'w-32'}`}>Kelas</th>
              <th className="py-2.5 px-4">Mata Pelajaran</th>
              <th className="py-2.5 px-4">Guru Pengampu</th>
              <th className={`py-2.5 px-3 text-center ${isXL ? 'w-28' : 'w-24'}`}>Ruang</th>
              <th className={`py-2.5 px-3 text-center ${isXL ? 'w-36' : 'w-32'}`}>Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {rows.map((row, index) => {
              const isOngoing = row.status === 'Berlangsung';
              const isFinished = row.status === 'Terlaksana';
              const rowNumber = startingNumber + index;

              return (
                <tr
                  key={row.id}
                  className={`transition-colors ${
                    isOngoing
                      ? 'bg-emerald-950/95 font-bold border-l-4 border-l-emerald-400 text-white ring-2 ring-inset ring-emerald-500/60 shadow-lg'
                      : isFinished
                      ? 'bg-slate-950/60 text-slate-400 hover:bg-slate-900/60'
                      : index % 2 === 0
                      ? 'bg-slate-900/50 hover:bg-slate-800/50 text-slate-200'
                      : 'bg-slate-900/80 hover:bg-slate-800/60 text-slate-200'
                  }`}
                >
                  {/* Row Number */}
                  <td className={`py-2 px-3 text-center font-mono text-slate-300 font-extrabold ${
                    isXL ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
                  }`}>
                    {rowNumber}
                  </td>

                  {/* Jam & Waktu */}
                  <td className="py-2 px-3 text-center whitespace-nowrap">
                    <span className={`font-black text-white block ${
                      isXL ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
                    }`}>
                      {row.periodDisplay}
                    </span>
                    <span className={`font-mono text-emerald-300 font-bold ${
                      isXL ? 'text-xs sm:text-sm' : 'text-[11px] sm:text-xs'
                    }`}>
                      {row.timeStart} - {row.timeEnd}
                    </span>
                  </td>

                  {/* Kelas */}
                  <td className="py-2 px-3 whitespace-nowrap">
                    <span className={`rounded-xl font-black tracking-wide bg-slate-800 text-emerald-300 border border-slate-700 shadow-xs inline-block ${
                      isXL ? 'px-3 py-1.5 text-xs sm:text-sm' : 'px-2.5 py-1 text-xs'
                    }`}>
                      {row.className}
                    </span>
                  </td>

                  {/* Mata Pelajaran */}
                  <td className="py-2 px-4">
                    <span className={`font-black tracking-tight leading-snug block ${
                      isXL ? 'text-base sm:text-lg lg:text-xl' : 'text-sm sm:text-base'
                    } ${isOngoing ? 'text-emerald-200 font-black' : 'text-white'}`}>
                      {row.subject}
                    </span>
                  </td>

                  {/* Guru Pengampu */}
                  <td className="py-2 px-4">
                    {row.teacherCode !== '-' ? (
                      <div className="flex items-center gap-2">
                        <span className={`rounded-lg bg-emerald-700 text-white font-mono font-black flex items-center justify-center shrink-0 shadow-xs ${
                          isXL ? 'w-8 h-8 text-xs sm:text-sm' : 'w-7 h-7 text-xs'
                        }`}>
                          {row.teacherCode}
                        </span>
                        <span className={`font-bold text-slate-100 truncate ${
                          isXL ? 'text-xs sm:text-sm max-w-[280px]' : 'text-xs max-w-[220px]'
                        }`}>
                          {row.teacherName}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-500 font-mono font-bold">-</span>
                    )}
                  </td>

                  {/* Ruang */}
                  <td className="py-2 px-3 text-center whitespace-nowrap">
                    <span className={`font-mono font-black text-emerald-200 bg-slate-800/90 rounded-xl border border-slate-700 shadow-2xs inline-block ${
                      isXL ? 'px-3 py-1.5 text-xs sm:text-sm' : 'px-2.5 py-1 text-xs'
                    }`}>
                      {row.room}
                    </span>
                  </td>

                  {/* Status Real-Time */}
                  <td className="py-2 px-3 text-center whitespace-nowrap">
                    {isOngoing && (
                      <span className={`inline-flex items-center gap-1.5 rounded-full font-black bg-emerald-400 text-slate-950 shadow-md ring-2 ring-emerald-300/40 animate-pulse ${
                        isXL ? 'px-3.5 py-1.5 text-xs sm:text-sm' : 'px-3 py-1 text-xs'
                      }`}>
                        <span className="w-2 h-2 rounded-full bg-slate-950"></span>
                        <span>Berlangsung</span>
                      </span>
                    )}
                    {row.status === 'Terjadwal' && (
                      <span className={`inline-flex items-center gap-1.5 rounded-full font-bold bg-blue-950/80 text-blue-200 border border-blue-700 ${
                        isXL ? 'px-3 py-1.5 text-xs sm:text-sm' : 'px-2.5 py-1 text-xs'
                      }`}>
                        <span>Terjadwal</span>
                      </span>
                    )}
                    {isFinished && (
                      <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-slate-800 text-slate-400 border border-slate-700/80 ${
                        isXL ? 'px-3 py-1.5 text-xs sm:text-sm' : 'px-2.5 py-1 text-xs'
                      }`}>
                        <span>Selesai</span>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
};
