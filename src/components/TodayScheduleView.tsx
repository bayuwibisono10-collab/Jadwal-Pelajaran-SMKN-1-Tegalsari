import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  MapPin, 
  User, 
  Search, 
  Filter, 
  CheckCircle2, 
  PlayCircle, 
  Calendar, 
  Layers, 
  Sparkles, 
  Coffee, 
  Flag, 
  Award,
  RotateCcw,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ScheduleSlot, Teacher, SchoolClass, DayType, WeekRotationType, WEEK_ROTATION_CONFIG } from '../types/schedule';
import { timeStringToMinutes } from '../utils/timeHelper';

interface TodayScheduleViewProps {
  schedule: ScheduleSlot[];
  teachers: Teacher[];
  classes: SchoolClass[];
  selectedDay: DayType;
  currentDay: DayType | 'MINGGU' | 'SABTU';
  currentTime: Date;
  onSelectTeacher?: (code: string) => void;
  onSwitchToTableView?: () => void;
  activeWeek?: WeekRotationType;
  onToggleActiveWeek?: (week?: WeekRotationType) => void;
}

export const TodayScheduleView: React.FC<TodayScheduleViewProps> = ({
  schedule,
  teachers,
  classes,
  selectedDay,
  currentDay,
  currentTime,
  onSelectTeacher,
  onSwitchToTableView,
  activeWeek = 'NORMADA_10_PRODUKTIF_11',
  onToggleActiveWeek,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Rolling classes state
  const [isAutoRolling, setIsAutoRolling] = useState<boolean>(false);
  const [rollingCountdown, setRollingCountdown] = useState<number>(8);

  // Auto-rolling classes effect
  useEffect(() => {
    if (!isAutoRolling || classes.length <= 1) return;

    const timer = setInterval(() => {
      setRollingCountdown((prev) => {
        if (prev <= 1) {
          setSelectedClassId((curr) => {
            const classIds = ['all', ...classes.map((c) => c.id)];
            const currIdx = classIds.indexOf(curr);
            const nextIdx = (currIdx + 1) % classIds.length;
            return classIds[nextIdx];
          });
          return 8;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAutoRolling, classes]);

  const isToday = currentDay === selectedDay;
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

  const getTeacher = (code: string) => {
    return teachers.find((t) => t.code.toUpperCase() === code.toUpperCase());
  };

  const daySlots = schedule
    .filter((s) => s.day === selectedDay)
    .filter((s) => !activeWeek || !s.weekType || s.weekType === 'ALL' || s.weekType === activeWeek)
    .sort((a, b) => timeStringToMinutes(a.timeStart) - timeStringToMinutes(b.timeStart));

  // Filter slots based on class selection and search query
  const filteredSlots = daySlots.filter((slot) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    
    // Check title or break
    if (slot.title?.toLowerCase().includes(q)) return true;

    // Check class assignments
    return Object.values(slot.classes).some((assignment) => {
      const teacher = getTeacher(assignment.teacherCode);
      return (
        assignment.subject.toLowerCase().includes(q) ||
        assignment.teacherCode.toLowerCase().includes(q) ||
        assignment.room.toLowerCase().includes(q) ||
        teacher?.name.toLowerCase().includes(q)
      );
    });
  });

  return (
    <div className="space-y-6 mb-8">
      
      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Class Filter Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            Tampilan Kelas:
          </span>

          <button
            type="button"
            onClick={() => {
              setIsAutoRolling(!isAutoRolling);
              setRollingCountdown(8);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-2xs ${
              isAutoRolling
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-500 ring-2 ring-emerald-500/30'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
            }`}
            title={isAutoRolling ? 'Hentikan Rolling Bergantian' : 'Putar Rolling Bergantian Semua Kelas'}
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isAutoRolling ? 'animate-spin' : ''}`} />
            <span>{isAutoRolling ? `Rolling Aktif (${rollingCountdown}s)` : '🔄 Rolling Bergantian'}</span>
          </button>

          <button
            onClick={() => {
              setSelectedClassId('all');
              setIsAutoRolling(false);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              selectedClassId === 'all' && !isAutoRolling
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Semua Kelas (Berdampingan)
          </button>
          {classes.map((cls) => (
            <button
              key={cls.id}
              onClick={() => {
                setSelectedClassId(cls.id);
                setIsAutoRolling(false);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                selectedClassId === cls.id && !isAutoRolling
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cls.name}
            </button>
          ))}
        </div>

        {/* Search input & Switch to Table */}
        <div className="flex items-center gap-2">
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari mapel, kode guru, ruang..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {onSwitchToTableView && (
            <button
              onClick={onSwitchToTableView}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors whitespace-nowrap flex items-center gap-1.5 shadow-2xs"
            >
              <span>Format Tabel Status →</span>
            </button>
          )}
        </div>

      </div>

      {/* Active Rolling Banner */}
      {isAutoRolling && (
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white px-5 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0"></span>
            <div>
              <span className="text-xs font-bold block">
                Mode Rolling Bergantian Aktif • Menampilkan:{' '}
                <strong className="text-emerald-200">
                  {selectedClassId === 'all'
                    ? 'Semua Kelas (Berdampingan)'
                    : classes.find((c) => c.id === selectedClassId)?.name || selectedClassId}
                </strong>
              </span>
              <span className="text-[11px] text-emerald-100">
                Jadwal setiap kelas bergantian muncul otomatis setiap 8 detik.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-emerald-950/60 px-2.5 py-1 rounded-xl border border-emerald-700/60 text-xs font-mono">
              <Clock className="w-3.5 h-3.5 text-emerald-300" />
              <span>{rollingCountdown}s</span>
            </div>
            <button
              type="button"
              onClick={() => {
                const classIds = ['all', ...classes.map((c) => c.id)];
                const currIdx = classIds.indexOf(selectedClassId);
                const nextIdx = (currIdx + 1) % classIds.length;
                setSelectedClassId(classIds[nextIdx]);
                setRollingCountdown(8);
              }}
              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-colors"
            >
              Lewati →
            </button>
            <button
              type="button"
              onClick={() => setIsAutoRolling(false)}
              className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 rounded-xl text-xs font-bold transition-colors"
            >
              Hentikan
            </button>
          </div>
        </div>
      )}

      {/* Timeline List of Slots */}
      <div className="space-y-3.5">
        {filteredSlots.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
            <p className="text-slate-500 text-sm font-medium">Tidak ada jadwal yang cocok dengan pencarian.</p>
          </div>
        ) : (
          filteredSlots.map((slot) => {
            const startMin = timeStringToMinutes(slot.timeStart);
            const endMin = timeStringToMinutes(slot.timeEnd);
            
            const isFinished = isToday && currentMinutes >= endMin;
            const isOngoing = isToday && currentMinutes >= startMin && currentMinutes < endMin;
            const isUpcoming = isToday && currentMinutes < startMin;

            // Special types
            const isBreak = slot.type === 'BREAK';
            const isUpacara = slot.type === 'UPACARA';
            const isIstigosah = slot.type === 'ISTIGOSAH';
            const isDiniyah = slot.type === 'DINIYAH';
            const isEkstrakurikuler = slot.type === 'EKSTRAKURIKULER';

            return (
              <div
                key={slot.id}
                className={`rounded-2xl transition-all border overflow-hidden ${
                  isOngoing
                    ? 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/40 shadow-md shadow-emerald-500/10'
                    : isFinished
                    ? 'bg-slate-50/80 border-slate-200 opacity-80'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                }`}
              >
                {/* Header row of slot */}
                <div className={`px-4 sm:px-6 py-2.5 flex items-center justify-between border-b ${
                  isOngoing 
                    ? 'bg-emerald-600 text-white' 
                    : isDiniyah
                    ? 'bg-pink-100 text-pink-900 border-pink-200'
                    : isIstigosah
                    ? 'bg-cyan-100 text-cyan-900 border-cyan-200'
                    : 'bg-slate-100/70 text-slate-700 border-slate-200'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-xs flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {slot.timeStart} - {slot.timeEnd} WIB
                    </span>
                    <span className="font-extrabold text-xs">
                      {slot.periodNumber ? `Jam ke-${slot.periodNumber}` : slot.title || 'Sesi Terjadwal'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isToday && (
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        isOngoing
                          ? 'bg-white text-emerald-800 animate-pulse'
                          : isFinished
                          ? 'bg-slate-200 text-slate-600'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {isOngoing ? 'SEDANG BERLANGSUNG' : isFinished ? 'SELESAI' : 'AKAN DATANG'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Body: Break / Special / Classes */}
                <div className="p-4 sm:p-5">
                  {isBreak ? (
                    <div className="flex items-center gap-3 py-2 text-slate-600">
                      <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800">
                        <Coffee className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{slot.title || 'ISTIRAHAT'}</h4>
                        <p className="text-xs text-slate-500">Waktu jeda, istirahat dan makan/ibadah seluruh siswa SMKN 1 Tegalsari.</p>
                      </div>
                    </div>
                  ) : isUpacara ? (
                    <div className="flex items-center gap-3 py-2 text-slate-700">
                      <div className="p-2.5 rounded-xl bg-red-100 text-red-800">
                        <Flag className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">UPACARA BENDERA</h4>
                        <p className="text-xs text-slate-500">Seluruh kelas X Kuliner 1 & 2 di Lapangan Utama SMKN 1 Tegalsari.</p>
                      </div>
                    </div>
                  ) : isIstigosah ? (
                    <div className="flex items-center gap-3 py-2 text-cyan-900">
                      <div className="p-2.5 rounded-xl bg-cyan-100 text-cyan-800">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-cyan-950 text-sm">ISTIGOSAH BERSAMA JUMAT PAGI</h4>
                        <p className="text-xs text-cyan-700">Doa bersama dan pembinaan akhlak di Masjid / Lapangan Sekolah.</p>
                      </div>
                    </div>
                  ) : isEkstrakurikuler ? (
                    <div className="flex items-center gap-3 py-2 text-indigo-900">
                      <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-800">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-indigo-950 text-sm">EKSTRAKURIKULER</h4>
                        <p className="text-xs text-indigo-700">Kegiatan minat bakat, keorganisasian, pramuka dan olahraga.</p>
                      </div>
                    </div>
                  ) : (
                    /* Regular / Diniyah Classes Cards */
                    <div className={`grid gap-4 ${
                      selectedClassId === 'all' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
                    }`}>
                      {classes
                        .filter((c) => selectedClassId === 'all' || selectedClassId === c.id)
                        .map((cls) => {
                          const assignment = slot.classes[cls.id];
                          if (!assignment) return null;
                          const teacherObj = getTeacher(assignment.teacherCode);

                          return (
                            <div
                              key={cls.id}
                              className={`rounded-xl p-4 border transition-all ${
                                isDiniyah
                                  ? 'bg-pink-50/50 border-pink-200'
                                  : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-black tracking-wide text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                                  {cls.name}
                                </span>
                                <span className="flex items-center gap-1 text-xs font-bold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                  <MapPin className="w-3 h-3 text-emerald-600" />
                                  {assignment.room}
                                </span>
                              </div>

                              <h4 className="text-base sm:text-lg font-black text-slate-900 tracking-tight mb-2">
                                {assignment.subject}
                              </h4>

                              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                                <div className="flex items-center gap-2">
                                  <span className="w-7 h-7 rounded-lg bg-emerald-700 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                    {assignment.teacherCode}
                                  </span>
                                  <div>
                                    <div className="text-xs font-bold text-slate-900">
                                      {teacherObj?.name || assignment.teacherCode}
                                    </div>
                                    <div className="text-[10px] text-slate-500">
                                      {teacherObj?.subject || 'Pengajar'}
                                    </div>
                                  </div>
                                </div>

                                {teacherObj && onSelectTeacher && (
                                  <button
                                    onClick={() => onSelectTeacher(assignment.teacherCode)}
                                    className="text-[11px] font-semibold text-emerald-700 hover:underline"
                                  >
                                    Jadwal Guru →
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
