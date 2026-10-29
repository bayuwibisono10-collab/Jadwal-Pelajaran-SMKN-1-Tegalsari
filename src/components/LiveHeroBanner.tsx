import React from 'react';
import { 
  Sparkles, 
  MapPin, 
  User, 
  ArrowRight, 
  Coffee, 
  Flag, 
  BookOpen, 
  Award,
  Sun,
  Activity,
  AlertCircle,
  Table,
  Calendar,
  Clock as ClockIcon
} from 'lucide-react';
import { ScheduleSlot, Teacher, SchoolClass, DayType, WeekRotationType, WEEK_ROTATION_CONFIG } from '../types/schedule';
import { SlotStatusResult } from '../utils/timeHelper';

interface LiveHeroBannerProps {
  statusResult: SlotStatusResult;
  selectedDay: DayType;
  setSelectedDay: (day: DayType) => void;
  classes: SchoolClass[];
  teachers: Teacher[];
  currentRealDay: DayType | 'MINGGU' | 'SABTU';
  isLiveDay: boolean;
  activeView?: 'status-table' | 'today' | 'original' | 'teachers' | 'rooms' | 'admin';
  setActiveView?: (view: 'status-table' | 'today' | 'original' | 'teachers' | 'rooms' | 'admin') => void;
  activeWeek?: WeekRotationType;
  onToggleActiveWeek?: (week?: WeekRotationType) => void;
}

export const LiveHeroBanner: React.FC<LiveHeroBannerProps> = ({
  statusResult,
  selectedDay,
  setSelectedDay,
  classes,
  teachers,
  currentRealDay,
  isLiveDay,
  activeView,
  setActiveView,
  activeWeek = 'NORMADA_10_PRODUKTIF_11',
  onToggleActiveWeek,
}) => {
  const { currentSlot, nextSlot, status, statusText, progressPercentage, timeRemainingFormatted } = statusResult;

  const getTeacher = (code: string) => {
    return teachers.find((t) => t.code.toUpperCase() === code.toUpperCase());
  };

  const days: DayType[] = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT'];

  return (
    <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-950 text-white rounded-3xl p-5 sm:p-7 shadow-xl shadow-emerald-950/20 mb-6 border border-emerald-700/50 relative overflow-hidden">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
      <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-teal-400/10 rounded-full blur-3xl pointer-events-none -mb-20"></div>

      {/* Top Header of the Hero Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-emerald-700/50 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              STATUS LIVE KBM
            </span>

            {isLiveDay ? (
              <span className="text-xs text-emerald-300 font-medium">
                Hari ini: <strong className="text-white">{selectedDay}</strong>
              </span>
            ) : (
              <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium">
                Melihat Jadwal: <strong>{selectedDay}</strong> (Hari ini adalah {currentRealDay})
              </span>
            )}

            {/* Active Week Rotation Cycle Badge */}
            <button
              type="button"
              onClick={() => onToggleActiveWeek && onToggleActiveWeek()}
              className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer ${
                activeWeek === 'NORMADA_10_PRODUKTIF_11'
                  ? 'bg-emerald-400/20 text-emerald-100 border border-emerald-400/40 hover:bg-emerald-400/30'
                  : 'bg-amber-400/25 text-amber-100 border border-amber-400/50 hover:bg-amber-400/35'
              }`}
              title="Klik untuk beralih giliran pekan KBM"
            >
              <span>🔄</span>
              <span>{WEEK_ROTATION_CONFIG[activeWeek]?.title || activeWeek}</span>
              <span className="text-[10px] bg-white/20 px-1 py-0.2 rounded font-mono">Ubah ⇄</span>
            </button>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            {statusText}
          </h2>
          
          {currentSlot && (
            <p className="text-sm text-emerald-200/90 font-medium mt-1">
              Pukul <span className="font-mono font-bold text-white bg-emerald-900/60 px-2 py-0.5 rounded">{currentSlot.timeStart} - {currentSlot.timeEnd} WIB</span>
              {currentSlot.periodNumber && ` • Jam ke-${currentSlot.periodNumber}`}
            </p>
          )}
        </div>

        {/* Real-time Progress Bar & Countdown Timer */}
        {currentSlot && (
          <div className="bg-emerald-950/60 backdrop-blur-md rounded-2xl p-3.5 border border-emerald-600/30 min-w-[240px] shrink-0">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-200 mb-1.5">
              <span>Sisa Waktu Sesi Ini:</span>
              <span className="font-mono font-bold text-emerald-100 text-sm">{timeRemainingFormatted}</span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-emerald-900/80 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-emerald-400 to-teal-300 h-2.5 rounded-full transition-all duration-1000 ease-linear shadow-xs shadow-emerald-400/50"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[10px] text-emerald-400/80 mt-1 font-mono">
              <span>Mulai {currentSlot.timeStart}</span>
              <span>{progressPercentage}% Berjalan</span>
              <span>Selesai {currentSlot.timeEnd}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area: Classes State Side-by-Side */}
      <div className="py-5 relative z-10">
        
        {/* If Break or Upacara or Special Full-School Event */}
        {currentSlot && currentSlot.type === 'BREAK' && (
          <div className="bg-slate-900/50 backdrop-blur-md border border-emerald-500/30 rounded-2xl p-6 text-center">
            <div className="inline-flex p-3 rounded-2xl bg-amber-500/20 text-amber-300 mb-3">
              <Coffee className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">{currentSlot.title || 'WAKTU ISTIRAHAT'}</h3>
            <p className="text-emerald-200 text-sm max-w-md mx-auto">
              Siswa diperbolehkan beristirahat, jajan di kantin sehat sekolah, atau melaksanakan sholat berjamaah di masjid SMKN 1 Tegalsari.
            </p>
          </div>
        )}

        {currentSlot && currentSlot.type === 'UPACARA' && (
          <div className="bg-red-950/40 backdrop-blur-md border border-red-500/40 rounded-2xl p-6 text-center">
            <div className="inline-flex p-3 rounded-2xl bg-red-500/20 text-red-300 mb-3">
              <Flag className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">UPACARA BENDERA HARI SENIN</h3>
            <p className="text-red-200 text-sm max-w-md mx-auto">
              Seluruh siswa X Kuliner 1, X Kuliner 2, dan dewan guru berkumpul tertib di Lapangan Utama SMKN 1 Tegalsari.
            </p>
          </div>
        )}

        {currentSlot && currentSlot.type === 'ISTIGOSAH' && (
          <div className="bg-cyan-950/50 backdrop-blur-md border border-cyan-400/40 rounded-2xl p-6 text-center">
            <div className="inline-flex p-3 rounded-2xl bg-cyan-500/20 text-cyan-300 mb-3">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">ISTIGOSAH BERSAMA JUMAT PAGI</h3>
            <p className="text-cyan-200 text-sm max-w-md mx-auto">
              Pembacaan doa, istigosah, dan pembinaan karakter religius di Masjid / Lapangan SMKN 1 Tegalsari.
            </p>
          </div>
        )}

        {currentSlot && currentSlot.type === 'EKSTRAKURIKULER' && (
          <div className="bg-indigo-950/50 backdrop-blur-md border border-indigo-400/40 rounded-2xl p-6 text-center">
            <div className="inline-flex p-3 rounded-2xl bg-indigo-500/20 text-indigo-300 mb-3">
              <Award className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">KEGIATAN EKSTRAKURIKULER JUMAT</h3>
            <p className="text-indigo-200 text-sm max-w-md mx-auto">
              Pramuka, Olahraga, PMR, Seni, Jurnalistik, dan pengembangan bakat minat siswa di lingkungan sekolah.
            </p>
          </div>
        )}

        {/* Regular or Diniyah Classroom Teaching */}
        {currentSlot && (currentSlot.type === 'REGULAR' || currentSlot.type === 'DINIYAH') && (
          <div className={`grid grid-cols-1 ${classes.length > 2 ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
            {classes.map((cls) => {
              const assignment = currentSlot.classes[cls.id];
              if (!assignment) return null;
              const teacherObj = getTeacher(assignment.teacherCode);
              const isDiniyah = currentSlot.type === 'DINIYAH' || assignment.subject.toUpperCase().includes('DINIYAH');

              return (
                <div 
                  key={cls.id}
                  className={`relative rounded-2xl p-5 border transition-all ${
                    isDiniyah
                      ? 'bg-rose-950/40 border-pink-400/40 hover:border-pink-300'
                      : 'bg-emerald-950/40 border-emerald-600/40 hover:border-emerald-400'
                  }`}
                >
                  {/* Class Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 rounded-xl bg-white/10 backdrop-blur-md text-xs font-black tracking-wide text-white border border-white/10">
                      {cls.name}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-200 bg-emerald-900/60 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      {assignment.room}
                    </span>
                  </div>

                  {/* Subject Name */}
                  <h4 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2">
                    {assignment.subject}
                  </h4>

                  {/* Teacher Info */}
                  <div className="flex items-center gap-2.5 pt-2 border-t border-emerald-800/40">
                    <div className="w-8 h-8 rounded-lg bg-emerald-800 text-emerald-200 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-600/30">
                      {assignment.teacherCode}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">
                        {teacherObj?.name || `Guru Kode: ${assignment.teacherCode}`}
                      </div>
                      <div className="text-[11px] text-emerald-300/80">
                        {teacherObj?.subject || 'Tenaga Pendidik SMKN 1 Tegalsari'}
                      </div>
                    </div>
                  </div>

                  {isDiniyah && (
                    <div className="mt-3 text-[11px] bg-pink-500/20 text-pink-200 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 border border-pink-500/30">
                      <Sparkles className="w-3 h-3 text-pink-300" />
                      Program Penguatan Keagamaan & Karakter (Diniyah)
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* When Before School, After School, or Weekend */}
        {!currentSlot && (
          <div className="bg-emerald-950/40 backdrop-blur-md border border-emerald-600/30 rounded-2xl p-6 text-center">
            <div className="inline-flex p-3 rounded-2xl bg-emerald-500/20 text-emerald-300 mb-2">
              <Sun className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              {status === 'WEEKEND' ? 'Selamat Berakhir Pekan!' : statusText}
            </h3>
            <p className="text-emerald-200 text-sm max-w-md mx-auto">
              {status === 'WEEKEND'
                ? 'Tidak ada kegiatan belajar mengajar aktif hari ini. Anda dapat melihat jadwal lengkap hari Senin - Jumat di bawah.'
                : status === 'BEFORE_SCHOOL'
                ? 'Kegiatan Belajar Mengajar segera dimulai. Pastikan kehadiran tepat waktu dan tertib.'
                : 'KBM hari ini telah selesai. Selamat beristirahat dan belajar mandiri di rumah.'}
            </p>
          </div>
        )}

      </div>

      {/* Next Upcoming Slot Bar */}
      {nextSlot && (
        <div className="mt-2 pt-3 border-t border-emerald-700/50 flex flex-wrap items-center justify-between text-xs text-emerald-200 gap-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white flex items-center gap-1 bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-600/30">
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              Sesi Berikutnya:
            </span>
            <span className="font-semibold text-white">
              {nextSlot.title || (nextSlot.periodNumber ? `Jam ke-${nextSlot.periodNumber}` : 'Sesi Lanjutan')}
            </span>
            <span>({nextSlot.timeStart} - {nextSlot.timeEnd} WIB)</span>
          </div>

          <div className="flex items-center gap-3 font-medium">
            {classes.map((c) => {
              const nextAssignment = nextSlot.classes[c.id];
              if (!nextAssignment) return null;
              return (
                <span key={c.id} className="text-emerald-100">
                  <strong className="text-white">{c.name}:</strong> {nextAssignment.subject} ({nextAssignment.room})
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick View & Day Switcher Bar */}
      <div className="mt-5 pt-4 border-t border-emerald-700/50 flex flex-col md:flex-row md:items-center justify-between gap-3 relative z-10">
        
        {/* Quick View Mode Switcher */}
        {setActiveView && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-emerald-300 font-semibold flex items-center gap-1">
              <Table className="w-3.5 h-3.5" />
              Tampilan:
            </span>
            <button
              onClick={() => setActiveView('status-table')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeView === 'status-table'
                  ? 'bg-white text-emerald-900 shadow-md font-extrabold'
                  : 'bg-emerald-950/60 text-emerald-200 hover:bg-emerald-900 hover:text-white border border-emerald-700/40'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Tabel Status KBM</span>
            </button>
            <button
              onClick={() => setActiveView('original')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeView === 'original'
                  ? 'bg-amber-400 text-amber-950 shadow-md font-extrabold'
                  : 'bg-emerald-950/60 text-emerald-200 hover:bg-emerald-900 hover:text-white border border-emerald-700/40'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Tabel Matriks (10 Kuliner 1 & 2)</span>
            </button>
            <button
              onClick={() => setActiveView('today')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeView === 'today'
                  ? 'bg-white text-emerald-900 shadow-md font-extrabold'
                  : 'bg-emerald-950/60 text-emerald-200 hover:bg-emerald-900 hover:text-white border border-emerald-700/40'
              }`}
            >
              <ClockIcon className="w-3.5 h-3.5" />
              <span>Timeline</span>
            </button>
          </div>
        )}

        {/* Quick Day Switcher Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-emerald-300 font-semibold flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            Hari:
          </span>
          {days.map((day) => {
            const isSelected = selectedDay === day;
            const isToday = currentRealDay === day;

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all relative ${
                  isSelected
                    ? 'bg-white text-emerald-900 shadow-md font-extrabold scale-105'
                    : 'bg-emerald-950/60 text-emerald-200 hover:bg-emerald-900 hover:text-white border border-emerald-700/40'
                }`}
              >
                {day}
                {isToday && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-emerald-900" title="Hari ini"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};
